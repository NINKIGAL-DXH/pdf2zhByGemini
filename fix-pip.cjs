const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `        });
        
        pipProc.on("error", (err) => {
           sendLog("error", \`Failed to span pip command: \${err.message}.\`);
           res.write(\`data: \${JSON.stringify({ type: "progress", value: 0 })}\\n\\n\`);
           res.write(\`data: \${JSON.stringify({ type: "done", message: "Setup completed with errors." })}\\n\\n\`);
           res.end();
        });`,
  `          pipProc.on("error", (err) => {
             sendLog("error", \`Failed to span pip command: \${err.message}.\`);
             res.write(\`data: \${JSON.stringify({ type: "progress", value: 0 })}\\n\\n\`);
             res.write(\`data: \${JSON.stringify({ type: "done", message: "Setup completed with errors." })}\\n\\n\`);
             res.end();
          });
        });
        
        pipUpgradeProc.on("error", (err) => {
           sendLog("warning", \`Failed to span pip upgrade command: \${err.message}. It will try proceeding with default pip version.\`);
        });`
);
fs.writeFileSync('server.ts', code);
