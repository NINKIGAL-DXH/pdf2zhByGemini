const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  /proc\.stderr\.on\("data", \(data\) => \{\n\s*sendLog\("stderr", data\.toString\(\)\);\n\s*\}\);/g,
  `proc.stderr.on("data", (data) => {
    const text = data.toString();
    const lines = text.split(/[\\r\\n]+/);
    for (const line of lines) {
       if (!line.trim()) continue;
       const matchModel = line.match(/(\\d+)%\\|.*?\\|.*?\\s+\\[(?:.*?(?:<\\s*([^,]+))?|.*?),\\s*([^\\]]+)\\]/);
       if (matchModel) {
          res.write(\`data: \${JSON.stringify({ type: "model_progress", percentage: parseInt(matchModel[1], 10), eta: (matchModel[2] || "00:00").trim(), speed: (matchModel[3] || "N/A").trim() })}\\n\\n\`);
       } else {
          const transMatch = line.match(/(?:\\s|^)(\\d+)%\\|.*?\\|/);
          if (transMatch) {
              res.write(\`data: \${JSON.stringify({ type: "translation_progress", percentage: parseInt(transMatch[1], 10) })}\\n\\n\`);
          }
       }
       sendLog("stderr", line.trim());
    }
  });`
);

fs.writeFileSync('server.ts', serverContent);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  /\} else if \(payload\.type === "stderr" \|\| payload\.type === "warning"\) \{/g,
  `} else if (payload.type === "translation_progress") {
     setTranslationProgress(payload.percentage);
  } else if (payload.type === "model_progress") {
     setModelDownloadProgress({ percentage: payload.percentage, eta: payload.eta, speed: payload.speed });
  } else if (payload.type === "stderr" || payload.type === "warning") {`
);

fs.writeFileSync('src/App.tsx', appContent);
