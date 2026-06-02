import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "50mb" }));

// Resolve and serve the pdfjs-dist web worker locally under same-origin to pass iframe browser sandbox CORS blocks
app.get("/pdf.worker.min.mjs", (req, res) => {
  try {
    const workerPath = path.join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
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
  const { textBlocks, sourceLang, targetLang, provider, model, apiKey, endpoint } = req.body;

  if (!textBlocks || !Array.isArray(textBlocks)) {
    return res.status(400).json({ error: "Invalid textBlocks format. Array expected." });
  }

  // If user explicitly requests Cloud Gemini
  if (provider === "gemini") {
    try {
      const ai = getGeminiClient();
      const batchSize = 25;
      const translatedBlocks: string[] = [];

      console.log(`Starting Cloud Gemini translation of ${textBlocks.length} blocks in batches of ${batchSize}...`);

      for (let i = 0; i < textBlocks.length; i += batchSize) {
        const batch = textBlocks.slice(i, i + batchSize);
        const prompt = `Translate the following array of text segments from language "${sourceLang || "English"}" to "${targetLang || "Chinese (Simplified)"}".
Keep the output array in the exact same index order and length. Return EXACTLY a JSON array of strings corresponding to each translated segment. Do not include markdown codeblocks packaging outside the JSON structure.

Here is the input array of strings:
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
        try {
          const parsed = JSON.parse(responseText);
          if (Array.isArray(parsed)) {
            translatedBlocks.push(...parsed);
          } else {
            console.warn("Gemini didn't return a proper JSON array, falling back to batch copy.");
            translatedBlocks.push(...batch);
          }
        } catch (parseErr: any) {
          console.error("Failed to parse Gemini model json:", parseErr);
          translatedBlocks.push(...batch);
        }
      }

      return res.json({
        success: true,
        translatedBlocks,
        message: "Translated successfully via Cloud Gemini Engine."
      });
    } catch (apiErr: any) {
      console.error("Gemini API translation error:", apiErr);
      return res.status(500).json({ 
        error: `Gemini API Call Failed: ${apiErr.message || apiErr}` 
      });
    }
  }

  // Handle any custom OpenAI-compatible engine target (lmstudio, omlx, openai)
  const targetEndpoint = endpoint || "https://api.openai.com/v1";
  const targetModel = model || (provider === "lmstudio" ? "qwen2.5-7b-instruct" : provider === "omlx" ? "llama3.2" : "gpt-4o-mini");
  const url = targetEndpoint.endsWith("/chat/completions") ? targetEndpoint : `${targetEndpoint}/chat/completions`;

  const prompt = `Translate each segment of the following list from "${sourceLang || "English"}" to "${targetLang || "Chinese (Simplified)"}". Retain original technical formatting, mathematical variables, and spacing where necessary. Return a raw JSON array of strings in the exact same sequence. No markdown wrapping.
Input List: ${JSON.stringify(textBlocks)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // Increased to 90 seconds to prevent local model timeouts on slow hardware

    console.log(`Sending real API translation target: [${targetModel}] at [${url}]`);
    
    // Construct request body compatibly
    const requestBody: any = {
      model: targetModel,
      messages: [
        { role: "system", content: "You are a layout-preserving translation engine. Translate accurately and output a raw JSON array of translated strings in identical array dimension length." },
        { role: "user", content: prompt }
      ]
    };

    // Only apply response_format: JSON if provider is openai to avoid compatibility issues with local/older Ollama & LM Studio platforms
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
      const list = parseTranslationResponse(contentText, textBlocks.length);
      if (list && list.length > 0) {
        return res.json({
          success: true,
          translatedBlocks: list,
          message: `Translated via custom model: "${targetModel}"`
        });
      }
    }
    
    let responseErrText = "";
    try {
      responseErrText = await apiResponse.text();
    } catch (_) {}
    throw new Error(`Model host returned statusCode ${apiResponse.status}: ${responseErrText || "No response body"}`);
  } catch (err: any) {
    console.warn(`Connection failed to custom endpoint "${url}" (${err.message || err}). Bootstrapping cloud sandbox Gemini translation fallback...`);
    
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
        const fallbackPrompt = `Translate the following array of text segments from language "${sourceLang || "English"}" to "${targetLang || "Chinese (Simplified)"}".
Keep the output array in the exact same index order and length. Return EXACTLY a JSON array of strings corresponding to each translated segment. No markdown codeblocks wrap.

Here is the input array of strings:
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
        try {
          const parsed = JSON.parse(responseText);
          if (Array.isArray(parsed)) {
            translatedBlocks.push(...parsed);
          } else {
            translatedBlocks.push(...batch);
          }
        } catch {
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on("error", (error: any) => {
    console.error("Express server error:", error);
  });
}

startServer();
