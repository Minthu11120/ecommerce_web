import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8822676355:AAH5dNrG5sviEeDA_rjN_f15BPdTPHNlpKg';
const APP_URL = process.env.APP_URL || 'https://ais-dev-clolk3s7rlanhskhm5pbt3-77988015174.asia-southeast1.run.app';

async function startServer() {
  const app = express();

  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Ayar Atelier Commerce Server',
      bot: '@ayar_atelier_bot',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Telegram Bot status endpoint (getMe)
  app.get('/api/telegram/getMe', async (req, res) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error('Error in /api/telegram/getMe:', err);
      res.status(500).json({ ok: false, error: err?.message || 'Failed to connect to Telegram' });
    }
  });

  // 3. Telegram Send Message Proxy
  app.post('/api/telegram/send', async (req, res) => {
    try {
      const { chatId, text, photoUrl, inlineButtons } = req.body;
      const targetChatId = chatId || '@AyarAtelierOrders';

      const payload: any = {
        chat_id: targetChatId,
        parse_mode: 'HTML',
      };

      if (inlineButtons && Array.isArray(inlineButtons) && inlineButtons.length > 0) {
        payload.reply_markup = {
          inline_keyboard: [
            inlineButtons.map((btn: any) => {
              if (btn.url) return { text: btn.text, url: btn.url };
              if (btn.web_app) return { text: btn.text, web_app: btn.web_app };
              return { text: btn.text, callback_data: btn.action || 'action' };
            }),
          ],
        };
      }

      let endpoint = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      if (photoUrl) {
        endpoint = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
        payload.photo = photoUrl;
        payload.caption = text;
      } else {
        payload.text = text;
      }

      const tgResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const tgData = await tgResponse.json();
      res.json(tgData);
    } catch (err: any) {
      console.error('Error in /api/telegram/send:', err);
      res.status(500).json({ ok: false, error: err?.message || 'Failed to dispatch Telegram message' });
    }
  });

  // 3.5. Meta Facebook Messenger Webhook verification & receiver
  const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'ayar_atelier_secret_verify_token_2026';

  app.get(['/webhook', '/api/facebook/webhook'], (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
      console.log('✅ Meta Webhook successfully verified by Facebook!');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verification token mismatch');
  });

  app.post(['/webhook', '/api/facebook/webhook'], async (req, res) => {
    try {
      const data = req.body;
      if (data && data.object === 'page') {
        console.log('📩 Facebook Messenger message received:', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Error in Facebook webhook:', e);
    }
    return res.status(200).send('EVENT_RECEIVED');
  });

  // 4. Telegram Webhook handler (if webhook is configured)
  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      const update = req.body;
      if (update) {
        await handleTelegramUpdate(update);
      }
    } catch (err) {
      console.warn('Telegram webhook handling warning:', err);
    }
    res.sendStatus(200);
  });

  // Vite middleware setup
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
    console.log(`Ayar Atelier server running on http://0.0.0.0:${PORT}`);
    // Start Telegram long-polling daemon in background
    startTelegramPolling();
  });
}

/**
 * Handle incoming Telegram updates (messages, bot commands, button callbacks)
 */
