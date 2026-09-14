import { store } from './store';
import { curateFreshDigest } from './curator';
import { telegramService } from './telegram';
import { DigestReport } from '../src/types';

class Scheduler {
  private timer: NodeJS.Timeout | null = null;
  private lastTriggeredMinute: string = '';
  private timezone: string = process.env.TIMEZONE || 'Asia/Taipei';

  public start(): void {
    if (this.timer) return;
    console.log(`[Scheduler] Initialized daily cron monitor for 08:00 & 17:00 (${this.timezone})`);

    // Check every 30 seconds
    this.timer = setInterval(() => {
      this.checkTime();
    }, 30000);

    // Initial check
    this.checkTime();
  }

  private getTimeInZone(): { hour: number; minute: number; minuteKey: string } {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
    const hour = parseInt(getPart('hour'), 10);
    const minute = parseInt(getPart('minute'), 10);
    const minuteKey = `${getPart('year')}-${getPart('month')}-${getPart('day')} ${hour}:${minute}`;

    return { hour, minute, minuteKey };
  }

  private async checkTime(): Promise<void> {
    try {
      const { hour, minute, minuteKey } = this.getTimeInZone();

      // Prevent duplicate triggers within the same minute
      if (this.lastTriggeredMinute === minuteKey) return;

      // Check for 08:00
      if (hour === 8 && minute === 0) {
        this.lastTriggeredMinute = minuteKey;
        console.log(`[Scheduler] ⏰ Morning 08:00 trigger reached! Curating and broadcasting...`);
        await this.runScheduledDigest('scheduled_morning');
      }
      // Check for 17:00
      else if (hour === 17 && minute === 0) {
        this.lastTriggeredMinute = minuteKey;
        console.log(`[Scheduler] ⏰ Evening 17:00 trigger reached! Curating and broadcasting...`);
        await this.runScheduledDigest('scheduled_evening');
      }
    } catch (err) {
      console.error('[Scheduler] Error checking time:', err);
    }
  }

  public async runScheduledDigest(triggerType: 'scheduled_morning' | 'scheduled_evening' | 'manual'): Promise<DigestReport> {
    console.log(`[Scheduler] Curating digest with type: ${triggerType}`);
    const digest = await curateFreshDigest(triggerType);
    store.addDigest(digest);

    // Broadcast to Telegram
    const { sent, failed } = await telegramService.broadcastDigest(digest);
    console.log(`[Scheduler] Broadcast finished: ${sent} sent, ${failed} failed`);

    return digest;
  }
}

export const scheduler = new Scheduler();
