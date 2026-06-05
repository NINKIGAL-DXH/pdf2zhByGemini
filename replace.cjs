const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /if \(payload\.type === "progress"\) \{\s+setSetupProgressNum\(payload\.value\);\s+\} else if \(payload\.type === "stdout"/g,
  `if (payload.type === "progress") {
                                                  setSetupProgressNum(payload.value);
                                               } else if (payload.type === "model_progress") {
                                                  setModelDownloadProgress({ percentage: payload.percentage, eta: payload.eta, speed: payload.speed });
                                               } else if (payload.type === "stdout"`
);

code = code.replace(
  /setExecuteMode\("native"\);\s+\}\s+\} catch/g,
  `setExecuteMode("native");
                                                  setModelDownloadProgress(null);
                                               }
                                             } catch`
);

fs.writeFileSync('src/App.tsx', code);
