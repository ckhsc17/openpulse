import React from 'react';
import { Bot, Sparkles, Clock, RefreshCw, Send, Radio, Zap } from 'lucide-react';
import { BotStatusInfo } from '../types';

interface HeaderProps {
  status: BotStatusInfo | null;
  activeTab: 'digest' | 'simulator' | 'subscribers' | 'guide';
  setActiveTab: (tab: 'digest' | 'simulator' | 'subscribers' | 'guide') => void;
  onManualTrigger: () => void;
  isTriggering: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  activeTab,
  setActiveTab,
  onManualTrigger,
  isTriggering,
}) => {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  OpenPulse
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Telegram Bot
                </span>
                {status?.hasToken ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                    已連線正式 Bot
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Radio className="w-3 h-3 mr-1" />
                    模擬與預覽模式
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                每日 08:00 & 17:00 定時彙整資訊・科學・AI 研究開源突破與 PR 貢獻獵場
              </p>
            </div>
          </div>

          {/* Quick Schedule Pill & Action Trigger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              id="btn-goto-webhook"
              onClick={() => setActiveTab('guide')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition shadow-sm"
              title="前往一鍵註冊 Webhook"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-500 fill-current" />
              <span>一鍵註冊 Webhook</span>
            </button>

            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span>下次定時:</span>
              <strong className="text-zinc-900 dark:text-zinc-100">
                {status?.nextBroadcastAt || '08:00 / 17:00'}
              </strong>
            </div>

            <button
              id="btn-manual-trigger"
              onClick={onManualTrigger}
              disabled={isTriggering}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition shadow-sm ${
                isTriggering
                  ? 'bg-sky-400 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 shadow-sky-600/20'
              }`}
              title="立即整理並發送最新情報至所有訂閱者"
            >
              {isTriggering ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI 整理中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>手動立即生成</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-zinc-100 dark:border-zinc-800/80 -mb-px overflow-x-auto">
          <button
            id="nav-tab-digest"
            onClick={() => setActiveTab('digest')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === 'digest'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            📰 即時情報閱覽室
          </button>
          <button
            id="nav-tab-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === 'simulator'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            💬 Telegram 機器人互動測試器
          </button>
          <button
            id="nav-tab-subscribers"
            onClick={() => setActiveTab('subscribers')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === 'subscribers'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            👥 訂閱群組與排程 (08:00 & 17:00)
          </button>
          <button
            id="nav-tab-guide"
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <span>⚡ 一鍵註冊 Webhook 與公開上線</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
              Webhook
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
