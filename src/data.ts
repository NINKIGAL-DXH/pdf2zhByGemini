import { TranslatedDoc, PDFPage } from "./types";

// Page definition helper helper
export const PRESET_PAPERS: { [key: string]: { name: string; size: string; pages: PDFPage[] } } = {
  transformer: {
    name: "Attention_Is_All_You_Need.pdf",
    size: "1.2 MB",
    pages: [
      {
        pageNumber: 1,
        width: 612,
        height: 792,
        blocks: [
          {
            id: "t1-title",
            type: "title",
            originalText: "Attention Is All You Need",
            translatedText: "注意力就是你需要的一切 (Attention Is All You Need)",
            x: 10, y: 8, w: 80, h: 6
          },
          {
            id: "t1-authors",
            type: "paragraph",
            originalText: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin",
            translatedText: "阿希什·瓦斯瓦尼, 诺姆·沙泽尔, 妮基·帕尔马, 雅各布·乌茨科雷特, 莱恩·琼斯, 艾丹·N·戈麦斯, 卢卡什·凯泽, 伊利亚·波洛苏欣",
            x: 15, y: 15, w: 70, h: 4
          },
          {
            id: "t1-abs-header",
            type: "header",
            originalText: "Abstract",
            translatedText: "摘要",
            x: 12, y: 22, w: 76, h: 3
          },
          {
            id: "t1-abs-desc",
            type: "abstract",
            originalText: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks which include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
            translatedText: "主流的序列转导模型基于复杂的循环或卷积神经网络，其中包括编码器和解码器。性能最佳的模型还通过注意力机制连接编码器和解码器。我们提出了一种新型、简单的网络结构，即 Transformer，它完全基于注意力机制，完全摒弃了循环和卷积。",
            x: 12, y: 26, w: 76, h: 12
          },
          {
            id: "t1-intro-header",
            type: "header",
            originalText: "1. Introduction",
            translatedText: "1. 引言",
            x: 12, y: 40, w: 36, h: 3
          },
          {
            id: "t1-intro-p1",
            type: "paragraph",
            originalText: "Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling. Numerous efforts have since continued to push the boundaries of recurrent language models.",
            translatedText: "循环神经网络，特别是长短期记忆（LSTM）和门控循环神经网络（GRU），已被公认为序列建模中的前沿方法。此后，无数的研究继续致力于拓宽循环语言模型的边界。",
            x: 12, y: 44, w: 36, h: 14
          },
          {
            id: "t1-intro-p2",
            type: "paragraph",
            originalText: "However, recurrent models suffer from fundamental limitations in sequential computation, as training cannot be parallelized across sequence lengths. This limits training efficiencies.",
            translatedText: "然而，循环模型在序列计算中存在根本性的限制，因为训练无法在序列长度上进行并行化。这限制了训练效率。",
            x: 12, y: 59, w: 36, h: 10
          },
          {
            id: "t1-model-header",
            type: "header",
            originalText: "2. Model Architecture",
            translatedText: "2. 模型架构",
            x: 52, y: 40, w: 36, h: 3
          },
          {
            id: "t1-model-p1",
            type: "paragraph",
            originalText: "Most competitive neural sequence transduction models have an encoder-decoder structure. Here, the encoder maps an input sequence of symbol representations into a sequence of continuous representations.",
            translatedText: "大多数极具竞争力的神经序列转导模型都具有编码器-解码器的结构。在此，编码器将符号表示的输入序列映射为连续表示的序列。",
            x: 52, y: 44, w: 36, h: 12
          },
          {
            id: "t1-eq1",
            type: "equation",
            originalText: "Attention(Q, K, V) = softmax( (QK^T) / sqrt(d_k) ) V",
            translatedText: "Attention(Q, K, V) = softmax( (QK^T) / sqrt(d_k) ) V",
            x: 52, y: 58, w: 36, h: 5
          },
          {
            id: "t1-model-p2",
            type: "paragraph",
            originalText: "Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.",
            translatedText: "多头注意力机制允许模型在不同位置联合关注来自不同表示子空间的信息。",
            x: 52, y: 64, w: 36, h: 9
          },
          {
            id: "t1-fig-1",
            type: "figure",
            originalText: "[Figure 1: Scaled Dot-Product Attention & Multi-Head Attention Layout]",
            translatedText: "[图 1：缩放点积注意力与多头注意力布局结构]",
            x: 12, y: 75, w: 76, h: 14
          }
        ]
      },
      {
        pageNumber: 2,
        width: 612,
        height: 792,
        blocks: [
          {
            id: "t2-sec3-header",
            type: "header",
            originalText: "3. Self-Attention Advantages",
            translatedText: "3. 自注意力机制的优势",
            x: 12, y: 8, w: 76, h: 3
          },
          {
            id: "t2-p1",
            type: "paragraph",
            originalText: "In this section we compare various aspects of self-attention layers to recurrent and convolutional layers. To motivate our use of self-attention we consider three desiderata:",
            translatedText: "在本节中，我们从多个维度对比自注意力层与循环层及卷积层。为了说明采用自注意力机制的动机，我们考虑三个评判要素：",
            x: 12, y: 12, w: 76, h: 8
          },
          {
            id: "t2-p2",
            type: "paragraph",
            originalText: "First is the total computational complexity per layer. Another is the amount of computation that can be parallelized, measured by the minimum number of sequential operations required.",
            translatedText: "首先是每层的总计算复杂度。其次是可进行并行化计算的数量，通过所需的最少串行操作步数来进行衡量。",
            x: 12, y: 21, w: 36, h: 12
          },
          {
            id: "t2-p3",
            type: "paragraph",
            originalText: "The third is the path length between long-range dependencies in the network. Learning long-range dependencies is a key challenge in many sequence transduction tasks. One key factor affecting the ability to learn such dependencies is the length of paths forward and backward.",
            translatedText: "第三点是网络中长距离依赖关系之间的路径长度。学习长距离依赖是许多序列转导任务中的一大核心挑战。影响学习此类依赖关系能力的关键因素之一便是前向和后向传播的路径长度。",
            x: 52, y: 21, w: 36, h: 16
          },
          {
            id: "t2-table-1",
            type: "figure",
            originalText: "[Table 1: Maximum path lengths, computational complexity and sequential operations for multiple layer types]",
            translatedText: "[表 1：多种不同图层架构的最大路径长度、计算复杂度和串行操作步数对比]",
            x: 12, y: 40, w: 76, h: 15
          },
          {
            id: "t2-p4",
            type: "paragraph",
            originalText: "As noted in Table 1, a self-attention layer connects all positions with a constant number of sequentially executed operations. A recurrent layer requires O(n) sequential operations, which becomes a key bottleneck for long paragraphs.",
            translatedText: "如表1所示，自注意力层以常数级别的串行执行操作数连接所有位置。而循环层需要 O(n) 次串行操作，这成为了长文本段落的关键性能瓶颈。",
            x: 12, y: 57, w: 76, h: 10
          },
          {
            id: "t2-conclusion-header",
            type: "header",
            originalText: "4. Conclusion",
            translatedText: "4. 结论与未来展望",
            x: 12, y: 70, w: 76, h: 3
          },
          {
            id: "t2-conclusion-text",
            type: "paragraph",
            originalText: "In this work, we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention.",
            translatedText: "在本项工作中，我们提出了 Transformer，这是首个完全基于注意力机制的序列转导模型，它用多头自注意力机制完全替代了传统的编码器-解码器架构中最常用的循环层。",
            x: 12, y: 74, w: 76, h: 10
          }
        ]
      }
    ]
  },
  rag: {
    name: "RAG_Augmented_Generation.pdf",
    size: "840 KB",
    pages: [
      {
        pageNumber: 1,
        width: 612,
        height: 792,
        blocks: [
          {
            id: "r1-title",
            type: "title",
            originalText: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
            translatedText: "面向知识密集型自然语言处理任务的检索增强生成技术 (RAG)",
            x: 10, y: 8, w: 80, h: 8
          },
          {
            id: "r1-abstract-header",
            type: "header",
            originalText: "Abstract",
            translatedText: "摘要",
            x: 12, y: 20, w: 76, h: 3
          },
          {
            id: "r1-abstract-text",
            type: "abstract",
            originalText: "Large pre-trained language models have been shown to store implicit knowledge in their parameters. However, their ability to access and precisely manipulate knowledge is still limited, especially for knowledge-intensive duties. We introduce Retrieval-Augmented Generation (RAG) which merges pre-trained parametric memory with external non-parametric memory datasets.",
            translatedText: "大型预训练语言模型已被证明可以在其内部参数中存储隐性知识。然而，它们精确提取和操作知识的能力仍然有限，特别是在处理知识密集型场景时。我们引入了检索增强生成 (RAG) 技术，该技术将预训练的参数化内存与外部非参数化的非结构化数据资产库完美结合。",
            x: 12, y: 24, w: 76, h: 12
          },
          {
            id: "r1-intro-header",
            type: "header",
            originalText: "1. Background",
            translatedText: "1. 问题背景",
            x: 12, y: 40, w: 36, h: 3
          },
          {
            id: "r1-intro-text",
            type: "paragraph",
            originalText: "Pre-trained neural models like BART or T5 are capable of generating fluent, human-like answers. However, they are prone to expressing hallucinations, i.e., making up facts, and often fail to cite sources when producing responses.",
            translatedText: "类似于 BART 或 T5 这种已预训练成功的神经网络模型，确实能够生成非常自然流畅、类似人类的答案。然而，它们极易产生幻觉现象（即虚构事实），且在生成内容时往往无法附带真实文献来源。",
            x: 12, y: 44, w: 36, h: 16
          },
          {
            id: "r1-method-header",
            type: "header",
            originalText: "2. Core Methodology",
            translatedText: "2. 核心系统法",
            x: 52, y: 40, w: 36, h: 3
          },
          {
            id: "r1-method-text",
            type: "paragraph",
            originalText: "Operating at a high level, RAG takes as input a query vector x and retrieves matching documents z from an index database. It then combines query x with passages z to prompt a seq2seq generator model to output text y.",
            translatedText: "在顶层架构中，RAG 接收输入的查询向量 x，并从索引数据库中检索匹配的文本段落归纳集合 z。接下来它将查询 x 与文本细节 z 整合起来，共同输入一个序列到序列生成模型，最终得到精确输出文本 y。",
            x: 52, y: 44, w: 36, h: 16
          },
          {
            id: "r1-eq-rag",
            type: "equation",
            originalText: "P(y|x) = Sum_{z} P(z|x) * P(y|x, z)",
            translatedText: "P(y|x) = Sum_{z} P(z|x) * P(y|x, z)",
            x: 52, y: 62, w: 36, h: 6
          },
          {
            id: "r1-footer",
            type: "footer",
            originalText: "Preprint. Under review of NeurIPS Conference.",
            translatedText: "预印本。NeurIPS 会议审稿中。",
            x: 10, y: 92, w: 80, h: 2
          }
        ]
      }
    ]
  },
  pdf2zh_guide: {
    name: "pdf2zh_Guide_Book.pdf",
    size: "420 KB",
    pages: [
      {
        pageNumber: 1,
        width: 612,
        height: 792,
        blocks: [
          {
            id: "g1-title",
            type: "title",
            originalText: "pdf2zh: PDF Translation Command Line Tool Graphical User Guide",
            translatedText: "pdf2zh：PDF 格式保留翻译命令行客户端图形操作指南",
            x: 10, y: 10, w: 80, h: 8
          },
          {
            id: "g1-sec1-header",
            type: "header",
            originalText: "1. What is pdf2zh?",
            translatedText: "1. 什么是 pdf2zh？",
            x: 12, y: 22, w: 76, h: 3
          },
          {
            id: "g1-p1",
            type: "paragraph",
            originalText: "pdf2zh is a highly efficient layout-preserving translator for PDF documents. It parses complex PDFs, parses text fragments, mathematical equations, and float figures, translates them via neural models, and reconstructs the output PDF while maintaining fonts, styles, columns, and absolute coordinate placements.",
            translatedText: "pdf2zh 是一款针对 PDF 电子文件的版式完美保留翻译利器。它可以解析复杂的文档、提取文本段、数学公式、浮动图像等，接着通过主流的大语言模型执行内容转换，重构后还原输出排版，同时完整保留原始字体、字号、栏目多页布局。",
            x: 12, y: 26, w: 76, h: 12
          },
          {
            id: "g1-sec2-header",
            type: "header",
            originalText: "2. Getting Started with CLI",
            translatedText: "2. CLI 命令行开始使用",
            x: 12, y: 40, w: 76, h: 3
          },
          {
            id: "g1-p2",
            type: "paragraph",
            originalText: "Simply install it via pip in your macOS terminal, and run your command. pdf2zh will handle the heavy lifting of OCR / fitz stream segmenting, and stitch translations seamlessly.",
            translatedText: "您只需在 macOS 终端里使用 pip 进行简易安装，即可一键运行。pdf2zh 会代替您处理复杂的 OCR 文字识别和 fitz 段落分句流，并自适应拼接翻译译文。",
            x: 12, y: 44, w: 41, h: 12
          },
          {
            id: "g1-p3",
            type: "paragraph",
            originalText: "The program produces two target files: \n- mono document containing translated blocks in-place.\n- dual document retaining original lines overlaid with translated sections side-by-side or block-by-block.",
            translatedText: "程序运行完毕会自动在同目录下产出两个文件：\n- 单语版 mono：直接将排版位置覆盖为中文译文；\n- 双语版 dual：保留原汁原味的英文文本，并在其下方或旁边自适应对齐输出中文译文。",
            x: 55, y: 44, w: 35, h: 18
          },
          {
            id: "g1-eq-cmd",
            type: "equation",
            originalText: "$ pip install pdf2zh \n$ pdf2zh document.pdf --service openai --model gpt-4o",
            translatedText: "$ pip install pdf2zh \n$ pdf2zh document.pdf --service openai --model gpt-4o",
            x: 12, y: 65, w: 76, h: 8
          }
        ]
      }
    ]
  }
};

