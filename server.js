"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var path_1 = require("path");
var fs_1 = require("fs");
var os_1 = require("os");
var dotenv_1 = require("dotenv");
var genai_1 = require("@google/genai");
var multer_1 = require("multer");
var child_process_1 = require("child_process");
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.use(express_1.default.json({ limit: "50mb" }));
// PDF2ZH Native Execution working directory (Cleanly uninstallable)
// Using an explicit designated folder in the system so users can cleanly delete it.
var pdf2zhDataDir = "";
try {
    pdf2zhDataDir = path_1.default.join(os_1.default.homedir(), ".pdf2zh_gui_workspace");
    if (!fs_1.default.existsSync(pdf2zhDataDir)) {
        fs_1.default.mkdirSync(pdf2zhDataDir, { recursive: true });
    }
}
catch (err) {
    try {
        console.warn("Failed to create workspace in homedir, falling back to tmpdir:", err);
        pdf2zhDataDir = path_1.default.join(os_1.default.tmpdir(), ".pdf2zh_gui_workspace");
        if (!fs_1.default.existsSync(pdf2zhDataDir)) {
            fs_1.default.mkdirSync(pdf2zhDataDir, { recursive: true });
        }
    }
    catch (err2) {
        console.warn("Failed to create workspace in tmpdir, falling back to cwd:", err2);
        pdf2zhDataDir = path_1.default.join(process.cwd(), ".pdf2zh_gui_workspace");
        if (!fs_1.default.existsSync(pdf2zhDataDir)) {
            fs_1.default.mkdirSync(pdf2zhDataDir, { recursive: true });
        }
    }
}
// Multer storage for uploaded PDFs waiting for native python translation
var storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        var uploadPath = path_1.default.join(pdf2zhDataDir, "uploads");
        try {
            if (!fs_1.default.existsSync(uploadPath))
                fs_1.default.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        }
        catch (err) {
            console.error("Failed to create uploads directory:", err);
            // Fallback to os.tmpdir() directly
            cb(null, os_1.default.tmpdir());
        }
    },
    filename: function (req, file, cb) {
        // Ensure safe file names
        cb(null, Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_"));
    }
});
var upload = (0, multer_1.default)({ storage: storage });
// Resolve and serve the pdfjs-dist web worker locally under same-origin to pass iframe browser sandbox CORS blocks
app.get("/pdf.worker.min.mjs", function (req, res) {
    try {
        var workerPath = path_1.default.join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
        if (fs_1.default.existsSync(workerPath)) {
            res.setHeader("Content-Type", "application/javascript");
            return res.sendFile(workerPath);
        }
        // Fallback if not found in build path
        console.warn("pdf.worker.min.mjs not found at standard path:", workerPath);
        return res.status(404).send("Worker script not found");
    }
    catch (err) {
        console.error("Failed to serve local pdf.worker.min.mjs:", err);
        return res.status(500).send("Internal server error serving worker");
    }
});
// Initialize Gemini SDK with custom user agent for telemetry
var getGeminiClient = function () {
    var apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required on the server.");
    }
    return new genai_1.GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
            headers: {
                "User-Agent": "aistudio-build",
            },
        },
    });
};
// Test Connection Endpoint
app.post("/api/test-connection", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, provider, apiKey, endpoint, model, ai, response, err_1, targetEndpoint, targetModel, url, controller_1, timeoutId, response, errorText, isLocalhost, adviceMsg, err_2, isLocalhost, adviceMsg, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, provider = _a.provider, apiKey = _a.apiKey, endpoint = _a.endpoint, model = _a.model;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 13, , 14]);
                if (!(provider === "gemini")) return [3 /*break*/, 5];
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                ai = getGeminiClient();
                return [4 /*yield*/, ai.models.generateContent({
                        model: "gemini-3.1-flash",
                        contents: "Hello! Reply with OK",
                    })];
            case 3:
                response = _b.sent();
                return [2 /*return*/, res.json({
                        success: true,
                        message: "Successfully connected to Cloud Gemini API!",
                        modelUsed: "gemini-3.1-flash",
                    })];
            case 4:
                err_1 = _b.sent();
                return [2 /*return*/, res.json({
                        success: false,
                        message: "Cloud Gemini API error: ".concat(err_1.message || err_1),
                    })];
            case 5:
                if (!(provider === "openai" || provider === "lmstudio" || provider === "omlx")) return [3 /*break*/, 12];
                targetEndpoint = endpoint || "https://api.openai.com/v1";
                targetModel = model || (provider === "lmstudio" ? "qwen2.5-7b-instruct" : provider === "omlx" ? "llama3.2" : "gpt-3.5-turbo");
                url = targetEndpoint.endsWith("/chat/completions") ? targetEndpoint : "".concat(targetEndpoint, "/chat/completions");
                controller_1 = new AbortController();
                timeoutId = setTimeout(function () { return controller_1.abort(); }, 6000);
                _b.label = 6;
            case 6:
                _b.trys.push([6, 11, , 12]);
                console.log("Testing connection directly to provider \"".concat(provider, "\" custom endpoint: ").concat(url));
                return [4 /*yield*/, fetch(url, {
                        method: "POST",
                        headers: __assign({ "Content-Type": "application/json" }, (apiKey ? { Authorization: "Bearer ".concat(apiKey) } : {})),
                        body: JSON.stringify({
                            model: targetModel,
                            messages: [{ role: "user", content: "ping" }],
                            max_tokens: 5,
                        }),
                        signal: controller_1.signal,
                    })];
            case 7:
                response = _b.sent();
                clearTimeout(timeoutId);
                if (!response.ok) return [3 /*break*/, 8];
                return [2 /*return*/, res.json({
                        success: true,
                        message: "Successfully connected to target model \"".concat(targetModel, "\"!"),
                    })];
            case 8: return [4 /*yield*/, response.text()];
            case 9:
                errorText = _b.sent();
                isLocalhost = endpoint && (endpoint.includes("localhost") || endpoint.includes("127.0.0.1"));
                adviceMsg = "";
                if (isLocalhost) {
                    adviceMsg = "\n\n💡提示: AI Studio 网页版目前在云端运行，无法直接请求您内网或本机 localhost 的端口。如有需要，欢迎您在左上角设置中【导出为 ZIP 格式】并在您本机运行，或在 LM Studio 中开启隧道工具 (Ngrok)。";
                }
                return [2 /*return*/, res.json({
                        success: false,
                        message: "Host returned error code ".concat(response.status, ": ").concat(errorText.substring(0, 150)).concat(adviceMsg),
                    })];
            case 10: return [3 /*break*/, 12];
            case 11:
                err_2 = _b.sent();
                clearTimeout(timeoutId);
                isLocalhost = endpoint && (endpoint.includes("localhost") || endpoint.includes("127.0.0.1"));
                adviceMsg = "";
                if (isLocalhost) {
                    adviceMsg = "\n\n💡 提示: 您的自定义地址是 localhost/127.0.0.1，由于此 APP 正在云端独立沙盒环境预览，服务端无权访问您的个人电脑。如果您需要调试本地模型：\n1. 可先使用左上角设置面板的【导出代码 ZIP 包】在您本机使用 node server.ts 运行，即可本地秒连 127.0.0.1:1234 工作流！\n2. 也可以利用 Ngrok 或 LocalTunnel 将本地接口映射出公网 https 域名，再将该网址填入此处调试。\n3. 在您的云端网页预览里，即使连接失败，我们也会智能切换为云端 Gemini 进行翻译防挂，让您依然能预览系统完整的渲染排版！";
                }
                return [2 /*return*/, res.json({
                        success: false,
                        isLocal: isLocalhost,
                        message: "Connection test failed: ".concat(err_2.message || err_2).concat(adviceMsg),
                    })];
            case 12: 
            // Default fallback
            return [2 /*return*/, res.json({
                    success: true,
                    message: "Configuration Saved!",
                })];
            case 13:
                error_1 = _b.sent();
                return [2 /*return*/, res.json({
                        success: false,
                        message: "Failed to connect: ".concat(error_1.message || error_1),
                    })];
            case 14: return [2 /*return*/];
        }
    });
}); });
// Helper for fuzzy array parsing of model chat completion outputs
function parseTranslationResponse(text, expectedCount) {
    var trimmed = text.trim();
    // Strip markdown blocks if any
    if (trimmed.startsWith("```")) {
        trimmed = trimmed.replace(/^```(?:json)?\n?/i, "");
        trimmed = trimmed.replace(/\n?```$/, "");
        trimmed = trimmed.trim();
    }
    try {
        var parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        if (parsed.translations && Array.isArray(parsed.translations)) {
            return parsed.translations;
        }
        if (parsed.translatedBlocks && Array.isArray(parsed.translatedBlocks)) {
            return parsed.translatedBlocks;
        }
    }
    catch (e) {
        console.warn("Raw JSON array parsing failed, attempting sub-array extraction...", e);
    }
    try {
        var startIndex = trimmed.indexOf("[");
        var endIndex = trimmed.lastIndexOf("]");
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            var candidates = trimmed.substring(startIndex, endIndex + 1);
            var parsed = JSON.parse(candidates);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    }
    catch (e) {
        console.warn("Sub-array extraction match failed.", e);
    }
    // Line division fallback
    var lines = trimmed
        .split(/\n+/)
        .map(function (l) { return l.replace(/^[-*•\s\d.]+|[#"']/g, "").trim(); })
        .filter(Boolean);
    if (lines.length === expectedCount) {
        return lines;
    }
    return [];
}
// Real/Simulation translation router
app.post("/api/translate", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, textBlocks, sourceLang, targetLang, provider, model, apiKey, endpoint, threads, concurrentConfig, ai, batchSize_1, translatedBlocks_1, i, batch, prompt_1, geminiResponse, responseText, parsed, finalBatch, aligned, k, singleEnglishText, singleText, isTargetChinese, isUntranslated, singlePrompt, singleResponse, retryResponse, retryErr_1, batchErr_1, apiErr_1, targetEndpoint, targetModel, url, batchSize, translatedBlocks, resultBlocks_1, batches, i, workerQueue_1, worker, workerPromises, i, err_3, hasGeminiKey, ai, batchSize_2, translatedBlocks_2, i, batch, fallbackPrompt, geminiResponse, responseText, parsed, finalBatch, aligned, k, singleEnglishText, singleText, isTargetChinese, isUntranslated, singlePrompt, singleResponse, retryResponse, retryErr_2, fErr_1, gemError_1;
    var _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _a = req.body, textBlocks = _a.textBlocks, sourceLang = _a.sourceLang, targetLang = _a.targetLang, provider = _a.provider, model = _a.model, apiKey = _a.apiKey, endpoint = _a.endpoint, threads = _a.threads;
                if (!textBlocks || !Array.isArray(textBlocks)) {
                    return [2 /*return*/, res.status(400).json({ error: "Invalid textBlocks format. Array expected." })];
                }
                concurrentConfig = Math.min(Math.max(Number(threads) || 1, 1), 16);
                if (!(provider === "gemini")) return [3 /*break*/, 18];
                _h.label = 1;
            case 1:
                _h.trys.push([1, 17, , 18]);
                ai = getGeminiClient();
                batchSize_1 = 25;
                translatedBlocks_1 = [];
                console.log("Starting Cloud Gemini translation of ".concat(textBlocks.length, " blocks in batches of ").concat(batchSize_1, "..."));
                i = 0;
                _h.label = 2;
            case 2:
                if (!(i < textBlocks.length)) return [3 /*break*/, 16];
                batch = textBlocks.slice(i, i + batchSize_1);
                _h.label = 3;
            case 3:
                _h.trys.push([3, 14, , 15]);
                prompt_1 = "Translate the following JSON array of text segments from \"".concat(sourceLang || "English", "\" to \"").concat(targetLang || "Chinese (Simplified)", "\".\nFollow these rules strictly:\n1. Preserve all mathematical formulas, LaTeX, and technical variables. Wrap mathematical equations in standard Markdown LaTeX format (e.g., $E=mc^2$ or $$...$$) where applicable.\n2. Translate ALL English human-readable words and sentences to natural ").concat(targetLang || "Chinese (Simplified)", ". If the target is Chinese, outputs must contain Chinese characters! Do NOT leave English text untranslated.\n3. Keep the output array in the exact same index order and length. The output MUST have exactly ").concat(batch.length, " elements.\n4. DO NOT drop punctuation marks (periods, commas, etc). Translate them correspondingly.\n5. Return EXACTLY a JSON array of strings. Do not include markdown codeblocks or any additional packaging text outside the JSON structure.\n\nInput List:\n").concat(JSON.stringify(batch), "\n");
                return [4 /*yield*/, ai.models.generateContent({
                        model: "gemini-3.1-flash",
                        contents: prompt_1,
                        config: {
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: genai_1.Type.ARRAY,
                                items: {
                                    type: genai_1.Type.STRING
                                }
                            }
                        },
                    })];
            case 4:
                geminiResponse = _h.sent();
                responseText = ((_b = geminiResponse.text) === null || _b === void 0 ? void 0 : _b.trim()) || "[]";
                parsed = parseTranslationResponse(responseText, batch.length);
                finalBatch = [];
                if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
                    console.warn("Gemini returned invalid or empty JSON array. Retrying translation individually for the batch of ".concat(batch.length, " items to prevent untranslated sentences."));
                    parsed = batch; // Use original batch as fallback array to be caught by the loop below
                }
                else if (parsed.length !== batch.length) {
                    console.warn("Gemini length mismatch (Expected ".concat(batch.length, ", got ").concat(parsed.length, "). Using partial and padding..."));
                    aligned = parsed.slice(0, batch.length);
                    while (aligned.length < batch.length) {
                        aligned.push(batch[aligned.length]);
                    }
                    parsed = aligned;
                }
                k = 0;
                _h.label = 5;
            case 5:
                if (!(k < batch.length)) return [3 /*break*/, 13];
                singleEnglishText = batch[k];
                singleText = parsed[k];
                isTargetChinese = (targetLang || "").toLowerCase().includes("chinese") || (targetLang || "").toLowerCase().includes("zh");
                isUntranslated = isTargetChinese && /[a-zA-Z]{3,}/.test(singleEnglishText) && !/[\u4e00-\u9fa5]/.test(singleText);
                if (!(isUntranslated || singleText.trim() === "[]" || singleText.trim() === "")) return [3 /*break*/, 11];
                _h.label = 6;
            case 6:
                _h.trys.push([6, 10, , 11]);
                singlePrompt = "Translate the following text strictly from \"".concat(sourceLang || "English", "\" to \"").concat(targetLang || "Chinese (Simplified)", "\".\nCRITICAL RULES:\n1. You MUST translate all human-readable words into ").concat(targetLang || "Chinese (Simplified)", ". \n2. If you leave the text purely in English when the target is Chinese, this is a FATAL ERROR.\n3. Preserve all mathematical formulas and LaTeX perfectly (do not translate variable names or math).\n4. Output ONLY the translated string, nothing else.\n\nText to translate:\n").concat(singleEnglishText);
                return [4 /*yield*/, ai.models.generateContent({
                        model: "gemini-3.1-flash",
                        contents: singlePrompt
                    })];
            case 7:
                singleResponse = _h.sent();
                singleText = ((_c = singleResponse.text) === null || _c === void 0 ? void 0 : _c.trim().replace(/^['"]|['"]$/g, '')) || singleText;
                if (!(isTargetChinese && /[a-zA-Z]{3,}/.test(singleEnglishText) && !/[\u4e00-\u9fa5]/.test(singleText))) return [3 /*break*/, 9];
                return [4 /*yield*/, ai.models.generateContent({
                        model: "gemini-3.1-flash",
                        contents: "You failed to translate this to Chinese! Please forcefully translate this paragraph to Chinese while keeping formulas intact:\n\n".concat(singleEnglishText)
                    })];
            case 8:
                retryResponse = _h.sent();
                singleText = ((_d = retryResponse.text) === null || _d === void 0 ? void 0 : _d.trim().replace(/^['"]|['"]$/g, '')) || singleText;
                _h.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                retryErr_1 = _h.sent();
                console.error("Individual fallback translation failed:", retryErr_1);
                return [3 /*break*/, 11];
            case 11:
                finalBatch.push(singleText);
                _h.label = 12;
            case 12:
                k++;
                return [3 /*break*/, 5];
            case 13:
                translatedBlocks_1.push.apply(translatedBlocks_1, finalBatch);
                return [3 /*break*/, 15];
            case 14:
                batchErr_1 = _h.sent();
                console.error("Cloud Gemini translation batch starting at index ".concat(i, " failed partially:"), batchErr_1.message || batchErr_1);
                // Gracefully isolate batch translation error to prevent entire process halt on long PDFs
                translatedBlocks_1.push.apply(translatedBlocks_1, batch);
                return [3 /*break*/, 15];
            case 15:
                i += batchSize_1;
                return [3 /*break*/, 2];
            case 16: return [2 /*return*/, res.json({
                    success: true,
                    translatedBlocks: translatedBlocks_1,
                    message: "Translated successfully via Cloud Gemini Engine."
                })];
            case 17:
                apiErr_1 = _h.sent();
                console.error("Gemini API global initialization failed:", apiErr_1);
                return [2 /*return*/, res.status(500).json({
                        error: "Gemini API Call Failed: ".concat(apiErr_1.message || apiErr_1)
                    })];
            case 18:
                targetEndpoint = endpoint || "https://api.openai.com/v1";
                targetModel = model || (provider === "lmstudio" ? "qwen2.5-7b-instruct" : provider === "omlx" ? "llama3.2" : "gpt-4o-mini");
                url = targetEndpoint.endsWith("/chat/completions") ? targetEndpoint : "".concat(targetEndpoint, "/chat/completions");
                batchSize = 15;
                translatedBlocks = [];
                _h.label = 19;
            case 19:
                _h.trys.push([19, 21, , 40]);
                console.log("Starting Custom API translation of ".concat(textBlocks.length, " blocks in batches of ").concat(batchSize, " with ").concat(concurrentConfig, " threads..."));
                resultBlocks_1 = new Array(textBlocks.length).fill("");
                batches = [];
                for (i = 0; i < textBlocks.length; i += batchSize) {
                    batches.push({ startIdx: i, batch: textBlocks.slice(i, i + batchSize) });
                }
                workerQueue_1 = __spreadArray([], batches, true);
                worker = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var _loop_1;
                    var _a, _b, _c;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                _loop_1 = function () {
                                    var _e, startIdx, batch, prompt_2, controller_2, timeoutId, requestBody, apiResponse, data, contentText, parsed, aligned, j, aligned, j, j, responseErrText, _1, j, batchErr_2, j;
                                    return __generator(this, function (_f) {
                                        switch (_f.label) {
                                            case 0:
                                                _e = workerQueue_1.shift(), startIdx = _e.startIdx, batch = _e.batch;
                                                _f.label = 1;
                                            case 1:
                                                _f.trys.push([1, 10, , 11]);
                                                prompt_2 = "Translate the following JSON array of text segments from \"".concat(sourceLang || "English", "\" to \"").concat(targetLang || "Chinese (Simplified)", "\".\nFollow these rules strictly:\n1. Preserve all mathematical formulas, LaTeX, and technical variables. Wrap mathematical equations in standard Markdown LaTeX format (e.g., $E=mc^2$ or $$...$$) where applicable.\n2. Translate all English words and sentences to natural ").concat(targetLang || "Chinese (Simplified)", ", even if they are partial sentence fragments or figures. Do NOT leave English text untranslated.\n3. Keep the output array in the exact same index order and length. The output MUST have exactly ").concat(batch.length, " elements.\n4. DO NOT drop punctuation marks (periods, commas, etc). Translate them correspondingly.\n5. Return EXACTLY a raw JSON array of strings. Do not include markdown wrappers (like ```json).\n\nInput List: \n").concat(JSON.stringify(batch));
                                                controller_2 = new AbortController();
                                                timeoutId = setTimeout(function () { return controller_2.abort(); }, 60000);
                                                console.log("Sending real API translation target batch starting at index ".concat(startIdx, ": [").concat(targetModel, "] at [").concat(url, "]"));
                                                requestBody = {
                                                    model: targetModel,
                                                    messages: [
                                                        { role: "system", content: "You are a layout-preserving translation engine. Translate accurately and output a raw JSON array of translated strings in identical array dimension length." },
                                                        { role: "user", content: prompt_2 }
                                                    ]
                                                };
                                                if (provider === "openai") {
                                                    requestBody.response_format = { type: "json_object" };
                                                }
                                                return [4 /*yield*/, fetch(url, {
                                                        method: "POST",
                                                        headers: __assign({ "Content-Type": "application/json" }, (apiKey ? { Authorization: "Bearer ".concat(apiKey) } : {})),
                                                        body: JSON.stringify(requestBody),
                                                        signal: controller_2.signal,
                                                    })];
                                            case 2:
                                                apiResponse = _f.sent();
                                                clearTimeout(timeoutId);
                                                if (!apiResponse.ok) return [3 /*break*/, 4];
                                                return [4 /*yield*/, apiResponse.json()];
                                            case 3:
                                                data = _f.sent();
                                                contentText = ((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || "[]";
                                                parsed = parseTranslationResponse(contentText, batch.length);
                                                if (parsed && Array.isArray(parsed) && parsed.length === batch.length) {
                                                    aligned = parsed.slice(0, batch.length);
                                                    for (j = 0; j < aligned.length; j++)
                                                        resultBlocks_1[startIdx + j] = aligned[j];
                                                }
                                                else if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                                                    console.warn("Local model length mismatch (Expected ".concat(batch.length, ", got ").concat(parsed.length, "). Using partial and padding..."));
                                                    aligned = parsed.slice(0, batch.length);
                                                    while (aligned.length < batch.length) {
                                                        aligned.push(batch[aligned.length]);
                                                    }
                                                    for (j = 0; j < aligned.length; j++)
                                                        resultBlocks_1[startIdx + j] = aligned[j];
                                                }
                                                else {
                                                    console.warn("JSON alignment list parse failed completely for batch starting at ".concat(startIdx, ", returning original texts for fallback to prevent crash."));
                                                    for (j = 0; j < batch.length; j++)
                                                        resultBlocks_1[startIdx + j] = batch[j];
                                                }
                                                return [3 /*break*/, 9];
                                            case 4:
                                                responseErrText = "";
                                                _f.label = 5;
                                            case 5:
                                                _f.trys.push([5, 7, , 8]);
                                                return [4 /*yield*/, apiResponse.text()];
                                            case 6:
                                                responseErrText = _f.sent();
                                                return [3 /*break*/, 8];
                                            case 7:
                                                _1 = _f.sent();
                                                return [3 /*break*/, 8];
                                            case 8:
                                                console.warn("Model host returned statusCode ".concat(apiResponse.status, " for batch ending at ").concat(startIdx + batch.length, ": ").concat(responseErrText || "No response body", ". Utilizing original texts."));
                                                for (j = 0; j < batch.length; j++)
                                                    resultBlocks_1[startIdx + j] = batch[j];
                                                _f.label = 9;
                                            case 9: return [3 /*break*/, 11];
                                            case 10:
                                                batchErr_2 = _f.sent();
                                                console.error("Custom translation batch starting at index ".concat(startIdx, " failed partially:"), batchErr_2.message || batchErr_2);
                                                // Isolate error from halting the entire long document progress
                                                for (j = 0; j < batch.length; j++)
                                                    resultBlocks_1[startIdx + j] = batch[j];
                                                return [3 /*break*/, 11];
                                            case 11: return [2 /*return*/];
                                        }
                                    });
                                };
                                _d.label = 1;
                            case 1:
                                if (!(workerQueue_1.length > 0)) return [3 /*break*/, 3];
                                return [5 /*yield**/, _loop_1()];
                            case 2:
                                _d.sent();
                                return [3 /*break*/, 1];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); };
                workerPromises = [];
                for (i = 0; i < concurrentConfig; i++) {
                    workerPromises.push(worker());
                }
                return [4 /*yield*/, Promise.all(workerPromises)];
            case 20:
                _h.sent();
                translatedBlocks.push.apply(translatedBlocks, resultBlocks_1);
                if (translatedBlocks.length > 0) {
                    return [2 /*return*/, res.json({
                            success: true,
                            translatedBlocks: translatedBlocks,
                            message: "Translated via custom model: \"".concat(targetModel, "\"")
                        })];
                }
                else {
                    throw new Error("No translation returned from Custom model.");
                }
                return [3 /*break*/, 40];
            case 21:
                err_3 = _h.sent();
                console.warn("Fallback triggered because of global custom endpoint failure: \"".concat(url, "\" (").concat(err_3.message || err_3, "). Bootstrapping cloud sandbox Gemini translation fallback..."));
                hasGeminiKey = !!process.env.GEMINI_API_KEY;
                if (!hasGeminiKey) {
                    console.warn("Cloud Gemini API Key is not configured in Settings. Skipping fallback to show raw connection error.");
                    return [2 /*return*/, res.status(500).json({
                            error: "Custom model connection failed: ".concat(err_3.message || "Timeout / connection refused", ". (Additional details: GEMINI_API_KEY environment variable is not configured, so cloud fallback is disabled.)")
                        })];
                }
                _h.label = 22;
            case 22:
                _h.trys.push([22, 38, , 39]);
                ai = getGeminiClient();
                batchSize_2 = 25;
                translatedBlocks_2 = [];
                i = 0;
                _h.label = 23;
            case 23:
                if (!(i < textBlocks.length)) return [3 /*break*/, 37];
                batch = textBlocks.slice(i, i + batchSize_2);
                _h.label = 24;
            case 24:
                _h.trys.push([24, 35, , 36]);
                fallbackPrompt = "Translate the following JSON array of text segments from \"".concat(sourceLang || "English", "\" to \"").concat(targetLang || "Chinese (Simplified)", "\".\nFollow these rules strictly:\n1. Preserve all mathematical formulas, LaTeX, and technical variables. Wrap mathematical equations in standard Markdown LaTeX format (e.g., $E=mc^2$ or $$...$$) where applicable.\n2. Translate all English words and sentences to natural ").concat(targetLang || "Chinese (Simplified)", ", even if they are partial sentence fragments or figures. Do NOT leave English text untranslated.\n3. Keep the output array in the exact same index order and length. The output MUST have exactly ").concat(batch.length, " elements.\n4. DO NOT drop punctuation marks (periods, commas, etc). Translate them correspondingly.\n5. Return EXACTLY a JSON array of strings. Do not include markdown codeblocks or any additional packaging text outside the JSON structure.\n\nInput List:\n").concat(JSON.stringify(batch), "\n");
                return [4 /*yield*/, ai.models.generateContent({
                        model: "gemini-3.1-flash",
                        contents: fallbackPrompt,
                        config: {
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: genai_1.Type.ARRAY,
                                items: {
                                    type: genai_1.Type.STRING
                                }
                            }
                        },
                    })];
            case 25:
                geminiResponse = _h.sent();
                responseText = ((_e = geminiResponse.text) === null || _e === void 0 ? void 0 : _e.trim()) || "[]";
                parsed = parseTranslationResponse(responseText, batch.length);
                finalBatch = [];
                if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
                    console.warn("Gemini returned invalid or empty JSON array. Retrying translation individually for the batch of ".concat(batch.length, " items to prevent untranslated sentences."));
                    parsed = batch; // fallback to original texts so loop will catch and individual-translate
                }
                else if (parsed.length !== batch.length) {
                    console.warn("Gemini length mismatch (Expected ".concat(batch.length, ", got ").concat(parsed.length, "). Using partial and padding..."));
                    aligned = parsed.slice(0, batch.length);
                    while (aligned.length < batch.length) {
                        aligned.push(batch[aligned.length]);
                    }
                    parsed = aligned;
                }
                k = 0;
                _h.label = 26;
            case 26:
                if (!(k < batch.length)) return [3 /*break*/, 34];
                singleEnglishText = batch[k];
                singleText = parsed[k];
                isTargetChinese = (targetLang || "").toLowerCase().includes("chinese") || (targetLang || "").toLowerCase().includes("zh");
                isUntranslated = isTargetChinese && /[a-zA-Z]{3,}/.test(singleEnglishText) && !/[\u4e00-\u9fa5]/.test(singleText);
                if (!(isUntranslated || singleText.trim() === "[]" || singleText.trim() === "")) return [3 /*break*/, 32];
                _h.label = 27;
            case 27:
                _h.trys.push([27, 31, , 32]);
                singlePrompt = "Translate the following text strictly from \"".concat(sourceLang || "English", "\" to \"").concat(targetLang || "Chinese (Simplified)", "\".\nCRITICAL RULES:\n1. You MUST translate all human-readable words into ").concat(targetLang || "Chinese (Simplified)", ". \n2. If you leave the text purely in English when the target is Chinese, this is a FATAL ERROR.\n3. Preserve all mathematical formulas and LaTeX perfectly (do not translate variable names or math).\n4. Output ONLY the translated string, nothing else.\n\nText to translate:\n").concat(singleEnglishText);
                return [4 /*yield*/, ai.models.generateContent({
                        model: "gemini-3.1-flash",
                        contents: singlePrompt
                    })];
            case 28:
                singleResponse = _h.sent();
                singleText = ((_f = singleResponse.text) === null || _f === void 0 ? void 0 : _f.trim().replace(/^['"]|['"]$/g, '')) || singleText;
                if (!(isTargetChinese && /[a-zA-Z]{3,}/.test(singleEnglishText) && !/[\u4e00-\u9fa5]/.test(singleText))) return [3 /*break*/, 30];
                return [4 /*yield*/, ai.models.generateContent({
                        model: "gemini-3.1-flash",
                        contents: "You failed to translate this to Chinese! Please forcefully translate this paragraph to Chinese while keeping formulas intact:\n\n".concat(singleEnglishText)
                    })];
            case 29:
                retryResponse = _h.sent();
                singleText = ((_g = retryResponse.text) === null || _g === void 0 ? void 0 : _g.trim().replace(/^['"]|['"]$/g, '')) || singleText;
                _h.label = 30;
            case 30: return [3 /*break*/, 32];
            case 31:
                retryErr_2 = _h.sent();
                console.error("Individual fallback translation failed:", retryErr_2);
                return [3 /*break*/, 32];
            case 32:
                finalBatch.push(singleText);
                _h.label = 33;
            case 33:
                k++;
                return [3 /*break*/, 26];
            case 34:
                translatedBlocks_2.push.apply(translatedBlocks_2, finalBatch);
                return [3 /*break*/, 36];
            case 35:
                fErr_1 = _h.sent();
                console.error("Gemini fallback batch starting at index ".concat(i, " failed partially:"), fErr_1.message || fErr_1);
                translatedBlocks_2.push.apply(translatedBlocks_2, batch);
                return [3 /*break*/, 36];
            case 36:
                i += batchSize_2;
                return [3 /*break*/, 23];
            case 37: return [2 /*return*/, res.json({
                    success: true,
                    translatedBlocks: translatedBlocks_2,
                    fallbackUsed: true,
                    message: "Connected using Cloud Gemini fallback! (Your offline local model on \"localhost\" is inaccessible from our cloud workspace sandbox environment. Run this tool locally or expose it via tunnel if you wish to bypass this.)"
                })];
            case 38:
                gemError_1 = _h.sent();
                console.error("Gemini fallback also failed:", gemError_1);
                return [2 /*return*/, res.status(500).json({ error: "Translation failed on both customized model and Backup Cloud Gemini backend: ".concat(gemError_1.message || gemError_1) })];
            case 39: return [3 /*break*/, 40];
            case 40: return [2 /*return*/];
        }
    });
}); });
// API to Setup/Install Local pdf2zh instance
app.post("/api/pdf2zh-setup", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    function downloadModel() {
        sendLog("info", "Pre-downloading required ONNX layout models from HF Hub...");
        res.write("data: ".concat(JSON.stringify({ type: "progress", value: 90 }), "\n\n"));
        var venvPythonCmd = isWin ? path_1.default.join(venvDir, "Scripts", "python.exe") : path_1.default.join(venvDir, "bin", "python3");
        // Instead of just calling huggingface_hub.cli directly which might be problematic, 
        // we run pdf2zh with a dummy command or trigger its model download, 
        // or we just use python to robustly download.
        var pythonCode = "\nimport os\nimport sys\nimport time\n\ntry:\n    from huggingface_hub import hf_hub_download\n    print(\"Downloading ONNX layout model...\")\n    max_retries = 100\n    for attempt in range(max_retries):\n        try:\n            hf_hub_download(\n                repo_id=\"wybxc/DocLayout-YOLO-DocStructBench-onnx\", \n                filename=\"doclayout_yolo_docstructbench_imgsz1024.onnx\",\n                resume_download=True\n            )\n            print(\"Download completed successfully!\")\n            sys.exit(0)\n        except Exception as e:\n            print(f\"Attempt {attempt + 1} failed: {e}\", file=sys.stderr)\n            if attempt < max_retries - 1:\n                print(\"Network disconnected or error. Retrying in 5 seconds to resume download...\", file=sys.stderr)\n                time.sleep(5)\n            else:\n                sys.exit(1)\nexcept Exception as e:\n    print(f\"Error downloading model: {e}\", file=sys.stderr)\n    sys.exit(1)\n";
        var hfResolved = false;
        var hfProc = (0, child_process_1.spawn)(venvPythonCmd, ["-c", pythonCode], {
            env: __assign(__assign({}, process.env), { HF_ENDPOINT: "http://127.0.0.1:" + (global.APP_PORT || 3000) + "/hf-proxy", HF_HUB_ENABLE_HF_TRANSFER: "0" })
        });
        hfProc.stdout.on("data", function (data) { return sendLog("stdout", data.toString().trim()); });
        hfProc.stderr.on("data", function (data) {
            var text = data.toString();
            var textLines = text.split(/[\r\n]+/);
            for (var _i = 0, textLines_1 = textLines; _i < textLines_1.length; _i++) {
                var line = textLines_1[_i];
                if (!line.trim())
                    continue;
                var match = line.match(/(\d+)%\|.*?\|.*?\s+\[(?:.*?(?:<\s*([^,]+))?|.*?),\s*([^\]]+)\]/);
                if (match) {
                    res.write("data: ".concat(JSON.stringify({ type: "model_progress", percentage: parseInt(match[1], 10), eta: (match[2] || "00:00").trim(), speed: (match[3] || "N/A").trim() }), "\n\n"));
                }
                sendLog("stderr", line.trim());
            }
        });
        hfProc.on("close", function (code) {
            if (hfResolved)
                return;
            hfResolved = true;
            if (code === 0) {
                sendLog("success", "ONNX Layout Models downloaded and verified successfully!");
                res.write("data: ".concat(JSON.stringify({ type: "progress", value: 100 }), "\n\n"));
                res.write("data: ".concat(JSON.stringify({ type: "done", message: "Setup completed successfully." }), "\n\n"));
            }
            else {
                sendLog("warning", "ONNX Layout Model download failed with code ".concat(code, ". Translation might retry downloading it at runtime."));
                res.write("data: ".concat(JSON.stringify({ type: "progress", value: 100 }), "\n\n"));
                res.write("data: ".concat(JSON.stringify({ type: "done", message: "Setup completed with warnings." }), "\n\n"));
            }
            res.end();
        });
        hfProc.on("error", function (err) {
            if (hfResolved)
                return;
            hfResolved = true;
            sendLog("warning", "Failed to spawn python for download: ".concat(err.message, ". Models might download at runtime."));
            res.write("data: ".concat(JSON.stringify({ type: "progress", value: 100 }), "\n\n"));
            res.write("data: ".concat(JSON.stringify({ type: "done", message: "Setup completed with warnings." }), "\n\n"));
            res.end();
        });
    }
    function createVenvAndInstall() {
        sendLog("info", "Creating self-contained python virtual environment at: ".concat(venvDir));
        res.write("data: ".concat(JSON.stringify({ type: "progress", value: 10 }), "\n\n"));
        var venvProc = (0, child_process_1.spawn)(pythonCmd, ["-m", "venv", venvDir]);
        var venvResolved = false;
        venvProc.stdout.on("data", function (data) { return sendLog("stdout", data.toString()); });
        venvProc.stderr.on("data", function (data) { return sendLog("stderr", data.toString()); });
        venvProc.on("close", function (code) {
            if (venvResolved)
                return;
            venvResolved = true;
            if (code !== 0) {
                sendLog("error", "Failed to create virtual environment (code ".concat(code, "). Please ensure python3-venv is installed."));
                res.write("data: ".concat(JSON.stringify({ type: "progress", value: 0 }), "\n\n"));
                res.write("data: ".concat(JSON.stringify({ type: "done", message: "Setup failed during venv creation." }), "\n\n"));
                return res.end();
            }
            sendLog("success", "Virtual environment created successfully. Upgrading pip and essential build tools...");
            res.write("data: ".concat(JSON.stringify({ type: "progress", value: 20 }), "\n\n"));
            var venvPythonCmd = isWin ? path_1.default.join(venvDir, "Scripts", "python.exe") : path_1.default.join(venvDir, "bin", "python3");
            // Upgrade pip, setuptools, and wheel before installing anything to prevent Wheel build errors during dependencies resolution
            var pipUpgradeProc = (0, child_process_1.spawn)(venvPythonCmd, ["-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"]);
            var pipUpgradeResolved = false;
            pipUpgradeProc.stdout.on("data", function (data) { return sendLog("stdout", data.toString()); });
            pipUpgradeProc.stderr.on("data", function (data) { return sendLog("stderr", data.toString()); });
            pipUpgradeProc.on("error", function (err) {
                if (pipUpgradeResolved)
                    return;
                pipUpgradeResolved = true;
                sendLog("warning", "Failed to span pip upgrade command: ".concat(err.message, ". It will try proceeding with default pip version."));
            });
            pipUpgradeProc.on("close", function (upgradeCode) {
                if (pipUpgradeResolved)
                    return;
                pipUpgradeResolved = true;
                if (upgradeCode !== 0) {
                    sendLog("warning", "Pip/setuptools upgrade failed, proceeding with default pip version. (If build fails later, this might be why).");
                }
                else {
                    sendLog("success", "Build tools (pip, setuptools, wheel) upgraded successfully.");
                }
                res.write("data: ".concat(JSON.stringify({ type: "progress", value: 30 }), "\n\n"));
                sendLog("info", "Executing: ".concat(venvPythonCmd, " -m pip install pdf2zh (this may take a few minutes)"));
                // Use venvPythonCmd -m pip instead of pipCmd to ensure we use the upgraded pip module reliably
                var pipProc = (0, child_process_1.spawn)(venvPythonCmd, ["-m", "pip", "install", "urllib3<2", "certifi", "spacy<3.8.0", "pdf2zh"]);
                var pipResolved = false;
                var currentProgress = 30;
                pipProc.stdout.on("data", function (data) {
                    var out = data.toString();
                    sendLog("stdout", out);
                    if (out.includes("Collecting") || out.includes("Downloading") || out.includes("Installing")) {
                        currentProgress = Math.min(currentProgress + 1, 80); // Cap at 80 for pip install so UI does not look stuck at 95, allows room for Model downloading if needed
                        res.write("data: ".concat(JSON.stringify({ type: "progress", value: currentProgress }), "\n\n"));
                    }
                });
                pipProc.stderr.on("data", function (data) {
                    sendLog("stderr", data.toString());
                });
                pipProc.on("close", function (pipCode) {
                    if (pipResolved)
                        return;
                    pipResolved = true;
                    if (pipCode === 0) {
                        sendLog("success", "pdf2zh successfully installed in isolated environment!");
                        downloadModel();
                    }
                    else {
                        sendLog("error", "pip install failed with code ".concat(pipCode, ". Please check your python/pip setup or network connection."));
                        res.write("data: ".concat(JSON.stringify({ type: "progress", value: 0 }), "\n\n"));
                        res.write("data: ".concat(JSON.stringify({ type: "done", message: "Setup completed with errors." }), "\n\n"));
                        res.end();
                    }
                });
                pipProc.on("error", function (err) {
                    if (pipResolved)
                        return;
                    pipResolved = true;
                    sendLog("error", "Failed to span pip command: ".concat(err.message, "."));
                    res.write("data: ".concat(JSON.stringify({ type: "progress", value: 0 }), "\n\n"));
                    res.write("data: ".concat(JSON.stringify({ type: "done", message: "Setup completed with errors." }), "\n\n"));
                    res.end();
                });
            });
        });
        venvProc.on("error", function (err) {
            if (venvResolved)
                return;
            venvResolved = true;
            sendLog("error", "Failed to execute python venv: ".concat(err.message));
            res.write("data: ".concat(JSON.stringify({ type: "progress", value: 0 }), "\n\n"));
            res.write("data: ".concat(JSON.stringify({ type: "done", message: "Setup failed." }), "\n\n"));
            res.end();
        });
    }
    var sendLog, configPath, venvDir, isWin, pythonCmd, pipCmd, pdf2zhCmdLocal, forceReinstall, testProc, testResolved_1;
    return __generator(this, function (_a) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        sendLog = function (type, message) {
            res.write("data: ".concat(JSON.stringify({ type: type, message: message }), "\n\n"));
        };
        sendLog("info", "Starting native pdf2zh one-click installation checking...");
        configPath = path_1.default.join(pdf2zhDataDir, "config.json");
        fs_1.default.writeFileSync(configPath, JSON.stringify({
            setupDate: new Date().toISOString(),
            uninstallInstruction: "To completely clean up, simply delete this directory: ".concat(pdf2zhDataDir, ". It contains a fully self-isolated virtual environment.")
        }, null, 2));
        sendLog("info", "Workspace configuration directory created safely at: ".concat(pdf2zhDataDir));
        venvDir = path_1.default.join(pdf2zhDataDir, "venv");
        isWin = process.platform === "win32";
        pythonCmd = isWin ? "python" : "python3";
        pipCmd = isWin ? path_1.default.join(venvDir, "Scripts", "pip.exe") : path_1.default.join(venvDir, "bin", "pip");
        pdf2zhCmdLocal = isWin ? path_1.default.join(venvDir, "Scripts", "pdf2zh.exe") : path_1.default.join(venvDir, "bin", "pdf2zh");
        forceReinstall = req.query.forceReinstall === 'true';
        if (forceReinstall) {
            sendLog("info", "Force reinstall requested. Cleaning up existing virtual environment...");
            if (fs_1.default.existsSync(venvDir)) {
                try {
                    fs_1.default.rmSync(venvDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
                }
                catch (err) {
                    sendLog("warning", "Could not completely remove existing venvDir (".concat(err.message, "). Proceeding anyway."));
                }
            }
            createVenvAndInstall();
        }
        else {
            testProc = (0, child_process_1.spawn)(pdf2zhCmdLocal, ["--version"]);
            testResolved_1 = false;
            testProc.on("error", function () {
                if (testResolved_1)
                    return;
                testResolved_1 = true;
                sendLog("warning", "Local virtual environment pdf2zh not found. Proceeding with isolated installation...");
                createVenvAndInstall();
            });
            testProc.on("close", function (code) {
                if (testResolved_1)
                    return;
                testResolved_1 = true;
                if (code === 0) {
                    sendLog("success", "pdf2zh is already installed in the isolated virtual environment and is working correctly!");
                    res.write("data: ".concat(JSON.stringify({ type: "progress", value: 80 }), "\n\n"));
                    downloadModel();
                }
                else {
                    sendLog("warning", "Existing pdf2zh installation appears broken. Re-installing...");
                    if (fs_1.default.existsSync(venvDir)) {
                        try {
                            fs_1.default.rmSync(venvDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
                        }
                        catch (err) {
                            sendLog("warning", "Could not completely remove existing venvDir (".concat(err.message, "). Proceeding anyway."));
                        }
                    }
                    createVenvAndInstall();
                }
            });
        }
        return [2 /*return*/];
    });
}); });
// API to Uninstall Local pdf2zh instance and clean workspace
app.post("/api/pdf2zh-uninstall", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sendLog;
    return __generator(this, function (_a) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        sendLog = function (type, message) {
            res.write("data: ".concat(JSON.stringify({ type: type, message: message }), "\n\n"));
        };
        sendLog("info", "Starting native pdf2zh cleanup and workspace removal...");
        sendLog("info", "Deleting self-contained workspace directory: ".concat(pdf2zhDataDir));
        // Delete the data dir completely
        fs_1.default.rm(pdf2zhDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }, function (err) {
            if (err) {
                sendLog("error", "Failed to remove directory: ".concat(err.message));
                res.write("data: ".concat(JSON.stringify({ type: "done", message: "Uninstall completed with errors." }), "\n\n"));
            }
            else {
                sendLog("success", "Workspace directory and isolated virtual environment deleted successfully.");
                res.write("data: ".concat(JSON.stringify({ type: "done", message: "Uninstall and cleanup completed perfectly." }), "\n\n"));
            }
            res.end();
        });
        return [2 /*return*/];
    });
}); });
// API to proxy huggingface downloads (bypasses python SSL/TLS limitations on older macs)
app.use("/hf-proxy", function (req, res) {
    // Extract target URL from query parameter if provided (for redirects), else build from req.url
    var targetUrlStr = req.query.url;
    if (!targetUrlStr) {
        // Remove query params related to hfproxy if any, usually it's just the path
        targetUrlStr = "https://hf-mirror.com" + req.url;
    }
    var targetUrl = new URL(targetUrlStr);
    var proxyModule = targetUrl.protocol === 'http:' ? require("http") : require("https");
    var options = {
        method: req.method,
        headers: __assign(__assign({ "User-Agent": req.headers["user-agent"] || "huggingface_hub/0.23.0" }, (req.headers["range"] && { "Range": req.headers["range"] })), (req.headers["authorization"] && { "Authorization": req.headers["authorization"] }))
    };
    var proxyReq = proxyModule.request(targetUrl, options, function (proxyRes) {
        // Intercept redirects and rewrite the Location header so python uses HTTP
        var statusCode = proxyRes.statusCode || 200;
        // For redirect status codes, we capture the Location header
        if ([301, 302, 303, 307, 308].includes(statusCode) && proxyRes.headers.location) {
            var originalLocation = proxyRes.headers.location;
            // Convert to absolute URL if it's relative
            var absoluteLocation = originalLocation;
            if (!absoluteLocation.startsWith("http")) {
                absoluteLocation = new URL(originalLocation, targetUrl.origin).toString();
            }
            // Rewrite the location to go through our proxy again
            proxyRes.headers.location = "http://127.0.0.1:".concat(global.APP_PORT || 3000, "/hf-proxy?url=").concat(encodeURIComponent(absoluteLocation));
        }
        res.status(statusCode);
        Object.keys(proxyRes.headers).forEach(function (key) {
            res.setHeader(key, proxyRes.headers[key]);
        });
        if (req.method === "HEAD") {
            res.end();
            return;
        }
        proxyRes.pipe(res, { end: true });
    });
    proxyReq.on("error", function (err) {
        console.error("[HF Proxy Error]", err.message);
        res.status(500).end();
    });
    req.pipe(proxyReq, { end: true });
});
// API to run actual PDFMathTranslate/pdf2zh Python script
app.post("/api/pdf2zh-translate", upload.single("file"), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, sourceLang, targetLang, provider, model, endpoint, apiKey, threads, filePath, fileName, sendLog, args, envVars, venvDir, isWin, pdf2zhCmdLocal, commandToRun, proc, transResolved;
    return __generator(this, function (_b) {
        if (!req.file) {
            return [2 /*return*/, res.status(400).json({ error: "No PDF file uploaded" })];
        }
        _a = req.body, sourceLang = _a.sourceLang, targetLang = _a.targetLang, provider = _a.provider, model = _a.model, endpoint = _a.endpoint, apiKey = _a.apiKey, threads = _a.threads;
        filePath = req.file.path;
        fileName = req.file.filename;
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        sendLog = function (type, message) {
            res.write("data: ".concat(JSON.stringify({ type: type, message: message }), "\n\n"));
        };
        sendLog("info", "Initiating native PDFMathTranslate (pdf2zh) for ".concat(req.file.originalname));
        args = [filePath];
        if (sourceLang) {
            args.push("-li");
            args.push(sourceLang === "English" ? "en" : sourceLang);
        }
        if (targetLang) {
            args.push("-lo");
            args.push(targetLang === "Chinese (Simplified)" ? "zh" : targetLang);
        }
        if (threads) {
            args.push("-t");
            args.push(String(threads));
        }
        if (provider === "gemini") {
            args.push("-s");
            args.push("gemini"); // Note: real pdf2zh doesn't natively support gemini without extra config maybe, but we passthrough
        }
        else if (provider === "openai" || provider === "lmstudio" || provider === "omlx") {
            if (model) {
                args.push("-s");
                args.push("openai:".concat(model));
            }
            else {
                args.push("-s");
                args.push("openai"); // pdf2zh uses openai compatible format
            }
        }
        envVars = __assign(__assign({}, process.env), { PYTHONWARNINGS: "ignore", HF_ENDPOINT: "http://127.0.0.1:" + (global.APP_PORT || 3000) + "/hf-proxy", HF_HUB_ENABLE_HF_TRANSFER: "0" });
        if (model) {
            envVars.OPENAI_MODEL = model;
        }
        if (endpoint) {
            envVars.OPENAI_BASE_URL = endpoint.endsWith("/chat/completions") ? endpoint.replace("/chat/completions", "") : endpoint;
        }
        if (apiKey) {
            envVars.OPENAI_API_KEY = apiKey;
        }
        if (provider === "gemini" && process.env.GEMINI_API_KEY) {
            envVars.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        }
        venvDir = path_1.default.join(pdf2zhDataDir, "venv");
        isWin = process.platform === "win32";
        pdf2zhCmdLocal = isWin ? path_1.default.join(venvDir, "Scripts", "pdf2zh.exe") : path_1.default.join(venvDir, "bin", "pdf2zh");
        commandToRun = fs_1.default.existsSync(pdf2zhCmdLocal) ? pdf2zhCmdLocal : "pdf2zh";
        sendLog("info", "Executing command: ".concat(commandToRun, " ").concat(args.join(" ")));
        sendLog("info", "Working directory: " + pdf2zhDataDir);
        proc = (0, child_process_1.spawn)(commandToRun, args, { cwd: pdf2zhDataDir, env: envVars });
        transResolved = false;
        proc.stdout.on("data", function (data) {
            sendLog("stdout", data.toString());
        });
        proc.stderr.on("data", function (data) {
            var text = data.toString();
            var lines = text.split(/[\r\n]+/);
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var line = lines_1[_i];
                if (!line.trim())
                    continue;
                var matchModel = line.match(/(\d+)%\|.*?\|.*?\s+\[(?:.*?(?:<\s*([^,]+))?|.*?),\s*([^\]]+)\]/);
                if (matchModel) {
                    res.write("data: ".concat(JSON.stringify({ type: "model_progress", percentage: parseInt(matchModel[1], 10), eta: (matchModel[2] || "00:00").trim(), speed: (matchModel[3] || "N/A").trim() }), "\n\n"));
                }
                else {
                    var transMatch = line.match(/(?:\s|^)(\d+)%\|.*?\|/);
                    if (transMatch) {
                        res.write("data: ".concat(JSON.stringify({ type: "translation_progress", percentage: parseInt(transMatch[1], 10) }), "\n\n"));
                    }
                }
                sendLog("stderr", line.trim());
            }
        });
        proc.on("error", function (err) {
            if (transResolved)
                return;
            transResolved = true;
            sendLog("error", "Failed to spawn pdf2zh check your setup: ".concat(err.message));
            res.write("data: ".concat(JSON.stringify({ type: "done", error: err.message }), "\n\n"));
            res.end();
        });
        proc.on("close", function (code) {
            if (transResolved)
                return;
            transResolved = true;
            if (code !== 0) {
                sendLog("error", "pdf2zh execution exited with error code ".concat(code));
                res.write("data: ".concat(JSON.stringify({ type: "done", error: "Translation process failed" }), "\n\n"));
            }
            else {
                sendLog("success", "pdf2zh successfully localized the document!");
                // Attempt to resolve generated output files:
                // pdf2zh defaults output names based on original file, let's verify what's outputted
                var parsedPath = path_1.default.parse(filePath);
                var monoPath = path_1.default.join(pdf2zhDataDir, "uploads", "".concat(parsedPath.name, "-mono.pdf"));
                var dualPath = path_1.default.join(pdf2zhDataDir, "uploads", "".concat(parsedPath.name, "-dual.pdf"));
                res.write("data: ".concat(JSON.stringify({
                    type: "done",
                    message: "Success",
                    files: {
                        mono: fs_1.default.existsSync(monoPath) ? "/api/pdf2zh-download/".concat(path_1.default.basename(monoPath)) : null,
                        dual: fs_1.default.existsSync(dualPath) ? "/api/pdf2zh-download/".concat(path_1.default.basename(dualPath)) : null
                    }
                }), "\n\n"));
            }
            res.end();
        });
        return [2 /*return*/];
    });
}); });
app.get("/api/pdf2zh-download/:filename", function (req, res) {
    var filename = req.params.filename;
    var filepath = path_1.default.join(pdf2zhDataDir, "uploads", filename);
    // Prevent directory traversal
    if (!filepath.startsWith(path_1.default.join(pdf2zhDataDir, "uploads"))) {
        return res.status(403).send("Forbidden path");
    }
    if (fs_1.default.existsSync(filepath)) {
        res.download(filepath);
    }
    else {
        res.status(404).send("File not found");
    }
});
// Serve frontend assets via Vite in development, or standard express static in production
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var createViteServer, vite, distPath_1, host, server;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(process.env.NODE_ENV !== "production")) return [3 /*break*/, 3];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("vite"); })];
                case 1:
                    createViteServer = (_a.sent()).createServer;
                    return [4 /*yield*/, createViteServer({
                            server: { middlewareMode: true },
                            appType: "spa",
                        })];
                case 2:
                    vite = _a.sent();
                    app.use(vite.middlewares);
                    return [3 /*break*/, 4];
                case 3:
                    distPath_1 = typeof __dirname !== "undefined" ? __dirname : path_1.default.join(process.cwd(), "dist");
                    app.use(express_1.default.static(distPath_1));
                    app.get("*", function (req, res) {
                        res.sendFile(path_1.default.join(distPath_1, "index.html"));
                    });
                    _a.label = 4;
                case 4:
                    host = process.env.HOST || "0.0.0.0";
                    server = app.listen(PORT, host, function () {
                        var address = server.address();
                        var actualPort = typeof address === 'string' ? PORT : address === null || address === void 0 ? void 0 : address.port;
                        if (typeof global !== 'undefined') {
                            global.APP_PORT = actualPort;
                        }
                        console.log("Server running on http://".concat(host, ":").concat(actualPort));
                    });
                    server.on("error", function (error) {
                        console.error("Express server error:", error);
                    });
                    return [2 /*return*/];
            }
        });
    });
}
startServer().catch(function (err) {
    console.error("Failed to start server asynchronously:", err);
    process.exit(1);
});
