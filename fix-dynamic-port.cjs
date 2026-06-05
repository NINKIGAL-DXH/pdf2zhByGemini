const fs = require('fs');

// ==== 1. SERVER.TS ====
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  /const server = app\.listen\(PORT, host, \(\) => \{/,
  `const server = app.listen(PORT, host, () => {\n    const address = server.address();\n    const actualPort = typeof address === 'string' ? PORT : address?.port;\n    if (typeof global !== 'undefined') {\n       (global as any).APP_PORT = actualPort;\n    }`
);

serverContent = serverContent.replace(
  /console\.log\(\`Server running on http:\/\/\$\{host\}:\$\{PORT\}\`\);/,
  `console.log(\`Server running on http://\${host}:\${actualPort}\`);`
);

fs.writeFileSync('server.ts', serverContent);


// ==== 2. ELECTRON-MAIN.CJS ====
let electronContent = fs.readFileSync('electron-main.cjs', 'utf8');

electronContent = electronContent.replace(
  /process\.env\.PORT = '13028';/,
  `process.env.PORT = '0'; // Use 0 to let OS assign a random free port`
);

// We need to look up global.APP_PORT inside the setTimeout
electronContent = electronContent.replace(
  /mainWindow\.loadURL\('http:\/\/127\.0\.0\.1:13028'\)\.catch\(\(err\) => \{/g,
  `const actualPort = global.APP_PORT || 13028;\n    mainWindow.loadURL('http://127.0.0.1:' + actualPort).catch((err) => {`
);
electronContent = electronContent.replace(
  /mainWindow\.loadURL\('http:\/\/127\.0\.0\.1:13028'\)\.catch\(\(e\) => \{/g,
  `mainWindow.loadURL('http://127.0.0.1:' + actualPort).catch((e) => {`
);

// Fix the error message to not show hardcoded 13028
electronContent = electronContent.replace(
  /on port 13028/g,
  `on port " + actualPort + "`
);

fs.writeFileSync('electron-main.cjs', electronContent);
