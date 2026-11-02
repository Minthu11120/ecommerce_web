import { Order, Product, TelegramBotConfig, TelegramMessage } from '../types';

const TELEGRAM_CONFIG_KEY = 'ayar_telegram_bot_config_v1';
const TELEGRAM_MESSAGES_KEY = 'ayar_telegram_bot_messages_v1';

export const DEFAULT_TELEGRAM_CONFIG: TelegramBotConfig = {
  botToken: '8822676355:AAH5dNrG5sviEeDA_rjN_f15BPdTPHNlpKg',
  botUsername: 'ayar_atelier_bot',
  channelChatId: '',
  adminChatId: '',
  notifyOnOrder: true,
  notifyOnDispatched: true,
  notifyOnDelivered: true,
  enableTWA: true,
  lastPingAt: new Date().toISOString(),
};

export function getTelegramConfig(): TelegramBotConfig {
  try {
    const raw = localStorage.getItem(TELEGRAM_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Automatically migrate if using demo token or old placeholder username
      if (
        !parsed.botToken ||
        parsed.botToken.includes('DEMO_SECRET_KEY') ||
        parsed.botUsername === 'AyarAtelier_bot'
      ) {
        parsed.botToken = DEFAULT_TELEGRAM_CONFIG.botToken;
        parsed.botUsername = DEFAULT_TELEGRAM_CONFIG.botUsername;
        saveTelegramConfig(parsed);
      }
      return { ...DEFAULT_TELEGRAM_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Error reading telegram config', e);
  }
  saveTelegramConfig(DEFAULT_TELEGRAM_CONFIG);
  return DEFAULT_TELEGRAM_CONFIG;
}

export function saveTelegramConfig(config: TelegramBotConfig): void {
  try {
    localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving telegram config', e);
  }
}

export function getStoredTelegramMessages(): TelegramMessage[] {
  try {
    const raw = localStorage.getItem(TELEGRAM_MESSAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading telegram messages', e);
  }

  // Pre-seed demo interaction
  const initialMessages: TelegramMessage[] = [
    {
      id: 'tg-init-1',
      sender: 'user',
      text: '/start',
      timestamp: '10:00 AM',
    },
    {
      id: 'tg-init-2',
      sender: 'bot',
      text: `မင်္ဂလာပါ Ayar Atelier မှ နွေးထွေးစွာ ကြိုဆိုပါသည် ✨\n\nTelegram Bot မှတစ်ဆင့် မြန်မာ့ရိုးရာ အဆင့်မြင့် ပိုးထည်နှင့် ခေတ်မီဆန်းသစ်သော ဖက်ရှင်ဝတ်စုံများကို တိုက်ရိုက် ကြည့်ရှုဝယ်ယူနိုင်ပါသည်။\n\nWelcome to Ayar Atelier Telegram Bot Store! You can browse our handloomed silk collections, place 1-click orders, and track deliveries in real time.`,
      timestamp: '10:00 AM',
      inlineButtons: [
        { text: '👗 စတိုးဆိုင်ဖွင့်ပါ (Open Shop)', action: 'open_catalog' },
        { text: '✨ အသစ်ရောက် ပိုးထည်များ (New Arrivals)', action: 'view_new' },
        { text: '📦 အော်ဒါခြေရာခံမည် (Track Order)', action: 'prompt_track' },
        { text: '💬 အရောင်းဝန်ဆောင်မှု (Talk to Staff)', action: 'contact_staff' },
      ],
    },
  ];

  saveStoredTelegramMessages(initialMessages);
  return initialMessages;
}

export function saveStoredTelegramMessages(messages: TelegramMessage[]): void {
  try {
    localStorage.setItem(TELEGRAM_MESSAGES_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Error saving telegram messages', e);
  }
}

export function addTelegramMessage(message: Omit<TelegramMessage, 'id' | 'timestamp'>): TelegramMessage {
  const all = getStoredTelegramMessages();
  const newMsg: TelegramMessage = {
    ...message,
    id: `tg-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  const updated = [...all, newMsg];
  saveStoredTelegramMessages(updated);
  return newMsg;
}

/**
 * Checks Telegram Bot details and status using getMe
 */
export async function getTelegramBotMe(token?: string): Promise<{ ok: boolean; result?: any; error?: string }> {
  try {
    // Try local server proxy first
    const proxyRes = await fetch('/api/telegram/getMe');
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.ok) return data;
    }
  } catch (e) {
    // fallback to direct API
  }

  const activeToken = token || getTelegramConfig().botToken;
  try {
    const res = await fetch(`https://api.telegram.org/bot${activeToken}/getMe`);
    const data = await res.json();
    return { ok: data.ok, result: data.result, error: data.description };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

/**
 * Sends a real HTTP request to Telegram Bot API (via server proxy or direct API)
 */
export async function sendRealTelegramApiMessage(
  token: string,
  chatId: string,
  text: string,
  photoUrl?: string
): Promise<{ success: boolean; error?: string }> {
  if (!token || token.includes('DEMO_SECRET_KEY')) {
    return { success: true }; // Simulator mode
  }

  // 1. Try server proxy route first
  try {
    const proxyRes = await fetch('/api/telegram/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        text,
        photoUrl,
      }),
    });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.ok) {
        return { success: true };
      } else if (data.description) {
        return { success: false, error: data.description };
      }
    }
  } catch (e) {
    // server proxy unreachable or in dev build, fallback to direct API
  }

  // 2. Direct Telegram Bot API fallback
  try {
    if (photoUrl) {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: text,
          parse_mode: 'HTML',
        }),
      });
      const data = await res.json();
      return { success: data.ok, error: data.description };
    } else {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });
      const data = await res.json();
      return { success: data.ok, error: data.description };
    }
  } catch (err: any) {
    console.warn('Telegram API call error (handled gracefully):', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Sends Telegram notification when a customer places an order
 */
export function dispatchTelegramOrderNotification(order: Order): TelegramMessage {
  const config = getTelegramConfig();
  const itemsText = order.items
    .map((i) => `• <b>${i.quantity}x ${i.product.name}</b> (${i.selectedSize}, ${i.selectedColor.name}) - K ${Math.round(i.product.priceMmk * i.quantity).toLocaleString()}`)
    .join('\n');

  const formattedMessage = `🚨 <b>အော်ဒါအသစ် ရောက်ရှိပါသည် (NEW ORDER)</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
    `🔖 <b>Order ID:</b> <code>#${order.id}</code>\n` +
    `📦 <b>Tracking No:</b> <code>${order.trackingNumber}</code>\n` +
    `👤 <b>Customer:</b> ${order.customer.name}\n` +
    `📞 <b>Phone:</b> <code>${order.customer.phone}</code>\n` +
    `📍 <b>Address:</b> ${order.customer.address}, ${order.customer.city}\n\n` +
    `🛍️ <b>မှာယူထားသော ပစ္စည်းများ:</b>\n${itemsText}\n\n` +
    `💰 <b>ကျသင့်ငွေစုစုပေါင်း:</b> <b>K ${Math.round(order.total).toLocaleString()}</b>\n` +
    `💳 <b>ငွေပေးချေမှုစနစ်:</b> ${order.payment.method.toUpperCase()} (TX: ${order.payment.transactionId})\n` +
    `🚚 <b>သတ်မှတ်ပို့ဆောင်သူ:</b> ${order.courier.name} (${order.courier.vehicle})\n━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ <i>Ayar Atelier Telegram Commerce Gateway</i>`;

  // Try real API dispatch in background
  if (config.botToken && config.channelChatId) {
    sendRealTelegramApiMessage(config.botToken, config.channelChatId, formattedMessage, order.items[0]?.product.images[0]);
  }

  // Also add to bot simulator channel feed
  return addTelegramMessage({
    sender: 'system',
    text: formattedMessage,
    photoUrl: order.items[0]?.product.images[0],
    orderSnippet: {
      id: order.id,
      total: `K ${Math.round(order.total).toLocaleString()}`,
      status: order.status,
      trackingNumber: order.trackingNumber,
    },
    inlineButtons: [
      { text: `📦 Track #${order.id}`, action: 'track_order', payload: order.id },
      { text: '📞 ဖုန်းခေါ်ဆိုရန်', action: 'call_customer', payload: order.customer.phone },
      { text: '✅ အထည်ထုတ်ပိုးပြီး (Ready)', action: 'advance_status', payload: order.id },
    ],
  });
}

/**
 * Sends Telegram notification when order status advances
 */
export function dispatchTelegramStatusUpdate(order: Order, newStatus: string): TelegramMessage {
  const config = getTelegramConfig();
  const statusLabelMm: Record<string, string> = {
    tailoring: 'အထည်ချုပ်လုပ်စစ်ဆေးပြီး ထုတ်ပိုးနေပါသည် (Tailoring & Packaging)',
    dispatched: 'ဂိုဒေါင်မှ ထွက်ခွာပါပြီ (Dispatched to Courier)',
    transit: 'ပို့ဆောင်ရေး လမ်းကြောင်းပေါ်ရောက်ရှိပါသည် (In Transit)',
    out_for_delivery: 'ယနေ့ သင့်ထံသို့ ပို့ဆောင်နေပါပြီ (Out for Delivery)',
    delivered: 'ပို့ဆောင်ပြီးစီးပါပြီ (Successfully Delivered)',
  };

  const formatted = `🚚 <b>အော်ဒါ အခြေအနေ ပြောင်းလဲမှု (ORDER STATUS UPDATE)</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
    `🔖 <b>Order ID:</b> <code>#${order.id}</code>\n` +
    `✨ <b>အဆင့်:</b> <b>${statusLabelMm[newStatus] || newStatus}</b>\n` +
    `👤 <b>Customer:</b> ${order.customer.name} (${order.customer.phone})\n` +
    `🛵 <b>Courier:</b> ${order.courier.name} (${order.courier.phone})\n` +
    `📍 <b>လက်ရှိတည်နေရာ:</b> ရန်ကုန်မြို့တွင်း အမြန်ပို့ဆောင်ရေး\n━━━━━━━━━━━━━━━━━━━━`;

  if (config.botToken && config.channelChatId) {
    sendRealTelegramApiMessage(config.botToken, config.channelChatId, formatted);
  }

  return addTelegramMessage({
    sender: 'bot',
    text: formatted,
    inlineButtons: [
      { text: `🔍 ခြေရာခံကြည့်ရှုရန် #${order.id}`, action: 'track_order', payload: order.id },
    ],
  });
}

/**
 * Handle incoming conversational query from customer in Telegram Bot
 */
export function processCustomerBotInput(
  rawInput: string,
  products: Product[],
  orders: Order[],
  onPlaceOrder?: (product: Product, size: string, color: any) => void
): TelegramMessage {
  const text = rawInput.trim();
  const lower = text.toLowerCase();

  // 1. /start
  if (lower === '/start' || lower === 'start' || lower === 'မင်္ဂလာပါ') {
    return addTelegramMessage({
      sender: 'bot',
      text: `မင်္ဂလာပါ Ayar Atelier Luxury Fashion မှ ကြိုဆိုပါသည် ✨\n\nအောက်ပါ ခလုတ်များမှတစ်ဆင့် ဆိုင်အတွင်းရှိ ပိုးထည်နှင့် အထည်များကို ကြည့်ရှုနိုင်သလို မှာယူထားသော အော်ဒါများကိုလည်း ခြေရာခံနိုင်ပါသည်။\n\nHow can we assist your style today?`,
      inlineButtons: [
        { text: '👗 စတိုးဆိုင်ဖွင့်ပါ (Open Shop)', action: 'open_catalog' },
        { text: '✨ ရိုးရာပိုးထည်များ (Heritage Silk)', action: 'filter_silk' },
        { text: '📦 အော်ဒါခြေရာခံမည် (Track Order)', action: 'prompt_track' },
        { text: '🔥 လက်ကျန်နည်းပစ္စည်းများ (Limited Stock)', action: 'filter_limited' },
      ],
    });
  }

  // 2. /catalog or /shop or products
  if (lower === '/catalog' || lower === '/shop' || lower.includes('ပစ္စည်း') || lower.includes('ထည်') || lower.includes('catalog') || lower.includes('shop')) {
    const featured = products.slice(0, 3);
    const productListText = featured
      .map((p, idx) => `${idx + 1}. <b>${p.nameMm}</b> (${p.name})\n   💰 စျေးနှုန်း: <b>K ${p.priceMmk.toLocaleString()}</b>\n   📦 လက်ကျန်: ${p.stock} ထည်\n   🔖 Code: <code>${p.sku}</code>`)
      .join('\n\n');

    return addTelegramMessage({
      sender: 'bot',
      text: `✨ <b>Ayar Atelier ရွေးချယ်ထားသော လူကြိုက်များသည့် ဖက်ရှင်များ:</b>\n\n${productListText}\n\n<i>အသေးစိတ်ကြည့်ရှုရန် သို့မဟုတ် တိုက်ရိုက်မှာယူရန် အောက်ပါခလုတ်ကို နှိပ်ပါ -</i>`,
      photoUrl: featured[0]?.images[0],
      inlineButtons: [
        { text: `⚡ ${featured[0].nameMm} အမြန်မှာမည်`, action: 'quick_buy', payload: featured[0].id },
        { text: `⚡ ${featured[1].nameMm} အမြန်မှာမည်`, action: 'quick_buy', payload: featured[1].id },
        { text: '📱 စတိုးဆိုင်အပြည့်အစုံ ဖွင့်ကြည့်ရန် (Open Mini App)', action: 'open_catalog' },
      ],
    });
  }

  // 3. /track or tracking search
  if (lower.startsWith('/track') || lower.includes('track') || lower.includes('ခြေရာခံ') || lower.includes('ayr-') || lower.includes('trk-')) {
    const match = text.match(/(AYR-\d+|TRK-\d+-[A-Z]+)/i);
    const searchId = match ? match[1].toUpperCase() : text.replace('/track', '').trim().toUpperCase();

    const foundOrder = orders.find(
      (o) => o.id.toUpperCase() === searchId || o.trackingNumber.toUpperCase() === searchId
    );

    if (foundOrder) {
      return addTelegramMessage({
        sender: 'bot',
        text: `📦 <b>အော်ဒါ အချက်အလက် ရှာဖွေတွေ့ရှိပါသည်</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
          `🔖 <b>Order ID:</b> <code>#${foundOrder.id}</code>\n` +
          `🏷️ <b>အခြေအနေ:</b> <b>${foundOrder.status.toUpperCase()}</b>\n` +
          `👤 <b>မှာယူသူ:</b> ${foundOrder.customer.name}\n` +
          `💰 <b>စုစုပေါင်း:</b> K ${Math.round(foundOrder.total).toLocaleString()}\n` +
          `🛵 <b>ပို့ဆောင်သူ:</b> ${foundOrder.courier.name} (${foundOrder.courier.phone})\n` +
          `⏱️ <b>ရောက်ရှိမည့်အချိန်:</b> ${foundOrder.courier.estimatedDelivery}\n━━━━━━━━━━━━━━━━━━━━`,
        inlineButtons: [
          { text: '📍 Live Map တွင် တိုက်ရိုက်ကြည့်ရှုရန်', action: 'view_live_tracking', payload: foundOrder.id },
          { text: '📞 ပို့ဆောင်သူ ဖုန်းခေါ်ဆိုရန်', action: 'call_courier', payload: foundOrder.courier.phone },
        ],
      });
    } else {
      return addTelegramMessage({
        sender: 'bot',
        text: `မတွေ့ရှိပါရှင်။ သင်ရှာဖွေလိုသော Order ID (ဥပမာ - <code>AYR-8921</code>) သို့မဟုတ် Tracking Number ကို မှန်ကန်စွာ ရိုက်ထည့်ပေးပါရှင်။`,
        inlineButtons: [
          { text: '🔍 စမ်းသပ်အော်ဒါ #AYR-8921 စစ်ဆေးမည်', action: 'track_order', payload: 'AYR-8921' },
        ],
      });
    }
  }

  // 4. Keyword search across catalog (silk, coat, dress, kimono, etc.)
  const matchedProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.nameMm.toLowerCase().includes(lower) ||
      p.sku.toLowerCase() === lower ||
      p.category.toLowerCase().includes(lower)
  );

  if (matchedProducts.length > 0) {
    const item = matchedProducts[0];
    return addTelegramMessage({
      sender: 'bot',
      text: `👗 <b>${item.nameMm} (${item.name})</b>\n\n` +
        `📝 ${item.descriptionMm || item.description}\n\n` +
        `💰 စျေးနှုန်း: <b>K ${item.priceMmk.toLocaleString()}</b>\n` +
        `📦 လက်ကျန်: <b>${item.stock} ထည် ရှိပါသည်</b>\n` +
        `🔖 Item Code: <code>${item.sku}</code>\n` +
        `🎨 အရောင်: ${item.colors.map((c) => c.nameMm).join(', ')}`,
      photoUrl: item.images[0],
      inlineButtons: [
        { text: '⚡ Telegram မှ တိုက်ရိုက်မှာယူမည် (Order Now)', action: 'quick_buy', payload: item.id },
        { text: '🔎 ဝဘ်ဆိုဒ်တွင် အသေးစိတ်ကြည့်ရန်', action: 'view_product_detail', payload: item.id },
      ],
    });
  }

  // Default smart AI assistant fallback
  return addTelegramMessage({
    sender: 'bot',
    text: `ကျေးဇူးတင်ပါသည်ရှင်။ Ayar Atelier တွင် အောက်ပါ ဝန်ဆောင်မှုများကို ဆောင်ရွက်ပေးနိုင်ပါသည် -\n\n• <code>/catalog</code> - ပိုးထည်ဖက်ရှင်များ ကြည့်ရှုရန်\n• <code>/track AYR-8921</code> - အော်ဒါ ခြေရာခံရန်\n• ပိုးထည်၊ ကုတ်အင်္ကျီ၊ ဂါဝန် အစရှိသည့် အမည်များ ရိုက်ထည့်၍ ရှာဖွေနိုင်ပါသည်ရှင်။`,
    inlineButtons: [
      { text: '👗 ကုန်ပစ္စည်း စာရင်းကြည့်ရန်', action: 'open_catalog' },
      { text: '💬 ဖက်ရှင် အကြံပေးနှင့် စကားပြောမည်', action: 'contact_staff' },
    ],
  });
}

/**
 * Creates formatted Telegram sharing link for deep linking
 */
export function generateTelegramShareUrl(text: string, url: string = window.location.href): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * Generates direct Telegram chat message for an order or product
 */
export function generateTelegramOrderDirectChatUrl(
  botUsername: string,
  orderOrProductText: string
): string {
  const cleanUsername = botUsername.replace('@', '');
  return `https://t.me/${cleanUsername}?text=${encodeURIComponent(orderOrProductText)}`;
}
