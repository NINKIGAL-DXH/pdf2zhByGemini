const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const newPythonCode = `     const pythonCode = \`
import os
import sys
import time

try:
    from huggingface_hub import hf_hub_download
    print("Downloading ONNX layout model...")
    max_retries = 100
    for attempt in range(max_retries):
        try:
            hf_hub_download(
                repo_id="wybxc/DocLayout-YOLO-DocStructBench-onnx", 
                filename="doclayout_yolo_docstructbench_imgsz1024.onnx",
                resume_download=True
            )
            print("Download completed successfully!")
            sys.exit(0)
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}", file=sys.stderr)
            if attempt < max_retries - 1:
                print("Network disconnected or error. Retrying in 5 seconds to resume download...", file=sys.stderr)
                time.sleep(5)
            else:
                sys.exit(1)
except Exception as e:
    print(f"Error downloading model: {e}", file=sys.stderr)
    sys.exit(1)
\`;`;

content = content.replace(
  /const pythonCode = `[\s\S]*?`;/m,
  newPythonCode
);

fs.writeFileSync('server.ts', content);
