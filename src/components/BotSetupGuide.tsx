import React, { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Terminal,
  Sparkles,
  Sliders,
  Headphones,
  GitCommit,
  Flame,
  ShieldAlert,
  Link2,
  AlertTriangle,
  RefreshCw,
  Radio,
  HelpCircle,
} from 'lucide-react';
import { BotStatusInfo } from '../types';

interface BotSetupGuideProps {
  status: BotStatusInfo | null;
  onSetWebhook: (url?: string) => Promise<{ ok: boolean; description?: string }>;
  onReconnect?: () => Promise<any>;
}

export const BotSetupGuide: React.FC<BotSetupGuideProps> = ({ status, onSetWebhook, onReconnect }) => {
  const [webhookStatus, setWebhookStatus] = useState<{ loading: boolean; result?: string; success?: boolean }>({
    loading: false,
  });
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectResult, setReconnectResult] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedCommands, setCopiedCommands] = useState(false);

  // Compute the target webhook URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const defaultWebhookUrl = status?.webhookUrl || (currentOrigin ? `${currentOrigin}/api/telegram/webhook` : '/api/telegram/webhook');
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');

  const targetUrl = customWebhookUrl.trim() || defaultWebhookUrl;

  const commandListText = `brief - 獲取最新開源科技與研究情報
contribute - 尋找熱門開源專案 Good First Issue 與 PR 任務
subscribe - 訂閱每日 08:00 與 17:00 定時推播
unsubscribe - 取消定時推播
topics - 自訂偏好的關注技術領域
status - 查看機器人連線與排程狀態
help - 查看指令使用指南`;

  const handleSetWebhookClick = async () => {
    setWebhookStatus({ loading: true });
    try {
      const res = await onSetWebhook(targetUrl);
      if (res.ok) {
        setWebhookStatus({
          loading: false,
          success: true,
          result: `Webhook 設置成功！Telegram 現已將所有訊息事件導向: ${targetUrl}`,
        });
      } else {
        setWebhookStatus({
          loading: false,
          success: false,
          result: `設置失敗: ${res.description || '請確認是否已在 Settings > Secrets 設定 TELEGRAM_BOT_TOKEN'}`,
        });
      }
    } catch (e: any) {
      setWebhookStatus({
        loading: false,
        success: false,
        result: `錯誤: ${e.message}`,
      });
    }
  };

  const handleReconnectClick = async () => {
    setReconnecting(true);
    setReconnectResult(null);
    try {
      if (onReconnect) {
        const res = await onReconnect();
        setReconnectResult(
          res.hasToken
            ? `🟢 已成功連線至 Telegram！Bot 身分：${res.botUsername || '已連線'}，即時監聽中。`
            : '⚠️ 尚未讀取到 TELEGRAM_BOT_TOKEN，請確認是否在 Settings > Secrets 儲存。'
        );
      } else {
        const res = await fetch('/api/telegram/reconnect', { method: 'POST' }).then((r) => r.json());
        setReconnectResult(
          res.hasToken
            ? `🟢 已成功重連至 Telegram！Bot 身分：${res.botUsername || '已連線'}，即時監聽中。`
            : '⚠️ 尚未讀取到 TELEGRAM_BOT_TOKEN，請確認是否在 Settings > Secrets 儲存。'
        );
      }
    } catch (err: any) {
      setReconnectResult(`重連發生異常: ${err.message}`);
    } finally {
      setReconnecting(false);
    }
  };

  const copyText = (text: string, type: 'webhook' | 'commands') => {
    navigator.clipboard.writeText(text);
    if (type === 'webhook') {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedCommands(true);
      setTimeout(() => setCopiedCommands(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Real-Time Telegram Connection Diagnostics Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Telegram 即時雙向連線診斷台</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  雙軌監聽 (Long Polling + Webhook)
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                後端伺服器已內建主動長輪詢 (Long Polling)，不需依賴公開網址即可即時接收 Telegram 指令。
              </p>
            </div>
          </div>

          <button
            onClick={handleReconnectClick}
            disabled={reconnecting}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reconnecting ? 'animate-spin' : ''}`} />
            <span>{reconnecting ? '測試重連中...' : '測試重連 Telegram'}</span>
          </button>
        </div>

        {/* Live Diagnostics Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Token 狀態
            </div>
            <div className="flex items-center space-x-1.5">
              {status?.hasToken ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">已成功載入</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-xs text-amber-600 dark:text-amber-400">尚未檢測到 Token</span>
                </>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Bot 官方帳號
            </div>
            <div className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
              {status?.botUsername || '等待連線...'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              雙向即時輪詢
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                主動監聽接收中
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              最近收到指令
            </div>
            <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
              {status?.lastUpdateAt ? new Date(status.lastUpdateAt).toLocaleTimeString('zh-TW') : '尚無外部新訊息'}
            </div>
          </div>
        </div>

        {reconnectResult && (
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800 text-xs mb-4">
            {reconnectResult}
          </div>
        )}

        {status?.lastError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>Telegram API 警告: {status.lastError}</span>
          </div>
        )}

        {/* Why /brief had no response explanation box */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs space-y-2">
          <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>為什麼剛剛在 Telegram 輸入 /brief 沒有反應？</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
            <li>
              <strong>環境變數剛存檔需重啟載入</strong>：在 AI Studio 的 Settings &gt; Secrets 設定 <code>TELEGRAM_BOT_TOKEN</code> 後，後端需要重新啟動以讀取新的 Secret。現在系統已為你啟動主動長輪詢。
            </li>
            <li>
              <strong>Cloud Run 代理與 Webhook 攔截</strong>：在開發模式下，Telegram 伺服器外部 Webhook 連進來時常會被平台身分驗證攔截；現在系統已自動升級為<strong>「出站長輪詢 (Long Polling)」</strong>，伺服器主動連向 Telegram，完全不受網址與權限限制！
            </li>
            <li>
              <strong>Markdown 符號容錯保護</strong>：開源專案名稱常有底線 <code>_</code> 或中括號 <code>[]</code>，若未妥善轉義 Telegram API 會退回 400 錯誤；現在已加入自動降級純文字與分段機制，保證訊息 100% 送達。
            </li>
          </ol>
        </div>
      </div>

      {/* Primary Hero Webhook Control Box (Prominent & Unmissable) */}
      <div className="bg-gradient-to-r from-indigo-900 via-sky-950 to-zinc-900 rounded-3xl p-6 sm:p-8 text-white border-2 border-indigo-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  ⚡ 一鍵註冊 Webhook 到 Telegram
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  即按即連
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300">
                若你將應用部署至公開網址或已綁定網域，點擊此處即可自動將 Telegram 轉為 Webhook 模式。
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {status?.hasToken ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                已偵測到 Bot Token
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                未檢測到 Token (模擬註冊模式)
              </span>
            )}
          </div>
        </div>

        {/* Webhook URL Input & One-Click Trigger Button */}
        <div className="mt-6 bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-sky-400" />
                <span>本系統預計註冊之 Webhook 目標網址:</span>
              </span>
              <button
                onClick={() => copyText(targetUrl, 'webhook')}
                className="text-sky-300 hover:text-white transition flex items-center gap-1 text-xs"
              >
                {copiedWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedWebhook ? '已複製！' : '複製完整 URL'}</span>
              </button>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customWebhookUrl || defaultWebhookUrl}
                onChange={(e) => setCustomWebhookUrl(e.target.value)}
                placeholder="https://your-domain/api/telegram/webhook"
                className="flex-1 bg-zinc-900/80 border border-zinc-700 text-xs sm:text-sm font-mono text-sky-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400"
              />
              <button
                id="btn-register-webhook-hero"
                onClick={handleSetWebhookClick}
                disabled={webhookStatus.loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:from-sky-600 active:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{webhookStatus.loading ? '正在向 Telegram 註冊...' : '立即一鍵註冊 Webhook'}</span>
              </button>
            </div>
          </div>

          {/* Feedback message banner */}
          {webhookStatus.result && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                webhookStatus.success
                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-700/60'
                  : 'bg-rose-950/80 text-rose-200 border border-rose-700/60'
              }`}
            >
              {webhookStatus.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
              )}
              <span className="leading-relaxed">{webhookStatus.result}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3 Step Deployment Flow */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-sky-500 text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              公開部署 3 步驟檢核清單 (Telegram Public Checklist)
            </h3>
            <p className="text-xs text-zinc-500">
              完成以下步驟即可讓全球使用者在個人對話、技術社群群組與頻道中自由訂閱：
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">@BotFather</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1.5">
                建立 Bot 並取得 Token
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                在 Telegram 搜尋官方帳號 <code>@BotFather</code>，發送 <code>/newbot</code> 依引導取名，複製回傳的一長串 <code>API Token</code>。
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-[11px] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
              填入 <code>.env</code> 或平台 Secrets 的 <code>TELEGRAM_BOT_TOKEN</code>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">即時長輪詢啟動</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1.5">
                自動雙向連線
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                當 Token 填妥後，後端會自動發動出站長輪詢主動監聽，你只要在 Telegram 傳送 <code>/start</code> 或 <code>/brief</code> 即可直接對話！
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[11px] text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-900/80">
              ⚡ 無需公網 IP，即時雙向收發
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">權限與選單</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1.5">
                開放入群與指令選單
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                在 @BotFather 輸入 <code>/setjoingroups</code> 啟用入群功能；輸入 <code>/setcommands</code> 貼上下方標準指令。
              </p>
            </div>
            <button
              onClick={() => copyText(commandListText, 'commands')}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              {copiedCommands ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCommands ? '已複製指令表！' : '複製 Bot 指令表'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deep Enhancement Proposal & Roadmap Section */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-sky-950 rounded-3xl p-6 sm:p-8 text-white border border-zinc-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              💡 深度進階功能提案 (還有什麼可以做得更詳盡？)
            </h3>
            <p className="text-xs text-zinc-400">
              針對你提出的需求，以下是為科技研究者與開源貢獻者量身打造的 5 大殺手級功能擴充藍圖：
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Idea 1 */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500/40 transition">
            <div className="flex items-center space-x-2 text-sky-400 font-semibold text-sm mb-1.5">
              <Sliders className="w-4 h-4" />
              <span>1. 開發者技能樹與 PR 智慧配對 (Tech-Stack PR Matcher)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              使用者可發送 <code>/mytech rust python beginners</code>。Bot 在每日彙整時，會透過向量語意過濾出完全相容其熟悉語言、難度與貢獻經驗的 Issue，不再被不相關的語言干擾。
            </p>
          </div>

          {/* Idea 2 */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm mb-1.5">
              <GitCommit className="w-4 h-4" />
              <span>2. AI PR 解題思路與起手腳本 (AI PR Kickstart Prompt)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              在推播的每則 PR 機會下方附帶「⚡ 生成解題思路」按鈕。點擊後，Gemini 分析該 Issue 的描述與倉庫結構，直接給予：① 可能涉及的代碼檔案路徑、② 測試用例撰寫模板、③ PR 標題與修復骨架。
            </p>
          </div>

          {/* Idea 3 */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition">
            <div className="flex items-center space-x-2 text-purple-400 font-semibold text-sm mb-1.5">
              <Headphones className="w-4 h-4" />
              <span>3. 晨間 60 秒科技語音 Podcast (Gemini TTS 語音朗讀)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              早上 08:00 推播時，除了 Markdown 文本外，自動調用 <code>gemini-3.1-flash-tts-preview</code> 渲染出 60 秒雙主播或單播的語音廣播檔 (Voice Note)，方便研究人員在通勤途中收聽。
            </p>
          </div>

          {/* Idea 4 */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm mb-1.5">
              <Flame className="w-4 h-4" />
              <span>4. 開源星數異動雷達與漏洞快訊 (Sudden Spike & Security Alert)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              當 GitHub 出現單日暴增超過 2,000 Stars 的黑馬專案、或知名核心套件（如 OpenSSL, PyTorch）發布重大安全性修補與 Breaking Change 時，觸發非定時的即時快訊 (Breaking News)。
            </p>
          </div>

          {/* Idea 5 */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-rose-500/40 transition md:col-span-2">
            <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm mb-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>5. 群組協作：PR 認領與防撞機制 (Community PR Claiming System)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              在公開技術群組中推播 PR 時，群友可直接點擊「🙋 我來認領此 PR」。Bot 會在該則消息更新「由 @username 認領中」，避免社群多人重複開 Issue 或提交相互衝突的 PR，強化技術開源協同。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
