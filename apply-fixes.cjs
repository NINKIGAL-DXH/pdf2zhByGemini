const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Fix fs.rmSync to swallow errors or use maxRetries
content = content.replace(
  /if \(fs\.existsSync\(venvDir\)\) \{\s*fs\.rmSync\(venvDir, \{ recursive: true, force: true \}\);\s*\}/g,
  `if (fs.existsSync(venvDir)) {
       try {
          fs.rmSync(venvDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
       } catch (err) {
          sendLog("warning", \`Could not completely remove existing venvDir (\${err.message}). Proceeding anyway.\`);
       }
    }`
);

content = content.replace(
  /fs\.rm\(pdf2zhDataDir, \{ recursive: true, force: true \}, \(err\) => \{/g,
  `fs.rm(pdf2zhDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }, (err) => {`
);

// Install an older spacy for arm64 python3.9 to fix thinc build issue
content = content.replace(
  /const pipProc = spawn\(venvPythonCmd, \["-m", "pip", "install", "urllib3<2", "certifi", "pdf2zh"\]\);/g,
  `const pipProc = spawn(venvPythonCmd, ["-m", "pip", "install", "urllib3<2", "certifi", "spacy<3.8.0", "pdf2zh"]);`
);

fs.writeFileSync('server.ts', content);
