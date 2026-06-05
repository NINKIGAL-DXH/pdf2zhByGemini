const fs = require('fs');

let s = fs.readFileSync('server.ts', 'utf8');

// The dynamic port might not be ready if evaluated immediately, but downloadModel and translation run later!
s = s.replace(
  /HF_ENDPOINT\: "http:\/\/127\.0\.0\.1\:3000\/hf-proxy"/g,
  `HF_ENDPOINT: "http://127.0.0.1:" + ((global as any).APP_PORT || 3000) + "/hf-proxy"`
);

s = s.replace(
  /proxyRes\.headers\.location = \`http:\/\/127\.0\.0\.1\:3000\/hf-proxy\?url=\$\{encodeURIComponent\(absoluteLocation\)\}\`;/g,
  `proxyRes.headers.location = \`http://127.0.0.1:\${(global as any).APP_PORT || 3000}/hf-proxy?url=\${encodeURIComponent(absoluteLocation)}\`;`
);

fs.writeFileSync('server.ts', s);
