const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(
  /const match = line\.match\(\/\(\\d\+\)%.*?\\\[.*?<\\s\*\(\[\^,\]\+\),\\s\*\(\[\^\\\]\]\+\)\\\]\/\);/,
  `const match = line.match(/(\\d+)%\\|.*?\\|.*?\\s+\\[(?:.*?(?:<\\s*([^,]+))?|.*?),\\s*([^\\]]+)\\]/);`
);

s = s.replace(
  /Percentage: parseInt\(match\[1\], 10\), eta: match\[2\]\.trim\(\), speed: match\[3\]\.trim\(\)/g,
  `percentage: parseInt(match[1], 10), eta: (match[2] || "00:00").trim(), speed: (match[3] || "N/A").trim()`
);

fs.writeFileSync('server.ts', s);
