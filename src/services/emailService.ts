import { EmailNotification, Order } from '../types';

const EMAIL_STORE_KEY = 'ayar_emails_store_v1';

export function getStoredEmails(): EmailNotification[] {
  try {
    const raw = localStorage.getItem(EMAIL_STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading emails', e);
  }

  // Pre-seed with one initial order confirmed email
  const initialEmail: EmailNotification = {
    id: 'em-001',
    orderId: 'AYR-8921',
    recipientEmail: 'runisn2016@gmail.com',
    subject: 'Order Confirmed: #AYR-8921 — Ayar Atelier Silk Kimono & Bamboo Shirt',
    subjectMm: 'အော်ဒါ အတည်ပြုပြီးပါပြီ: #AYR-8921 — Ayar Atelier',
    preview: 'Thank you for your order. Your bespoke handcrafted pieces are now being tailored and prepared for dispatch.',
    sentAt: 'Yesterday at 10:16 AM',
    type: 'order_confirmed',
    isRead: false,
    htmlContent: generateOrderConfirmedHtml({
      id: 'AYR-8921',
      trackingNumber: 'TRK-98420-MM',
      customerName: 'Dr. Thant Zin',
      customerEmail: 'runisn2016@gmail.com',
      total: 1014000,
      currency: 'MMK',
      itemsSummary: '1x Amarapura Mulberry Silk Kimono Coat (M), 1x Bamboo Cotton Drop-Shoulder Shirt (L)',
      paymentMethod: 'KBZPay (1-Click Authorized)',
    }),
  };

  saveStoredEmails([initialEmail]);
  return [initialEmail];
}

export function saveStoredEmails(emails: EmailNotification[]): void {
  try {
    localStorage.setItem(EMAIL_STORE_KEY, JSON.stringify(emails));
  } catch (e) {
    console.error('Error saving emails', e);
  }
}

export function sendAutomatedOrderEmail(order: Order, type: 'order_confirmed' | 'order_dispatched' | 'out_for_delivery'): EmailNotification {
  const itemsText = order.items.map((i) => `${i.quantity}x ${i.product.name} (${i.selectedSize})`).join(', ');

  let subject = `Order Confirmed: #${order.id} — Ayar Atelier`;
  let subjectMm = `အော်ဒါအတည်ပြုခြင်း: #${order.id} — Ayar Atelier`;
  let preview = `Your order #${order.id} has been confirmed and transferred to our master tailors.`;

  if (type === 'order_dispatched') {
    subject = `Your Order #${order.id} Has Been Dispatched! Tracking: ${order.trackingNumber}`;
    subjectMm = `သင့်အော်ဒါ #${order.id} အား ပို့ဆောင်ရေးသို့ လွှဲပြောင်းလိုက်ပါပြီ`;
    preview = `Your bespoke garments have departed our Yangon central fulfillment center via ${order.courier.name}.`;
  } else if (type === 'out_for_delivery') {
    subject = `Out for Delivery: #${order.id} arriving today with ${order.courier.name}`;
    subjectMm = `ယနေ့ လာရောက်ပို့ဆောင်ပါမည်: အော်ဒါ #${order.id}`;
    preview = `Courier is approaching your destination area in Kamayut / Downtown.`;
  }

  const newEmail: EmailNotification = {
    id: `em-${Date.now()}`,
    orderId: order.id,
    recipientEmail: order.customer.email,
    subject,
    subjectMm,
    preview,
    sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type,
    isRead: false,
    htmlContent: generateOrderConfirmedHtml({
      id: order.id,
      trackingNumber: order.trackingNumber,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      total: order.total,
      currency: order.currency,
      itemsSummary: itemsText,
      paymentMethod: order.payment.method.toUpperCase(),
    }),
  };

  const current = getStoredEmails();
  const updated = [newEmail, ...current];
  saveStoredEmails(updated);
  return newEmail;
}

function generateOrderConfirmedHtml(data: {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  currency: string;
  itemsSummary: string;
  paymentMethod: string;
}): string {
  return `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
    <div style="background: #1c1917; color: #ffffff; padding: 32px 24px; text-align: center;">
      <h1 style="letter-spacing: 0.2em; font-size: 22px; font-weight: 600; margin: 0; text-transform: uppercase;">AYAR ATELIER</h1>
      <p style="font-size: 12px; color: #a8a29e; margin-top: 6px; letter-spacing: 0.1em;">HAUTE TAILORING &amp; MODERN HERITAGE</p>
    </div>
    
    <div style="padding: 28px 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f5f5f4; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <span style="font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em;">Order Reference</span>
          <h2 style="font-size: 20px; font-weight: 700; color: #1c1917; margin: 2px 0 0 0;">#${data.id}</h2>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 11px; background: #ecfdf5; color: #047857; padding: 4px 10px; border-radius: 9999px; font-weight: 600;">PAID &amp; VERIFIED</span>
        </div>
      </div>

      <p style="font-size: 15px; color: #44403c; line-height: 1.6;">
        Dear <strong>${data.customerName}</strong>,<br>
        Thank you for choosing Ayar Atelier. Your order has been registered in our PostgreSQL database cluster and sent to our Amarapura and Yangon tailoring studios.
      </p>

      <div style="background: #fafaf9; border: 1px solid #f5f5f4; border-radius: 6px; padding: 18px; margin: 24px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #78716c; letter-spacing: 0.05em;">Order Summary</h4>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #1c1917; font-weight: 500;">${data.itemsSummary}</p>
        <div style="border-top: 1px dashed #e7e5e4; padding-top: 10px; display: flex; justify-content: space-between; font-size: 15px;">
          <span><strong>Total Charged:</strong></span>
          <span style="font-weight: 700; color: #1c1917;">K ${data.total.toLocaleString()}</span>
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: #78716c;">
          Authorized via: <strong>${data.paymentMethod}</strong> (256-bit Encrypted Token)
        </div>
      </div>

      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; margin-bottom: 24px;">
        <span style="font-size: 12px; font-weight: 600; color: #1e40af; text-transform: uppercase;">Real-time Telemetry Tracking Number:</span>
        <div style="font-family: monospace; font-size: 16px; font-weight: 700; color: #1e3a8a; margin-top: 4px;">${data.trackingNumber}</div>
      </div>

      <p style="font-size: 13px; color: #78716c; line-height: 1.5; margin-bottom: 24px;">
        You will receive automated tracking pings as your parcel passes quality inspection, leaves the fulfillment depot, and reaches courier dispatch.
      </p>

      <div style="text-align: center; border-top: 1px solid #f5f5f4; padding-top: 20px; font-size: 12px; color: #a8a29e;">
        Ayar Atelier Co. Ltd. • Yangon | Amarapura | Singapore<br>
        24/7 Concierge: concierge@ayaratelier.com
      </div>
    </div>
  </div>
  `;
}

export const emailService = {
  getEmails: getStoredEmails,
  sendOrderConfirmationEmail: (order: Order) => sendAutomatedOrderEmail(order, 'order_confirmed'),
  sendOrderDispatchedEmail: (order: Order) => sendAutomatedOrderEmail(order, 'order_dispatched'),
  sendOrderDeliveredEmail: (order: Order) => sendAutomatedOrderEmail(order, 'out_for_delivery'),
};

