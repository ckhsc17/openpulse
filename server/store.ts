import fs from 'fs';
import path from 'path';
import { DigestReport, Subscriber, IntelligenceItem, BotStatusInfo } from '../src/types';

const SUBSCRIBERS_FILE = path.join(process.cwd(), 'data_subscribers.json');

// Initial curated intelligence data to provide immediate value
const initialItems: IntelligenceItem[] = [
  {
    id: 'item-ai-1',
    category: 'ai',
    title: 'vLLM 推出全新 v1 架構：推論吞吐量提升 2.7 倍並深度支援投機解碼 (Speculative Decoding)',
    source: 'GitHub / vllm-project/vllm',
    url: 'https://github.com/vllm-project/vllm',
    summary: '高吞吐量開源 LLM 推論引擎 vLLM 發布重大架構重構，大幅降低了多 GPU 批次處理時的排程負載，並重構了 PagedAttention 核心算子。',
    keyHighlights: [
      '透過 C++ 重寫核心 Scheduler，CPU 排程延遲由 2.4ms 降低至 0.3ms',
      '支援自適應投機解碼草稿模型 (Draft Models)，提升長上下文生成速度',
      '新增對 DeepSeek-V3 / R1 混合專家模型 (MoE) 的原生快顯暫存支援'
    ],
    impactScore: 9.6,
    tags: ['LLM Inference', 'vLLM', 'CUDA', 'Python', 'C++'],
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    prContribution: {
      repoName: 'vllm-project/vllm',
      repoUrl: 'https://github.com/vllm-project/vllm',
      issueOrPrTitle: '[Good First Issue] Add unit test and benchmarking script for RoPE scaled contexts in Triton kernel',
      issueOrPrUrl: 'https://github.com/vllm-project/vllm/issues',
      difficulty: '初學者 (Good First Issue)',
      language: 'Python / Triton',
      tags: ['good first issue', 'testing', 'benchmarks'],
      contributionGuide: '維護者已在 Issue 內列出測試資料集與預期誤差容忍度，僅需編寫 pytest 單元測試並比較 GPU 數值一致性即可送出 PR。',
      starsCount: '48.2k'
    }
  },
  {
    id: 'item-ai-2',
    category: 'ai',
    title: 'DeepSeek-R1 開源推理權重與蒸餾技術全面開放，引爆開源社群複現浪潮',
    source: 'arXiv / cs.AI & Hugging Face',
    url: 'https://arxiv.org/abs/2501.12948',
    summary: 'DeepSeek 正式開源其強化學習推理模型 DeepSeek-R1 與 6 款以 Llama/Qwen 為骨幹的蒸餾小模型，展示純 RL 訓練可激發強大長鏈思考 (CoT) 能力。',
    keyHighlights: [
      'R1-Zero 證明無須 SFT 監督微調即可自主湧現自我反思與重新審題能力',
      '開源社群發起多個微型複現專案 (TinyZero / Open-R1)',
      '蒸餾模型 (1.5B ~ 70B) 於 AIME 2024 與 MATH-500 評測媲美 OpenAI o1-mini'
    ],
    impactScore: 9.9,
    tags: ['Reasoning Models', 'DeepSeek', 'Reinforcement Learning', 'OpenWeights'],
    publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    prContribution: {
      repoName: 'huggingface/open-r1',
      repoUrl: 'https://github.com/huggingface/open-r1',
      issueOrPrTitle: 'Help Wanted: Implement evaluation pipeline for MathVerify benchmark',
      issueOrPrUrl: 'https://github.com/huggingface/open-r1/issues',
      difficulty: '中等 (Intermediate)',
      language: 'Python',
      tags: ['help wanted', 'evaluation', 'math-eval'],
      contributionGuide: '社群正在建立針對開源 R1 訓練後模型的驗證測試流，需要將 MathVerify 正則比對邏輯整合至 `src/open_r1/evaluate.py`。',
      starsCount: '15.4k'
    }
  },
  {
    id: 'item-cs-1',
    category: 'cs_infra',
    title: 'Tokio 團隊開源新型輕量非同步通道 fast-channel，多生產者吞吐達每秒 4000 萬次',
    source: 'GitHub / tokio-rs',
    url: 'https://github.com/tokio-rs',
    summary: 'Rust 生態最受歡迎的非同步運行時 Tokio 開發組釋出專為極限低延遲設計的無鎖 (Lock-free) 環形通道實作，為微服務與金融數據流帶來重大加速。',
    keyHighlights: [
      '利用快取行填充 (Cache-line padding) 避免虛假共享 (False Sharing)',
      '支援自適應自旋退避 (Adaptive Backoff) 機制，減少多核心爭搶',
      '記憶體佔用較傳統 crossbeam-channel 減少 35%'
    ],
    impactScore: 8.8,
    tags: ['Rust', 'Async', 'Concurrency', 'Tokio', 'Systems'],
    publishedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    prContribution: {
      repoName: 'tokio-rs/tokio',
      repoUrl: 'https://github.com/tokio-rs/tokio',
      issueOrPrTitle: 'Docs & Example: Add Chinese translation and architectural diagram for tokio-util codec',
      issueOrPrUrl: 'https://github.com/tokio-rs/tokio/issues',
      difficulty: '初學者 (Good First Issue)',
      language: 'Markdown / Rust',
      tags: ['documentation', 'good first issue', 'translation'],
      contributionGuide: '目前 tokio-util 的多協議編解碼器模組缺少視覺化資料流說明圖與國際化指南，是新手熟悉 Rust 生態並留下首個貢獻的好機會。',
      starsCount: '27.9k'
    }
  },
  {
    id: 'item-science-1',
    category: 'science',
    title: 'Google DeepMind 發表 AlphaFold 3 開源推論代碼與學術社群預測伺服器',
    source: 'Nature / DeepMind Research',
    url: 'https://github.com/google-deepmind/alphafold3',
    summary: 'AlphaFold 3 正式向學術界開放其推論權重與原始碼，除了預測蛋白質結構外，更能精準模擬蛋白質與 DNA、RNA、小分子配體（藥物分子）及離子結合後的立體結構。',
    keyHighlights: [
      '擴展至全生命分子系統 (Proteins, Nucleic Acids, Small Molecules)',
      '採用擴散模型 (Diffusion Module) 直接預測原子坐標，取代傳統物理能量採樣',
      '為全球生物資訊學家開啟全新的開源藥物篩選與分子對接模擬流程'
    ],
    impactScore: 9.8,
    tags: ['Structural Biology', 'AlphaFold3', 'Diffusion', 'Bioinformatics', 'Python'],
    publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    prContribution: {
      repoName: 'biopython/biopython',
      repoUrl: 'https://github.com/biopython/biopython',
      issueOrPrTitle: 'Feature Request: Native parser for mmCIF files containing modern AlphaFold3 confidence metrics',
      issueOrPrUrl: 'https://github.com/biopython/biopython/issues',
      difficulty: '中等 (Intermediate)',
      language: 'Python',
      tags: ['help wanted', 'parser', 'bio-data'],
      contributionGuide: 'BioPython 正在擴展對 AF3 輸出的 pLDDT 與 PAE 信心度矩陣的讀取支援，專案提供詳細的範例 CIF 測試檔供驗證。',
      starsCount: '4.3k'
    }
  },
  {
    id: 'item-pr-1',
    category: 'pr_contribution',
    title: 'LangChain / LangGraph 尋求社群支援：多代理人狀態持久化記憶體轉接器 (State Adapters)',
    source: 'GitHub / langchain-ai/langgraph',
    url: 'https://github.com/langchain-ai/langgraph',
    summary: '作為目前最流行的 Agent 狀態圖框架，LangGraph 正在向全球開源開發者徵求針對 DuckDB、Redis Stack 與 SQLite WAL 模式的 Checkpointer 擴充套件。',
    keyHighlights: [
      '官方提供清晰的抽象基礎類別 `BaseCheckpointSaver` 與單元測試合約',
      '完成後可列名官方 Ecosystem 推薦外掛，獲得數百萬開發者引用',
      '具備詳細的 Contribution Guidelines 與積極的 Core Team Code Review'
    ],
    impactScore: 9.1,
    tags: ['Agents', 'LangGraph', 'Python', 'OpenSource', 'PR Wanted'],
    publishedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    prContribution: {
      repoName: 'langchain-ai/langgraph',
      repoUrl: 'https://github.com/langchain-ai/langgraph',
      issueOrPrTitle: 'Issue #1842: [Help Wanted] Add Async SQLite checkpoint saver with connection pool support',
      issueOrPrUrl: 'https://github.com/langchain-ai/langgraph/issues',
      difficulty: '初學者 (Good First Issue)',
      language: 'Python / aiosqlite',
      tags: ['help wanted', 'good first issue', 'database'],
      contributionGuide: '依據現有的 SqliteSaver 類別，使用 aiosqlite 實作非同步版本的 `get_tuple` 和 `put` 函式，並加上 2 個整合測試即可。',
      starsCount: '12.8k'
    }
  }
];

