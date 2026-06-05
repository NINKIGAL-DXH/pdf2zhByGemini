const fs = require('fs');

const code = `
  function downloadModel() {
     sendLog("info", "Pre-downloading required ONNX layout models from HF Hub...");
     res.write(\`data: \${JSON.stringify({ type: "progress", value: 90 })}\\n\\n\`);
     
     const venvPythonCmd = isWin ? path.join(venvDir, "Scripts", "python.exe") : path.join(venvDir, "bin", "python3");
     const hfProc = spawn(venvPythonCmd, ["-m", "huggingface_hub.cli", "download", "wybxc/DocLayout-YOLO-DocStructBench-onnx", "doclayout_yolo_docstructbench_imgsz1024.onnx"], {
        env: { ...process.env, HF_ENDPOINT: "http://127.0.0.1:3000/hf-proxy" }
     });
     
     hfProc.stdout.on("data", (data) => sendLog("stdout", data.toString().trim()));
     hfProc.stderr.on("data", (data) => {
        const text = data.toString();
        const textLines = text.split(/[\\r\\n]+/);
        for (const line of textLines) {
           if (!line.trim()) continue;
           const match = line.match(/(\\d+)%.*?\\[.*?<\\s*([^,]+),\\s*([^\\]]+)\\]/);
           if (match) {
              res.write(\`data: \${JSON.stringify({ type: "model_progress", percentage: parseInt(match[1], 10), eta: match[2].trim(), speed: match[3].trim() })}\\n\\n\`);
           }
           sendLog("stderr", line.trim());
        }
     });
     hfProc.on("close", (code) => {
        if (code === 0) {
           sendLog("success", "ONNX Layout Models downloaded successfully!");
           res.write(\`data: \${JSON.stringify({ type: "progress", value: 100 })}\\n\\n\`);
           res.write(\`data: \${JSON.stringify({ type: "done", message: "Setup completed successfully." })}\\n\\n\`);
        } else {
           sendLog("warning", \`ONNX Layout Model download failed with code \${code}. Translation might retry downloading it at runtime.\`);
           res.write(\`data: \${JSON.stringify({ type: "progress", value: 100 })}\\n\\n\`);
           res.write(\`data: \${JSON.stringify({ type: "done", message: "Setup completed with warnings." })}\\n\\n\`);
        }
        res.end();
     });
     
     hfProc.on("error", (err) => {
        sendLog("warning", \`Failed to span huggingface-cli: \${err.message}. Models will download at runtime.\`);
        res.write(\`data: \${JSON.stringify({ type: "progress", value: 100 })}\\n\\n\`);
        res.write(\`data: \${JSON.stringify({ type: "done", message: "Setup completed with warnings." })}\\n\\n\`);
        res.end();
     });
  }
`;

let content = fs.readFileSync('server.ts', 'utf8');
const regex = /function downloadModel\(\) \{[\s\S]*?(?=\n\s*if \(forceReinstall\))/m;
content = content.replace(regex, code.trim());
fs.writeFileSync('server.ts', content);
