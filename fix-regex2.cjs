const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(
  /const match = line\.match\(\/\(\\d\+\)%.*?\\\[.*?<\\s\*\(\[\^,\]\+\),\\s\*\(\[\^\\\]\]\+\)\\\]\/\);\s*if \(match\) \{\s*res\.write\(`data: \$\{JSON\.stringify\(\{ type: "model_progress", percentage: parseInt\(match\[1\], 10\), eta: match\[2\]\.trim\(\), speed: match\[3\]\.trim\(\) \}\)\}\\n\\n`\);\s*\}/g,
  `const match = line.match(/(\\d+)%\\|.*?\\|.*?\\s+\\[(?:.*?(?:<\\s*([^,]+))?|.*?),\\s*([^\\]]+)\\]/);
           if (match) {
              res.write(\`data: \${JSON.stringify({ type: "model_progress", percentage: parseInt(match[1], 10), eta: (match[2] || "00:00").trim(), speed: (match[3] || "N/A").trim() })}\\n\\n\`);
           }`
);

fs.writeFileSync('server.ts', s);
