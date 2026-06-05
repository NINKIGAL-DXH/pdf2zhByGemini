const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(
  /HF_ENDPOINT\: "http:\/\/127\.0\.0\.1\:" \+ \(\(global as any\)\.APP_PORT \|\| 3000\) \+ "\/hf-proxy"/g,
  `HF_ENDPOINT: "https://hf-mirror.com"`
);

fs.writeFileSync('server.ts', s);
