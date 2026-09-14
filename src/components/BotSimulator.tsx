import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, ArrowDownCircle, ExternalLink } from 'lucide-react';
import { BotSimulatorMessage } from '../types';

interface BotSimulatorProps {
  onSimulateCommand: (command: string) => Promise<{ replyText: string; buttons?: Array<{ text: string; callbackData?: string; url?: string }> }>;
}

export const BotSimulator: React.FC<BotSimulatorProps> = ({ onSimulateCommand }) => {
  const [messages, setMessages] = useState<BotSimulatorMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: `👋 嗨！我是 *OpenPulse* 開源與科技前沿情報機器人！

每日 *08:00* 與 *17:00* 為你推播全球最新開源專案突破、熱門論文，以及精選的 *Good First Issues / PR 貢獻獵場*！

你可以點擊下方快捷指令，或在對話框直接輸入任何指令進行互動測試：`,
      timestamp: '剛剛',
      buttons: [
        { text: '⚡ 立即生成情報 (/brief)', callbackData: '/brief' },
        { text: '🛠️ 開源 PR 獵場 (/contribute)', callbackData: '/contribute' },
        { text: '🔔 訂閱每日推送 (/subscribe)', callbackData: '/subscribe' },
        { text: '📊 運行狀態 (/status)', callbackData: '/status' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: BotSimulatorMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await onSimulateCommand(text);
      const botMsg: BotSimulatorMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.replyText,
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        buttons: response.buttons?.map(b => ({
          text: b.text,
          callbackData: b.callbackData || b.url || '',
        })),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: '⚠️ 處理訊息時發生錯誤，請稍後重試。',
          timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = (action: string) => {
    if (action.startsWith('http://') || action.startsWith('https://')) {
      window.open(action, '_blank');
      return;
    }
    if (action.startsWith('cmd_')) {
      const cmd = action.replace('cmd_', '/');
      handleSend(cmd);
    } else if (action.startsWith('topic_')) {
      handleSend(`關注主題: ${action.replace('topic_', '')}`);
    } else {
      handleSend(action);
    }
  };

  // Simple clean markdown text renderer for simulation chat
  const renderFormattedText = (raw: string) => {
    // Process markdown headers, bold, code, links
    return raw.split('\n').map((line, idx) => {
      // Bold replace
      let formatted = line;
      return (
        <span key={idx} className="block leading-relaxed">
          {line.length === 0 ? <br /> : line}
        </span>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Simulation Banner */}
      <div className="mb-4 bg-sky-50 dark:bg-sky-950/40 rounded-xl p-4 border border-sky-200 dark:border-sky-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sky-500 text-white">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Telegram 機器人對話環境模擬
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              此處完全模擬 Telegram 核心邏輯。支援所有斜線指令與按鈕回呼，供你在未掛載 Bot Token 前預覽體驗！
            </p>
          </div>
        </div>
        <button
          onClick={() => setMessages(messages.slice(0, 1))}
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
        >
          清空歷史對話
        </button>
      </div>

      {/* Telegram Chat Window */}
      <div className="bg-zinc-100 dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col h-[640px]">
        {/* Chat Header */}
        <div className="bg-sky-600 dark:bg-zinc-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-sky-700 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm flex items-center gap-1.5">
                <span>OpenPulse Bot</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              </div>
              <div className="text-xs text-sky-100 dark:text-zinc-400">
                @OpenPulseNewsBot • 在線中 (bot)
              </div>
            </div>
          </div>
          <div className="text-xs text-sky-200 dark:text-zinc-400">
            08:00 / 17:00 定時廣播
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#0e1621] text-zinc-100">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans ${
                    msg.sender === 'user'
                      ? 'bg-[#2b5278] text-white rounded-tr-none'
                      : 'bg-[#182533] text-zinc-100 rounded-tl-none border border-zinc-700/50 shadow-sm'
                  }`}
                >
                  {renderFormattedText(msg.text)}
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-sky-200/80' : 'text-zinc-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {/* Inline Action Keyboard Buttons */}
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {msg.buttons.map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => handleButtonClick(btn.callbackData)}
                        className="text-xs text-left px-3 py-2 rounded-lg bg-[#242f3d] hover:bg-[#2e3b4d] text-sky-300 font-medium transition border border-zinc-700/60 flex items-center justify-between"
                      >
                        <span className="truncate">{btn.text}</span>
                        {btn.callbackData.startsWith('http') && (
                          <ExternalLink className="w-3 h-3 opacity-70 flex-shrink-0 ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-zinc-400 text-xs">
              <Bot className="w-4 h-4 text-sky-400 animate-bounce" />
              <span>OpenPulse 正在查詢並組織情報中...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Command Suggestions */}
        <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-zinc-500 whitespace-nowrap text-[11px]">快捷指令:</span>
          {['/brief', '/contribute', '/subscribe', '/status', '/topics', '/help'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleSend(cmd)}
              disabled={loading}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-sky-400 font-mono text-xs whitespace-nowrap transition"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center space-x-2"
        >
          <input
            id="bot-sim-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="輸入指令 (例如: /brief, /contribute, /subscribe 或隨意交談)..."
            className="flex-1 bg-zinc-800 border border-zinc-700 text-xs sm:text-sm text-zinc-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500 placeholder-zinc-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
