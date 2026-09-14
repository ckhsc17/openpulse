import React, { useState, useEffect } from 'react';
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
          <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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