async function handleTelegramUpdate(update: any) {
  try {
    // 1. Handle Inline Button Clicks (Callback Queries)
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message?.chat?.id;
      const data = cq.data;
      const userName = cq.from?.first_name || 'Customer';

      // Answer callback to remove loading clock
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: cq.id }),
        });
      } catch (e) {
        // ignore
      }

      if (chatId) {
        if (data === 'cmd_shop' || data === 'view_catalog') {
          await sendShopCatalog(chatId);
        } else if (data === 'cmd_track' || data === 'track_order') {
          await sendTrackInfo(chatId);
        } else if (data === 'cmd_help') {
          await sendHelpInfo(chatId);
        } else if (data === 'cmd_start') {
          await sendWelcome(chatId, userName);
        }
      }
      return;
    }

    // 2. Handle Text Messages and Commands
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const rawText = (msg.text || '').trim();
      const userName = msg.from?.first_name || 'Customer';

      if (!chatId || !rawText) return;

      const lower = rawText.toLowerCase();

      if (lower.startsWith('/start')) {
        await sendWelcome(chatId, userName);
      } else if (lower.startsWith('/shop') || lower.includes('shop') || lower.includes('ဝတ်စုံ') || lower.includes('ပစ္စည်း')) {
        await sendShopCatalog(chatId);
      } else if (lower.startsWith('/track') || lower.includes('track') || lower.includes('ခြေရာခံ') || lower.startsWith('ayar-')) {
        await sendTrackInfo(chatId, rawText);
      } else if (lower.startsWith('/help') || lower.includes('help') || lower.includes('အကူအညီ') || lower.includes('ဆိုင်လိပ်စာ')) {
        await sendHelpInfo(chatId);
      } else {
        // Friendly conversational reply with Open Store button
        await sendGeneralReply(chatId, userName, rawText);
      }
    }
  } catch (err: any) {
    console.error('Error handling Telegram update:', err?.message || err);
  }
}

/**
 * Sends Welcome response (/start)
 */
async function sendWelcome(chatId: number | string, userName: string) {
  const text =
    `မင်္ဂလာပါ <b>${userName}</b> ရှင် ✨\n\n` +
    `<b>Ayar Atelier - Modern Luxury & Handcrafted Myanmar Silks</b> မှ နွေးထွေးစွာ ကြိုဆိုပါသည် 👗\n\n` +
    `ကျွန်မတို့၏ စတိုးဆိုင်တွင်:\n` +
    `• အမရပူရ ပိုးစစ်လက်ရက်ထည်နှင့် ခေတ်မီဆန်းသစ်သော ဖက်ရှင်ဝတ်စုံများ\n` +
    `• Telegram အတွင်း ၁-ချက်နှိပ် အော်ဒါတင်နိုင်ခြင်း (1-Click Order)\n` +
    `• အော်ဒါအခြေအနေကို Real-Time ခြေရာခံနိုင်ခြင်း (Live Tracking)\n` +
    `• KBZPay / WavePay တိုက်ရိုက် ငွေပေးချေမှု\n\n` +
    `👇 စတိုးဆိုင်ကို စတင်ကြည့်ရှုပြီး အော်ဒါတင်ရန် အောက်ပါ <b>🛍️ Open Store</b> ခလုတ်ကို နှိပ်ပါရှင်:`;

  await sendTelegramMessageWithButtons(chatId, text, [
    [
      {
        text: '🛍️ Open Store (စတိုးဆိုင်ဖွင့်မည်)',
        web_app: { url: APP_URL },
      },
    ],
    [
      { text: '👗 Featured Garments (အဝတ်အထည်များ)', callback_data: 'cmd_shop' },
      { text: '📦 Track Order (အော်ဒါခြေရာခံ)', callback_data: 'cmd_track' },
    ],
    [
      { text: '💬 Customer Support (အကူအညီ)', callback_data: 'cmd_help' },
    ],
  ]);
}

/**
 * Sends Product Catalog preview (/shop)
 */
