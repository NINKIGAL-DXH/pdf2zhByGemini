const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /const envVars = \{ \.\.\.process\.env,/g,
  'const envVars: any = { ...process.env,'
);

fs.writeFileSync('server.ts', content);
