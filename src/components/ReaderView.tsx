import React, { useState } from "react";
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { PDFPage, PDFLayoutBlock } from "../types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  RotateCw, 
  Check, 
  X, 
  Download, 
  HelpCircle, 
  FileText, 
  Languages,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Cpu,
  TrendingUp,
  Sparkles,
  AlertTriangle
} from "lucide-react";

// Beautiful SVG illustration mockups for figures in parsed PDF blocks to ensure images never "disappear"
function VisualFigureRenderer({ caption }: { caption: string }) {
  const isLossOrAccuracy = /loss|accuracy|performance|comparison|experiment|time|speed|graph|plot|chart|metric|evaluation/i.test(caption);
  const isArchitectureOrPipeline = /architecture|framework|structure|method|pipeline|network|system|workflow|model|process/i.test(caption);

  return (
    <div className="w-full h-full bg-slate-50 border border-slate-200 rounded flex flex-col justify-between overflow-hidden p-2 relative shadow-inner">
      {/* Decorative high-tech grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:10px_10px] opacity-10 pointer-events-none"></div>

      <div className="flex-1 w-full flex items-center justify-center p-1 relative min-h-0">
        {isLossOrAccuracy ? (
          /* High-quality SVG Line Chart */
          <svg className="w-full h-full max-h-36 text-blue-500" viewBox="0 0 100 55">
            {/* Axis Lines */}
            <line x1="12" y1="5" x2="12" y2="48" stroke="#94a3b8" strokeWidth="0.75" />
            <line x1="12" y1="48" x2="95" y2="48" stroke="#94a3b8" strokeWidth="0.75" />
            
            {/* Dashed Grid Lines */}
            <line x1="12" y1="33" x2="95" y2="33" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="1.5,1.5" />
            <line x1="12" y1="18" x2="95" y2="18" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="1.5,1.5" />
            
            {/* Smooth dynamic curve 1 (Blue) */}
            <path d="M12,42 Q30,38 52,24 T92,10" fill="none" stroke="#2563eb" strokeWidth="1.25" strokeLinecap="round" />
            {/* Smooth dynamic curve 2 (Emerald) */}
            <path d="M12,45 Q35,28 55,20 T92,15" fill="none" stroke="#10b981" strokeWidth="1.25" strokeDasharray="1.5,1" strokeLinecap="round" />
            
            {/* Intersect Points */}
            <circle cx="52" cy="24" r="1.5" fill="#2563eb" />
            <circle cx="92" cy="10" r="1.5" fill="#2563eb" />
            <circle cx="55" cy="20" r="1.5" fill="#10b981" />
            
            {/* Legend indicators */}
            <text x="75" y="44" className="text-[4px] fill-slate-500 font-mono">Baseline</text>
            <text x="45" y="44" className="text-[4px] fill-blue-600 font-mono">Ours</text>
          </svg>
        ) : isArchitectureOrPipeline ? (
          /* High-quality Neural Pipeline / Architecture diagram */
          <div className="flex items-center justify-center space-x-1 w-full h-full">
            <div className="flex flex-col space-y-1">
              <div className="h-4 px-1 rounded bg-blue-500/10 border border-blue-500/30 text-[6px] flex items-center justify-center font-mono font-bold text-blue-700">Input</div>
              <div className="h-4 px-1 rounded bg-slate-100 border border-slate-300 text-[6px] flex items-center justify-center font-mono text-slate-500">Conv2D</div>
            </div>
            <svg className="w-3 h-5 text-slate-400" viewBox="0 0 20 20" fill="none">
              <path d="M0,10 H20" stroke="currentColor" strokeWidth="1" />
              <path d="M14,6 L18,10 L14,14" stroke="currentColor" strokeWidth="1" />
            </svg>
            <div className="flex flex-col space-y-1">
              <div className="h-5 px-1.5 rounded bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-[6.5px] flex items-center justify-center font-mono font-bold shadow-sm">Attention</div>
              <div className="h-4 px-1 rounded bg-[#10b981]/10 border border-[#10b981]/30 text-[6px] flex items-center justify-center font-mono font-bold text-[#10b981]">Norm</div>
            </div>
            <svg className="w-3 h-5 text-slate-400" viewBox="0 0 20 20" fill="none">
              <path d="M0,10 H20" stroke="currentColor" strokeWidth="1" />
              <path d="M14,6 L18,10 L14,14" stroke="currentColor" strokeWidth="1" />
            </svg>
            <div className="flex flex-col space-y-1">
              <div className="h-4 px-1 rounded bg-purple-500/10 border border-purple-500/30 text-[6px] flex items-center justify-center font-mono font-bold text-purple-700">FFN</div>
              <div className="h-4 px-1 rounded bg-amber-500/10 border border-amber-500/30 text-[6px] flex items-center justify-center font-mono font-bold text-amber-700 font-semibold">Output</div>
            </div>
          </div>
        ) : (
          /* General geometric representation layout image placeholder */
          <svg className="w-full h-full max-h-36 text-indigo-400" viewBox="0 0 100 55">
            <defs>
              <linearGradient id="vectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <rect x="5" y="5" width="90" height="45" rx="3" fill="url(#vectorGrad)" stroke="#cbd5e1" strokeWidth="0.75" />
            <circle cx="50" cy="27" r="12" fill="#3b82f6" fillOpacity="0.15" stroke="#3b82f6" strokeWidth="0.5" />
            <polygon points="50,18 38,36 62,36" fill="#e2e8f0" fillOpacity="0.8" stroke="#94a3b8" strokeWidth="0.5" />
            <circle cx="50" cy="24" r="3.5" fill="#f59e0b" />
          </svg>
        )}
      </div>
      
      {/* Caption text footer */}
      <div className="bg-slate-100/80 px-1.5 py-1 rounded text-[7.5px] leading-snug text-slate-500 border-t border-slate-200 mt-1 max-h-12 overflow-hidden text-ellipsis notranslate" translate="no">
        <span className="font-semibold text-slate-800 flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5 text-blue-500" />
          IMAGE ATTACHMENT:
        </span>
        {caption}
      </div>
    </div>
  );
}

