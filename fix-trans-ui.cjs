const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Also clear modelDownloadProgress on start Native Translation
appContent = appContent.replace(
  /setTranslationError\(null\);\n\n    let/g,
  `setTranslationError(null);\n    setModelDownloadProgress(null);\n\n    let`
);

// We should also render the ModelDownloadProgress in the Translate Tab
appContent = appContent.replace(
  /\{translationProgress > 0 && \(/g,
  `{modelDownloadProgress && (
                           <div className="mb-4 bg-purple-900/20 rounded p-2 border border-purple-500/20">
                             <div className="flex justify-between items-center mb-1.5">
                               <div className="flex items-center space-x-2">
                                  <svg className="w-3.5 h-3.5 text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                  <span className="text-xs font-medium text-purple-300">模型下载 (Downloading Context)</span>
                               </div>
                               <span className="text-xs font-mono text-purple-400">{modelDownloadProgress.percentage}%</span>
                             </div>
                             <div className="flex justify-between text-[9px] font-mono text-purple-300/60 mb-1.5">
                               <span>Speed: {modelDownloadProgress.speed}</span>
                               <span>ETA: {modelDownloadProgress.eta}</span>
                             </div>
                             <div className="w-full bg-black/40 rounded-full h-1 overflow-hidden shadow-inner border border-white/5">
                               <div className="bg-purple-500 h-1 rounded-full transition-all duration-300 ease-out" style={{ width: \`\${Math.max(2, modelDownloadProgress.percentage)}%\` }}></div>
                             </div>
                           </div>
                        )}
                        \n                        {translationProgress > 0 && (`
);

fs.writeFileSync('src/App.tsx', appContent);
