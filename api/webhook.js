// Vercel Serverless Function for Meta Facebook Messenger Webhook
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'ayar_atelier_secret_verify_token_2026';

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

  // 2. Meta Messenger Event Receiver (POST request)
  if (req.method === 'POST') {
    const data = req.body;
    console.log('📩 Incoming Meta event on Vercel:', JSON.stringify(data));
    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.status(405).send('Method Not Allowed');
}
