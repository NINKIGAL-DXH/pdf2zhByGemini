const fs = require('fs');

const code = `
  function createVenvAndInstall() {
    sendLog("info", \`Creating self-contained python virtual environment at: \${venvDir}\`);
    res.write(\`data: \${JSON.stringify({ type: "progress", value: 10 })}\\n\\n\`);
    const venvProc = spawn(pythonCmd, ["-m", "venv", venvDir]);
    
    venvProc.stdout.on("data", (data) => sendLog("stdout", data.toString()));
    venvProc.stderr.on("data", (data) => sendLog("stderr", data.toString()));
    
    venvProc.on("close", (code) => {
       if (code !== 0) {
          sendLog("error", \`Failed to create virtual environment (code \${code}). Please ensure python3-venv is installed.\`);
          res.write(\`data: \${JSON.stringify({ type: "progress", value: 0 })}\\n\\n\`);
          res.write(\`data: \${JSON.stringify({ type: "done", message: "Setup failed during venv creation." })}\\n\\n\`);
          return res.end();
       }
       
       sendLog("success", "Virtual environment created successfully. Upgrading pip and essential build tools...");
       res.write(\`data: \${JSON.stringify({ type: "progress", value: 20 })}\\n\\n\`);
       
       const venvPythonCmd = isWin ? path.join(venvDir, "Scripts", "python.exe") : path.join(venvDir, "bin", "python3");
       // Upgrade pip, setuptools, and wheel before installing anything to prevent Wheel build errors during dependencies resolution
       const pipUpgradeProc = spawn(venvPythonCmd, ["-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"]);
       
       pipUpgradeProc.stdout.on("data", (data) => sendLog("stdout", data.toString()));
       pipUpgradeProc.stderr.on("data", (data) => sendLog("stderr", data.toString()));
       pipUpgradeProc.on("error", (err) => {
           sendLog("warning", \`Failed to span pip upgrade command: \${err.message}. It will try proceeding with default pip version.\`);
       });

       pipUpgradeProc.on("close", (upgradeCode) => {
         if (upgradeCode !== 0) {
            sendLog("warning", "Pip/setuptools upgrade failed, proceeding with default pip version. (If build fails later, this might be why).");
         } else {
            sendLog("success", "Build tools (pip, setuptools, wheel) upgraded successfully.");
         }
         
         res.write(\`data: \${JSON.stringify({ type: "progress", value: 30 })}\\n\\n\`);
         sendLog("info", \`Executing: \${venvPythonCmd} -m pip install pdf2zh (this may take a few minutes)\`);
         
         // Use venvPythonCmd -m pip instead of pipCmd to ensure we use the upgraded pip module reliably
         const pipProc = spawn(venvPythonCmd, ["-m", "pip", "install", "pdf2zh"]);
         
         let currentProgress = 30;
         
         pipProc.stdout.on("data", (data) => {
           const out = data.toString();
           sendLog("stdout", out);
           if (out.includes("Collecting") || out.includes("Downloading")) {
              currentProgress = Math.min(currentProgress + 1, 95);
              res.write(\`data: \${JSON.stringify({ type: "progress", value: currentProgress })}\\n\\n\`);
           }
         });
         
         pipProc.stderr.on("data", (data) => {
           sendLog("stderr", data.toString());
         });
         
         pipProc.on("close", (pipCode) => {
           if (pipCode === 0) {
             sendLog("success", "pdf2zh successfully installed in isolated environment!");
             downloadModel();
           } else {
             sendLog("error", \`pip install failed with code \${pipCode}. Please check your python/pip setup or network connection.\`);
             res.write(\`data: \${JSON.stringify({ type: "progress", value: 0 })}\\n\\n\`);
             res.write(\`data: \${JSON.stringify({ type: "done", message: "Setup completed with errors." })}\\n\\n\`);
             res.end();
           }
         });

         pipProc.on("error", (err) => {
             sendLog("error", \`Failed to span pip command: \${err.message}.\`);
             res.write(\`data: \${JSON.stringify({ type: "progress", value: 0 })}\\n\\n\`);
             res.write(\`data: \${JSON.stringify({ type: "done", message: "Setup completed with errors." })}\\n\\n\`);
             res.end();
         });
       });
    });
    
    venvProc.on("error", (err) => {
       sendLog("error", \`Failed to execute python venv: \${err.message}\`);
       res.write(\`data: \${JSON.stringify({ type: "progress", value: 0 })}\\n\\n\`);
       res.write(\`data: \${JSON.stringify({ type: "done", message: "Setup failed." })}\\n\\n\`);
       res.end();
    });
  }
`;

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /function createVenvAndInstall\(\) \{[\s\S]*?(?=\n\}\);\n\n\/\/ API to Uninstall Local)/m;
content = content.replace(regex, code.trim());
fs.writeFileSync('server.ts', content);
