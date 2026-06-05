const proxyCode = `
// API to proxy huggingface downloads (bypasses python SSL/TLS limitations on older macs)
app.use("/hf-proxy", (req, res) => {
  // Extract target URL from query parameter if provided (for redirects), else build from req.url
  let targetUrlStr = req.query.url;
  if (!targetUrlStr) {
     // Remove query params related to hfproxy if any, usually it's just the path
     targetUrlStr = "https://hf-mirror.com" + req.url;
  }
  
  const targetUrl = new URL(targetUrlStr);
  const proxyModule = targetUrl.protocol === 'http:' ? require("http") : require("https");
  
  const options = {
    method: req.method,
    headers: {
      "User-Agent": req.headers["user-agent"] || "huggingface_hub/0.23.0",
      ...(req.headers["range"] && { "Range": req.headers["range"] }),
      ...(req.headers["authorization"] && { "Authorization": req.headers["authorization"] })
    }
  };

  const proxyReq = proxyModule.request(targetUrl, options, (proxyRes) => {
    // Intercept redirects and rewrite the Location header so python uses HTTP
    let statusCode = proxyRes.statusCode || 200;
    
    // For redirect status codes, we capture the Location header
    if ([301, 302, 303, 307, 308].includes(statusCode) && proxyRes.headers.location) {
      const originalLocation = proxyRes.headers.location;
      // Convert to absolute URL if it's relative
      let absoluteLocation = originalLocation;
      if (!absoluteLocation.startsWith("http")) {
        absoluteLocation = new URL(originalLocation, targetUrl.origin).toString();
      }
      
      // Rewrite the location to go through our proxy again
      proxyRes.headers.location = \`http://127.0.0.1:3000/hf-proxy?url=\${encodeURIComponent(absoluteLocation)}\`;
    }

    res.status(statusCode);
    Object.keys(proxyRes.headers).forEach((key) => {
      res.setHeader(key, proxyRes.headers[key]);
    });

    if (req.method === "HEAD") {
      res.end();
      return;
    }
    
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("[HF Proxy Error]", err.message);
    res.status(500).end();
  });

  req.pipe(proxyReq, { end: true });
});
`;

const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('app.use("/hf-proxy"')) {
  // insert it before app.post("/api/pdf2zh-translate"
  code = code.replace(
    '// API to run actual PDFMathTranslate/pdf2zh Python script',
    proxyCode + '\n// API to run actual PDFMathTranslate/pdf2zh Python script'
  );
}

// ensure HF_ENDPOINT is the local proxy
code = code.replace(/HF_ENDPOINT: "https:\/\/hf-mirror\.com"/g, 'HF_ENDPOINT: "http://127.0.0.1:3000/hf-proxy"');

fs.writeFileSync('server.ts', code);
