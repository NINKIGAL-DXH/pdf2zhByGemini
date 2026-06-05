const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Fix testProc double firing
content = content.replace(
  /const testProc = spawn\(pdf2zhCmdLocal, \["--version"\]\);/,
  `const testProc = spawn(pdf2zhCmdLocal, ["--version"]);\n    let testResolved = false;`
);

content = content.replace(
  /testProc\.on\("error", \(\) => \{/,
  `testProc.on("error", () => {\n      if (testResolved) return;\n      testResolved = true;`
);

content = content.replace(
  /testProc\.on\("close", \(code\) => \{/,
  `testProc.on("close", (code) => {\n      if (testResolved) return;\n      testResolved = true;`
);

// Fix venvProc double firing
content = content.replace(
  /const venvProc = spawn\(pythonCmd, \["-m", "venv", venvDir\]\);/,
  `const venvProc = spawn(pythonCmd, ["-m", "venv", venvDir]);\n    let venvResolved = false;`
);

content = content.replace(
  /venvProc\.on\("close", \(code\) => \{/,
  `venvProc.on("close", (code) => {\n       if (venvResolved) return;\n       venvResolved = true;`
);

content = content.replace(
  /venvProc\.on\("error", \(err\) => \{/,
  `venvProc.on("error", (err) => {\n       if (venvResolved) return;\n       venvResolved = true;`
);

// Fix pipUpgradeProc double firing
content = content.replace(
  /const pipUpgradeProc = spawn\(venvPythonCmd, \["-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"\]\);/,
  `const pipUpgradeProc = spawn(venvPythonCmd, ["-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"]);\n       let pipUpgradeResolved = false;`
);
content = content.replace(
  /pipUpgradeProc\.on\("close", \(upgradeCode\) => \{/,
  `pipUpgradeProc.on("close", (upgradeCode) => {\n         if (pipUpgradeResolved) return;\n         pipUpgradeResolved = true;`
);
content = content.replace(
  /pipUpgradeProc\.on\("error", \(err\) => \{/,
  `pipUpgradeProc.on("error", (err) => {\n           if (pipUpgradeResolved) return;\n           pipUpgradeResolved = true;`
);


// Fix pipProc double firing
content = content.replace(
  /const pipProc = spawn\(venvPythonCmd, \["-m", "pip", "install", "urllib3<2", "certifi", "spacy<3.8.0", "pdf2zh"\]\);/,
  `const pipProc = spawn(venvPythonCmd, ["-m", "pip", "install", "urllib3<2", "certifi", "spacy<3.8.0", "pdf2zh"]);\n         let pipResolved = false;`
);
content = content.replace(
  /pipProc\.on\("close", \(pipCode\) => \{/,
  `pipProc.on("close", (pipCode) => {\n           if (pipResolved) return;\n           pipResolved = true;`
);
content = content.replace(
  /pipProc\.on\("error", \(err\) => \{/,
  `pipProc.on("error", (err) => {\n             if (pipResolved) return;\n             pipResolved = true;`
);

// Fix hfProc double firing
content = content.replace(
  /const hfProc = spawn\(venvPythonCmd, \["-c", pythonCode\], \{/,
  `let hfResolved = false;\n     const hfProc = spawn(venvPythonCmd, ["-c", pythonCode], {`
);
content = content.replace(
  /hfProc\.on\("close", \(code\) => \{/,
  `hfProc.on("close", (code) => {\n        if (hfResolved) return;\n        hfResolved = true;`
);
content = content.replace(
  /hfProc\.on\("error", \(err\) => \{/,
  `hfProc.on("error", (err) => {\n        if (hfResolved) return;\n        hfResolved = true;`
);

// Fix translation proc double firing
content = content.replace(
  /const proc = spawn\(commandToRun, args, \{ cwd: pdf2zhDataDir, env: envVars \}\);/,
  `const proc = spawn(commandToRun, args, { cwd: pdf2zhDataDir, env: envVars });\n  let transResolved = false;`
);
content = content.replace(
  /proc\.on\("close", \(code\) => \{/,
  `proc.on("close", (code) => {\n      if (transResolved) return;\n      transResolved = true;`
);
content = content.replace(
  /proc\.on\("error", \(err\) => \{/,
  `proc.on("error", (err) => {\n      if (transResolved) return;\n      transResolved = true;`
);

fs.writeFileSync('server.ts', content);
