import fs from 'fs';
import path from 'path';
import { store } from './store';
import { curateFreshDigest } from './curator';
import { telegramService } from './telegram';
import { DigestReport } from '../src/types';

interface SchedulerState {
  lastMorningDate?: string;
  lastEveningDate?: string;
  lastRunAt?: string;
}

const SCHEDULER_STATE_FILE = path.join(process.cwd(), 'data_scheduler_state.json');

class Scheduler {
  private timer: NodeJS.Timeout | null = null;
  private timezone: string = (process.env.TIMEZONE || 'Asia/Taipei').replace(/^["']|["']$/g, '').trim() || 'Asia/Taipei';
  private state: SchedulerState = {};

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      if (fs.existsSync(SCHEDULER_STATE_FILE)) {
        const raw = fs.readFileSync(SCHEDULER_STATE_FILE, 'utf-8');
        this.state = JSON.parse(raw);
        console.log('[Scheduler] Loaded persistent state:', this.state);
      }
    } catch (e) {
      console.warn('[Scheduler] Could not read state file, using empty state:', e);
    }
  }

  private saveState(): void {
    try {
      fs.writeFileSync(SCHEDULER_STATE_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Scheduler] Failed to save state file:', e);
    }
  }

  public start(): void {
    if (this.timer) return;
    console.log(`[Scheduler] Initialized daily cron monitor for 08:00 & 17:00 (${this.timezone})`);

    // Check every 30 seconds
    this.timer = setInterval(() => {
      this.checkTime();
    }, 30000);

    // Initial check on boot
    this.checkTime();
  }

  private getZoneTime(): { dateKey: string; hour: number; minute: number } {
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
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = parseInt(getPart('hour'), 10);
    const minute = parseInt(getPart('minute'), 10);
    const dateKey = `${year}-${month}-${day}`;

    return { dateKey, hour, minute };
  }

  private async checkTime(): Promise<void> {
    try {
      const { dateKey, hour, minute } = this.getZoneTime();

      // Morning Window: Trigger at 08:00 (or on first boot if between 08:00 and 16:59 and not yet sent today)
      if (hour >= 8 && hour < 17) {
        if (this.state.lastMorningDate !== dateKey) {
          this.state.lastMorningDate = dateKey;
          this.state.lastRunAt = new Date().toISOString();
          this.saveState();
          console.log(`[Scheduler] ⏰ Morning 08:00 trigger executed for ${dateKey} (current time: ${hour}:${minute})!`);
          await this.runScheduledDigest('scheduled_morning');
        }
      }

      // Evening Window: Trigger at 17:00 (or on first boot if hour >= 17 and not yet sent today)
      else if (hour >= 17) {
        if (this.state.lastEveningDate !== dateKey) {
          this.state.lastEveningDate = dateKey;
          this.state.lastRunAt = new Date().toISOString();
          this.saveState();
          console.log(`[Scheduler] ⏰ Evening 17:00 trigger executed for ${dateKey} (current time: ${hour}:${minute})!`);
          await this.runScheduledDigest('scheduled_evening');
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error in checkTime:', err);
    }
  }

  public getState(): SchedulerState & { timezone: string; currentTime: string } {
    const { dateKey, hour, minute } = this.getZoneTime();
    return {
      ...this.state,
      timezone: this.timezone,
      currentTime: `${dateKey} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    };
  }

  public async forceRun(triggerType: 'scheduled_morning' | 'scheduled_evening' | 'manual'): Promise<DigestReport> {
    const { dateKey } = this.getZoneTime();
    if (triggerType === 'scheduled_morning') {
      this.state.lastMorningDate = dateKey;
    } else if (triggerType === 'scheduled_evening') {
      this.state.lastEveningDate = dateKey;
    }
    this.state.lastRunAt = new Date().toISOString();
    this.saveState();
    return this.runScheduledDigest(triggerType);
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
