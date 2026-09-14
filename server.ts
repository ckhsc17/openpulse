import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store';
import { telegramService } from './server/telegram';
import { scheduler } from './server/scheduler';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Start background scheduler for 08:00 & 17:00
  scheduler.start();

  // Start background Telegram Long Polling (ensures immediate bidirectional messages without ingress issues)
  telegramService.startPolling();

  // API Routes

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Bot Status & Info with Live Telegram Diagnostics
  app.get('/api/status', async (req, res) => {
    const me = await telegramService.getMe();
    const appUrl = process.env.APP_URL || '';
    const webhookUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/api/telegram/webhook` : '';
    const status = store.getStatus(telegramService.hasToken, me.username, webhookUrl, telegramService.hasToken);
    res.json({
      ...status,
      lastPollAt: telegramService.lastPollAt,
      lastUpdateAt: telegramService.lastUpdateAt,
      lastError: telegramService.lastError,
      botUsername: telegramService.botUsername,
    });
  });

  // Telegram In-Depth Diagnostics
  app.get('/api/telegram/diagnostics', async (req, res) => {
    const me = await telegramService.getMe();
    const webhookInfo = await telegramService.getWebhookInfo();
    res.json({
      hasToken: telegramService.hasToken,
      tokenPreview: telegramService.hasToken ? `${telegramService.token.slice(0, 6)}...${telegramService.token.slice(-4)}` : 'NOT_SET',
      botProfile: me,
      webhookInfo,
      lastPollAt: telegramService.lastPollAt,
      lastUpdateAt: telegramService.lastUpdateAt,
      lastError: telegramService.lastError,
    });
  });

  // Get Digests
  app.get('/api/digests', (req, res) => {
    res.json({
      latest: store.getLatestDigest(),
      history: store.getDigests(),
    });
  });

  // Manually Trigger Intelligence Curation & Broadcast
  app.post('/api/digests/generate', async (req, res) => {
    try {
      const digest = await scheduler.runScheduledDigest('manual');
      res.json({ success: true, digest });
    } catch (err: any) {
      console.error('Manual generation failed:', err);
      res.status(500).json({ error: err.message || 'Generation failed' });
    }
  });

  // List Subscribers
  app.get('/api/subscribers', (req, res) => {
    res.json(store.getSubscribers());
  });

  // Add / Toggle Subscriber
  app.post('/api/subscribers', (req, res) => {
    const { chatId, title, username, type } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }
    const sub = store.addSubscriber({
      chatId,
      type: type || 'private',
      title: title || `User_${chatId}`,
      username: username || '',
      preferredTopics: ['ai', 'cs_infra', 'science', 'pr_contribution'],
    });
    res.json({ success: true, subscriber: sub });
  });

  // Telegram Simulator for browser testing
  app.post('/api/telegram/simulate', async (req, res) => {
    const { message, chatId } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    const cid = chatId || 'web-sim-user';
    const result = await telegramService.handleIncomingCommand(cid, message, {
      firstName: 'Web Tester',
      username: 'web_tester',
      isGroup: false,
    });
    res.json(result);
  });

  // Set Telegram Webhook
  app.post('/api/telegram/set-webhook', async (req, res) => {
    const appUrl = process.env.APP_URL || '';
    const defaultWebhook = appUrl ? `${appUrl.replace(/\/$/, '')}/api/telegram/webhook` : '';
    const targetUrl = req.body.webhookUrl || defaultWebhook;

    if (!targetUrl) {
      return res.status(400).json({ error: 'APP_URL or webhookUrl is required' });
    }

    const result = await telegramService.setWebhook(targetUrl, process.env.TELEGRAM_WEBHOOK_SECRET);
    res.json(result);
  });

  // Telegram Test Send
  app.post('/api/telegram/test-send', async (req, res) => {
    const { chatId, message } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }
    const text = message || store.getLatestDigest().telegramFormattedText;
    const result = await telegramService.sendMessage(chatId, text);
    res.json(result);
  });

  // Reconnect Telegram Polling
  app.post('/api/telegram/reconnect', async (req, res) => {
    telegramService.stopPolling();
    await telegramService.startPolling();
    const me = await telegramService.getMe();
    res.json({
      success: true,
      hasToken: telegramService.hasToken,
      botUsername: me.username,
      lastError: telegramService.lastError,
    });
  });

  // Live Telegram Webhook Endpoint
  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      const update = req.body;
      console.log('[Telegram Webhook Update]:', JSON.stringify(update).slice(0, 200));
      await telegramService.processRawUpdate(update);
      res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error('Webhook processing error:', err);
      res.status(200).json({ ok: true, error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
