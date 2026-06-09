const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(/\["-m", "pip", "install", "--upgrade"/g, `["-m", "pip", "install", "--no-cache-dir", "--upgrade"`);
s = s.replace(/\["-m", "pip", "install", "urllib3<2"/g, `["-m", "pip", "install", "--no-cache-dir", "urllib3<2"`);
s = s.replace(/pip install "pymupdf==1\.24\.11"/g, `pip install --no-cache-dir "pymupdf==1.24.11"`);

// Add tsinghua mirror just in case
s = s.replace(/"--upgrade", "pip"/g, `"--upgrade", "-i", "https://pypi.tuna.tsinghua.edu.cn/simple", "pip"`);
s = s.replace(/"--no-cache-dir", "urllib3<2"/g, `"--no-cache-dir", "-i", "https://pypi.tuna.tsinghua.edu.cn/simple", "urllib3<2"`);
s = s.replace(/--no-cache-dir "pymupdf==1.24.11"/g, `--no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple "pymupdf==1.24.11"`);

fs.writeFileSync('server.ts', s);
