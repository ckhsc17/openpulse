import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, Zap, Cloud, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { DigestViewer } from './components/DigestViewer';
import { BotSimulator } from './components/BotSimulator';
import { SubscribersManager } from './components/SubscribersManager';
import { BotSetupGuide } from './components/BotSetupGuide';
import { BotStatusInfo, DigestReport, Subscriber } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'digest' | 'simulator' | 'subscribers' | 'guide'>('digest');
  const [status, setStatus] = useState<BotStatusInfo | null>(null);
  const [latestDigest, setLatestDigest] = useState<DigestReport | null>(null);
  const [digestHistory, setDigestHistory] = useState<DigestReport[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const [showAlwaysOnGuide, setShowAlwaysOnGuide] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [statusRes, digestsRes, subsRes] = await Promise.all([
        fetch('/api/status').then(r => r.json()),
        fetch('/api/digests').then(r => r.json()),
        fetch('/api/subscribers').then(r => r.json()),
      ]);

      setStatus(statusRes);
      if (digestsRes.latest) {
        setLatestDigest(digestsRes.latest);
      }
      if (digestsRes.history) {
        setDigestHistory(digestsRes.history);
      }
      if (Array.isArray(subsRes)) {
        setSubscribers(subsRes);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Active Heartbeat: Ping /api/status every 25s to keep container warm and polling active
    const timer = setInterval(() => {
      fetch('/api/status')
        .then(r => r.json())
        .then(statusData => {
          setStatus(statusData);
        })
        .catch(() => {});
    }, 25000);

    return () => clearInterval(timer);
  }, []);

  // Manual trigger
  const handleManualTrigger = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/digests/generate', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.digest) {
        setLatestDigest(data.digest);
        setDigestHistory(prev => [data.digest, ...prev.filter(d => d.id !== data.digest.id)]);
        showToast('⚡ 已成功生成最新開源情報並推播至 Telegram 訂閱者！');
        setActiveTab('digest');
      } else {
        showToast('⚠️ 生成失敗，請稍後重試。');
      }
    } catch (err) {
      showToast('⚠️ 發生錯誤，無法完成即時生成。');
    } finally {
      setIsTriggering(false);
      fetch('/api/status').then(r => r.json()).then(setStatus).catch(() => {});
    }
  };

  // Bot command simulator handler
  const handleSimulateCommand = async (command: string) => {
    const res = await fetch('/api/telegram/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: command }),
    });
    return await res.json();
  };

  // Add subscriber
  const handleAddSubscriber = async (chatId: string, title: string, type: 'private' | 'group' | 'channel') => {
    const res = await fetch('/api/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, title, type }),
    });
    const data = await res.json();
    if (data.success) {
      setSubscribers(prev => [data.subscriber, ...prev.filter(s => String(s.chatId) !== String(chatId))]);
      showToast(`✅ 已將 ${title} (${chatId}) 加入廣播清單！`);
    }
  };

  // Test send message
  const handleTestSend = async (chatId: string) => {
    const res = await fetch('/api/telegram/test-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId }),
    });
    return await res.json();
  };

  // Set Webhook
  const handleSetWebhook = async (url?: string) => {
    const res = await fetch('/api/telegram/set-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: url }),
    });
    return await res.json();
  };

  // Reconnect Telegram
  const handleReconnect = async () => {
    const res = await fetch('/api/telegram/reconnect', { method: 'POST' });
    const data = await res.json();
    fetch('/api/status').then(r => r.json()).then(setStatus).catch(() => {});
    return data;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center space-x-2 border border-zinc-700/50 animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        status={status}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onManualTrigger={handleManualTrigger}
        isTriggering={isTriggering}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Webhook Notice Bar */}
        {activeTab !== 'guide' && (
          <div className="space-y-3 mb-6">
            {/* 17:00 troubleshooting banner */}
            <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  📱 <strong>剛才 17:00 手機沒收到推播？</strong> 依 Telegram 安全機制，請先在手機搜尋 <a href="https://t.me/open_pulse_bot" target="_blank" rel="noreferrer" className="font-bold underline text-amber-900 dark:text-amber-100">@open_pulse_bot</a> 點擊 <strong>Start</strong> 發送 <code>/start</code>，以永久登記您的 Telegram 帳號。
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/telegram/catchup-1700', { method: 'POST' });
                      const data = await res.json();
                      if (data.success) {
                        showToast(`🚀 已補發今日 17:00 晚報！已送達 ${data.deliveryStats?.sentCount ?? 0} 人`);
                      } else {
                        showToast(`⚠️ 補發失敗: ${data.error || '未知錯誤'}`);
                      }
                    } catch (e: any) {
                      showToast(`⚠️ 補發出錯: ${e.message}`);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-sm transition"
                >
                  <span>補發 17:00 晚報</span>
                </button>
                <a
                  href="https://t.me/open_pulse_bot"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold flex items-center gap-1 whitespace-nowrap transition"
                >
                  <span>開啟 Telegram</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Always-on / Keep-Alive & Cloud Run Sandbox Status Banner */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      機器人運行狀態：{status?.hasToken ? '🟢 監聽中 (Long Polling Active)' : '🟡 尚未設定 Token'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-medium">
                      心跳保活中 (25s)
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    目前運行於 AI Studio 雲端沙盒。只要保持此分頁開啟，心跳機制將持續維持容器清醒。
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAlwaysOnGuide(true)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-850 hover:bg-emerald-50 dark:hover:bg-zinc-800 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800/80 flex items-center gap-1.5 whitespace-nowrap shadow-sm transition flex-shrink-0"
              >
                <span>💡 為什麼過一陣子會睡著？</span>
              </button>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping flex-shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300">
                  想要將機器人公開發布給群組或頻道？點擊此處進行 <strong>一鍵註冊 Webhook</strong>，即可連接 Telegram 伺服器！
                </span>
              </div>
              <button
                onClick={() => setActiveTab('guide')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-indigo-600/20 transition"
              >
                <span>前往一鍵註冊 Webhook</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-500">正在加載 OpenPulse 開源情報感知核心...</p>
          </div>
        ) : (
          <>
            {activeTab === 'digest' && (
              <DigestViewer
                digest={latestDigest}
                history={digestHistory}
                onSelectReport={(report) => setLatestDigest(report)}
              />
            )}

            {activeTab === 'simulator' && (
              <BotSimulator onSimulateCommand={handleSimulateCommand} />
            )}

            {activeTab === 'subscribers' && (
              <SubscribersManager
                status={status}
                subscribers={subscribers}
                history={digestHistory}
                onAddSubscriber={handleAddSubscriber}
                onTestSend={handleTestSend}
              />
            )}

            {activeTab === 'guide' && (
              <BotSetupGuide
                status={status}
                onSetWebhook={handleSetWebhook}
                onReconnect={handleReconnect}
              />
            )}
          </>
        )}
      </main>

      {/* Always-On & Keep-Alive Modal */}
      {showAlwaysOnGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    為什麼過一陣子機器人會暫停？運行機制說明
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    雲端沙盒生命週期、防休眠心跳與 7x24 永久常駐指南
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAlwaysOnGuide(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 max-h-[75vh] overflow-y-auto">
              {/* Point 1 */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <span>1. 根本原因：雲端預覽沙盒「閒置休眠 (Scale to Zero)」機制</span>
                </h4>
                <p className="leading-relaxed text-amber-950/80 dark:text-amber-200/80 text-xs">
                  目前專案處於 <strong>Google AI Studio 的開發預覽容器</strong>。為節約雲端資源，當瀏覽器分頁關閉、或超過 10~15 分鐘無操作時，<strong>容器會進入休眠 (CPU 暫停)</strong>。
                  在容器休眠期間，記憶體中的 Telegram 長輪詢迴圈與定時排程會被凍結，因此發送 Telegram 訊息會感覺像「死掉了」。只要重新開啟網頁，容器就會被喚醒！
                </p>
              </div>

              {/* Point 2 */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>2. 系統已內建的「自癒與防凍」防護</span>
                </h4>
                <ul className="space-y-1.5 text-xs list-disc list-inside text-emerald-950/80 dark:text-emerald-200/80">
                  <li>
                    <strong>分頁保活心跳（Heartbeat）：</strong>只要你開著這個網頁分頁，系統每 25 秒會自動發送心跳 Ping，容器<strong>絕不休眠</strong>！
                  </li>
                  <li>
                    <strong>30 秒看門狗（Watchdog）：</strong>後端已加入長輪詢逾時偵測（30s），防止 Telegram 連線無故掛死，並自動自癒重連。
                  </li>
                  <li>
                    <strong>重啟自動補發（Catch-up）：</strong>若伺服器在 17:00 剛好在休眠，一旦被喚醒會立即檢測並自動補發今日晚報。
                  </li>
                </ul>
              </div>

              {/* Point 3 */}
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-3">
                <h4 className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-sky-500" />
                  <span>3. 如何達成 7x24 小時 365 天「永久常駐運行」？</span>
                </h4>
                <div className="space-y-2.5 text-xs text-sky-950/80 dark:text-sky-200/80">
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-800/60 border border-sky-200 dark:border-sky-900">
                    <strong className="text-zinc-900 dark:text-zinc-100 block mb-1">
                      方案 A：部署為獨立正式 Cloud Run 服務（推薦）
                    </strong>
                    點擊 AI Studio 頂部右上角的 <strong>Deploy to Cloud Run</strong>，將本專案正式部署。可設定常駐執行個體（<code>min-instances: 1</code>）或切換至 <strong>Webhook</strong>，即使平時休眠省錢，只要 Telegram 有訊息進來，就會被<strong>自動秒級喚醒</strong>！
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-800/60 border border-sky-200 dark:border-sky-900">
                    <strong className="text-zinc-900 dark:text-zinc-100 block mb-1">
                      方案 B：匯出專案至獨立 VPS 或 Docker 伺服器
                    </strong>
                    點擊右上角選單 <strong>Export to GitHub</strong> 或下載 ZIP，在任何 24 小時開機的主機（Linux VPS、Railway、Zeabur 等）執行 <code>npm start</code>，即可長年保持 Long Polling 不中斷。
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>目前心跳保活中 • 伺服器已運行 {status?.serverUptimeSec || 0} 秒</span>
              </div>
              <button
                onClick={() => setShowAlwaysOnGuide(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 text-white dark:text-zinc-900 text-xs font-semibold shadow-sm transition"
              >
                我瞭解了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-6 bg-white/50 dark:bg-zinc-950 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>OpenPulse</strong> • 開源專案、科學與 AI 研究情報機器人
          </div>
          <div>
            每日排程: 08:00 & 17:00 (Asia/Taipei) • 驅動引擎: Google Gemini & Telegram Bot API
          </div>
        </div>
      </footer>
    </div>
  );
}