// Helper to format Telegram Markdown message
export function generateTelegramDigestMarkdown(items: IntelligenceItem[], title: string): string {
  const dateStr = new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', month: 'long', day: 'numeric', weekday: 'short' });
  const timeStr = new Date().toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit' });

  let text = `⚡ *【OpenPulse 每日開源與科技情報】*\n`;
  text += `📅 *${dateStr} ${timeStr} 報告*\n`;
  text += `──────────────\n\n`;

  text += `🎯 *今日速覽焦點*\n`;
  items.slice(0, 3).forEach((item, idx) => {
    text += `${idx + 1}\\. *${item.title.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')}*\n`;
    text += `   🏷️ \`${item.category}\` \\| 來源: [${item.source.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')}](${item.url})\n\n`;
  });

  text += `──────────────\n`;
  text += `🛠️ *今日推薦可貢獻開源 PR / Good First Issue:*\n\n`;

  const prItems = items.filter(i => i.prContribution).slice(0, 2);
  prItems.forEach((item, idx) => {
    const pr = item.prContribution!;
    text += `🔹 *${idx + 1}\\. [${pr.repoName.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')}](${pr.repoUrl})* ⭐ ${pr.starsCount || 'Popular'}\n`;
    text += `   📌 任務: *${pr.issueOrPrTitle.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')}*\n`;
    text += `   🟢 難度: \`${pr.difficulty}\` \\| 語言: \`${pr.language}\`\n`;
    text += `   💡 指南: ${pr.contributionGuide.slice(0, 100).replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')}...\n`;
    text += `   🔗 [前往 Issue / PR 頁面](${pr.issueOrPrUrl})\n\n`;
  });

  text += `──────────────\n`;
  text += `💡 *機器人指令:* /brief 刷新情報 \\| /prs 僅看 PR 獵場 \\| /topics 自訂主題 \\| /help 指南\n`;
  text += `📢 *歡迎將此機器人加入技術群組或頻道，每日 08:00 與 17:00 自動推播！*`;

  return text;
}

