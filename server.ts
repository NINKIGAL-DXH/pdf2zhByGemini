import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import multer from "multer";
import { spawn } from "child_process";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "50mb" }));

// PDF2ZH Native Execution working directory (Cleanly uninstallable)
// Using an explicit designated folder in the system so users can cleanly delete it.
let pdf2zhDataDir = "";
try {
  // Use system-approved app data directory if provided by Electron, otherwise fallback
  pdf2zhDataDir = process.env.APP_DATA_DIR || path.join(os.homedir(), ".pdf2zh_gui_workspace");
  if (!fs.existsSync(pdf2zhDataDir)) {
    fs.mkdirSync(pdf2zhDataDir, { recursive: true });
  }
} catch (err) {
  try {
    console.warn("Failed to create workspace in homedir, falling back to tmpdir:", err);
    pdf2zhDataDir = path.join(os.tmpdir(), ".pdf2zh_gui_workspace");
    if (!fs.existsSync(pdf2zhDataDir)) {
      fs.mkdirSync(pdf2zhDataDir, { recursive: true });
    }
  } catch (err2) {
    console.warn("Failed to create workspace in tmpdir, using a temporary directory path:", err2);
    // NEVER fall back to process.cwd() in an Electron app as modifying the app bundle breaks the macOS code signature.
    pdf2zhDataDir = path.join(os.tmpdir(), "pdf2zh_gui_" + Date.now().toString());
    if (!fs.existsSync(pdf2zhDataDir)) {
      fs.mkdirSync(pdf2zhDataDir, { recursive: true });
    }
  }
}

// Multer storage for uploaded PDFs waiting for native python translation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(pdf2zhDataDir, "uploads");
    try {
      if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      console.error("Failed to create uploads directory:", err);
      // Fallback to os.tmpdir() directly
      cb(null, os.tmpdir());
    }
  },
  filename: (req, file, cb) => {
    // Ensure safe file names
    cb(null, Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_"));
  }
});
const upload = multer({ storage });


// Resolve and serve the pdfjs-dist web worker locally under same-origin to pass iframe browser sandbox CORS blocks
app.get("/pdf.worker.min.mjs", (req, res) => {
  try {
    // In production, __dirname is dist/ inside the ASAR. node_modules is at __dirname/../node_modules.
    // In dev, it might be different, so let's try both paths.
    let workerPath = path.join(__dirname, "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
    if (!fs.existsSync(workerPath)) {
       workerPath = path.join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
    }
    if (fs.existsSync(workerPath)) {
      res.setHeader("Content-Type", "application/javascript");
      return res.sendFile(workerPath);
    }
    // Fallback if not found in build path
    console.warn("pdf.worker.min.mjs not found at standard path:", workerPath);
    return res.status(404).send("Worker script not found");
  } catch (err: any) {
    console.error("Failed to serve local pdf.worker.min.mjs:", err);
    return res.status(500).send("Internal server error serving worker");
  }
});

// Initialize Gemini SDK with custom user agent for telemetry
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required on the server.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Test Connection Endpoint
app.post("/api/test-connection", async (req, res) => {
  const { provider, apiKey, endpoint, model } = req.body;

  try {
    // If testing built-in Gemini
    if (provider === "gemini") {
      try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash",
          contents: "Hello! Reply with OK",
        });
        return res.json({
          success: true,
          message: "Successfully connected to Cloud Gemini API!",
          modelUsed: "gemini-3.1-flash",
        });
      } catch (err: any) {
        return res.json({
          success: false,
          message: `Cloud Gemini API error: ${err.message || err}`,
        });
      }
    }

    // Try standard custom/local endpoint testing (e.g. LM Studio, Ollama, OpenAI)
    if (provider === "openai" || provider === "lmstudio" || provider === "omlx") {
      const targetEndpoint = endpoint || "https://api.openai.com/v1";
      const targetModel = model || (provider === "lmstudio" ? "qwen2.5-7b-instruct" : provider === "omlx" ? "llama3.2" : "gpt-3.5-turbo");
      const url = targetEndpoint.endsWith("/chat/completions") ? targetEndpoint : `${targetEndpoint}/chat/completions`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        console.log(`Testing connection directly to provider "${provider}" custom endpoint: ${url}`);
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            model: targetModel,
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 5,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return res.json({
            success: true,
            message: `Successfully connected to target model "${targetModel}"!`,
          });
        } else {
          const errorText = await response.text();
          const isLocalhost = endpoint && (endpoint.includes("localhost") || endpoint.includes("127.0.0.1"));
          let adviceMsg = "";
          if (isLocalhost) {
            adviceMsg = "\n\n💡提示: AI Studio 网页版目前在云端运行，无法直接请求您内网或本机 localhost 的端口。如有需要，欢迎您在左上角设置中【导出为 ZIP 格式】并在您本机运行，或在 LM Studio 中开启隧道工具 (Ngrok)。";
          }
          return res.json({
            success: false,
            message: `Host returned error code ${response.status}: ${errorText.substring(0, 150)}${adviceMsg}`,
          });
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isLocalhost = endpoint && (endpoint.includes("localhost") || endpoint.includes("127.0.0.1"));
        let adviceMsg = "";
        if (isLocalhost) {
          adviceMsg = "\n\n💡 提示: 您的自定义地址是 localhost/127.0.0.1，由于此 APP 正在云端独立沙盒环境预览，服务端无权访问您的个人电脑。如果您需要调试本地模型：\n1. 可先使用左上角设置面板的【导出代码 ZIP 包】在您本机使用 node server.ts 运行，即可本地秒连 127.0.0.1:1234 工作流！\n2. 也可以利用 Ngrok 或 LocalTunnel 将本地接口映射出公网 https 域名，再将该网址填入此处调试。\n3. 在您的云端网页预览里，即使连接失败，我们也会智能切换为云端 Gemini 进行翻译防挂，让您依然能预览系统完整的渲染排版！";
        }
        return res.json({
          success: false,
          isLocal: isLocalhost,
          message: `Connection test failed: ${err.message || err}${adviceMsg}`,
        });
      }
    }

    // Default fallback
    return res.json({
      success: true,
      message: "Configuration Saved!",
    });
  } catch (error: any) {
    return res.json({
      success: false,
      message: `Failed to connect: ${error.message || error}`,
    });
  }
});

