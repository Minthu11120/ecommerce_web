// Vercel Serverless Function for Meta Facebook Messenger Auto-reply Bot
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'ayar_atelier_secret_verify_token_2026';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || '';
const STORE_URL = process.env.STORE_URL || 'https://ayaratelierfashion.vercel.app';

export default async function handler(req, res) {
  // 1. Meta Webhook Verification (GET request)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
      console.log('✅ Meta Webhook verified on Vercel!');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Verification token mismatch');
  }

  // 2. Meta Messenger Event Receiver & Auto-Reply (POST request)
  if (req.method === 'POST') {
    const body = req.body;

    if (body && body.object === 'page') {
      try {
        for (const entry of body.entry || []) {
          for (const event of entry.messaging || []) {
            const senderId = event.sender?.id;
            const message = event.message;
            const postback = event.postback;

            // Don't reply to echo messages sent by the bot itself
            if (!senderId || message?.is_echo) continue;

            const text = (message?.text || postback?.payload || '').trim();

            if (text) {
              await handleCustomerMessage(senderId, text);
            }
          }
        }
      } catch (err) {
        console.error('Error processing Messenger event:', err);
      }

      // Meta requires a 200 OK within 5 seconds
      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.status(404).send('Not Found');
  }

  return res.status(405).send('Method Not Allowed');
}

/**
 * Handle incoming customer message and send auto-reply
 */