const initialDigest: DigestReport = {
  id: 'digest-initial-01',
  title: '今日開源前沿與 PR 獵場晨報 (08:00)',
  generatedAt: new Date().toISOString(),
  triggerType: 'scheduled_morning',
  headlineSummary: '今日開源核心聚焦於 vLLM v1 推論極限加速、DeepSeek-R1 強化學習開源複現潮、以及 LangGraph 廣徵狀態轉接器 PR 機會。',
  items: initialItems,
  telegramFormattedText: generateTelegramDigestMarkdown(initialItems, '今日開源前沿與 PR 獵場晨報 (08:00)'),
  deliveryStats: {
    sentCount: 142,
    failCount: 0,
    timestamp: new Date().toISOString()
  }
};

class DataStore {
  private digests: DigestReport[] = [initialDigest];
  private subscribers: Subscriber[] = [
    {
      chatId: 'demo-channel-1',
      type: 'channel',
      title: 'Open Source Pioneers (開源先鋒頻道)',
      username: 'opensource_pioneers',
      subscribedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      preferredTopics: ['ai', 'cs_infra', 'pr_contribution'],
      isActive: true
    },
    {
      chatId: 'demo-group-1',
      type: 'group',
      title: 'AI 研究與論文研討群',
      username: 'ai_research_tw',
      subscribedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      preferredTopics: ['ai', 'science'],
      isActive: true
    },
    {
      chatId: 'demo-user-1',
      type: 'private',
      title: 'Alex (開源貢獻者)',
      username: 'alex_coder',
      subscribedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      preferredTopics: ['ai', 'cs_infra', 'pr_contribution', 'science'],
      isActive: true
    }
  ];

