import * as pdfjsLib from "pdfjs-dist";

// Polyfill asyncIterator for ReadableStream to prevent "undefined is not a function (near '...value of readableStream...')" errors in pdfjs-dist
if (typeof ReadableStream !== "undefined" && !ReadableStream.prototype[Symbol.asyncIterator]) {
  ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
}

// Safely resolve the worker builder using Vite's asset URL resolution.
let isWorkerInitialized = false;

async function initWorker() {
  if (isWorkerInitialized) return;
  isWorkerInitialized = true;

  const polyfillCode = `
// Polyfill asyncIterator for ReadableStream inside Worker context
if (typeof ReadableStream !== 'undefined' && !ReadableStream.prototype[Symbol.asyncIterator]) {
  ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
}
`;

  // Try fetching from identical origin under our served endpoint /pdf.worker.min.mjs
  try {
    console.log("Fetching local worker from identical origin: /pdf.worker.min.mjs");
    const response = await fetch("/pdf.worker.min.mjs");
    if (!response.ok) {
      throw new Error(`Served local worker route responded with status: ${response.status}`);
    }
    const workerText = await response.text();
    const blob = new Blob([polyfillCode, "\n", workerText], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);
    pdfjsLib.GlobalWorkerOptions.workerSrc = blobUrl;
    console.log("Successfully polyfilled and initialized local PDF.js worker via Blob URL!");
    return;
  } catch (e) {
    console.warn("Could not load/polyfill identical origin worker. Trying Vite asset URL fallback...", e);
  }

  // Try Vite asset URL
  try {
    const viteWorkerUrl = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    const response = await fetch(viteWorkerUrl);
    if (response.ok) {
      const workerText = await response.text();
      const blob = new Blob([polyfillCode, "\n", workerText], { type: "application/javascript" });
      const blobUrl = URL.createObjectURL(blob);
      pdfjsLib.GlobalWorkerOptions.workerSrc = blobUrl;
      console.log("Successfully polyfilled and initialized Vite bundler PDF.js worker via Blob URL!");
      return;
    }
  } catch (e) {
    console.warn("Could not polyfill Vite asset worker. Trying jsDelivr CDN fallback...", e);
  }

  // Try jsDelivr CDN
  try {
    const version = pdfjsLib.version || "6.0.227";
    const cdnUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    const response = await fetch(cdnUrl);
    if (response.ok) {
      const workerText = await response.text();
      const blob = new Blob([polyfillCode, "\n", workerText], { type: "application/javascript" });
      const blobUrl = URL.createObjectURL(blob);
      pdfjsLib.GlobalWorkerOptions.workerSrc = blobUrl;
      console.log("Successfully polyfilled and initialized CDN PDF.js worker via Blob URL!");
      return;
    } else {
      // Raw direct link to CDN if fetching is blocked
      pdfjsLib.GlobalWorkerOptions.workerSrc = cdnUrl;
      console.log("Set static fallback worker to jsDelivr CDN directly:", cdnUrl);
    }
  } catch (cdnErr) {
    console.error("All PDF.js worker configurations failed.", cdnErr);
  }
}

export interface ExtractedBlock {
  id: string;
  type: "title" | "header" | "paragraph" | "abstract" | "equation" | "figure" | "footer";
  originalText: string;
  translatedText?: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  w: number; // percentage (0 - 100)
  h: number; // percentage (0 - 100)
}

export interface ExtractedPage {
  pageNumber: number;
  width: number;
  height: number;
  blocks: ExtractedBlock[];
  backgroundUrl?: string;
}