// Helper for fuzzy array parsing of model chat completion outputs
function parseTranslationResponse(text: string, expectedCount: number): string[] {
  let trimmed = text.trim();
  
  // Strip markdown blocks if any
  if (trimmed.startsWith("```")) {
    trimmed = trimmed.replace(/^```(?:json)?\n?/i, "");
    trimmed = trimmed.replace(/\n?```$/, "");
    trimmed = trimmed.trim();
  }
  
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed.translations && Array.isArray(parsed.translations)) {
      return parsed.translations;
    }
    if (parsed.translatedBlocks && Array.isArray(parsed.translatedBlocks)) {
      return parsed.translatedBlocks;
    }
  } catch (e) {
    console.warn("Raw JSON array parsing failed, attempting sub-array extraction...", e);
  }
  
  try {
    const startIndex = trimmed.indexOf("[");
    const endIndex = trimmed.lastIndexOf("]");
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const candidates = trimmed.substring(startIndex, endIndex + 1);
      const parsed = JSON.parse(candidates);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Sub-array extraction match failed.", e);
  }
  
  // Line division fallback
  const lines = trimmed
    .split(/\n+/)
    .map(l => l.replace(/^[-*•\s\d.]+|[#"']/g, "").trim())
    .filter(Boolean);
  if (lines.length === expectedCount) {
    return lines;
  }
  
  return [];
}

// Real/Simulation translation router
app.post("/api/translate", async (req, res) => {
  const { textBlocks, sourceLang, targetLang, provider, model, apiKey, endpoint, threads } = req.body;

  if (!textBlocks || !Array.isArray(textBlocks)) {
    return res.status(400).json({ error: "Invalid textBlocks format. Array expected." });
  }

  const concurrentConfig = Math.min(Math.max(Number(threads) || 1, 1), 16);

  // If user explicitly requests Cloud Gemini
  if (provider === "gemini") {
    try {
      const ai = getGeminiClient();
      const batchSize = 25;
      const translatedBlocks: string[] = [];

      console.log(`Starting Cloud Gemini translation of ${textBlocks.length} blocks in batches of ${batchSize}...`);

      for (let i = 0; i < textBlocks.length; i += batchSize) {
        const batch = textBlocks.slice(i, i + batchSize);
        try {
          const prompt = `Translate the following JSON array of text segments from "${sourceLang || "English"}" to "${targetLang || "Chinese (Simplified)"}".
Follow these rules strictly:
1. Preserve all mathematical formulas, LaTeX, and technical variables. Wrap mathematical equations in standard Markdown LaTeX format (e.g., $E=mc^2$ or $$...$$) where applicable.
2. Translate ALL English human-readable words and sentences to natural ${targetLang || "Chinese (Simplified)"}. If the target is Chinese, outputs must contain Chinese characters! Do NOT leave English text untranslated.
3. Keep the output array in the exact same index order and length. The output MUST have exactly ${batch.length} elements.
4. DO NOT drop punctuation marks (periods, commas, etc). Translate them correspondingly.
5. Return EXACTLY a JSON array of strings. Do not include markdown codeblocks or any additional packaging text outside the JSON structure.

Input List:
${JSON.stringify(batch)}
`;

          const geminiResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                }
              }
            },
          });

          const responseText = geminiResponse.text?.trim() || "[]";
          let parsed = parseTranslationResponse(responseText, batch.length);
          let finalBatch: string[] = [];
          
          if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
            console.warn(`Gemini returned invalid or empty JSON array. Retrying translation individually for the batch of ${batch.length} items to prevent untranslated sentences.`);
            parsed = batch; // Use original batch as fallback array to be caught by the loop below
          } else if (parsed.length !== batch.length) {
            console.warn(`Gemini length mismatch (Expected ${batch.length}, got ${parsed.length}). Using partial and padding...`);
            const aligned = parsed.slice(0, batch.length);
            while (aligned.length < batch.length) {
              aligned.push(batch[aligned.length]);
            }
            parsed = aligned;
          }

          // Single-item validation loop to catch un-translated fragments or missing languages
          for (let k = 0; k < batch.length; k++) {
              let singleEnglishText = batch[k];
              let singleText = parsed[k];
              
              const isTargetChinese = (targetLang || "").toLowerCase().includes("chinese") || (targetLang || "").toLowerCase().includes("zh");
              const isUntranslated = isTargetChinese && /[a-zA-Z]{3,}/.test(singleEnglishText) && !/[\u4e00-\u9fa5]/.test(singleText);
              
              if (isUntranslated || singleText.trim() === "[]" || singleText.trim() === "") {
                 try {
                     const singlePrompt = `Translate the following text strictly from "${sourceLang || "English"}" to "${targetLang || "Chinese (Simplified)"}".
CRITICAL RULES:
1. You MUST translate all human-readable words into ${targetLang || "Chinese (Simplified)"}. 
2. If you leave the text purely in English when the target is Chinese, this is a FATAL ERROR.
3. Preserve all mathematical formulas and LaTeX perfectly (do not translate variable names or math).
4. Output ONLY the translated string, nothing else.

Text to translate:
${singleEnglishText}`;
                     
                     let singleResponse = await ai.models.generateContent({
                        model: "gemini-3.1-flash",
                        contents: singlePrompt
                     });
                     singleText = singleResponse.text?.trim().replace(/^['"]|['"]$/g, '') || singleText;
                     
                     if (isTargetChinese && /[a-zA-Z]{3,}/.test(singleEnglishText) && !/[\u4e00-\u9fa5]/.test(singleText)) {
                          const retryResponse = await ai.models.generateContent({
                            model: "gemini-3.1-flash",
                            contents: `You failed to translate this to Chinese! Please forcefully translate this paragraph to Chinese while keeping formulas intact:\n\n${singleEnglishText}`
                          });
                          singleText = retryResponse.text?.trim().replace(/^['"]|['"]$/g, '') || singleText;
                     }
                 } catch (retryErr) {
                     console.error("Individual fallback translation failed:", retryErr);
                 }
              }
              finalBatch.push(singleText);
          }
          translatedBlocks.push(...finalBatch);
        } catch (batchErr: any) {
          console.error(`Cloud Gemini translation batch starting at index ${i} failed partially:`, batchErr.message || batchErr);
          // Gracefully isolate batch translation error to prevent entire process halt on long PDFs
          translatedBlocks.push(...batch);
        }
      }

      return res.json({
        success: true,
        translatedBlocks,
        message: "Translated successfully via Cloud Gemini Engine."
      });
    } catch (apiErr: any) {
      console.error("Gemini API global initialization failed:", apiErr);
      return res.status(500).json({ 
        error: `Gemini API Call Failed: ${apiErr.message || apiErr}` 
      });
    }
  }

  // Handle any custom OpenAI-compatible engine target (lmstudio, omlx, openai)
  const targetEndpoint = endpoint || "https://api.openai.com/v1";
  const targetModel = model || (provider === "lmstudio" ? "qwen2.5-7b-instruct" : provider === "omlx" ? "llama3.2" : "gpt-4o-mini");
  const url = targetEndpoint.endsWith("/chat/completions") ? targetEndpoint : `${targetEndpoint}/chat/completions`;

  const batchSize = 15; // Extremely safe batch size for local models to keep performance high and prevent context truncation
  const translatedBlocks: string[] = [];

  try {
    console.log(`Starting Custom API translation of ${textBlocks.length} blocks in batches of ${batchSize} with ${concurrentConfig} threads...`);

    const resultBlocks: string[] = new Array(textBlocks.length).fill("");
    const batches: { startIdx: number, batch: string[] }[] = [];
    for (let i = 0; i < textBlocks.length; i += batchSize) {
      batches.push({ startIdx: i, batch: textBlocks.slice(i, i + batchSize) });
    }

    const workerQueue = [...batches];

    const worker = async () => {
      while (workerQueue.length > 0) {
        const { startIdx, batch } = workerQueue.shift()!;
        try {
          const prompt = `Translate the following JSON array of text segments from "${sourceLang || "English"}" to "${targetLang || "Chinese (Simplified)"}".
Follow these rules strictly:
1. Preserve all mathematical formulas, LaTeX, and technical variables. Wrap mathematical equations in standard Markdown LaTeX format (e.g., $E=mc^2$ or $$...$$) where applicable.
2. Translate all English words and sentences to natural ${targetLang || "Chinese (Simplified)"}, even if they are partial sentence fragments or figures. Do NOT leave English text untranslated.
3. Keep the output array in the exact same index order and length. The output MUST have exactly ${batch.length} elements.
4. DO NOT drop punctuation marks (periods, commas, etc). Translate them correspondingly.
5. Return EXACTLY a raw JSON array of strings. Do not include markdown wrappers (like \`\`\`json).

Input List: 
${JSON.stringify(batch)}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s per batch is extremely comfortable

          console.log(`Sending real API translation target batch starting at index ${startIdx}: [${targetModel}] at [${url}]`);
          
          const requestBody: any = {
            model: targetModel,
            messages: [
              { role: "system", content: "You are a layout-preserving translation engine. Translate accurately and output a raw JSON array of translated strings in identical array dimension length." },
              { role: "user", content: prompt }
            ]
          };

          if (provider === "openai") {
            requestBody.response_format = { type: "json_object" };
          }

          const apiResponse = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (apiResponse.ok) {
            const data = await apiResponse.json();
            const contentText = data.choices?.[0]?.message?.content || "[]";
            const parsed = parseTranslationResponse(contentText, batch.length);
            if (parsed && Array.isArray(parsed) && parsed.length === batch.length) {
              const aligned = parsed.slice(0, batch.length);
              for (let j = 0; j < aligned.length; j++) resultBlocks[startIdx + j] = aligned[j];
            } else if (parsed && Array.isArray(parsed) && parsed.length > 0) {
              console.warn(`Local model length mismatch (Expected ${batch.length}, got ${parsed.length}). Using partial and padding...`);
              const aligned = parsed.slice(0, batch.length);
              while (aligned.length < batch.length) {
                aligned.push(batch[aligned.length]);
              }
              for (let j = 0; j < aligned.length; j++) resultBlocks[startIdx + j] = aligned[j];
            } else {
              console.warn(`JSON alignment list parse failed completely for batch starting at ${startIdx}, returning original texts for fallback to prevent crash.`);
              for (let j = 0; j < batch.length; j++) resultBlocks[startIdx + j] = batch[j];
            }
          } else {
            let responseErrText = "";
            try {
              responseErrText = await apiResponse.text();
            } catch (_) {}
            console.warn(`Model host returned statusCode ${apiResponse.status} for batch ending at ${startIdx + batch.length}: ${responseErrText || "No response body"}. Utilizing original texts.`);
            for (let j = 0; j < batch.length; j++) resultBlocks[startIdx + j] = batch[j];
          }
        } catch (batchErr: any) {
          console.error(`Custom translation batch starting at index ${startIdx} failed partially:`, batchErr.message || batchErr);
          // Isolate error from halting the entire long document progress
          for (let j = 0; j < batch.length; j++) resultBlocks[startIdx + j] = batch[j];
        }
      }
    };

    const workerPromises = [];
    for (let i = 0; i < concurrentConfig; i++) {
       workerPromises.push(worker());
    }
    await Promise.all(workerPromises);

    translatedBlocks.push(...resultBlocks);

    if (translatedBlocks.length > 0) {
      return res.json({
        success: true,
        translatedBlocks,
        message: `Translated via custom model: "${targetModel}"`
      });
    } else {
      throw new Error("No translation returned from Custom model.");
    }

  } catch (err: any) {
    console.warn(`Fallback triggered because of global custom endpoint failure: "${url}" (${err.message || err}). Bootstrapping cloud sandbox Gemini translation fallback...`);
    
    // Check if cloud fallback API key is actually set before attempting to load getGeminiClient()
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    if (!hasGeminiKey) {
      console.warn("Cloud Gemini API Key is not configured in Settings. Skipping fallback to show raw connection error.");
      return res.status(500).json({ 
        error: `Custom model connection failed: ${err.message || "Timeout / connection refused"}. (Additional details: GEMINI_API_KEY environment variable is not configured, so cloud fallback is disabled.)`
      });
    }

    // Cloud fallback so application remains functional and gorgeous dynamically
    try {
      const ai = getGeminiClient();
      const batchSize = 25;
      const translatedBlocks: string[] = [];

      for (let i = 0; i < textBlocks.length; i += batchSize) {
        const batch = textBlocks.slice(i, i + batchSize);
        try {
          const fallbackPrompt = `Translate the following JSON array of text segments from "${sourceLang || "English"}" to "${targetLang || "Chinese (Simplified)"}".
Follow these rules strictly:
1. Preserve all mathematical formulas, LaTeX, and technical variables. Wrap mathematical equations in standard Markdown LaTeX format (e.g., $E=mc^2$ or $$...$$) where applicable.
2. Translate all English words and sentences to natural ${targetLang || "Chinese (Simplified)"}, even if they are partial sentence fragments or figures. Do NOT leave English text untranslated.
3. Keep the output array in the exact same index order and length. The output MUST have exactly ${batch.length} elements.
4. DO NOT drop punctuation marks (periods, commas, etc). Translate them correspondingly.
5. Return EXACTLY a JSON array of strings. Do not include markdown codeblocks or any additional packaging text outside the JSON structure.

Input List:
${JSON.stringify(batch)}
`;

          const geminiResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash",
            contents: fallbackPrompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                }
              }
            },
          });

          const responseText = geminiResponse.text?.trim() || "[]";
          let parsed = parseTranslationResponse(responseText, batch.length);
          let finalBatch: string[] = [];
          
          if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
            console.warn(`Gemini returned invalid or empty JSON array. Retrying translation individually for the batch of ${batch.length} items to prevent untranslated sentences.`);
            parsed = batch; // fallback to original texts so loop will catch and individual-translate
          } else if (parsed.length !== batch.length) {
            console.warn(`Gemini length mismatch (Expected ${batch.length}, got ${parsed.length}). Using partial and padding...`);
            const aligned = parsed.slice(0, batch.length);
            while (aligned.length < batch.length) {
              aligned.push(batch[aligned.length]);
            }
            parsed = aligned;
          }

          for (let k = 0; k < batch.length; k++) {
              let singleEnglishText = batch[k];
              let singleText = parsed[k];
              
              const isTargetChinese = (targetLang || "").toLowerCase().includes("chinese") || (targetLang || "").toLowerCase().includes("zh");
              const isUntranslated = isTargetChinese && /[a-zA-Z]{3,}/.test(singleEnglishText) && !/[\u4e00-\u9fa5]/.test(singleText);
              
              if (isUntranslated || singleText.trim() === "[]" || singleText.trim() === "") {
                 try {
                     const singlePrompt = `Translate the following text strictly from "${sourceLang || "English"}" to "${targetLang || "Chinese (Simplified)"}".
CRITICAL RULES:
1. You MUST translate all human-readable words into ${targetLang || "Chinese (Simplified)"}. 
2. If you leave the text purely in English when the target is Chinese, this is a FATAL ERROR.
3. Preserve all mathematical formulas and LaTeX perfectly (do not translate variable names or math).
4. Output ONLY the translated string, nothing else.

Text to translate:
${singleEnglishText}`;
                     let singleResponse = await ai.models.generateContent({
                        model: "gemini-3.1-flash",
                        contents: singlePrompt
                     });
                     singleText = singleResponse.text?.trim().replace(/^['"]|['"]$/g, '') || singleText;
                     
                     if (isTargetChinese && /[a-zA-Z]{3,}/.test(singleEnglishText) && !/[\u4e00-\u9fa5]/.test(singleText)) {
                          const retryResponse = await ai.models.generateContent({
                            model: "gemini-3.1-flash",
                            contents: `You failed to translate this to Chinese! Please forcefully translate this paragraph to Chinese while keeping formulas intact:\n\n${singleEnglishText}`
                          });
                          singleText = retryResponse.text?.trim().replace(/^['"]|['"]$/g, '') || singleText;
                     }
                 } catch (retryErr) {
                     console.error("Individual fallback translation failed:", retryErr);
                 }
              }
              finalBatch.push(singleText);
          }
          translatedBlocks.push(...finalBatch);
        } catch (fErr: any) {
          console.error(`Gemini fallback batch starting at index ${i} failed partially:`, fErr.message || fErr);
          translatedBlocks.push(...batch);
        }
      }

      return res.json({
        success: true,
        translatedBlocks,
        fallbackUsed: true,
        message: `Connected using Cloud Gemini fallback! (Your offline local model on "localhost" is inaccessible from our cloud workspace sandbox environment. Run this tool locally or expose it via tunnel if you wish to bypass this.)`
      });
    } catch (gemError: any) {
      console.error("Gemini fallback also failed:", gemError);
      return res.status(500).json({ error: `Translation failed on both customized model and Backup Cloud Gemini backend: ${gemError.message || gemError}` });
    }
  }
});

// API to Setup/Install Local pdf2zh instance
app.post("/api/pdf2zh-setup", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendLog = (type: string, message: string) => {
    res.write(`data: ${JSON.stringify({ type, message })}\n\n`);
  };

  sendLog("info", "Starting native pdf2zh one-click installation checking...");
  
  // Create configuration file tracker to ensure clean uninstall visibility
  const configPath = path.join(pdf2zhDataDir, "config.json");
  fs.writeFileSync(configPath, JSON.stringify({
    setupDate: new Date().toISOString(),
    uninstallInstruction: `To completely clean up, simply delete this directory: ${pdf2zhDataDir}. It contains a fully self-isolated virtual environment.`
  }, null, 2));

  sendLog("info", `Workspace configuration directory created safely at: ${pdf2zhDataDir}`);

  const venvDir = path.join(pdf2zhDataDir, "venv");
  const isWin = process.platform === "win32";
  const pythonCmd = isWin ? "python" : "python3";
  const pipCmd = isWin ? path.join(venvDir, "Scripts", "pip.exe") : path.join(venvDir, "bin", "pip");
  const pdf2zhCmdLocal = isWin ? path.join(venvDir, "Scripts", "pdf2zh.exe") : path.join(venvDir, "bin", "pdf2zh");

  const forceReinstall = req.query.forceReinstall === 'true';

  function downloadModel() {
     sendLog("info", "Pre-downloading required ONNX layout models from HF Hub...");
     res.write(`data: ${JSON.stringify({ type: "progress", value: 90 })}\n\n`);
     
     const venvPythonCmd = isWin ? path.join(venvDir, "Scripts", "python.exe") : path.join(venvDir, "bin", "python3");
     
     // Instead of just calling huggingface_hub.cli directly which might be problematic, 
     // we run pdf2zh with a dummy command or trigger its model download, 
     // or we just use python to robustly download.
     
          const pythonCode = `
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
`;
     
     let hfResolved = false;
     const hfProc = spawn(venvPythonCmd, ["-c", pythonCode], {
        env: { ...process.env, HF_ENDPOINT: "https://hf-mirror.com", HF_HUB_ENABLE_HF_TRANSFER: "0" }
     });
     
     hfProc.stdout.on("data", (data) => sendLog("stdout", data.toString().trim()));
     hfProc.stderr.on("data", (data) => {
        const text = data.toString();
        const textLines = text.split(/[\r\n]+/);
        for (const line of textLines) {
           if (!line.trim()) continue;
           const match = line.match(/(\d+)%\|.*?\|.*?\s+\[(?:.*?(?:<\s*([^,]+))?|.*?),\s*([^\]]+)\]/);
           if (match) {
              res.write(`data: ${JSON.stringify({ type: "model_progress", percentage: parseInt(match[1], 10), eta: (match[2] || "00:00").trim(), speed: (match[3] || "N/A").trim() })}\n\n`);
           }
           sendLog("stderr", line.trim());
        }
     });
     hfProc.on("close", (code) => {
        if (hfResolved) return;
        hfResolved = true;
        if (code === 0) {
           sendLog("success", "ONNX Layout Models downloaded and verified successfully!");
           res.write(`data: ${JSON.stringify({ type: "progress", value: 100 })}\n\n`);
           res.write(`data: ${JSON.stringify({ type: "done", message: "Setup completed successfully." })}\n\n`);
        } else {
           sendLog("warning", `ONNX Layout Model download failed with code ${code}. Translation might retry downloading it at runtime.`);
           res.write(`data: ${JSON.stringify({ type: "progress", value: 100 })}\n\n`);
           res.write(`data: ${JSON.stringify({ type: "done", message: "Setup completed with warnings." })}\n\n`);
        }
        res.end();
     });
     
     hfProc.on("error", (err) => {
        if (hfResolved) return;
        hfResolved = true;
        sendLog("warning", `Failed to spawn python for download: ${err.message}. Models might download at runtime.`);
        res.write(`data: ${JSON.stringify({ type: "progress", value: 100 })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: "done", message: "Setup completed with warnings." })}\n\n`);
        res.end();
     });
  }

  if (forceReinstall) {
    sendLog("info", "Force reinstall requested. Cleaning up existing virtual environment...");
    if (fs.existsSync(venvDir)) {
       try {
          fs.rmSync(venvDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
       } catch (err) {
          sendLog("warning", `Could not completely remove existing venvDir (${err.message}). Proceeding anyway.`);
       }
    }
    createVenvAndInstall();
  } else {
    // Step 1: Check if local venv pdf2zh already exists
    const testProc = spawn(pdf2zhCmdLocal, ["--version"]);
    let testResolved = false;
    
    testProc.on("error", () => {
      if (testResolved) return;
      testResolved = true;
      sendLog("warning", "Local virtual environment pdf2zh not found. Proceeding with isolated installation...");
      createVenvAndInstall();
    });

    testProc.on("close", (code) => {
      if (testResolved) return;
      testResolved = true;
      if (code === 0) {
        sendLog("success", "pdf2zh is already installed in the isolated virtual environment and is working correctly!");
        res.write(`data: ${JSON.stringify({ type: "progress", value: 80 })}\n\n`);
        downloadModel();
      } else {
        sendLog("warning", "Existing pdf2zh installation appears broken. Re-installing...");
        if (fs.existsSync(venvDir)) {
       try {
          fs.rmSync(venvDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
       } catch (err) {
          sendLog("warning", `Could not completely remove existing venvDir (${err.message}). Proceeding anyway.`);
       }
    }
        createVenvAndInstall();
      }
    });
  }

  function createVenvAndInstall() {
    sendLog("info", `Creating self-contained python virtual environment at: ${venvDir}`);
    res.write(`data: ${JSON.stringify({ type: "progress", value: 10 })}\n\n`);
    const venvProc = spawn(pythonCmd, ["-m", "venv", venvDir]);
    let venvResolved = false;
    
    venvProc.stdout.on("data", (data) => sendLog("stdout", data.toString()));
    venvProc.stderr.on("data", (data) => sendLog("stderr", data.toString()));
    
    venvProc.on("close", (code) => {
       if (venvResolved) return;
       venvResolved = true;
       if (code !== 0) {
          sendLog("error", `Failed to create virtual environment (code ${code}). Please ensure python3-venv is installed.`);
          res.write(`data: ${JSON.stringify({ type: "progress", value: 0 })}\n\n`);
          res.write(`data: ${JSON.stringify({ type: "done", message: "Setup failed during venv creation." })}\n\n`);
          return res.end();
       }
       
       sendLog("success", "Virtual environment created successfully. Upgrading pip and essential build tools...");
       res.write(`data: ${JSON.stringify({ type: "progress", value: 20 })}\n\n`);
       
       const venvPythonCmd = isWin ? path.join(venvDir, "Scripts", "python.exe") : path.join(venvDir, "bin", "python3");
       // Upgrade pip, setuptools, and wheel before installing anything to prevent Wheel build errors during dependencies resolution
       const pipUpgradeProc = spawn(venvPythonCmd, ["-m", "pip", "install", "--no-cache-dir", "--upgrade", "-i", "https://pypi.tuna.tsinghua.edu.cn/simple", "pip", "setuptools", "wheel"]);
       let pipUpgradeResolved = false;
       
       pipUpgradeProc.stdout.on("data", (data) => sendLog("stdout", data.toString()));
       pipUpgradeProc.stderr.on("data", (data) => sendLog("stderr", data.toString()));
       pipUpgradeProc.on("error", (err) => {
           if (pipUpgradeResolved) return;
           pipUpgradeResolved = true;
           sendLog("warning", `Failed to span pip upgrade command: ${err.message}. It will try proceeding with default pip version.`);
       });

       pipUpgradeProc.on("close", (upgradeCode) => {
         if (pipUpgradeResolved) return;
         pipUpgradeResolved = true;
         if (upgradeCode !== 0) {
            sendLog("warning", "Pip/setuptools upgrade failed, proceeding with default pip version. (If build fails later, this might be why).");
         } else {
            sendLog("success", "Build tools (pip, setuptools, wheel) upgraded successfully.");
         }
         
         res.write(`data: ${JSON.stringify({ type: "progress", value: 30 })}\n\n`);
         sendLog("info", `Executing: ${venvPythonCmd} -m pip install pdf2zh (this may take a few minutes)`);
         
         // Use venvPythonCmd -m pip instead of pipCmd to ensure we use the upgraded pip module reliably
         const pipProc = spawn(venvPythonCmd, ["-m", "pip", "install", "--no-cache-dir", "-i", "https://pypi.tuna.tsinghua.edu.cn/simple", "urllib3<2", "certifi", "spacy<3.8.0", "pymupdf==1.24.11", "pdf2zh"]);
         let pipResolved = false;
         
         let currentProgress = 30;
         
         pipProc.stdout.on("data", (data) => {
           const out = data.toString();
           sendLog("stdout", out);
           if (out.includes("Collecting") || out.includes("Downloading") || out.includes("Installing")) {
              currentProgress = Math.min(currentProgress + 1, 80); // Cap at 80 for pip install so UI does not look stuck at 95, allows room for Model downloading if needed
              res.write(`data: ${JSON.stringify({ type: "progress", value: currentProgress })}\n\n`);
           }
         });
         
         pipProc.stderr.on("data", (data) => {
           sendLog("stderr", data.toString());
         });
         
         pipProc.on("close", (pipCode) => {
           if (pipResolved) return;
           pipResolved = true;
           if (pipCode === 0) {
             sendLog("success", "pdf2zh successfully installed in isolated environment!");
             downloadModel();
           } else {
             sendLog("error", `pip install failed with code ${pipCode}. Please check your python/pip setup or network connection.`);
             res.write(`data: ${JSON.stringify({ type: "progress", value: 0 })}\n\n`);
             res.write(`data: ${JSON.stringify({ type: "done", message: "Setup completed with errors." })}\n\n`);
             res.end();
           }
         });

         pipProc.on("error", (err) => {
             if (pipResolved) return;
             pipResolved = true;
             sendLog("error", `Failed to span pip command: ${err.message}.`);
             res.write(`data: ${JSON.stringify({ type: "progress", value: 0 })}\n\n`);
             res.write(`data: ${JSON.stringify({ type: "done", message: "Setup completed with errors." })}\n\n`);
             res.end();
         });
       });
    });
    
    venvProc.on("error", (err) => {
       if (venvResolved) return;
       venvResolved = true;
       sendLog("error", `Failed to execute python venv: ${err.message}`);
       res.write(`data: ${JSON.stringify({ type: "progress", value: 0 })}\n\n`);
       res.write(`data: ${JSON.stringify({ type: "done", message: "Setup failed." })}\n\n`);
       res.end();
    });
  }
});

// API to Uninstall Local pdf2zh instance and clean workspace
app.post("/api/pdf2zh-uninstall", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendLog = (type: string, message: string) => {
    res.write(`data: ${JSON.stringify({ type, message })}\n\n`);
  };

  sendLog("info", "Starting native pdf2zh cleanup and workspace removal...");
  sendLog("info", `Deleting self-contained workspace directory: ${pdf2zhDataDir}`);

  // Delete the data dir completely
  fs.rm(pdf2zhDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }, (err) => {
     if (err) {
       sendLog("error", `Failed to remove directory: ${err.message}`);
       res.write(`data: ${JSON.stringify({ type: "done", message: "Uninstall completed with errors." })}\n\n`);
     } else {
       sendLog("success", "Workspace directory and isolated virtual environment deleted successfully.");
       res.write(`data: ${JSON.stringify({ type: "done", message: "Uninstall and cleanup completed perfectly." })}\n\n`);
     }
     res.end();
  });
});


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
      proxyRes.headers.location = `http://127.0.0.1:${(global as any).APP_PORT || 3000}/hf-proxy?url=${encodeURIComponent(absoluteLocation)}`;
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

// API to run actual PDFMathTranslate/pdf2zh Python script
app.post("/api/pdf2zh-translate", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded" });
  }

  const { sourceLang, targetLang, provider, model, endpoint, apiKey, threads } = req.body;
  const filePath = req.file.path;
  const fileName = req.file.filename;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendLog = (type: string, message: string) => {
    res.write(`data: ${JSON.stringify({ type, message })}\n\n`);
  };

  sendLog("info", `Initiating native PDFMathTranslate (pdf2zh) for ${req.file.originalname}`);
  
  // Construct arguments based on pdf2zh documentation
  const args = [filePath];
  
  if (sourceLang) { args.push("-li"); args.push(sourceLang === "English" ? "en" : sourceLang); }
  if (targetLang) { args.push("-lo"); args.push(targetLang === "Chinese (Simplified)" ? "zh" : targetLang); }
  
  if (threads) { args.push("-t"); args.push(String(threads)); }
  
  if (provider === "gemini") {
     args.push("-s"); args.push("gemini"); // Note: real pdf2zh doesn't natively support gemini without extra config maybe, but we passthrough
  } else if (provider === "openai" || provider === "lmstudio" || provider === "omlx") {
     if (model) {
        args.push("-s"); args.push(`openai:${model}`);
     } else {
        args.push("-s"); args.push("openai"); // pdf2zh uses openai compatible format
     }
  }
  
  const envVars: any = { ...process.env, PYTHONWARNINGS: "ignore", HF_ENDPOINT: "https://hf-mirror.com", HF_HUB_ENABLE_HF_TRANSFER: "0" };
  if (model) {
     envVars.OPENAI_MODEL = model;
  }
  if (endpoint) {
     envVars.OPENAI_BASE_URL = endpoint.endsWith("/chat/completions") ? endpoint.replace("/chat/completions", "") : endpoint;
  }
  if (apiKey) {
     envVars.OPENAI_API_KEY = apiKey;
  } else {
     envVars.OPENAI_API_KEY = "sk-dummy";
  }
  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
     envVars.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  }

  
  const venvDir = path.join(pdf2zhDataDir, "venv");
  const isWin = process.platform === "win32";
  const pdf2zhCmdLocal = isWin ? path.join(venvDir, "Scripts", "pdf2zh.exe") : path.join(venvDir, "bin", "pdf2zh");
  const venvPythonCmdLocal = isWin ? path.join(venvDir, "Scripts", "python.exe") : path.join(venvDir, "bin", "python3");

  // Auto-downgrade for PyMuPDF 1.25.x bug
  if (fs.existsSync(venvPythonCmdLocal)) {
      try {
         const pyCheck = `import sys
try:
    import builtins
    import pymupdf
    if pymupdf.version[0].startswith("1.25."): sys.exit(1)
except Exception:
    pass
try:
    import fitz
    if fitz.version[0].startswith("1.25."): sys.exit(1)
except Exception:
    pass
sys.exit(0)`;
         require('child_process').execSync(`"${venvPythonCmdLocal}" -c "${pyCheck}"`, { stdio: 'ignore' });
      } catch (err) {
         sendLog("info", "Buggy PyMuPDF 1.25.x detected. Auto-downgrading to 1.24.11 which handles subset_fonts correctly... (This may take a minute)");
         try {
            require('child_process').execSync(`"${venvPythonCmdLocal}" -m pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple "pymupdf==1.24.11"`, { stdio: 'ignore' });
         } catch(e) {
            sendLog("warning", "Auto-downgrade failed, translation might encounter an encoding error.");
         }
      }
  }


  // Fallback to global pdf2zh if venv doesn't exist just in case they installed it globally
  const commandToRun = fs.existsSync(pdf2zhCmdLocal) ? pdf2zhCmdLocal : "pdf2zh";

  sendLog("info", `Executing command: ${commandToRun} ${args.join(" ")}`);
  sendLog("info", "Working directory: " + pdf2zhDataDir);

  const proc = spawn(commandToRun, args, { cwd: pdf2zhDataDir, env: envVars });
  let transResolved = false;

  proc.stdout.on("data", (data) => {
    sendLog("stdout", data.toString());
  });

  proc.stderr.on("data", (data) => {
    const text = data.toString();
    const lines = text.split(/[\r\n]+/);
    for (const line of lines) {
       if (!line.trim()) continue;
       const matchModel = line.match(/(\d+)%\|.*?\|.*?\s+\[(?:.*?(?:<\s*([^,]+))?|.*?),\s*([^\]]+)\]/);
       if (matchModel) {
          res.write(`data: ${JSON.stringify({ type: "model_progress", percentage: parseInt(matchModel[1], 10), eta: (matchModel[2] || "00:00").trim(), speed: (matchModel[3] || "N/A").trim() })}\n\n`);
       } else {
          const transMatch = line.match(/(?:\s|^)(\d+)%\|.*?\|/);
          if (transMatch) {
              res.write(`data: ${JSON.stringify({ type: "translation_progress", percentage: parseInt(transMatch[1], 10) })}\n\n`);
          }
       }
       sendLog("stderr", line.trim());
    }
  });

  proc.on("error", (err) => {
      if (transResolved) return;
      transResolved = true;
    sendLog("error", `Failed to spawn pdf2zh check your setup: ${err.message}`);
    res.write(`data: ${JSON.stringify({ type: "done", error: err.message })}\n\n`);
    res.end();
  });

  proc.on("close", (code) => {
      if (transResolved) return;
      transResolved = true;
    if (code !== 0) {
      sendLog("error", `pdf2zh execution exited with error code ${code}`);
      res.write(`data: ${JSON.stringify({ type: "done", error: "Translation process failed" })}\n\n`);
    } else {
      sendLog("success", "pdf2zh successfully localized the document!");
      
      // Attempt to resolve generated output files:
      // pdf2zh defaults output names based on original file, let's verify what's outputted
      const parsedPath = path.parse(filePath);
      const monoPath = path.join(pdf2zhDataDir, "uploads", `${parsedPath.name}-mono.pdf`);
      const dualPath = path.join(pdf2zhDataDir, "uploads", `${parsedPath.name}-dual.pdf`);
      
      res.write(`data: ${JSON.stringify({ 
        type: "done", 
        message: "Success",
        files: {
          mono: fs.existsSync(monoPath) ? `/api/pdf2zh-download/${path.basename(monoPath)}` : null,
          dual: fs.existsSync(dualPath) ? `/api/pdf2zh-download/${path.basename(dualPath)}` : null
        }
      })}\n\n`);
    }
    res.end();
  });
});

app.get("/api/pdf2zh-download/:filename", (req, res) => {
   const filename = req.params.filename;
   const filepath = path.join(pdf2zhDataDir, "uploads", filename);
   // Prevent directory traversal
   if (!filepath.startsWith(path.join(pdf2zhDataDir, "uploads"))) {
       return res.status(403).send("Forbidden path");
   }
   if (fs.existsSync(filepath)) {
       res.download(filepath);
   } else {
       res.status(404).send("File not found");
   }
});

// Serve frontend assets via Vite in development, or standard express static in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = typeof __dirname !== "undefined" ? __dirname : path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const host = process.env.HOST || "0.0.0.0";
  const server = app.listen(PORT, host, () => {
    const address = server.address();
    const actualPort = typeof address === 'string' ? PORT : address?.port;
    if (typeof global !== 'undefined') {
       (global as any).APP_PORT = actualPort;
    }
    console.log(`Server running on http://${host}:${actualPort}`);
  });

  server.on("error", (error: any) => {
    console.error("Express server error:", error);
  });
}

startServer().catch(err => {
  console.error("Failed to start server asynchronously:", err);
  process.exit(1);
});
