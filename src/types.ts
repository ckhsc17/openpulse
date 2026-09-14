export type CategoryType = 'ai' | 'cs_infra' | 'science' | 'pr_contribution';

export interface PRContributionInfo {
  repoName: string;
  repoUrl: string;
  issueOrPrTitle: string;
  issueOrPrUrl: string;
  difficulty: '初學者 (Good First Issue)' | '中等 (Intermediate)' | '進階 (Advanced)';
  language: string;
  tags: string[];
  contributionGuide: string;
  starsCount?: string;
}

export interface IntelligenceItem {
  id: string;
  category: CategoryType;
  title: string;
  source: string;
  url: string;
  summary: string;
  keyHighlights: string[];
  impactScore: number; // 1 - 10
  tags: string[];
  publishedAt: string;
  prContribution?: PRContributionInfo;
}

export interface DigestReport {
  id: string;
  title: string;
  generatedAt: string;
  triggerType: 'scheduled_morning' | 'scheduled_evening' | 'manual';
  headlineSummary: string;
  items: IntelligenceItem[];
  telegramFormattedText: string;
  deliveryStats?: {
    sentCount: number;
    failCount: number;
    timestamp: string;
  };
}

export interface Subscriber {
  chatId: string | number;
  type: 'private' | 'group' | 'channel';
  title: string;
  username?: string;
  subscribedAt: string;
  preferredTopics: CategoryType[];
  isActive: boolean;
}

export interface BotStatusInfo {
  hasToken: boolean;
  botUsername: string;
  webhookUrl: string;
  webhookActive: boolean;
  scheduleMorning: string;
  scheduleEvening: string;
  timezone: string;
  subscribersCount: number;
  totalBroadcasts: number;
  lastBroadcastAt: string | null;
  nextBroadcastAt: string;
  isSimulated: boolean;
  lastPollAt?: string | null;
  lastUpdateAt?: string | null;
  lastError?: string | null;
}

export interface BotSimulatorMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  buttons?: Array<{ text: string; callbackData: string }>;
}
