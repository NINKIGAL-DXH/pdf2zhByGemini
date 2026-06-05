const fs = require('fs');

// Fix server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(
  /const server = app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{/,
  `const host = process.env.HOST || "0.0.0.0";\n  const server = app.listen(PORT, host, () => {`
);
serverContent = serverContent.replace(
  /console\.log\(\`Server running on http:\/\/localhost:\$\{PORT\}\`\);/,
  `console.log(\`Server running on http://\${host}:\${PORT}\`);`
);
serverContent = serverContent.replace(
  /startServer\(\);/,
  `startServer().catch(err => {\n  console.error("Failed to start server asynchronously:", err);\n  process.exit(1);\n});`
);
fs.writeFileSync('server.ts', serverContent);

// Fix electron-main.cjs
let electronContent = fs.readFileSync('electron-main.cjs', 'utf8');
electronContent = electronContent.replace(
  /process\.env\.PORT = '13028';/,
  `process.env.PORT = '13028';\nprocess.env.HOST = '127.0.0.1'; // Bind strictly to localhost`
);
fs.writeFileSync('electron-main.cjs', electronContent);