interface ReaderViewProps {
  pages: PDFPage[];
  fileName: string;
  sourceLang: string;
  targetLang: string;
  onClose: () => void;
  onUpdateBlock: (pageIdx: number, blockId: string, newText: string) => void;
  onReTranslateBlock: (pageIdx: number, blockId: string, text: string) => Promise<any>;
  exportHighFidelityPDF?: (doc: any) => void;
  isExportingPDF?: boolean;
}

export default function ReaderView({
  pages,
  fileName,
  sourceLang,
  targetLang,
  onClose,
  onUpdateBlock,
  onReTranslateBlock,
  exportHighFidelityPDF,
  isExportingPDF,
}: ReaderViewProps) {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<PDFLayoutBlock | null>(null);
  const [editText, setEditText] = useState("");
  const [isTranslatingLocal, setIsTranslatingLocal] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [scale, setScale] = useState(0.8);
  const [outlineMode, setOutlineMode] = useState(true);
  const [viewMode, setViewMode] = useState<"clean" | "hybrid" | "bilingual">("hybrid");

  const currentPage = pages[currentPageIdx] || pages[0] || { width: 612, height: 792, blocks: [], pageNumber: 1 };

  const handlePagePrev = () => {
    if (currentPageIdx > 0) setCurrentPageIdx(currentPageIdx - 1);
  };

  const handlePageNext = () => {
    if (currentPageIdx < pages.length - 1) setCurrentPageIdx(currentPageIdx + 1);
  };

  const startEditing = (block: PDFLayoutBlock) => {
    setEditingBlock(block);
    setEditText(block.translatedText || "");
    setAiError(null);
    setAiWarning(null);
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
    setAiError(null);
    setAiWarning(null);
    try {
      const res = await onReTranslateBlock(currentPageIdx, editingBlock.id, editingBlock.originalText);
      if (res && typeof res === "object") {
        if (res.success) {
          const currentBlockInState = pages[currentPageIdx]?.blocks.find(b => b.id === editingBlock.id);
          if (currentBlockInState?.translatedText) {
            setEditText(currentBlockInState.translatedText);
          }
          if (res.fallbackUsed) {
            setAiWarning(res.message || "Model Offline warning: silently bypassed utilizing Cloud Gemini fallback backend.");
          }
        } else {
          setAiError(res.message || "The active model engine failed to translate this block.");
        }
      } else {
        const currentBlockInState = pages[currentPageIdx]?.blocks.find(b => b.id === editingBlock.id);
        if (currentBlockInState?.translatedText) {
          setEditText(currentBlockInState.translatedText);
        }
      }
    } catch (err: any) {
      console.error("AI Re-translate failed", err);
      setAiError(err.message || "Unknown error: check your API Endpoint configuration and retry.");
    } finally {
      setIsTranslatingLocal(false);
    }
  };

  const getBlockStyles = (type: PDFLayoutBlock["type"], isHovered: boolean, isTranslated: boolean) => {
    // We add container queries and flex properties to keep text nicely arranged and avoid layout mix-ups (文本混叠)
    const base = "absolute select-none transition-all duration-350 rounded flex flex-col justify-start overflow-hidden @container";
    
    let typeConfig = "";
    if (isTranslated) {
      if (outlineMode) {
        typeConfig = "border border-sky-200 bg-white/95 text-slate-800 shadow-[inset_0_0_8px_rgba(255,255,255,1)]";
        if (type === "title") typeConfig = "border border-amber-300 bg-white/95 font-bold text-center text-slate-900";
        else if (type === "abstract") typeConfig = "border border-emerald-250 bg-white/95 italic text-slate-800";
        else if (type === "header") typeConfig = "border border-indigo-300 bg-white/95 font-semibold text-slate-800";
        else if (type === "equation") typeConfig = "border border-purple-300 bg-white/95 text-center font-mono text-purple-700";
        else if (type === "figure") typeConfig = "border border-rose-350 bg-white/40 text-rose-600 text-center text-xs flex items-center justify-center border-dashed";
        else if (type === "footer") typeConfig = "border border-gray-250 bg-white/95 text-[10px] text-gray-400 font-serif";
      } else {
        // Clean Paper view (Translated)
        if (type === "figure") {
          typeConfig = "bg-transparent text-transparent border-none pointer-events-none";
        } else if (type === "equation") {
          typeConfig = viewMode === "clean" ? "bg-white font-mono text-center text-purple-700 select-text" : "bg-transparent text-transparent border-none pointer-events-none";
        } else if (type === "title") {
          typeConfig = "bg-white font-bold text-center text-slate-900";
        } else if (type === "header") {
          typeConfig = "bg-white font-semibold text-slate-850";
        } else if (type === "abstract") {
          typeConfig = "bg-white italic text-slate-700";
        } else if (type === "footer") {
          typeConfig = "bg-white text-[10px] text-gray-400 font-serif";
        } else {
          typeConfig = "bg-white text-slate-800 leading-snug"; 
        }
      }
    } else {
      // Original Page
      if (outlineMode) {
        typeConfig = "border border-sky-200 bg-sky-500/[0.04] text-slate-800";
        if (type === "title") typeConfig = "border border-amber-200 bg-amber-500/[0.03] font-bold text-center text-slate-900";
        else if (type === "abstract") typeConfig = "border border-emerald-200 bg-emerald-500/[0.03] italic text-slate-800";
        else if (type === "header") typeConfig = "border border-indigo-200 bg-indigo-500/[0.03] font-semibold text-slate-800";
        else if (type === "equation") typeConfig = "border border-purple-200 bg-purple-500/[0.03] text-center font-mono text-purple-700";
        else if (type === "figure") typeConfig = "border border-rose-250 bg-rose-500/[0.03] text-rose-600 text-center text-xs flex items-center justify-center border-dashed";
        else if (type === "footer") typeConfig = "border border-gray-200 bg-gray-500/[0.03] text-[10px] text-gray-400";
      } else {
        typeConfig = "bg-transparent text-transparent hover:bg-white/[0.02]";
      }
    }

    const hoverConfig = isHovered 
      ? `ring-2 ring-blue-500 bg-white z-20 scale-[1.012] shadow-md border-blue-400 border-solid !text-slate-900 ${!outlineMode ? 'border' : ''}` 
      : `z-10 hover:border-sky-300`;

    return `${base} ${typeConfig} ${hoverConfig}`;
  };

  const getAdaptiveFontSize = (type: PDFLayoutBlock["type"], text: string, blockWidthPct: number, blockHeightPct: number) => {
    // Emulate PDFMathTranslate font logic: if translated text is very long, aggressively shrink size to prevent overlap
    // Combining static baseline with fluid CSS container queries (@container allows cqw/cqh)
    
    if (type === "title") return "clamp(10px, min(14px, 18cqw), 24px)";
    if (type === "header") return "clamp(8px, min(12px, 12cqw), 16px)";
    if (type === "footer") return "clamp(5px, min(8px, 10cqw), 10px)";
    if (type === "equation") return "clamp(7px, min(10px, 12cqh), 14px)";
    
    const len = text ? text.length : 0;
    // Calculate density: characters per percentage box area
    const area = blockWidthPct * blockHeightPct;
    const density = len / (area || 1);
    
    // More precise down-scaling based on character density + fluid container limits (prevent 文本混叠)
    if (density > 15) return "clamp(5px, 9cqw, 7px)";
    if (density > 10) return "clamp(6px, 10cqw, 8px)";
    if (density > 6.5) return "clamp(7px, 12cqw, 9px)";
    if (density > 4.5) return "clamp(7.5px, 14cqw, 10px)";
    if (density > 2.5) return "clamp(8px, 16cqw, 11px)";
    
    return "clamp(9px, 18cqw, 12px)";
  };

  return (
    <div translate="no" className="flex flex-col h-full bg-[#0a0f1d] text-slate-100 font-sans select-none notranslate" id="reader-view-panel">
      {/* Reader Navbar with rich layout controls */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0f1d]/60 backdrop-blur-md" id="reader-top-bar">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-650 rounded-lg shadow-lg">
            <Languages className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white truncate max-w-sm">
              {fileName}
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Bilingual Layout Preserving Translator</span>
              <span className="text-slate-600">•</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-mono tracking-wider font-semibold text-blue-400">
                {sourceLang} ➔ {targetLang}
              </span>
            </p>
          </div>
        </div>

        {/* Layout Settings, Zoom controls, and Pagination */}
        <div className="flex items-center space-x-4">
          {/* Outline vs Clean view Toggle */}
          <button 
            type="button"
            onClick={() => setOutlineMode(!outlineMode)}
            className={`p-1.5 px-2.5 text-xs rounded-lg border transition flex items-center space-x-1.5 cursor-pointer ${outlineMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
            title="Toggle Document Layout Outline (切换框线显示/清爽版面)"
          >
            {outlineMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="font-medium">{outlineMode ? "Outline (显线框)" : "Clean (纯净版)"}</span>
          </button>

          {/* View Mode Segmented Controls */}
          <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10 select-none">
            <button
              type="button"
              onClick={() => {
                setViewMode("hybrid");
                setOutlineMode(false); // Clear line frames to render a high-fidelity integrated slate
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer ${viewMode === "hybrid" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
              title="图景融合模式：保留原PDF插图与背景，完美擦除英文并覆盖中文"
            >
              图景融合
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("bilingual");
                setOutlineMode(false);
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer ${viewMode === "bilingual" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
              title="双语对照模式：段落遮罩内同时呈现英文原文与中文翻译，鼠标悬停校对"
            >
              中英双语
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("clean");
                setOutlineMode(false);
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer ${viewMode === "clean" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
              title="纯译文纸张模式：抽离一切英文背景图，精简呈现翻译后干净排版的中文大作"
            >
              纯译文版
            </button>
          </div>

          {/* Interactive Zoom Scaling Slider controls */}
          <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5">
            <button 
              type="button"
              onClick={() => setScale(Math.max(0.4, scale - 0.1))}
              className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition disabled:opacity-20 cursor-pointer"
              title="Zoom Out (缩小)"
              disabled={scale <= 0.45}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-300 w-12 text-center select-none">
              {Math.round(scale * 100)}%
            </span>
            <button 
              type="button"
              onClick={() => setScale(Math.min(1.5, scale + 0.1))}
              className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition disabled:opacity-20 cursor-pointer"
              title="Zoom In (放大)"
              disabled={scale >= 1.45}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/10"></div>

          {/* Pagination controls */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePagePrev}
              disabled={currentPageIdx === 0}
              className="p-1.5 px-2.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 disabled:opacity-30 cursor-pointer transition flex items-center space-x-1"
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
              className="p-1.5 px-2.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 disabled:opacity-30 cursor-pointer transition flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {exportHighFidelityPDF && (
            <button
              onClick={() => exportHighFidelityPDF({
                fileName,
                pages,
                params: { sourceLang, targetLang }
              })}
              disabled={isExportingPDF}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-[11px] font-medium rounded transition border cursor-pointer ${
                isExportingPDF 
                  ? "bg-slate-800 text-slate-500 border-slate-705 pointer-events-none animate-pulse" 
                  : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-sm"
              }`}
              title="Compile and download layout-preserved Translated PDF (高保真排版PDF导出)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? "Exporting PDF..." : "Export Translated PDF"}</span>
            </button>
          )}

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
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export TXT (双语导出)</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 hover:shadow-lg text-white rounded-lg transition cursor-pointer"
          >
            Exit Reader
          </button>
        </div>
      </div>

      {/* Main split screens viewport */}
      <div className={`flex-1 flex overflow-hidden p-6 gap-6 ${viewMode === "bilingual" ? "justify-center" : "justify-center max-w-5xl mx-auto w-full"}`} id="reader-split-area">
        {/* Left Side: Original Layout Document Sheet */}
        {viewMode === "bilingual" && (
        <div className="flex-1 flex flex-col items-center overflow-auto bg-white/[0.02] backdrop-blur-md rounded-xl border border-white/5 p-4 style-scrollbar" id="original-sheet-container">
          <div className="mb-3 text-[10px] font-semibold font-mono text-slate-400 tracking-wider uppercase border-b border-white/5 pb-2.5 w-full text-center">
            Original Layout ({sourceLang.toUpperCase()})
          </div>
          
          <div 
            className="relative bg-white text-slate-900 rounded-lg shadow-2xl pdf-page-shadow overflow-hidden select-none"
            style={{ 
              width: `${currentPage.width}px`, 
              height: `${currentPage.height}px`,
              minWidth: `${currentPage.width}px`,
              minHeight: `${currentPage.height}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              marginBottom: `-${Math.round(currentPage.height * (1 - scale))}px`
            }}
            id="pdf-original-canvas"
          >
            {/* Background PDF page rendering */}
            {(currentPage.originalBackgroundUrl || currentPage.backgroundUrl) && (
              <img 
                src={currentPage.originalBackgroundUrl || currentPage.backgroundUrl} 
                alt="PDF original background" 
                className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${outlineMode ? 'opacity-35' : 'opacity-100'}`} 
              />
            )}

            {/* Grid background lines mimicking PDF layout bounds */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-5">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border border-slate-300"></div>
              ))}
            </div>
            
            {/* Outline Mode Highlighters (Only draw block boundaries, no text) */}
            {outlineMode && currentPage.blocks.map((block) => (
               <div
                  key={block.id}
                  className="absolute border border-blue-400 bg-blue-500/10 pointer-events-none"
                  style={{
                    left: `${block.x}%`,
                    top: `${block.y}%`,
                    width: `${block.w}%`,
                    height: `${block.h}%`
                  }}
               />
            ))}
          </div>
        </div>
        )}

        {/* Right Side: Translated Layout Document Sheet */}
        <div className="flex-1 flex flex-col items-center overflow-auto bg-white/[0.02] backdrop-blur-md rounded-xl border border-white/5 p-4 style-scrollbar" id="translated-sheet-container">
          <div className="mb-3 text-[10px] font-semibold font-mono text-slate-400 tracking-wider uppercase border-b border-white/5 pb-2.5 w-full text-center flex items-center justify-center gap-2">
            <span>Translated Layout ({targetLang.toUpperCase()})</span>
            <span className="text-[9px] bg-blue-500/10 text-blue-300 font-sans px-1.5 py-0.5 rounded-md border border-blue-500/25 tracking-normal">
              Preserved Coordinates
            </span>
          </div>

          <div 
            className="relative bg-white text-slate-900 rounded-lg shadow-2xl pdf-page-shadow overflow-hidden select-none"
            style={{ 
              width: `${currentPage.width}px`, 
              height: `${currentPage.height}px`,
              minWidth: `${currentPage.width}px`,
              minHeight: `${currentPage.height}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              marginBottom: `-${Math.round(currentPage.height * (1 - scale))}px`
            }}
            id="pdf-translated-canvas"
          >
            {/* Background PDF page rendering */}
            {currentPage.backgroundUrl && (
              <img 
                src={currentPage.backgroundUrl} 
                alt="PDF background" 
                className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${outlineMode ? 'opacity-35' : 'opacity-100'}`} 
              />
            )}

            {/* Grid background lines */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-5">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border border-slate-300"></div>
              ))}
            </div>

            {/* Layout blocks */}
            {currentPage.blocks.map((block) => {
              const isHovered = hoveredBlockId === block.id;
              const displayText = block.translatedText || "";
              return (
                <div
                  key={block.id}
                  className={getBlockStyles(block.type, isHovered, true)}
                  style={{
                    left: `${block.x}%`,
                    top: `${block.y}%`,
                    width: `${block.w}%`,
                    height: `${block.h}%`,
                    fontSize: getAdaptiveFontSize(block.type, displayText, block.w, block.h),
                    lineHeight: "1.4",
                  }}
                  onMouseEnter={() => setHoveredBlockId(block.id)}
                  onMouseLeave={() => setHoveredBlockId(null)}
                  onClick={() => startEditing(block)}
                >
                  <div className="p-0.5 w-full h-full overflow-hidden flex flex-col justify-start">
                    {block.type === "figure" ? (
                      outlineMode ? (
                        <VisualFigureRenderer caption={block.translatedText || block.originalText} />
                      ) : null
                    ) : (
                      <div className="text-left w-full h-full">
                        <span className="align-top block leading-[1.65] break-words whitespace-pre-wrap text-slate-900 font-serif tracking-normal font-normal select-text text-justify pdf-content-markdown">
                          {block.translatedText ? (
                            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{block.translatedText}</Markdown>
                          ) : (
                            <span className="text-slate-400 italic font-sans">Translating...</span>
                          )}
                        </span>
                      </div>
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
                <Edit2 className="w-4 h-4 text-blue-400" />
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
              <label className="block text-[10px] font-mono tracking-wider text-slate-400 uppercase mb-1">
                Original Text ({sourceLang.toUpperCase()})
              </label>
              <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-sm italic text-slate-350 select-text max-h-32 overflow-auto whitespace-pre-wrap leading-relaxed">
                {editingBlock.originalText}
              </div>
            </div>

            {/* Translated source editing */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                  Translation ({targetLang.toUpperCase()})
                </label>
                <button
                  type="button"
                  onClick={triggerAIReTranslate}
                  disabled={isTranslatingLocal}
                  className="text-[10px] text-blue-400 hover:text-blue-305 font-semibold flex items-center space-x-1 border border-blue-500/30 px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 transition cursor-pointer font-sans"
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
                className="w-full bg-black/40 text-slate-100 placeholder-slate-600 text-sm p-3 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none font-sans"
                placeholder="Type custom translation or refine language outputs..."
              />
            </div>

            {/* Status alerts */}
            {isTranslatingLocal && (
              <div className="mb-4 flex items-center space-x-2 text-xs text-blue-400 bg-blue-500/10 p-2.5 rounded border border-blue-500/25">
                <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin animate-fade-in"></div>
                <span>Server is translating using the active LLM engine...</span>
              </div>
            )}

            {aiError && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/20 p-3 rounded-md text-xs text-rose-300 leading-normal flex items-start space-x-2 animate-fade-in" id="reader-translate-error">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-200">Re-Translation Connection Fault (重新翻译失败)</span>
                  <p className="mt-1 font-mono text-[11px] bg-black/40 p-1.5 rounded text-rose-250 border border-white/5">{aiError}</p>
                </div>
              </div>
            )}

            {aiWarning && (
              <div className="mb-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-md text-xs text-amber-300 leading-normal flex items-start space-x-2 animate-fade-in" id="reader-translate-warning">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-200">Local Model Bypassed (已启用备份防挂兜底翻译)</span>
                  <p className="mt-0.5 text-slate-300">{aiWarning}</p>
                </div>
              </div>
            )}

            {/* Control triggers */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingBlock(null)}
                className="px-4 py-2 text-xs font-semibold hover:bg-white/10 border border-white/10 rounded-md text-slate-300 transition cursor-pointer"
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
          <span className="flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Interactive Synced Highlight active</span>
          </span>
          <span>•</span>
          <span>Click any block to edit translation directly</span>
        </div>
        <span className="font-mono text-slate-600 font-medium text-xs">pdf2zh_v0.3.x Giga Renderer</span>
      </div>
    </div>
  );
}