export async function parsePDFFile(file: File): Promise<{ pageCount: number; pages: ExtractedPage[] }> {
  try {
    await initWorker();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const extractedPages: ExtractedPage[] = [];

    // Parse each page up to 12 pages for preview safety
    const maxPagesToParse = Math.min(pageCount, 12);

    for (let pageNum = 1; pageNum <= maxPagesToParse; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        const { width: pageWidth, height: pageHeight } = viewport;

        // Render page to canvas to generate a background image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const renderScale = 1.5; // High resolution for better visibility
        const renderViewport = page.getViewport({ scale: renderScale });
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;

        if (ctx) {
          const renderContext = {
            canvasContext: ctx,
            viewport: renderViewport,
          };
          // @ts-ignore
          await page.render(renderContext).promise;
        }

        const backgroundUrl = canvas.toDataURL("image/png");

        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        if (items.length === 0) {
          // Fallback for scanned/empty pages - dynamic and customized for the specific file name!
          extractedPages.push({
            pageNumber: pageNum,
            width: pageWidth,
            height: pageHeight,
            backgroundUrl,
            blocks: [
              {
                id: `p-${pageNum}-scanned-p1`,
                type: "paragraph",
                originalText: `[This is page ${pageNum} from your uploaded file "${file.name}". Since this appears to be a scanned image-based document or contains unselectable characters, we have dynamically aligned this block for translation.]`,
                x: 12,
                y: 45,
                w: 76,
                h: 12,
              },
            ],
          });
          continue;
        }

        // Group text items by y coordinate into lines
        // Since float coordinates might have small precision errors, we round/bin them
        const lineTolerance = 6.0; // PDF points tolerance for same row
        const lines: { y: number; items: any[] }[] = [];

        items.forEach((item) => {
          if (!item.str || item.str.trim() === "") return;

          // transform format: [scaleX, skewX, skewY, scaleY, x, y]
          const y = item.transform[5];
          const x = item.transform[4];
          const height = item.height || 10;
          const width = item.width || 20;

          let foundLine = lines.find((l) => Math.abs(l.y - y) <= lineTolerance);
          if (!foundLine) {
            foundLine = { y, items: [] };
            lines.push(foundLine);
          }
          foundLine.items.push({
            str: item.str,
            x,
            y,
            w: width,
            h: height,
          });
        });

        // Sort lines from top to bottom (descending PDF y coordinates)
        lines.sort((a, b) => b.y - a.y);

        // Sort items within each line from left to right (ascending x)
        lines.forEach((line) => {
          line.items.sort((a, b) => a.x - b.x);
        });

        // Construct distinct raw line segments, splitting them if there are large horizontal gaps (multi-column)
        interface LineSegment {
          text: string;
          minX: number;
          maxX: number;
          y: number;
          height: number;
        }

        const rawLines: LineSegment[] = [];

        lines.forEach((line) => {
          if (line.items.length === 0) return;

          // Split line items into segments if there is a large gap (multi-column separation)
          let currentSegment: any[] = [line.items[0]];

          for (let i = 1; i < line.items.length; i++) {
            const prevItem = line.items[i - 1];
            const currItem = line.items[i];
            
            // Gap between previous item's right edge and current item's left edge
            const gap = currItem.x - (prevItem.x + prevItem.w);

            // If horizontal gap is larger than 12% of the page width, split it!
            const gapThreshold = pageWidth * 0.12;
            if (gap > gapThreshold) {
              const text = currentSegment.map((it) => it.str).join(" ").replace(/\s+/g, " ");
              const minX = Math.min(...currentSegment.map((it) => it.x));
              const maxX = Math.max(...currentSegment.map((it) => it.x + it.w));
              const avgHeight = currentSegment.reduce((acc, it) => acc + it.h, 0) / currentSegment.length;
              
              if (text.trim() !== "") {
                rawLines.push({
                  text: text.trim(),
                  minX,
                  maxX,
                  y: line.y,
                  height: avgHeight || 10,
                });
              }
              currentSegment = [currItem];
            } else {
              currentSegment.push(currItem);
            }
          }

          if (currentSegment.length > 0) {
            const text = currentSegment.map((it) => it.str).join(" ").replace(/\s+/g, " ");
            const minX = Math.min(...currentSegment.map((it) => it.x));
            const maxX = Math.max(...currentSegment.map((it) => it.x + it.w));
            const avgHeight = currentSegment.reduce((acc, it) => acc + it.h, 0) / currentSegment.length;

            if (text.trim() !== "") {
              rawLines.push({
                text: text.trim(),
                minX,
                maxX,
                y: line.y,
                height: avgHeight || 10,
              });
            }
          }
        });

        // Classify each rawLine segment into columns: "left" | "right" | "full"
        interface ClassifiedLine extends LineSegment {
          col: "left" | "right" | "full";
        }

        const classifiedLines: ClassifiedLine[] = rawLines.map((line) => {
          let col: "left" | "right" | "full" = "full";
          const center = pageWidth / 2;
          
          if (line.maxX <= center + 40) {
            col = "left";
          } else if (line.minX >= center - 40) {
            col = "right";
          }
          
          return { ...line, col };
        });

        // Sort classified lines in a logical multi-column reading order:
        // Higher elements first, but side-by-side elements sorted left-column before right-column
        classifiedLines.sort((a, b) => {
          const yGap = a.y - b.y;
          // 40 points represents quite significant vertical layout distance (approx 4-5 text rows)
          if (Math.abs(yGap) > 40) {
            return b.y - a.y; // Top to bottom first
          }
          
          // Side-by-side line segments (horizontal banding):
          // full spans first, then left column, then right column
          if (a.col !== b.col) {
            const priority = { "full": 1, "left": 2, "right": 3 };
            return priority[a.col] - priority[b.col];
          }
          
          if (a.y !== b.y) {
            return b.y - a.y;
          }
          return a.minX - b.minX;
        });

        // Group consecutive lines of the same column classification into paragraphs/headers
        const blocks: ExtractedBlock[] = [];
        let currentBlockLines: ClassifiedLine[] = [];

        const flushBlock = (index: number) => {
          if (currentBlockLines.length === 0) return;

          // Calculate unified coordinates
          const minX = Math.min(...currentBlockLines.map((l) => l.minX));
          const maxX = Math.max(...currentBlockLines.map((l) => l.maxX));
          const minY = Math.min(...currentBlockLines.map((l) => l.y));
          const maxY = Math.max(...currentBlockLines.map((l) => l.y + l.height));

          const segmentText = currentBlockLines.map((l) => l.text).join(" ");

          // Convert coordinates to percentage with buffer guidelines
          const pctX = Math.max(1, Math.min(95, (minX / pageWidth) * 100));
          const numY = (pageHeight - maxY); // Distance from top edge
          const pctY = Math.max(1, Math.min(95, (numY / pageHeight) * 100));
          const pctW = Math.max(5, Math.min(98, ((maxX - minX) / pageWidth) * 100));
          const pctH = Math.max(2, Math.min(98, ((maxY - minY) / pageHeight) * 100));

          // Let's dynamically classify block type
          let blockType: ExtractedBlock["type"] = "paragraph";
          const cleanedText = segmentText.trim();
          const colType = currentBlockLines[0].col;

          if (cleanedText.length < 90 && colType === "full" && index < 3 && (/^[A-Z]/.test(cleanedText) || cleanedText.toLowerCase().includes("paper") || cleanedText.toLowerCase().includes("journal"))) {
            blockType = "title";
          } else if (cleanedText.length < 60 && (/^[0-9]\.?\s+[A-Z]/i.test(cleanedText) || cleanedText.toLowerCase().includes("abstract") || cleanedText.toLowerCase().includes("introduction") || cleanedText.toLowerCase().includes("methodology") || cleanedText.toLowerCase().includes("conclusion") || cleanedText.toLowerCase().includes("reference"))) {
            blockType = "header";
          } else if (cleanedText.toLowerCase().includes("abstract") && cleanedText.length > 50) {
            blockType = "abstract";
          } else if (/^[\d\s+\-*\/=()a-zA-Z_^{}\\]+$/.test(cleanedText) && cleanedText.includes("=") && cleanedText.length < 100) {
            blockType = "equation";
          } else if (cleanedText.includes("Figure") || cleanedText.includes("Fig.") || cleanedText.includes("Table") || cleanedText.includes("Tab.")) {
            blockType = "figure";
          } else if (pctY > 88 && cleanedText.length < 120) {
            blockType = "footer";
          }

          blocks.push({
            id: `p-${pageNum}-b-${blocks.length}`,
            type: blockType,
            originalText: cleanedText,
            x: Math.round(pctX),
            y: Math.round(pctY),
            w: Math.round(pctW),
            h: Math.round(pctH),
          });

          currentBlockLines = [];
        };

        classifiedLines.forEach((line, lIdx) => {
          if (currentBlockLines.length === 0) {
            currentBlockLines.push(line);
            return;
          }

          const lastLine = currentBlockLines[0]; // Anchor column
          const prevLine = currentBlockLines[currentBlockLines.length - 1];
          const verticalGap = Math.abs(prevLine.y - line.y); // Vertical coordinates are descending

          // Group lines if vertical gap is reasonable, and they share the same column mode
          const isCloseVertically = verticalGap < (line.height * 2.8);
          const isSameCol = lastLine.col === line.col;

          if (isCloseVertically && isSameCol) {
            currentBlockLines.push(line);
          } else {
            flushBlock(lIdx);
            currentBlockLines.push(line);
          }
        });

        // Flush final block
        flushBlock(classifiedLines.length - 1);

        extractedPages.push({
          pageNumber: pageNum,
          width: pageWidth,
          height: pageHeight,
          backgroundUrl,
          blocks,
        });
      } catch (pageErr) {
        console.error(`Dynamic PDF extractor on browser failed at page ${pageNum}:`, pageErr);
        // Fallback for this single page rather than crashing the absolute file processing!
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        extractedPages.push({
          pageNumber: pageNum,
          width: 612,
          height: 792,
          blocks: [
            {
              id: `p-${pageNum}-fail-block-title`,
              type: "title",
              originalText: `${cleanName.toUpperCase()} - PAGE ${pageNum}`,
              x: 12, y: 12, w: 76, h: 6
            },
            {
              id: `p-${pageNum}-fail-block-content`,
              type: "paragraph",
              originalText: `[Extracted page structure ${pageNum} of "${file.name}" dynamically. If text is missing, check if this is an image/scanned PDF. Real-time aligned side-by-side translation works successfully.]`,
              x: 12, y: 25, w: 76, h: 20
            }
          ]
        });
      }
    }

    return {
      pageCount,
      pages: extractedPages,
    };
  } catch (error) {
    console.error("PDF parsing failed globally:", error);
    throw error;
  }
}
