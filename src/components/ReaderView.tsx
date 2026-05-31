import React, { useState } from "react";
import { PDFPage, PDFLayoutBlock } from "../types";
import { ChevronLeft, ChevronRight, Edit2, RotateCw, Check, X, Download, HelpCircle, FileText, Languages } from "lucide-react";

interface ReaderViewProps {
  pages: PDFPage[];
  fileName: string;
  sourceLang: string;
  targetLang: string;
  onClose: () => void;
  onUpdateBlock: (pageIdx: number, blockId: string, newText: string) => void;
  onReTranslateBlock: (pageIdx: number, blockId: string, text: string) => Promise<void>;
}

export default function ReaderView({
  pages,
  fileName,
  sourceLang,
  targetLang,
  onClose,
  onUpdateBlock,
  onReTranslateBlock,
}: ReaderViewProps) {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<PDFLayoutBlock | null>(null);
  const [editText, setEditText] = useState("");
  const [isTranslatingLocal, setIsTranslatingLocal] = useState(false);

  const currentPage = pages[currentPageIdx] || pages[0];

  const handlePagePrev = () => {
    if (currentPageIdx > 0) setCurrentPageIdx(currentPageIdx - 1);
  };

  const handlePageNext = () => {
    if (currentPageIdx < pages.length - 1) setCurrentPageIdx(currentPageIdx + 1);
  };

  const startEditing = (block: PDFLayoutBlock) => {
    setEditingBlock(block);
    setEditText(block.translatedText || "");
  };

  const saveEdit = () => {
    if (editingBlock) {
      onUpdateBlock(currentPageIdx, editingBlock.id, editText);
      setEditingBlock(null);
    }
  };

  const triggerAIReTranslate = async () => {
    if (!editingBlock) return;
    setIsTranslatingLocal(true);
    try {
      await onReTranslateBlock(currentPageIdx, editingBlock.id, editingBlock.originalText);
      // Wait for prop refresh, update current editor text area
      const currentBlockInState = pages[currentPageIdx]?.blocks.find(b => b.id === editingBlock.id);
      if (currentBlockInState?.translatedText) {
        setEditText(currentBlockInState.translatedText);
      }
    } catch (err) {
      console.error("AI Re-translate failed", err);
    } finally {
      setIsTranslatingLocal(false);
    }
  };

  // Helper color map for layout elements to mimic modern Omlx layout engine representation
  const getBlockStyles = (type: PDFLayoutBlock["type"], isHovered: boolean) => {
    const base = "absolute border select-none transition-all duration-300 rounded";
    let typeConfig = "border-sky-200 bg-sky-50/20";
    
    if (type === "title") typeConfig = "border-amber-300 bg-amber-50/20 font-bold text-center";
    else if (type === "abstract") typeConfig = "border-emerald-200 bg-emerald-50/10 italic text-slate-600";
    else if (type === "header") typeConfig = "border-indigo-300 bg-indigo-50/20 font-semibold";
    else if (type === "equation") typeConfig = "border-purple-300 bg-purple-50/10 text-center font-mono text-purple-700";
    else if (type === "figure") typeConfig = "border-rose-400 bg-rose-50/10 text-rose-600 text-center text-xs flex items-center justify-center border-dashed";
    else if (type === "footer") typeConfig = "border-gray-200 bg-gray-50/50 text-[10px] text-gray-400";

    const hoverConfig = isHovered 
      ? "ring-2 ring-sky-500 border-sky-400 bg-sky-100/35 z-20 scale-[1.012] shadow-md" 
      : "z-10 hover:border-sky-300 hover:bg-sky-50/30";

    return `${base} ${typeConfig} ${hoverConfig}`;
  };

  return (
    <div translate="no" className="flex flex-col h-full bg-[#0a0f1d] text-slate-100 font-sans select-none notranslate" id="reader-view-panel">
      {/* Reader Navbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0f1d]/60 backdrop-blur-md" id="reader-top-bar">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg shadow-lg">
            <Languages className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white truncate max-w-sm">
              {fileName}
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>pdf2zh Layout Preserving Translator</span>
              <span className="text-slate-600">•</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-mono tracking-wider font-semibold text-blue-400">
                {sourceLang} ➔ {targetLang}
              </span>
            </p>
          </div>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={handlePagePrev}
            disabled={currentPageIdx === 0}
            className="p-1 px-2 text-xs rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 disabled:opacity-30 cursor-pointer transition flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>
          <span className="text-xs font-mono text-slate-300">
            Page <strong className="text-white">{currentPageIdx + 1}</strong> of {pages.length}
          </span>
          <button 
            onClick={handlePageNext}
            disabled={currentPageIdx === pages.length - 1}
            className="p-1 px-2 text-xs rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 disabled:opacity-30 cursor-pointer transition flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              // Create mock compiled text file download
              const content = pages.map(p => `--- PAGE ${p.pageNumber} ---\n` + p.blocks.map(b => `[Original]\n${b.originalText}\n\n[Translation]\n${b.translatedText || "(Untranslated)"}\n`).join("\n")).join("\n\n");
              const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `translated_${fileName.replace(".pdf", "")}.txt`;
              a.click();
            }}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export TXT (双语导出)</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-md transition cursor-pointer"
          >
            Exit Reader (退出阅读)
          </button>
        </div>
      </div>

      {/* Main split screens viewport */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6" id="reader-split-area">
        {/* Left Side: Original Layout Document Sheet */}
        <div className="flex-1 flex flex-col items-center overflow-auto bg-white/[0.02] backdrop-blur-md rounded-xl border border-white/5 p-4" id="original-sheet-container">
          <div className="mb-3 text-xs font-medium font-mono text-slate-450 tracking-wider uppercase border-b border-white/5 pb-2.5 w-full text-center">
            Original Layout ({sourceLang.toUpperCase()})
          </div>
          
          <div 
            className="relative bg-white text-slate-900 rounded-md shadow-2xl pdf-page-shadow overflow-hidden select-none"
            style={{ 
              width: `${currentPage.width}px`, 
              height: `${currentPage.height}px`,
              minWidth: `${currentPage.width}px`,
              minHeight: `${currentPage.height}px`,
              transform: 'scale(0.85)',
              transformOrigin: 'top center',
              marginBottom: '-90px' // adjust for scaled out space
            }}
            id="pdf-original-canvas"
          >
            {/* Grid background lines mimicking PDF layout bounds */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-5">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border border-slate-300"></div>
              ))}
            </div>

            {/* Layout blocks */}
            {currentPage.blocks.map((block) => {
              const isHovered = hoveredBlockId === block.id;
              return (
                <div
                  key={block.id}
                  className={getBlockStyles(block.type, isHovered)}
                  style={{
                    left: `${block.x}%`,
                    top: `${block.y}%`,
                    width: `${block.w}%`,
                    height: `${block.h}%`,
                    fontSize: `${block.type === "title" ? "14px" : "9.5px"}`,
                    lineHeight: "1.25"
                  }}
                  onMouseEnter={() => setHoveredBlockId(block.id)}
                  onMouseLeave={() => setHoveredBlockId(null)}
                  onClick={() => startEditing(block)}
                >
                  <div className="p-1 w-full h-full overflow-hidden text-ellipsis flex flex-col justify-center">
                    {block.type === "figure" ? (
                      <div className="text-center font-mono font-medium flex items-center justify-center gap-1 w-full h-full text-zinc-500 bg-zinc-100 p-2">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <span>{block.originalText}</span>
                      </div>
                    ) : (
                      <span className="align-middle block leading-relaxed break-words whitespace-pre-wrap">
                        {block.originalText}
                      </span>
                    )}

                    {/* Small edit helper on hover */}
                    {isHovered && block.type !== "figure" && (
                      <div className="absolute top-1 right-1 p-0.5 bg-blue-600 text-white rounded opacity-90 shadow">
                        <Edit2 className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center overflow-auto bg-white/[0.02] backdrop-blur-md rounded-xl border border-white/5 p-4" id="translated-sheet-container">
          <div className="mb-3 text-xs font-medium font-mono text-slate-450 tracking-wider uppercase border-b border-white/5 pb-2.5 w-full text-center flex items-center justify-center gap-2">
            <span>Translated Layout ({targetLang.toUpperCase()})</span>
            <span className="text-[10px] bg-blue-500/10 text-blue-300 font-sans px-1.5 py-0.5 rounded border border-blue-500/20">
              Preserved Coordinates
            </span>
          </div>

          <div 
            className="relative bg-white text-slate-900 rounded-md shadow-2xl pdf-page-shadow overflow-hidden select-none"
            style={{ 
              width: `${currentPage.width}px`, 
              height: `${currentPage.height}px`,
              minWidth: `${currentPage.width}px`,
              minHeight: `${currentPage.height}px`,
              transform: 'scale(0.85)',
              transformOrigin: 'top center',
              marginBottom: '-90px' // adjust for scaled out space
            }}
            id="pdf-translated-canvas"
          >
            {/* Grid background lines */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-5">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border border-slate-300"></div>
              ))}
            </div>

            {/* Layout blocks */}
            {currentPage.blocks.map((block) => {
              const isHovered = hoveredBlockId === block.id;
              return (
                <div
                  key={block.id}
                  className={getBlockStyles(block.type, isHovered)}
                  style={{
                    left: `${block.x}%`,
                    top: `${block.y}%`,
                    width: `${block.w}%`,
                    height: `${block.h}%`,
                    fontSize: `${block.type === "title" ? "14px" : "10px"}`,
                    lineHeight: "1.35",
                  }}
                  onMouseEnter={() => setHoveredBlockId(block.id)}
                  onMouseLeave={() => setHoveredBlockId(null)}
                  onClick={() => startEditing(block)}
                >
                  <div className="p-1 w-full h-full overflow-hidden text-ellipsis flex flex-col justify-center">
                    {block.type === "figure" ? (
                      <div className="text-center font-mono font-medium flex items-center justify-center gap-1 w-full h-full text-zinc-500 bg-zinc-100 p-2">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <span>{block.translatedText || block.originalText}</span>
                      </div>
                    ) : (
                      <span className="align-middle block leading-relaxed break-words whitespace-pre-wrap text-blue-900 font-sans tracking-wide">
                        {block.translatedText || <span className="text-slate-300 italic">Translating...</span>}
                      </span>
                    )}

                    {/* Small edit helper */}
                    {isHovered && block.type !== "figure" && (
                      <div className="absolute top-1 right-1 p-0.5 bg-blue-600 text-white rounded opacity-90 shadow">
                        <Edit2 className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pop-up Interactive translation proofreader and correction editor (bottom or overlay modal) */}
      {editingBlock && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          id="block-translation-modal"
        >
          <div className="bg-[#0d1527]/90 border border-white/10 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col p-6 text-slate-100 backdrop-blur-lg">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-blue-450" />
                <span>Proofread & Edit Segment Translation (校对翻译片段)</span>
              </h2>
              <button 
                onClick={() => setEditingBlock(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Original source reading */}
            <div className="mb-4">
              <label className="block text-[10px] font-mono tracking-wider text-slate-450 uppercase mb-1">
                Original Text ({sourceLang.toUpperCase()})
              </label>
              <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-sm italic text-slate-300 select-text max-h-32 overflow-auto whitespace-pre-wrap leading-relaxed">
                {editingBlock.originalText}
              </div>
            </div>

            {/* Translated source editing */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-mono tracking-wider text-slate-455 uppercase">
                  Translation ({targetLang.toUpperCase()})
                </label>
                <button
                  type="button"
                  onClick={triggerAIReTranslate}
                  disabled={isTranslatingLocal}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 border border-blue-500/30 px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 transition cursor-pointer"
                  title="Force model re-translation of this section"
                >
                  <RotateCw className={`w-2.5 h-2.5 ${isTranslatingLocal ? 'animate-spin' : ''}`} />
                  <span>{isTranslatingLocal ? 'AI Translating...' : 'AI Re-Translate (AI重新翻译)'}</span>
                </button>
              </div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                className="w-full bg-black/40 text-slate-100 placeholder-slate-650 text-sm p-3 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none font-sans"
                placeholder="Type custom translation or refine language outputs..."
              />
            </div>

            {/* Status alerts */}
            {isTranslatingLocal && (
              <div className="mb-4 flex items-center space-x-2 text-xs text-blue-400 bg-blue-500/10 p-2.5 rounded border border-blue-500/25">
                <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                <span>Server is translating using the active LLM engine...</span>
              </div>
            )}

            {/* Control triggers */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingBlock(null)}
                className="px-4 py-2 text-xs font-semibold hover:bg-white/10 border border-white/10 rounded-md text-slate-350 transition cursor-pointer"
              >
                Cancel (取消)
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-lg flex items-center space-x-1 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Translation (应用修改)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer floating helper */}
      <div className="px-6 py-2 border-t border-white/5 bg-black/30 text-[11px] text-slate-500 flex items-center justify-between" id="reader-footer">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Interactive Synced Highlight active
          </span>
          <span>•</span>
          <span>Click any block to edit translation directly</span>
        </div>
        <span className="font-mono text-slate-600">pdf2zh_v0.3.x GUI Renderer</span>
      </div>
    </div>
  );
}
