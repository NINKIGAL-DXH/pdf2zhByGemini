// TypeScript definitions for PDF2ZH Desktop App

export interface AIProviderConfig {
  provider: "openai" | "lmstudio" | "omlx" | "gemini";
  apiKey: string;
  endpoint: string;
  model: string;
  isActive: boolean;
}

export interface TranslationParams {
  sourceLang: string;
  targetLang: string;
  mode: "dual" | "mono";
  pageRange: string; // e.g. "all", "1-3"
  threads: number;
  preserveImages: boolean;
  translateFigures: boolean;
  fontSizeRatio: number;
  layoutEngine: "fitz" | "pdfplumber";
  enableChunking?: boolean;
  enableBreakpointResume?: boolean;
  enableMemoryOptimization?: boolean;
  enableBottomCover?: boolean;
  enableTablePipeline?: boolean;
  ocrEngine?: "none" | "rapidocr";
}

export interface PDFLayoutBlock {
  id: string;
  type: "title" | "abstract" | "header" | "paragraph" | "equation" | "figure" | "footer";
  originalText: string;
  translatedText?: string;
  // CSS styling guides for rendering layout representation
  x: number; // percentage
  y: number; // percentage
  w: number; // percentage
  h: number; // percentage
}

export interface PDFPage {
  pageNumber: number;
  blocks: PDFLayoutBlock[];
  width: number;
  height: number;
  backgroundUrl?: string;
  originalBackgroundUrl?: string;
}

export interface TranslatedDoc {
  id: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  translatedAt: string;
  params: TranslationParams;
  providerConfig: {
    provider: string;
    model: string;
  };
  pages: PDFPage[];
  status: "idle" | "parsing" | "translating" | "assembling" | "completed" | "failed";
  progress: number; // 0 to 100
  nativeDownloadUrls?: { mono: string | null; dual: string | null };
}
