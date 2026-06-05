const fs = require('fs');

let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(
  /currentProgress = Math\.min\(currentProgress \+ 1, 95\);/g,
  `currentProgress = Math.min(currentProgress + 1, 80); // Cap at 80 for pip install so UI does not look stuck at 95, allows room for Model downloading if needed`
);
s = s.replace(
  /if \(out\.includes\("Collecting"\) \|\| out\.includes\("Downloading"\)\) \{/g,
  `if (out.includes("Collecting") || out.includes("Downloading") || out.includes("Installing")) {`
);

fs.writeFileSync('server.ts', s);
