const fs = require('fs');

let s = fs.readFileSync('server.ts', 'utf8');

const injection = `
  const venvDir = path.join(pdf2zhDataDir, "venv");
  const isWin = process.platform === "win32";
  const pdf2zhCmdLocal = isWin ? path.join(venvDir, "Scripts", "pdf2zh.exe") : path.join(venvDir, "bin", "pdf2zh");
  const venvPythonCmdLocal = isWin ? path.join(venvDir, "Scripts", "python.exe") : path.join(venvDir, "bin", "python3");

  // Auto-downgrade for PyMuPDF 1.25.x bug
  if (fs.existsSync(venvPythonCmdLocal)) {
      try {
         const pyCheck = \`import sys
try:
    import builtins
    import pymupdf
    if pymupdf.version[0].startswith("1.25."): sys.exit(1)
except Exception:
    pass
try:
    import fitz
    if fitz.version[0].startswith("1.25."): sys.exit(1)
except Exception:
    pass
sys.exit(0)\`;
         require('child_process').execSync(\`"\${venvPythonCmdLocal}" -c "\${pyCheck}"\`, { stdio: 'ignore' });
      } catch (err) {
         sendLog("info", "Buggy PyMuPDF 1.25.x detected. Auto-downgrading to 1.24.11 which handles subset_fonts correctly... (This may take a minute)");
         try {
            require('child_process').execSync(\`"\${venvPythonCmdLocal}" -m pip install "pymupdf==1.24.11"\`, { stdio: 'ignore' });
         } catch(e) {
            sendLog("warning", "Auto-downgrade failed, translation might encounter an encoding error.");
         }
      }
  }
`;

s = s.replace(
  /const venvDir = path\.join\(pdf2zhDataDir, "venv"\);\n\s*const isWin = process\.platform === "win32";\n\s*const pdf2zhCmdLocal = isWin \? path\.join\(venvDir, "Scripts", "pdf2zh\.exe"\) : path\.join\(venvDir, "bin", "pdf2zh"\);/,
  injection
);

fs.writeFileSync('server.ts', s);