async function sendShopCatalog(chatId: number | string) {
  const text =
    `👗 <b>Ayar Atelier - Signature Collection</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `✨ <b>၁။ အမရပူရ ပိုးစစ် ကီမိုနို ကုတ်အင်္ကျီ (Amarapura Silk Kimono)</b>\n` +
    `• စျေးနှုန်း: <b>၇၂၀,၀၀၀ ကျပ်</b> ($240 USD)\n` +
    `• အမရပူရ ပိုးစစ် ၁၀၀% လက်ရက်ထည်၊ ခေတ်မီရင်ဖုံးဒီဇိုင်း\n\n` +
    `🌧️ <b>၂။ မိုးရာသီသုံး ရေစိုခံ ကုတ်ရှည်ကြီး (Waterproof Trench)</b>\n` +
    `• စျေးနှုန်း: <b>၃၈၀,၀၀၀ ကျပ်</b> ($128 USD)\n` +
    `• ရေစိုခံအထည်သားနှင့် လေကာကော်လာ\n\n` +
    `💎 <b>၃။ မန္တလေး ရွှေချည်ထိုး ပွဲတက်လုံချည် (Gold Thread Htamein)</b>\n` +
    `• စျေးနှုန်း: <b>၅၈၀,၀၀၀ ကျပ်</b> ($195 USD)\n` +
    `• မန္တလေး ရွှေချည်ထိုး နန်းတွင်းရိုးရာ လက်ရာစစ်စစ်\n\n` +
    `စတိုးဆိုင်အပြည့်အစုံကို ကြည့်ရှုရန်နှင့် စိတ်ကြိုက် အရွယ်အစား (S, M, L, XL) / အရောင် ရွေးချယ်ဝယ်ယူရန် အောက်ပါ <b>🛍️ Open Store</b> ကို နှိပ်ပါရှင်:`;

  await sendTelegramMessageWithButtons(chatId, text, [
    [
      {
        text: '🛍️ Open Store & Buy (စတိုးဆိုင်တွင် ဝယ်ယူမည်)',
        web_app: { url: APP_URL },
      },
    ],
    [
      { text: '📦 Track Delivery (အော်ဒါခြေရာခံ)', callback_data: 'cmd_track' },
      { text: '💬 Support (အကူအညီ)', callback_data: 'cmd_help' },
    ],
  ]);
}

/**
 * Sends Order Tracking Information (/track)
 */
async function sendTrackInfo(chatId: number | string, inputQuery?: string) {
  let extraStatus = '';
  if (inputQuery && inputQuery.toUpperCase().includes('AYAR-')) {
    const matched = inputQuery.toUpperCase().match(/AYAR-[A-Z0-9-]+/);
    if (matched) {
      extraStatus = `\n🔍 စစ်ဆေးထားသော Order ID: <code>${matched[0]}</code>\nအခြေအနေ: <b>✨ Confirmed & In Production</b> (အော်ဒါအတည်ပြုပြီး ပို့ဆောင်ရန် ပြင်ဆင်နေပါသည်)\n\n`;
    }
  }

  const text =
    `📦 <b>Ayar Atelier Order Tracking & Status</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    extraStatus +
    `သင့်အော်ဒါ အခြေအနေကို စစ်ဆေးရန်:\n` +
    `၁။ စတိုးဆိုင်ကို ဖွင့်ပြီး <b>Track Order</b> မီနူးသို့ သွားရောက်နိုင်ပါသည်\n` +
    `၂။ သို့မဟုတ် သင့် <b>Order ID</b> (ဥပမာ: <code>AYAR-2026-0891</code>) ကို ဤ Bot သို့ စာပို့ပေးနိုင်ပါသည်\n\n` +
    `အသေးစိတ် ပို့ဆောင်မှုမြေပုံနှင့် အဆင့်များကို ကြည့်ရှုရန် အောက်ပါခလုတ်ကို နှိပ်ပါရှင်:`;

  await sendTelegramMessageWithButtons(chatId, text, [
    [
      {
        text: '🛍️ Open Live Tracking (အော်ဒါခြေရာခံကြည့်မည်)',
        web_app: { url: APP_URL },
      },
    ],
    [
      { text: '👗 အဝတ်အထည်များ (/shop)', callback_data: 'cmd_shop' },
      { text: '🏠 မူလမီနူး (/start)', callback_data: 'cmd_start' },
    ],
  ]);
}

/**
 * Sends Customer Support & Store Information (/help)
 */