async function handleCustomerMessage(senderId, userText) {
  if (!PAGE_ACCESS_TOKEN) {
    console.error('⚠️ PAGE_ACCESS_TOKEN is not set in Vercel Environment Variables!');
    return;
  }

  const lower = userText.toLowerCase();
  let replyText = '';
  let buttons = null;

  // 1. Greetings / Start
  if (lower.includes('start') || lower.includes('မင်္ဂလာ') || lower.includes('hello') || lower.includes('hi')) {
    replyText =
      `မင်္ဂလာပါရှင် ✨ Ayar Atelier Luxury Fashion မှ ကြိုဆိုပါသည် 👗\n\n` +
      `ကျွန်မတို့ စတိုးဆိုင်တွင် ရိုးရာအမရပူရ ပိုးစစ်လက်ရက်ထည်များနှင့် ခေတ်မီဆန်းသစ်သော ဖက်ရှင်ဝတ်စုံများကို စိတ်ကြိုက်ရွေးချယ် ဝယ်ယူနိုင်ပါသည်ရှင်။\n\n` +
      `အဝတ်အထည်များ ကြည့်ရှုလိုပါက အောက်ပါ "🛍️ Open Store" ခလုတ်ကို နှိပ်ပါ သို့မဟုတ် "စျေးနှုန်း" ဟု စာပို့ပေးပါရှင်။`;
    
    buttons = [
      {
        type: 'web_url',
        url: STORE_URL,
        title: '🛍️ Open Store',
      },
      {
        type: 'postback',
        title: '👗 ဝတ်စုံများကြည့်မည်',
        payload: 'VIEW_CATALOG',
      },
      {
        type: 'postback',
        title: '📍 ဆိုင်လိပ်စာ/ဖုန်း',
        payload: 'VIEW_CONTACT',
      },
    ];
  }
  // 2. Product Catalog & Prices
  else if (lower.includes('စျေး') || lower.includes('ဈေး') || lower.includes('price') || lower.includes('catalog') || lower.includes('VIEW_CATALOG') || lower.includes('ပိုး') || lower.includes('အင်္ကျီ') || lower.includes('ဝတ်စုံ')) {
    replyText =
      `👗 Ayar Atelier - Signature Collection\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `✨ ၁။ အမရပူရ ပိုးစစ် ကီမိုနို ကုတ်အင်္ကျီ\n` +
      `• စျေးနှုန်း: ၇၂၀,၀၀၀ ကျပ် ($240 USD)\n` +
      `• ပိုးစစ်စစ် ၁၀၀% လက်ရက်ထည်\n\n` +
      `🌧️ ၂။ မိုးရာသီသုံး ရေစိုခံ ကုတ်ရှည်ကြီး\n` +
      `• စျေးနှုန်း: ၃၈၀,၀၀၀ ကျပ် ($128 USD)\n\n` +
      `💎 ၃။ မန္တလေး ရွှေချည်ထိုး ပွဲတက်လုံချည်\n` +
      `• စျေးနှုန်း: ၅၈၀,၀၀၀ ကျပ် ($195 USD)\n\n` +
      `ဝတ်စုံအပြည့်အစုံကို ကြည့်ရှုပြီး Size နှင့် အရောင် ရွေးချယ်ဝယ်ယူရန် အောက်ပါ Link ကို နှိပ်ပါရှင်:`;

    buttons = [
      {
        type: 'web_url',
        url: STORE_URL,
        title: '🛍️ Open Full Catalog',
      },
      {
        type: 'postback',
        title: '📦 အော်ဒါတင်နည်း',
        payload: 'HOW_TO_ORDER',
      },
    ];
  }
  // 3. Order tracking or How to order
  else if (lower.includes('order') || lower.includes('အော်ဒါ') || lower.includes('ဝယ်') || lower.includes('HOW_TO_ORDER')) {
    replyText =
      `📦 အော်ဒါတင်ယူလိုပါက-\n\n` +
      `၁။ အောက်ပါ Store Link သို့ ဝင်ရောက်ပြီး မိမိနှစ်သက်သော ဝတ်စုံကို ရွေးချယ်ပါ\n` +
      `၂။ နာမည်၊ ဖုန်းနံပါတ်၊ ပို့ဆောင်ရမည့်လိပ်စာ ဖြည့်စွက်ပါ\n` +
      `၃။ KBZPay သို့မဟုတ် WavePay ဖြင့် အလွယ်တကူ ငွေချေနိုင်ပါသည်ရှင်။\n\n` +
      `ဆိုင်ဝန်ထမ်းထံ တိုက်ရိုက်မှာယူလိုပါကလည်း ဤ Messenger တွင် ပစ္စည်းအမည်နှင့် ဖုန်းနံပါတ် ပို့ပေးထားနိုင်ပါသည်ရှင် ✨`;

    buttons = [
      {
        type: 'web_url',
        url: STORE_URL,
        title: '🛍️ စတိုးဆိုင်တွင် ဝယ်မည်',
      },
    ];
  }
  // 4. Contact / Showrooms
  else if (lower.includes('contact') || lower.includes('လိပ်စာ') || lower.includes('ဆိုင်') || lower.includes('ဖုန်း') || lower.includes('VIEW_CONTACT')) {
    replyText =
      `🏛️ Ayar Atelier Showrooms & Contact\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📍 ရန်ကုန်ဆိုင်ခွဲ: ဆရာစံလမ်း၊ ဗဟန်းမြို့နယ်၊ ရန်ကုန်\n` +
      `📍 မန္တလေးဆိုင်ခွဲ: ၇၃ လမ်း၊ ၃၀ × ၃၁ ကြား၊ ချမ်းအေးသာစံ\n\n` +
      `📞 ဖုန်းနံပါတ်: +95 9 778 899 001\n` +
      `⏰ ဖွင့်ချိန်: 9:00 AM – 8:00 PM (နေ့စဉ်)\n` +
      `💳 ငွေပေးချေမှု: KBZPay, WavePay, AYA Pay, Cash on Delivery`;
  }
  // 5. Default Fallback
  else {
    replyText =
      `ဟုတ်ကဲ့ မင်္ဂလာပါရှင် ✨\n\n` +
      `Ayar Atelier Luxury Fashion မှ မက်ဆေ့ခ်ျ လက်ခံရရှိပါသည်!\n` +
      `အဝတ်အထည်များ ကြည့်ရှုရန်နှင့် အော်ဒါတင်ရန် အောက်ပါ ခလုတ်ကို နှိပ်ပါ သို့မဟုတ် "စျေးနှုန်း" ဟု စာပို့ပေးနိုင်ပါသည်ရှင်။`;

    buttons = [
      {
        type: 'web_url',
        url: STORE_URL,
        title: '🛍️ Open Store',
      },
    ];
  }

  // Send message back to Facebook Messenger via Graph API
  await sendMessengerReply(senderId, replyText, buttons);
}

/**
 * Call Meta Graph API v20.0 to send message to recipient
 */
async function sendMessengerReply(recipientId, text, buttons) {
  try {
    let messagePayload = { text };

    if (buttons && buttons.length > 0) {
      messagePayload = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: text,
            buttons: buttons.slice(0, 3), // Facebook allows max 3 buttons per template
          },
        },
      };
    }

    const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: messagePayload,
        messaging_type: 'RESPONSE',
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      console.error('❌ Facebook Graph API Error:', data.error);
    } else {
      console.log('✅ Messenger reply sent successfully:', data);
    }
  } catch (err) {
    console.error('Network error calling Meta Send API:', err);
  }
}
