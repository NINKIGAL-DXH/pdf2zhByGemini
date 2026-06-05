const fs = require('fs');

let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(
  /if \(apiKey\) \{\n\s*envVars\.OPENAI_API_KEY = apiKey;\n\s*\}/,
  `if (apiKey) {
     envVars.OPENAI_API_KEY = apiKey;
  } else {
     envVars.OPENAI_API_KEY = "sk-dummy";
  }`
);

fs.writeFileSync('server.ts', s);
