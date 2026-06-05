const fs = require('fs');

const code = `
         // Use venvPythonCmd -m pip instead of pipCmd to ensure we use the upgraded pip module reliably
         const pipProc = spawn(venvPythonCmd, ["-m", "pip", "install", "urllib3<2", "certifi", "pdf2zh"]);
`;

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Use venvPythonCmd -m pip instead.*?\n\s+const pipProc = spawn\(venvPythonCmd, \["-m", "pip", "install", "pdf2zh"\]\);/g;
content = content.replace(regex, code.trim());
fs.writeFileSync('server.ts', content);
