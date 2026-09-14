import React, { useState } from 'react';
import { ExternalLink, GitPullRequest, Star, Sparkles, Tag, ChevronRight, Copy, Check, MessageSquareCode } from 'lucide-react';
import { DigestReport, IntelligenceItem, CategoryType } from '../types';

interface DigestViewerProps {
  digest: DigestReport | null;
  history: DigestReport[];
  onSelectReport: (report: DigestReport) => void;
}

export const DigestViewer: React.FC<DigestViewerProps> = ({
  digest,
  history,
  onSelectReport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [showRawTelegram, setShowRawTelegram] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!digest) {
    return (
      <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-500">尚未載入情報，請點擊上方按鈕立即生成。</p>
      </div>
    );
  }

  const filteredItems = selectedCategory === 'all'
    ? digest.items
    : digest.items.filter(item => {
        if (selectedCategory === 'pr_contribution') {
          return item.prContribution !== undefined || item.category === 'pr_contribution';
        }
        return item.category === selectedCategory;
      });

  const prCount = digest.items.filter(i => i.prContribution).length;

  const handleCopyTelegramText = () => {
    navigator.clipboard.writeText(digest.telegramFormattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryBadge = (cat: CategoryType) => {
    switch (cat) {
      case 'ai':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">🤖 AI 研究與模型</span>;
      case 'cs_infra':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">💻 資訊與核心架構</span>;
      case 'science':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">🔬 交叉前沿科學</span>;
      case 'pr_contribution':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">🛠️ PR 貢獻獵場</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Digest Header Card */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-zinc-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-sky-800/40">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30">
              {digest.triggerType === 'scheduled_morning' ? '🌅 晨間定時推播 (08:00)' : digest.triggerType === 'scheduled_evening' ? '🌆 傍晚定時推播 (17:00)' : '⚡ 手動即時快訊'}
            </span>
            <span className="text-xs text-sky-200/80">
              產生時間: {new Date(digest.generatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {history.length > 1 && (
              <select
                className="bg-black/40 text-xs text-sky-100 rounded-lg px-2.5 py-1.5 border border-white/10 focus:outline-none"
                value={digest.id}
                onChange={(e) => {
                  const found = history.find(h => h.id === e.target.value);
                  if (found) onSelectReport(found);
                }}
              >
                {history.map(h => (
                  <option key={h.id} value={h.id} className="bg-zinc-900 text-white">
                    {h.title} ({new Date(h.generatedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowRawTelegram(!showRawTelegram)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition border border-white/15"
            >
              <MessageSquareCode className="w-3.5 h-3.5" />
              <span>{showRawTelegram ? '收合 Telegram 訊息' : '檢視 Telegram 推播文本'}</span>
            </button>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3">
          {digest.title}
        </h2>

        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-4xl">
          {digest.headlineSummary}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4 pt-4 border-t border-white/10 text-xs text-zinc-300">
          <div className="flex items-center space-x-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>精選開源情報: <strong>{digest.items.length}</strong> 則</span>
          </div>
          <div className="flex items-center space-x-1">
            <GitPullRequest className="w-4 h-4 text-emerald-400" />
            <span>開放 PR / Issue 機會: <strong>{prCount}</strong> 個</span>
          </div>
          {digest.deliveryStats && (
            <div className="flex items-center space-x-1 text-sky-300">
              <span>已向 <strong>{digest.deliveryStats.sentCount}</strong> 個訂閱管道送出</span>
            </div>
          )}
        </div>
      </div>

      {/* Raw Telegram Format Viewer Collapsible */}
      {showRawTelegram && (
        <div className="p-4 sm:p-6 bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-100 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <h3 className="text-sm font-semibold text-zinc-200">
                Telegram 實際接收之 Markdown 訊息樣式預覽
              </h3>
            </div>
            <button
              onClick={handleCopyTelegramText}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已複製！' : '複製內容'}</span>
            </button>
          </div>
          <pre className="bg-black/60 p-4 rounded-xl text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto border border-zinc-800">
            {digest.telegramFormattedText}
          </pre>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            selectedCategory === 'all'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
          }`}
        >
          全部項目 ({digest.items.length})
        </button>
        <button
          onClick={() => setSelectedCategory('ai')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            selectedCategory === 'ai'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
          }`}
        >
          🤖 AI 前沿研究
        </button>
        <button
          onClick={() => setSelectedCategory('cs_infra')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            selectedCategory === 'cs_infra'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
          }`}
        >
          💻 系統與架構
        </button>
        <button
          onClick={() => setSelectedCategory('science')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            selectedCategory === 'science'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
          }`}
        >
          🔬 交叉前沿科學
        </button>
        <button
          onClick={() => setSelectedCategory('pr_contribution')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            selectedCategory === 'pr_contribution'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
          }`}
        >
          🛠️ 開源 PR 獵場 ({prCount})
        </button>
      </div>

      {/* Item Cards List */}
      <div className="grid grid-cols-1 gap-5">
        {filteredItems.map((item) => (
          <article
            key={item.id}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                {getCategoryBadge(item.category)}
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {item.source}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>影響力評分: {item.impactScore}/10</span>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-600 dark:hover:text-sky-400 transition inline-flex items-center gap-1.5"
              >
                <span>{item.title}</span>
                <ExternalLink className="w-4 h-4 opacity-60 flex-shrink-0" />
              </a>
            </h3>

            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
              {item.summary}
            </p>

            {/* Key Technical Highlights */}
            <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-xl p-3.5 border border-zinc-100 dark:border-zinc-800 mb-4">
              <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>核心架構與亮點分析:</span>
              </h4>
              <ul className="space-y-1.5">
                {item.keyHighlights.map((hl, i) => (
                  <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                    <span className="text-sky-500 font-bold mt-0.5">•</span>
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* PR / Issue Contribution Section if available */}
            {item.prContribution && (
              <div className="bg-rose-50/70 dark:bg-rose-950/30 rounded-xl p-4 border border-rose-200 dark:border-rose-900/60 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-rose-500 text-white">
                      <GitPullRequest className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      開源貢獻機會: {item.prContribution.repoName}
                    </span>
                    {item.prContribution.starsCount && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        ⭐ {item.prContribution.starsCount}
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                    {item.prContribution.difficulty}
                  </span>
                </div>

                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                  📌 認領任務: {item.prContribution.issueOrPrTitle}
                </p>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                  💡 <strong>新手指南:</strong> {item.prContribution.contributionGuide}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
                  <div className="flex items-center space-x-1 text-xs text-zinc-500">
                    <span>主要語言:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">{item.prContribution.language}</strong>
                  </div>
                  <a
                    href={item.prContribution.issueOrPrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
                  >
                    <span>前往 GitHub Issue / 認領</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                >
                  <Tag className="w-3 h-3 opacity-60" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