export const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English (英语)" },
  { code: "zh", name: "Simplified Chinese (简体中文)" },
  { code: "tw", name: "Traditional Chinese (繁体中文)" },
  { code: "ja", name: "Japanese (日语)" },
  { code: "ko", name: "Korean (韩语)" },
  { code: "fr", name: "French (法语)" },
  { code: "de", name: "German (德语)" },
];

export const MOCK_TERMINAL_LOGS = [
  { time: 50, text: "[pdf2zh] Initializing PDF translation process..." },
  { time: 150, text: "[pdf2zh] Checking Python version (3.11.2 detected)..." },
  { time: 300, text: "[pdf2zh] Opening raw document file streams..." },
  { time: 500, text: "[pdf2zh] Analyzing document hierarchy utilizing Fitz layout-parser..." },
  { time: 700, text: "[pdf2zh] Success: Extracted columns, block metadata, and structural headers..." },
  { time: 900, text: "[pdf2zh] Detected mathematical matrix elements and floating diagram boxes..." },
  { time: 1100, text: "[pdf2zh] Connecting with specified AI service translation endpoint..." },
  { time: 1300, text: "[pdf2zh] Batch sending Page 1 text segments (12 segments queued)..." },
  { time: 1700, text: "[pdf2zh] [Page 1/12] Translation block mapping complete (latency: 380ms)." },
  { time: 2100, text: "[pdf2zh] Batch sending Page 2 text segments (18 segments queued)..." },
  { time: 2600, text: "[pdf2zh] [Page 2/12] Translation block mapping complete (latency: 410ms)." },
  { time: 3000, text: "[pdf2zh] Generating vector placements and calculating adaptive font size ratios..." },
  { time: 3300, text: "[pdf2zh] Injecting translated text layers back into PDF coordinates..." },
  { time: 3600, text: "[pdf2zh] Rendering monolingual document: document.mono.pdf" },
  { time: 3900, text: "[pdf2zh] Rendering bilingual document: document.dual.pdf" },
  { time: 4200, text: "[pdf2zh] SUCCESS: Translations completed in 4.2 seconds." },
  { time: 4400, text: "[pdf2zh] Outputs saved: [document.mono.pdf] & [document.dual.pdf]" },
];