  private broadcastCount: number = 42;
  private lastBroadcastAt: string | null = new Date(Date.now() - 3600000 * 3).toISOString();

  constructor() {
    this.loadSubscribers();
  }

  private loadSubscribers(): void {
    try {
      if (fs.existsSync(SUBSCRIBERS_FILE)) {
        const raw = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.subscribers = parsed;
          console.log(`[DataStore] Loaded ${this.subscribers.length} persistent subscribers from disk.`);
        }
      } else {
        this.saveSubscribers();
      }
    } catch (err) {
      console.warn('[DataStore] Failed to load subscribers from disk, using defaults:', err);
    }
  }

  private saveSubscribers(): void {
    try {
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(this.subscribers, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DataStore] Failed to save subscribers to disk:', err);
    }
  }

  public getDigests(): DigestReport[] {
    return this.digests;
  }

  public getLatestDigest(): DigestReport {
    return this.digests[0] || initialDigest;
  }

  public addDigest(digest: DigestReport): void {
    this.digests.unshift(digest);
    if (this.digests.length > 20) {
      this.digests.pop();
    }
    this.broadcastCount++;
    this.lastBroadcastAt = new Date().toISOString();
  }

  public getSubscribers(): Subscriber[] {
    return this.subscribers;
  }

  public addSubscriber(sub: Omit<Subscriber, 'subscribedAt' | 'isActive'>): Subscriber {
    const existingIndex = this.subscribers.findIndex(s => String(s.chatId) === String(sub.chatId));
    if (existingIndex >= 0) {
      this.subscribers[existingIndex].isActive = true;
      if (sub.title) this.subscribers[existingIndex].title = sub.title;
      if (sub.username) this.subscribers[existingIndex].username = sub.username;
      if (sub.preferredTopics?.length) this.subscribers[existingIndex].preferredTopics = sub.preferredTopics;
      this.saveSubscribers();
      console.log(`[DataStore] Updated existing subscriber ${sub.chatId} (${sub.username || sub.title}) and saved to disk.`);
      return this.subscribers[existingIndex];
    }
    const newSub: Subscriber = {
      ...sub,
      subscribedAt: new Date().toISOString(),
      isActive: true,
      preferredTopics: sub.preferredTopics?.length ? sub.preferredTopics : ['ai', 'cs_infra', 'science', 'pr_contribution']
    };
    this.subscribers.unshift(newSub);
    this.saveSubscribers();
    console.log(`[DataStore] Added new persistent subscriber ${newSub.chatId} (${newSub.username || newSub.title}) and saved to disk.`);
    return newSub;
  }

  public removeSubscriber(chatId: string | number): boolean {
    const sub = this.subscribers.find(s => String(s.chatId) === String(chatId));
    if (sub) {
      sub.isActive = false;
      this.saveSubscribers();
      console.log(`[DataStore] Deactivated subscriber ${chatId} and saved to disk.`);
      return true;
    }
    return false;
  }

  public getStatus(hasToken: boolean, botUsername: string, webhookUrl: string, webhookActive: boolean): BotStatusInfo {
    const now = new Date();
    // Compute next scheduled time (08:00 or 17:00 Asia/Taipei)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Taipei',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
    const hour = parseInt(getPart('hour'), 10);

    let nextTarget = '08:00 (明日)';
    if (hour < 8) {
      nextTarget = '今日 08:00';
    } else if (hour < 17) {
      nextTarget = '今日 17:00';
    }

    return {
      hasToken,
      botUsername: botUsername || (hasToken ? '@OpenPulseNewsBot' : '@OpenPulseSimBot (模擬中)'),
      webhookUrl: webhookUrl || '',
      webhookActive,
      scheduleMorning: '08:00 (UTC+8)',
      scheduleEvening: '17:00 (UTC+8)',
      timezone: 'Asia/Taipei (UTC+8)',
      subscribersCount: this.subscribers.filter(s => s.isActive).length,
      totalBroadcasts: this.broadcastCount,
      lastBroadcastAt: this.lastBroadcastAt,
      nextBroadcastAt: nextTarget,
      isSimulated: !hasToken
    };
  }
}

export const store = new DataStore();
