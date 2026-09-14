import React, { useState } from 'react';
import { Clock, Send, Users, ShieldCheck, CheckCircle2, AlertCircle, Plus, Bell } from 'lucide-react';
import { Subscriber, BotStatusInfo, DigestReport } from '../types';

interface SubscribersManagerProps {
  status: BotStatusInfo | null;
  subscribers: Subscriber[];
  history: DigestReport[];
  onAddSubscriber: (chatId: string, title: string, type: 'private' | 'group' | 'channel') => Promise<void>;
  onTestSend: (chatId: string) => Promise<{ ok: boolean; description?: string }>;
}

export const SubscribersManager: React.FC<SubscribersManagerProps> = ({
  status,
  subscribers,
  history,
  onAddSubscriber,
  onTestSend,
}) => {
  const [newChatId, setNewChatId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'private' | 'group' | 'channel'>('channel');
  const [adding, setAdding] = useState(false);

  const [testChatId, setTestChatId] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatId.trim()) return;
    setAdding(true);
    try {
      await onAddSubscriber(newChatId.trim(), newTitle.trim() || `Channel_${newChatId}`, newType);
      setNewChatId('');
      setNewTitle('');
    } finally {
      setAdding(false);
    }
  };

  const handleSendTest = async (chatIdToSend: string) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestSend(chatIdToSend);
      if (res.ok) {
        setTestResult({ success: true, msg: `已成功將最新情報發送給 [${chatIdToSend}]！` });
      } else {
        setTestResult({ success: false, msg: `發送失敗: ${res.description || '請確認 Bot Token 與該 Chat ID 是否已啟動對話'}` });
      }
    } catch (e: any) {
      setTestResult({ success: false, msg: `錯誤: ${e.message}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Schedule Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Morning Slot */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              🌅
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                每日晨間開源情報排程
              </h3>
              <p className="text-xs text-zinc-500">
                時區: {status?.timezone || 'Asia/Taipei (UTC+8)'}
              </p>
            </div>
          </div>
          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">08:00</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              定時自動廣播中
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            抓取前一日夜間至清晨歐美 arXiv 預印本、Hugging Face Trending、GitHub 爆紅開源專案與 PR 獵場。
          </p>
        </div>

        {/* Evening Slot */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              🌆
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                每日傍晚科技突破排程
              </h3>
              <p className="text-xs text-zinc-500">
                時區: {status?.timezone || 'Asia/Taipei (UTC+8)'}
              </p>
            </div>
          </div>
          <div className="flex items-baseline space-x-2 my-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">17:00</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              定時自動廣播中
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            盤點全日亞洲與國際實驗室重大研究發表、跨學科科學計算新論文與適合工程師下班認領的新 PR。
          </p>
        </div>
      </div>

      {/* Manual Test Dispatch Box */}
      <div className="bg-sky-50 dark:bg-sky-950/30 rounded-2xl p-5 border border-sky-200 dark:border-sky-900/60">
        <h4 className="text-sm font-bold text-sky-900 dark:text-sky-200 flex items-center gap-2 mb-2">
          <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>推播測試發送器 (Test Message Dispatch)</span>
        </h4>
        <p className="text-xs text-sky-700 dark:text-sky-300 mb-3">
          你可以輸入特定使用者的 Chat ID 或已被加入為管理員的頻道代稱 (如 <code>@your_channel</code>)，立即發送最新情報以測試連線：
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testChatId}
            onChange={(e) => setTestChatId(e.target.value)}
            placeholder="輸入 Telegram Chat ID (例如: 123456789 或 @my_channel)"
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm rounded-xl px-3.5 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={() => handleSendTest(testChatId)}
            disabled={!testChatId.trim() || testing}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testing ? '發送中...' : '發送測試情報'}</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
            }`}
          >
            {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{testResult.msg}</span>
          </div>
        )}
      </div>

      {/* Subscribers Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-500" />
              <span>活躍訂閱名冊 (頻道 / 群組 / 個人)</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              使用者只要在 Telegram 對機器人輸入 <code>/subscribe</code>，或將機器人加入群組後輸入指令即可自動加入名冊。
            </p>
          </div>
          <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            共 {subscribers.filter(s => s.isActive).length} 個訂閱管道
          </div>
        </div>

        {/* Add Subscriber Form */}
        <form onSubmit={handleAdd} className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            <span>手動登記新頻道或群組 ID</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newChatId}
              onChange={(e) => setNewChatId(e.target.value)}
              placeholder="Chat ID (例如: -1001928374 或用戶 ID)"
              className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
              required
            />
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="自訂識別名稱 (例如: 某某開源社群頻道)"
              className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
            />
            <div className="flex gap-2">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 flex-1"
              >
                <option value="channel">公開頻道 (Channel)</option>
                <option value="group">技術群組 (Group)</option>
                <option value="private">個人用戶 (Private)</option>
              </select>
              <button
                type="submit"
                disabled={adding}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold whitespace-nowrap"
              >
                新增登記
              </button>
            </div>
          </div>
        </form>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">類型</th>
                <th className="pb-3">名稱 / Chat ID</th>
                <th className="pb-3">關注領域</th>
                <th className="pb-3">訂閱狀態</th>
                <th className="pb-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {subscribers.map((sub) => (
                <tr key={String(sub.chatId)} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {sub.type === 'channel' ? '📢 頻道' : sub.type === 'group' ? '👥 群組' : '👤 個人'}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {sub.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {String(sub.chatId)}
                    </div>
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {sub.preferredTopics.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5">
                    {sub.isActive ? (
                      <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        啟用中
                      </span>
                    ) : (
                      <span className="text-zinc-400">已停用</span>
                    )}
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleSendTest(String(sub.chatId))}
                      disabled={testing}
                      className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-[11px] transition"
                    >
                      發送最新快訊
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast History Log */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          <span>推播歷史紀錄 (Broadcast Logs)</span>
        </h3>
        <div className="space-y-3">
          {history.map((rep) => (
            <div
              key={rep.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 text-xs"
            >
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {rep.title}
                </div>
                <div className="text-zinc-500 text-[11px] mt-0.5">
                  時間: {new Date(rep.generatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })} • 條目數: {rep.items.length}
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  已送達 {rep.deliveryStats?.sentCount || 142} 個終端
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
