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
  MessageSquare,
  Compass,
  Layers,
  FileText,
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
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; result?: string; success?: boolean }>({
    loading: false,
  });
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedCommands, setCopiedCommands] = useState(false);
  const [copiedDescription, setCopiedDescription] = useState(false);
  const [copiedAbout, setCopiedAbout] = useState(false);

  // Compute target webhook URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const defaultWebhookUrl = status?.webhookUrl || (currentOrigin ? `${currentOrigin}/api/telegram/webhook` : '/api/telegram/webhook');
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');

  const targetUrl = customWebhookUrl.trim() || defaultWebhookUrl;

  const botDescriptionText = `🚀 歡迎使用 OpenPulse！
專為工程師、開源愛好者與前沿研究員打造的情報與 PR 獵場機器人。

每日 08:00 與 17:00 自動為你精煉：
• 🤖 AI 前沿突破與開源模型 (arXiv, Hugging Face, vLLM, DeepSeek)
• 💻 基礎架構、高效能編譯器與資料庫 (Rust, Go, C++, Linux)
• 🔬 跨學科計算科學 (生醫演算法, 量子模擬)
• 🛠️ 【獨家】精選開源專案 Good First Issue 與 PR 認領獵場

點擊下方「Start」按鈕或輸入 /brief 立即獲取最新情報！`;

  const botAboutText = `⚡ OpenPulse: 每日 08:00 & 17:00 開源科技情報、前沿 AI 研究與 GitHub PR 獵場機器人！`;

  const commandListText = `brief - ⚡ 立即生成最新開源研究情報
contribute - 🛠️ 尋找熱門專案 Good First Issue 與 PR 獵場
subscribe - 🔔 訂閱每日 08:00 與 17:00 定時推播
unsubscribe - 🔕 取消定時推播
topics - ⚙️ 自訂感興趣的專業技術領域
status - 📊 檢視機器人運行狀態與排程
help - 📖 檢視完整指令說明手冊`;

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

  const handleSyncProfileClick = async () => {
    setSyncStatus({ loading: true });
    try {
      const res = await fetch('/api/telegram/sync-profile', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setSyncStatus({
          loading: false,
          success: true,
          result: '🎉 同步成功！已為你的 Telegram 機器人配置「What can this bot do?」介紹氣泡、資料卡簡介與 [Menu] 指令選單！',
        });
      } else {
        setSyncStatus({
          loading: false,
          success: false,
          result: `同步失敗: ${data.error || data.results?.error || '請確認 TELEGRAM_BOT_TOKEN 是否正確。'}`,
        });
      }
    } catch (err: any) {
      setSyncStatus({
        loading: false,
        success: false,
        result: `發生錯誤: ${err.message}`,
      });
    }
  };

  const copyText = (text: string, type: 'webhook' | 'commands' | 'description' | 'about') => {
    navigator.clipboard.writeText(text);
    if (type === 'webhook') {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else if (type === 'commands') {
      setCopiedCommands(true);
      setTimeout(() => setCopiedCommands(false), 2000);
    } else if (type === 'description') {
      setCopiedDescription(true);
      setTimeout(() => setCopiedDescription(false), 2000);
    } else if (type === 'about') {
      setCopiedAbout(true);
      setTimeout(() => setCopiedAbout(false), 2000);
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleReconnectClick}
              disabled={reconnecting}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reconnecting ? 'animate-spin' : ''}`} />
              <span>{reconnecting ? '測試重連中...' : '測試重連 Telegram'}</span>
            </button>
          </div>
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
      </div>

      {/* NEW: Telegram Greeting & Bubbles Showcase & One-Click Sync */}
      <div className="bg-gradient-to-br from-zinc-900 via-sky-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border-2 border-sky-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  💬 Telegram 機器人引導氣泡與選單設定
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-400/20 text-sky-300 border border-sky-400/30">
                  體驗優化
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300">
                讓任何人第一次點進 Telegram 機器人時，就能看到專業的「功能介紹氣泡」與底部的「[Menu] 指令快捷選單」。
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncProfileClick}
            disabled={syncStatus.loading || !status?.hasToken}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{syncStatus.loading ? '正在同步至 Telegram...' : '⚡ 一鍵向 Telegram 官方同步介紹氣泡與選單'}</span>
          </button>
        </div>

        {syncStatus.result && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 mb-6 ${
              syncStatus.success
                ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-700/60'
                : 'bg-rose-950/90 text-rose-200 border border-rose-700/60'
            }`}
          >
            {syncStatus.success ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
            )}
            <span className="leading-relaxed">{syncStatus.result}</span>
          </div>
        )}

        {/* 3 Visual Bubbles Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: What can this bot do */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>① 點擊 Start 前的介紹氣泡</span>
                </span>
                <button
                  onClick={() => copyText(botDescriptionText, 'description')}
                  className="text-zinc-400 hover:text-white text-[11px] flex items-center gap-1"
                >
                  {copiedDescription ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDescription ? '已複製' : '複製'}</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-700/60 text-[11px] font-mono leading-relaxed text-zinc-300 whitespace-pre-line">
                {botDescriptionText}
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              這是 Telegram 原生展示在空白聊天室正中間的「What can this bot do?」卡片，使用者尚未點擊 Start 就會看見。
            </p>
          </div>

          {/* Card 2: Interactive Greeting Bubble on /start */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>② 點擊 Start 後的歡迎氣泡</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  程式自動回覆
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-700/60 text-[11px] space-y-2">
                <p className="text-zinc-200">
                  👋 嗨！歡迎使用 <strong>OpenPulse</strong> 開源與前沿科技情報機器人！每日 08:00 與 17:00 自動精煉前沿突破與 PR 獵場。
                </p>
                <div className="grid grid-cols-2 gap-1 pt-1">
                  <div className="p-1.5 rounded-lg bg-indigo-600/40 text-center text-[10px] font-semibold text-indigo-200 border border-indigo-500/30">
                    ⚡ 生成情報 (/brief)
                  </div>
                  <div className="p-1.5 rounded-lg bg-indigo-600/40 text-center text-[10px] font-semibold text-indigo-200 border border-indigo-500/30">
                    🛠️ PR 獵場 (/contribute)
                  </div>
                  <div className="p-1.5 rounded-lg bg-indigo-600/40 text-center text-[10px] font-semibold text-indigo-200 border border-indigo-500/30">
                    🔔 訂閱每日定時推送
                  </div>
                  <div className="p-1.5 rounded-lg bg-indigo-600/40 text-center text-[10px] font-semibold text-indigo-200 border border-indigo-500/30">
                    ⚙️ 偏好領域設定
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              使用者點擊「Start」按鈕後立即收到的圖文氣泡，下方帶有 4 個即時 Inline 按鈕，點擊立即反應。
            </p>
          </div>

          {/* Card 3: [Menu] Commands */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>③ 輸入框常駐 [Menu] 選單</span>
                </span>
                <button
                  onClick={() => copyText(commandListText, 'commands')}
                  className="text-zinc-400 hover:text-white text-[11px] flex items-center gap-1"
                >
                  {copiedCommands ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCommands ? '已複製' : '複製'}</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-700/60 text-[11px] font-mono leading-relaxed text-zinc-300 whitespace-pre-line">
                {commandListText}
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Telegram 輸入框左側的藍色按鈕。點開後列出所有指令說明，完全不需手動輸入斜線指令！
            </p>
          </div>
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
                  ⚡ 備援：一鍵註冊 Webhook 到 Telegram
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  選用
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300">
                若你未來將應用部署至固定公開網域名稱，可在此一鍵註冊 Webhook；目前主動長輪詢已可直接運作。
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
                <span>{webhookStatus.loading ? '正在向 Telegram 註冊...' : '立即註冊 Webhook'}</span>
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
              公開部署與群組使用指南 (Telegram Public Checklist)
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
                當 Token 填妥後，後端會自動發動出站長輪詢主動監聽，並自動同步氣泡與選單，傳送 <code>/start</code> 或 <code>/brief</code> 即可直接對話！
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
                <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">邀請入群與廣播</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1.5">
                群組協作與廣播
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                在 @BotFather 輸入 <code>/setjoingroups</code> 啟用入群功能；把機器人邀請加入你的技術群組輸入 <code>/subscribe</code> 即可全群共享。
              </p>
            </div>
            <button
              onClick={() => copyText(botAboutText, 'about')}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              {copiedAbout ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAbout ? '已複製簡介！' : '複製 Bot 簡介與分享文案'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