async function sendHelpInfo(chatId: number | string) {
  const text =
    `✨ <b>Ayar Atelier Concierge & Customer Care</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🏛️ <b>Flagship Showrooms:</b>\n` +
    `• <b>Yangon:</b> Sayarsan Road, Bahan Township, Yangon\n` +
    `• <b>Mandalay:</b> 73rd Street, Between 30th & 31st, Chanayethazan\n\n` +
    `📞 <b>ဆက်သွယ်ရန်:</b>\n` +
    `• Hotline: +95 9 778 899 001\n` +
    `• Telegram: @ayar_atelier_bot\n` +
    `• Email: concierge@ayaratelier.com\n` +
    `• ဝန်ဆောင်မှုအချိန်: 9:00 AM – 8:00 PM (နေ့စဉ်)\n\n` +
    `💳 <b>ငွေပေးချေမှု နည်းလမ်းများ:</b>\n` +
    `• KBZPay, WavePay, AYA Pay, CB Pay (QR Code တိုက်ရိုက် ပြေစာတင်နိုင်ပါသည်)\n` +
    `• Cash on Delivery (Yangon & Mandalay မြို့တွင်း)\n\n` +
    `🛍️ စတိုးဆိုင်သို့ သွားရောက်ရန်:`;

  await sendTelegramMessageWithButtons(chatId, text, [
    [
      {
        text: '🛍️ Open Store (စတိုးဆိုင်ဖွင့်မည်)',
        web_app: { url: APP_URL },
      },
    ],
    [
      { text: '👗 Catalog ကြည့်မည် (/shop)', callback_data: 'cmd_shop' },
      { text: '🏠 မူလစာမျက်နှာ (/start)', callback_data: 'cmd_start' },
    ],
  ]);
}

/**
 * General conversational reply for unrecognized text
 */
async function sendGeneralReply(chatId: number | string, userName: string, userInput: string) {
  const text =
    `မင်္ဂလာပါ <b>${userName}</b> ရှင် ✨\n\n` +
    `သင်ပေးပို့သော မက်ဆေ့ခ်ျကို လက်ခံရရှိပါသည်: "<i>${escapeHtml(userInput.slice(0, 80))}</i>"\n\n` +
    `Ayar Atelier တွင် အဝတ်အထည်များ ကြည့်ရှုရန်နှင့် အော်ဒါတင်ရန် အောက်ပါခလုတ်များကို အသုံးပြုနိုင်ပါသည်ရှင်:\n` +
    `• /shop - အဝတ်အထည်များ ကြည့်ရှုရန်\n` +
    `• /track - အော်ဒါအခြေအနေ စစ်ဆေးရန်\n` +
    `• /help - ဆိုင်လိပ်စာနှင့် ဖုန်းနံပါတ်\n\n` +
    `စတိုးဆိုင်တိုက်ရိုက်ဖွင့်လှစ်ရန် အောက်ပါ <b>🛍️ Open Store</b> ကို နှိပ်ပါရှင်:`;

  await sendTelegramMessageWithButtons(chatId, text, [
    [
      {
        text: '🛍️ Open Store (စတိုးဆိုင်ဖွင့်မည်)',
        web_app: { url: APP_URL },
      },
    ],
    [
      { text: '👗 အဝတ်အထည်များ (/shop)', callback_data: 'cmd_shop' },
      { text: '📦 အော်ဒါခြေရာခံ (/track)', callback_data: 'cmd_track' },
    ],
  ]);
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendTelegramMessageWithButtons(
  chatId: number | string,
  text: string,
  inlineKeyboard: Array<Array<{ text: string; url?: string; web_app?: { url: string }; callback_data?: string }>>
) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }),
    });
    return await res.json();
  } catch (err) {
    console.error(`Error sending message to chatId ${chatId}:`, err);
    return null;
  }
}

/**
 * Long-polling daemon for real-time Telegram incoming messages
 */
let lastProcessedUpdateId = 0;
let isPollingRunning = false;

async function startTelegramPolling() {
  if (isPollingRunning) return;
  isPollingRunning = true;
  console.log('🤖 Telegram long-polling service started for @ayar_atelier_bot...');

  while (isPollingRunning) {
    try {
      const offsetParam = lastProcessedUpdateId ? `?offset=${lastProcessedUpdateId + 1}&timeout=15` : '?timeout=15';
      const pollUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates${offsetParam}`;

      const res = await fetch(pollUrl);
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 4000));
        continue;
      }

      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastProcessedUpdateId = update.update_id;
          await handleTelegramUpdate(update);
        }
      }
    } catch (err: any) {
      // Network hiccup or container pause - wait 4s and safely continue
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

startServer();
