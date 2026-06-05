const fs = require('fs');

let electronContent = fs.readFileSync('electron-main.cjs', 'utf8');

electronContent = electronContent.replace(
  /setTimeout\(\(\) => \{\n    const actualPort = global\.APP_PORT \|\| 13028;\n    mainWindow\.loadURL\('http:\/\/127\.0\.0\.1:' \+ actualPort\)\.catch\(\(err\) => \{\n      console\.warn\("Retrying link connection \(attempt 2\)\.\.\.", err\);\n      setTimeout\(\(\) => \{\n        mainWindow\.loadURL\('http:\/\/127\.0\.0\.1:' \+ actualPort\)\.catch\(\(e\) => \{/g,
  `setTimeout(() => {
    let actualPort = global.APP_PORT || 13028;
    mainWindow.loadURL('http://127.0.0.1:' + actualPort).catch((err) => {
      console.warn("Retrying link connection (attempt 2)...", err);
      setTimeout(() => {
        actualPort = global.APP_PORT || 13028; // Re-evaluate in case server took longer than 1s to set it
        mainWindow.loadURL('http://127.0.0.1:' + actualPort).catch((e) => {`
);

fs.writeFileSync('electron-main.cjs', electronContent);
