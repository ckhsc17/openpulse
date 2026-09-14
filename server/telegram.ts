import { store } from './store';
import { curateFreshDigest } from './curator';
import { DigestReport } from '../src/types';

export interface TelegramSendMessageResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

export class TelegramService {
  private isPolling = false;
  private pollingAbortController: AbortController | null = null;
  private lastUpdateId = 0;
  public lastPollAt: string | null = null;
  public lastUpdateAt: string | null = null;
  public lastError: string | null = null;
  public botUsername: string | null = null;

  public get token(): string {
    return process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
  }

  public get hasToken(): boolean {
    return this.token.length > 10;
  }

  // Real Telegram API caller with timeout protection
  public async callTelegramApi(method: string, body: Record<string, any>, signal?: AbortSignal): Promise<any> {
    if (!this.hasToken) {
      console.log(`[Telegram Sim] Mock call to ${method}:`, JSON.stringify(body).slice(0, 100));
      return { ok: true, result: { simulated: true } };
    }

    const url = `https://api.telegram.org/bot${this.token}/${method}`;
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
      const data = await resp.json();
      if (!data.ok) {
        this.lastError = `[${method}] ${data.description || 'Unknown Telegram Error'}`;
        console.warn(`[Telegram API Warning] ${method}:`, data);
      } else {
        this.lastError = null;
      }
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { ok: false, description: 'Request aborted' };
      }
      this.lastError = `[${method}] Network error: ${err.message}`;
      console.error(`Telegram API network error (${method}):`, err);
      return { ok: false, description: err.message };
    }
  }

  // Get bot profile
  public async getMe(): Promise<{ ok: boolean; username: string }> {
    if (!this.hasToken) {
      return { ok: true, username: 'OpenPulseSimBot (模擬模式)' };
    }
    const res = await this.callTelegramApi('getMe', {});
    if (res.ok && res.result?.username) {
      this.botUsername = `@${res.result.username}`;
      return { ok: true, username: `@${res.result.username}` };
    }
    return { ok: false, username: '' };
  }

  // Delete webhook to allow long polling
  public async deleteWebhook(): Promise<{ ok: boolean; description?: string }> {
    if (!this.hasToken) return { ok: true };
    return await this.callTelegramApi('deleteWebhook', { drop_pending_updates: false });
  }

  // Set Webhook
  public async setWebhook(webhookUrl: string, secretToken?: string): Promise<{ ok: boolean; description?: string }> {
    if (!this.hasToken) {
      return { ok: true, description: 'Simulated webhook configured.' };
    }
    // Stop polling if switching to webhook
    this.stopPolling();

    const body: Record<string, any> = {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query', 'channel_post'],
    };
    if (secretToken) {
      body.secret_token = secretToken;
    }
    const res = await this.callTelegramApi('setWebhook', body);
    return res;
  }

  // Check webhook status from Telegram server
  public async getWebhookInfo(): Promise<any> {
    if (!this.hasToken) {
      return { ok: true, result: { url: '', has_custom_certificate: false, pending_update_count: 0 } };
    }
    return await this.callTelegramApi('getWebhookInfo', {});
  }

  // Sync Telegram Bot Description, Short Description (Bio), and Commands Menu
  public async syncBotProfileAndCommands(): Promise<{ ok: boolean; results: Record<string, any> }> {
    if (!this.hasToken) {
      return { ok: false, results: { error: 'TELEGRAM_BOT_TOKEN 尚未設定' } };
    }

    const description = `🚀 歡迎使用 OpenPulse！
專為工程師、開源愛好者與前沿研究員打造的情報與 PR 獵場機器人。

每日 08:00 與 17:00 自動為你精煉：
• 🤖 AI 前沿突破與開源模型 (arXiv, Hugging Face, vLLM, DeepSeek)
• 💻 基礎架構、高效能編譯器與資料庫 (Rust, Go, C++, Linux)
• 🔬 跨學科計算科學 (生醫演算法, 量子模擬)
• 🛠️ 【獨家】精選開源專案 Good First Issue 與 PR 認領獵場

點擊下方「Start」按鈕或輸入 /brief 立即獲取最新情報！`;

    const shortDescription = `⚡ OpenPulse: 每日 08:00 & 17:00 開源科技情報、前沿 AI 研究與 GitHub PR 獵場機器人！`;

    const commands = [
      { command: 'brief', description: '⚡ 立即生成最新開源研究情報' },
      { command: 'contribute', description: '🛠️ 尋找熱門專案 Good First Issue 與 PR 獵場' },
      { command: 'subscribe', description: '🔔 訂閱每日 08:00 與 17:00 定時推播' },
      { command: 'unsubscribe', description: '🔕 取消定時推播' },
      { command: 'topics', description: '⚙️ 自訂感興趣的專業技術領域' },
      { command: 'status', description: '📊 檢視機器人運行狀態與排程' },
      { command: 'help', description: '📖 檢視完整指令說明手冊' },
    ];

    const results: Record<string, any> = {};

    // 1. Set Chat Description (the large greeting bubble on empty chats before Start)
    results.description = await this.callTelegramApi('setMyDescription', { description });

    // 2. Set Short Description (shown in bot info card and link preview)
    results.shortDescription = await this.callTelegramApi('setMyShortDescription', { short_description: shortDescription });

    // 3. Set Commands (populates the blue [Menu] button in Telegram)
    results.commands = await this.callTelegramApi('setMyCommands', { commands });

    console.log('[Telegram Profile & Menu Sync Results]:', results);
    return { ok: Boolean(results.commands?.ok || results.description?.ok), results };
  }

  // Robust send message: auto-splits long text & falls back to plain text if markdown formatting errors occur
  public async sendMessage(
    chatId: string | number,
    text: string,
    options?: { replyMarkup?: any; parseMode?: string }
  ): Promise<TelegramSendMessageResponse> {
    if (!this.hasToken) {
      console.log(`[Telegram Sim] sendMessage to ${chatId}:`, text.slice(0, 100));
      return { ok: true, result: { message_id: Math.floor(Math.random() * 10000) } };
    }

    // Telegram message maximum length is 4096 characters
    const maxLen = 3900;
    const chunks: string[] = [];
    if (text.length <= maxLen) {
      chunks.push(text);
    } else {
      let remaining = text;
      while (remaining.length > 0) {
        if (remaining.length <= maxLen) {
          chunks.push(remaining);
          break;
        }
        let splitIdx = remaining.lastIndexOf('\n\n', maxLen);
        if (splitIdx === -1 || splitIdx < 1000) {
          splitIdx = remaining.lastIndexOf('\n', maxLen);
        }
        if (splitIdx === -1 || splitIdx < 1000) {
          splitIdx = maxLen;
        }
        chunks.push(remaining.slice(0, splitIdx));
        remaining = remaining.slice(splitIdx).trimStart();
      }
    }

    let lastRes: TelegramSendMessageResponse = { ok: true };
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLastChunk = i === chunks.length - 1;
      const markup = isLastChunk ? options?.replyMarkup : undefined;

      // Attempt 1: Try with requested parseMode (default 'Markdown')
      let res = await this.callTelegramApi('sendMessage', {
        chat_id: chatId,
        text: chunk,
        parse_mode: options?.parseMode || 'Markdown',
        disable_web_page_preview: false,
        reply_markup: markup,
      });

      // Attempt 2: If Telegram rejects due to markdown parsing error ("can't parse entities"), auto-retry as plain text
      if (!res.ok && res.description?.toLowerCase().includes("can't parse entities")) {
        console.warn(`[Telegram] Markdown parse failed for chat ${chatId}, falling back to plain text delivery:`, res.description);
        res = await this.callTelegramApi('sendMessage', {
          chat_id: chatId,
          text: chunk,
          disable_web_page_preview: false,
          reply_markup: markup,
        });
      }

      lastRes = res;
    }

    return lastRes;
  }

  // Broadcast latest digest to all registered subscribers
  public async broadcastDigest(digest: DigestReport): Promise<{ sent: number; failed: number }> {
    const subscribers = store.getSubscribers().filter(s => s.isActive);
    let sent = 0;
    let failed = 0;

    for (const sub of subscribers) {
      try {
        const inlineKeyboard = {
          inline_keyboard: [
            [
              { text: '🛠️ 查看 PR 貢獻獵場', callback_data: 'cmd_contribute' },
              { text: '🔄 刷新即時情報', callback_data: 'cmd_brief' },
            ],
            [
              { text: '🌐 在網頁詳細閱覽', url: process.env.APP_URL || 'https://ai.studio' },
              { text: '⚙️ 調整訂閱主題', callback_data: 'cmd_topics' },
            ]
          ]
        };

        const res = await this.sendMessage(sub.chatId, digest.telegramFormattedText, {
          parseMode: 'Markdown',
          replyMarkup: inlineKeyboard,
        });

        if (res.ok) {
          sent++;
        } else {
          failed++;
        }
      } catch (e) {
        failed++;
      }
    }

    digest.deliveryStats = {
      sentCount: sent,
      failCount: failed,
      timestamp: new Date().toISOString(),
    };

    return { sent, failed };
  }

  // Process incoming updates (both from Webhook AND Long-Polling)
  public async processRawUpdate(update: any): Promise<void> {
    this.lastUpdateAt = new Date().toISOString();

    // 1. Handle incoming message (User sent text or slash command)
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const from = update.message.from;
      const isGroup = update.message.chat.type === 'group' || update.message.chat.type === 'supergroup';

      console.log(`[Telegram Update Received] Chat ${chatId} (${from?.username || from?.first_name}): "${text}"`);

      // Auto-register subscriber if they interact
      store.addSubscriber({
        chatId,
        type: isGroup ? 'group' : 'private',
        title: update.message.chat.title || from?.first_name || `User_${chatId}`,
        username: from?.username,
        preferredTopics: ['ai', 'cs_infra', 'science', 'pr_contribution'],
      });

      const reply = await this.handleIncomingCommand(chatId, text, {
        username: from?.username,
        firstName: from?.first_name,
        isGroup,
      });

      let replyMarkup = undefined;
      if (reply.buttons && reply.buttons.length > 0) {
        replyMarkup = {
          inline_keyboard: reply.buttons.map(b => [
            b.url ? { text: b.text, url: b.url } : { text: b.text, callback_data: b.callbackData || 'noop' }
          ]),
        };
      }

      await this.sendMessage(chatId, reply.replyText, {
        parseMode: 'Markdown',
        replyMarkup,
      });
    }

    // 2. Handle callback query (inline button clicks)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id || cb.from?.id;
      const data = cb.data;

      console.log(`[Telegram Button Clicked] Chat ${chatId}: ${data}`);

      if (data === 'cmd_brief') {
        const digest = store.getLatestDigest();
        await this.sendMessage(chatId, digest.telegramFormattedText, { parseMode: 'Markdown' });
      } else if (data === 'cmd_contribute') {
        const res = await this.handleIncomingCommand(chatId, '/contribute');
        await this.sendMessage(chatId, res.replyText, { parseMode: 'Markdown' });
      } else if (data === 'cmd_subscribe') {
        const res = await this.handleIncomingCommand(chatId, '/subscribe');
        await this.sendMessage(chatId, res.replyText, { parseMode: 'Markdown' });
      } else if (data === 'cmd_topics') {
        const res = await this.handleIncomingCommand(chatId, '/topics');
        await this.sendMessage(chatId, res.replyText, { parseMode: 'Markdown' });
      } else if (data === 'cmd_force_refresh') {
        await this.sendMessage(chatId, `⚡ 正在透過 Gemini 與開源 API 抓取最新動態中，請稍候...`);
        const fresh = await curateFreshDigest('manual');
        store.addDigest(fresh);
        await this.sendMessage(chatId, `⚡ *已重新即時擷取最新開源情報！*\n\n${fresh.telegramFormattedText}`, { parseMode: 'Markdown' });
      } else if (data?.startsWith('topic_')) {
        await this.sendMessage(chatId, `✅ *已更新你的主題偏好！* 機器人將優先在情報中為你加重該領域的開源專案與 PR 推薦。`, { parseMode: 'Markdown' });
      }

      // Answer callback query so button stops spinning
      await this.callTelegramApi('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: '已處理！',
      });
    }
  }

  // Background Long Polling Worker: Guaranteed to work without public URL or ingress restrictions
  public async startPolling(): Promise<void> {
    if (this.isPolling) return;
    if (!this.hasToken) {
      console.log('[Telegram Poller] No TELEGRAM_BOT_TOKEN found. Polling skipped.');
      return;
    }

    this.isPolling = true;
    console.log('[Telegram Poller] Initializing Long Polling listener...');

    // First delete any previous webhook so getUpdates is allowed by Telegram
    try {
      await this.deleteWebhook();
      console.log('[Telegram Poller] Webhook cleared. Long Polling ready.');
    } catch (e) {
      console.warn('[Telegram Poller] Notice while deleting webhook:', e);
    }

    // Identify self
    const me = await this.getMe();
    if (me.ok) {
      console.log(`[Telegram Poller] Connected successfully as ${me.username}`);
      // Auto-sync Description, Short Description, and Commands Menu to Telegram
      try {
        await this.syncBotProfileAndCommands();
      } catch (e) {
        console.warn('[Telegram Profile Sync Notice]:', e);
      }
    }

    // Polling loop
    (async () => {
      while (this.isPolling && this.hasToken) {
        this.lastPollAt = new Date().toISOString();
        try {
          const body: Record<string, any> = {
            offset: this.lastUpdateId ? this.lastUpdateId + 1 : 0,
            timeout: 20, // 20s long poll
            allowed_updates: ['message', 'callback_query', 'channel_post'],
          };

          const res = await this.callTelegramApi('getUpdates', body);

          if (res.ok && Array.isArray(res.result)) {
            for (const update of res.result) {
              this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
              await this.processRawUpdate(update);
            }
          } else if (!res.ok) {
            // If conflict or error, wait 3 seconds before next cycle
            await new Promise((r) => setTimeout(r, 3000));
          }
        } catch (err: any) {
          console.error('[Telegram Poller Loop Error]:', err.message);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    })();
  }

  public stopPolling(): void {
    this.isPolling = false;
    if (this.pollingAbortController) {
      this.pollingAbortController.abort();
      this.pollingAbortController = null;
    }
  }

  // Process incoming user messages and slash commands
  public async handleIncomingCommand(
    chatId: string | number,
    text: string,
    fromInfo?: { username?: string; firstName?: string; isGroup?: boolean }
  ): Promise<{ replyText: string; buttons?: Array<{ text: string; callbackData?: string; url?: string }> }> {
    const rawCmd = text.trim().split(' ')[0].toLowerCase();
    const cmd = rawCmd.split('@')[0]; // strip bot username e.g. /brief@mybot -> /brief

    if (cmd === '/start') {
      const name = fromInfo?.firstName || '開發者與研究夥伴';
      const welcome = `👋 嗨，*${name}*！歡迎使用 *OpenPulse* 開源與前沿科技情報機器人！

🚀 *這個 Bot 為你做什麼？*
每日於 *早上 08:00* 與 *下午 17:00*，自動為你精煉：
• 🤖 *AI 前沿研究*: 最新開源模型、論文解析 (arXiv, Hugging Face, DeepSeek, vLLM)
• 💻 *資訊與基礎架構*: 高效能分散式系統、編譯器、資料庫、Rust/Go/C++ 生態
• 🔬 *跨學科科學突破*: 生物計算、量子模擬與計算物理
• 🛠️ *【獨家】開源 PR 獵場*: 為你精選熱門專案急需協助的 *Good First Issues*、代碼重構、單元測試或文件貢獻，附上手指南！

📌 *你可以點擊下方按鈕或輸入指令：*
/brief - 立即生成當前最新情報
/contribute - 尋找適合認領的開源 PR / Issue
/subscribe - 訂閱定時推播 (08:00 & 17:00)
/topics - 自訂偏好領域
/status - 檢視機器人運行狀態
/help - 說明手冊`;

      const buttons = [
        { text: '⚡ 立即生成情報 (/brief)', callbackData: 'cmd_brief' },
        { text: '🛠️ 開源 PR 獵場 (/contribute)', callbackData: 'cmd_contribute' },
        { text: '🔔 訂閱每日定時推送', callbackData: 'cmd_subscribe' },
        { text: '⚙️ 偏好領域設定', callbackData: 'cmd_topics' },
      ];

      return { replyText: welcome, buttons };
    }

    if (cmd === '/brief' || cmd === '/today' || cmd === '/news') {
      const digest = store.getLatestDigest();
      return {
        replyText: digest.telegramFormattedText,
        buttons: [
          { text: '🛠️ 僅看開源 PR 獵場', callbackData: 'cmd_contribute' },
          { text: '⚡ 重新手動生成快訊', callbackData: 'cmd_force_refresh' },
          { text: '🌐 在網頁儀表板檢視', url: process.env.APP_URL || 'https://ai.studio' },
        ]
      };
    }

    if (cmd === '/contribute' || cmd === '/prs' || cmd === '/issues') {
      const digest = store.getLatestDigest();
      const prItems = digest.items.filter(i => i.prContribution);

      let textMsg = `🛠️ *【OpenPulse 今日精選開源 PR 與 Issue 獵場】*\n`;
      textMsg += `尋找開源專案貢獻機會？以下是維護者標記為歡迎社群 PR 的熱門專案：\n\n`;

      prItems.forEach((item, idx) => {
        const pr = item.prContribution!;
        textMsg += `🔥 *${idx + 1}. [${pr.repoName}](${pr.repoUrl})* ⭐ ${pr.starsCount || '熱門'}\n`;
        textMsg += `   🏷️ 任務名稱: *${pr.issueOrPrTitle}*\n`;
        textMsg += `   難度等級: \`${pr.difficulty}\` | 主要語言: \`${pr.language}\`\n`;
        textMsg += `   💡 貢獻指南: ${pr.contributionGuide}\n`;
        textMsg += `   🔗 [立即認領並前往 GitHub Issue](${pr.issueOrPrUrl})\n\n`;
      });

      textMsg += `──────────────\n`;
      textMsg += `💡 *貢獻提示:* 請在 PR 前先在 Issue 下留言「I'd like to work on this!」，並遵循專案的 CONTRIBUTING.md 規範。`;

      return {
        replyText: textMsg,
        buttons: [
          { text: '⚡ 檢視完整科技情報', callbackData: 'cmd_brief' },
          { text: '🔔 訂閱定時推播', callbackData: 'cmd_subscribe' },
        ]
      };
    }

    if (cmd === '/subscribe') {
      store.addSubscriber({
        chatId,
        type: fromInfo?.isGroup ? 'group' : 'private',
        title: fromInfo?.firstName || (fromInfo?.isGroup ? '技術群組' : 'Telegram 使用者'),
        username: fromInfo?.username,
        preferredTopics: ['ai', 'cs_infra', 'science', 'pr_contribution'],
      });

      return {
        replyText: `✅ *訂閱成功！*
你已成功加入 *OpenPulse* 每日情報推播清單。
⏰ 每天 *08:00* 與 *17:00* (台北時間)，我們將準時為你推送全球最前沿的開源專案突破與 PR 獵場！

如欲取消訂閱，隨時輸入 /unsubscribe 即可。`,
        buttons: [
          { text: '⚡ 搶先看今日情報', callbackData: 'cmd_brief' },
          { text: '⚙️ 調整推播主題', callbackData: 'cmd_topics' },
        ]
      };
    }

    if (cmd === '/unsubscribe') {
      store.removeSubscriber(chatId);
      return {
        replyText: `🔕 *已取消訂閱*
你將不再自動收到定時推播。你仍可以隨時透過 /brief 或 /contribute 手動查詢開源動態。隨時歡迎再次輸入 /subscribe 重新啟用！`,
        buttons: [
          { text: '🔔 重新訂閱', callbackData: 'cmd_subscribe' },
        ]
      };
    }

    if (cmd === '/topics') {
      return {
        replyText: `⚙️ *【自訂關注領域】*
OpenPulse 目前覆蓋四大核心維度，點擊下方即可切換關注：
1. 🤖 *AI 前沿與開源大模型* (LLM, MoE, Reasoning, VLLM)
2. 💻 *資訊科學與基礎設施* (Rust, Concurrency, Database, OS)
3. 🔬 *跨學科科學運算* (Bioinformatics, Quantum, Physics)
4. 🛠️ *開源 PR / Good First Issue 獵場* (熱門 Issue, 貢獻起步)`,
        buttons: [
          { text: '🤖 AI 前沿研究', callbackData: 'topic_ai' },
          { text: '💻 系統與開源架構', callbackData: 'topic_cs' },
          { text: '🔬 交叉前沿科學', callbackData: 'topic_science' },
          { text: '🛠️ PR 貢獻專區', callbackData: 'topic_pr' },
        ]
      };
    }

    if (cmd === '/status') {
      const status = store.getStatus(this.hasToken, this.botUsername || '', '', true);
      return {
        replyText: `📊 *【OpenPulse 機器人運行狀態】*
• 狀態: 🟢 在線運行中
• 機器人名稱: ${this.botUsername || '未命名'}
• 運行模式: ${this.hasToken ? 'Telegram 實時連線中 (雙向輪詢/Webhook)' : '模擬預覽模式'}
• 定時推播時間: 08:00 & 17:00 (Asia/Taipei)
• 下次預計推播: ${status.nextBroadcastAt}
• 活躍訂閱者總數: *${status.subscribersCount}* (含個人/頻道/群組)
• 歷史推播累計: ${status.totalBroadcasts} 次
• 核心 AI 引擎: Gemini 3.8 Flash & 開源情報感知層`,
        buttons: [
          { text: '⚡ 立即生成最新快訊', callbackData: 'cmd_brief' },
        ]
      };
    }

    if (cmd === '/help') {
      return {
        replyText: `📖 *【OpenPulse 指令指南】*
/start - 啟動機器人並檢視歡迎指南
/brief - 取得最新開源科技與研究情報 (含摘要、亮點與 PR)
/contribute - 專門檢視近期熱門開源專案的 Good First Issue 與 PR 任務
/subscribe - 訂閱每日 08:00 與 17:00 自動推播
/unsubscribe - 取消定時推播
/topics - 設定你感興趣的專業領域
/status - 檢視機器人目前狀態與推播排程

📢 *公開使用方法:*
你可以自由將此機器人加到你的 Telegram 開發者群組、工作團隊或技術頻道，所有人皆可免費享受每日自動整理的科技前沿！`,
        buttons: [
          { text: '⚡ 立即獲取情報', callbackData: 'cmd_brief' },
        ]
      };
    }

    // Default response for other messages
    return {
      replyText: `🤖 收到你的訊息：「${text}」
我是 *OpenPulse* 開源情報機器人。
你可以輸入 /brief 獲取今日開源研究快訊，或輸入 /contribute 尋找可貢獻的 PR/Issue！輸入 /help 可檢視完整指令。`,
      buttons: [
        { text: '⚡ 今日最新情報', callbackData: 'cmd_brief' },
        { text: '🛠️ 開源 PR 獵場', callbackData: 'cmd_contribute' },
      ]
    };
  }
}

export const telegramService = new TelegramService();
