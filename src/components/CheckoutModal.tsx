import React, { useState } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  CheckCircle,
  CreditCard,
  Smartphone,
  Tag,
  ArrowRight,
  Sparkles,
  QrCode,
  Fingerprint,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, Currency, Language, Order, UserProfile } from '../types';
import { formatPrice, translations } from '../data/translations';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  userProfile: UserProfile;
  language: Language;
  currency: Currency;
  onOrderCompleted: (newOrder: Order) => void;
  onClearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  userProfile,
  language,
  currency,
  onOrderCompleted,
  onClearCart,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  const defaultAddr = userProfile.savedAddresses[0] || {
    name: userProfile.name || 'Patron Customer',
    street: 'No. 42 Inya Road, Kamayut Township',
    city: 'Yangon',
    phone: '+95 9 450 123 456',
  };

  const [formData, setFormData] = useState({
    fullName: defaultAddr.name,
    email: userProfile.email,
    phone: defaultAddr.phone,
    street: defaultAddr.street,
    city: defaultAddr.city,
    postalCode: '11041',
    notes: '',
  });

  const [selectedWallet, setSelectedWallet] = useState<'kbzpay' | 'wavepay' | 'applepay' | 'googlepay' | 'card' | 'cod'>('kbzpay');
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  // Card fields
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('•••');

  // Calculations
  const subtotalUsd = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const subtotalMmk = cartItems.reduce((sum, item) => sum + item.product.priceMmk * item.quantity, 0);

  const discountRate = discountApplied ? 0.15 : 0;
  const discountUsd = subtotalUsd * discountRate;
  const discountMmk = subtotalMmk * discountRate;

  // Free shipping over K 350,000
  const shippingFeeUsd = subtotalUsd > 120 || subtotalUsd === 0 ? 0 : 15;
  const shippingFeeMmk = subtotalMmk > 350000 || subtotalMmk === 0 ? 0 : 45000;

  const totalUsd = subtotalUsd - discountUsd + shippingFeeUsd;
  const totalMmk = subtotalMmk - discountMmk + shippingFeeMmk;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'AYARVIP15' || couponCode.trim().toUpperCase() === 'VIP') {
      setDiscountApplied(true);
    }
  };

  const handleExecutePayment = (chosenWallet = selectedWallet) => {
    setIsProcessing(true);

    setTimeout(() => {
      const orderId = `AYR-${Math.floor(1000 + Math.random() * 9000)}`;
      const trackingNumber = `TRK-${Math.floor(10000 + Math.random() * 90000)}-MM`;

      const newOrder: Order = {
        id: orderId,
        trackingNumber,
        createdAt: new Date().toISOString(),
        items: [...cartItems],
        subtotal: currency === 'MMK' ? subtotalMmk : subtotalUsd,
        discount: currency === 'MMK' ? discountMmk : discountUsd,
        shippingFee: currency === 'MMK' ? shippingFeeMmk : shippingFeeUsd,
        total: currency === 'MMK' ? totalMmk : totalUsd,
        currency,
        status: 'confirmed',
        customer: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          notes: formData.notes,
        },
        payment: {
          method: chosenWallet,
          transactionId: `${chosenWallet.toUpperCase()}-TX-${Date.now().toString().slice(-8)}`,
          paidAt: new Date().toISOString(),
          last4: chosenWallet === 'card' ? '4242' : undefined,
          isEncrypted: true,
        },
        courier: {
          name: 'Ko Aung Myint',
          phone: '+95 9 799 888 123',
          vehicle: 'Express Electric Van #04',
          currentCoords: { lat: 16.8256, lng: 96.1432 },
          estimatedDelivery: 'Within 24 Hours',
        },
        trackingHistory: [
          {
            status: 'confirmed',
            label: 'Order Placed & Payment Confirmed',
            labelMm: 'အော်ဒါ အတည်ပြုပြီး ငွေပေးချေမှု အောင်မြင်ပါသည်',
            timestamp: 'Just now',
            location: 'Yangon Central Fulfillment',
            locationMm: 'ရန်ကုန် ပင်မဌာန',
            note: `Payment successfully verified via ${chosenWallet.toUpperCase()}. Order confirmed.`,
            noteMm: `${chosenWallet.toUpperCase()} ဖြင့် ငွေပေးချေမှု အောင်မြင်ပါသည်။`,
            completed: true,
            current: true,
          },
          {
            status: 'tailoring',
            label: 'Garment Steaming & Protective Packaging',
            labelMm: 'အထည်ထုတ်ပိုး ပြင်ဆင်နေပါသည်',
            timestamp: 'Queued',
            location: 'Ayar Artisan Atelier',
            locationMm: 'အထည်ချုပ်လုပ်ဌာန',
            note: 'Master tailors performing final silhouette inspection.',
            noteMm: 'အရည်အသွေး စစ်ဆေးထုတ်ပိုးပါမည်။',
            completed: false,
            current: false,
          },
          {
            status: 'dispatched',
            label: 'Dispatched from Fulfillment Center',
            labelMm: 'ဂိုဒေါင်မှ ထွက်ခွာပါပြီ',
            timestamp: 'Upcoming',
            location: 'Yangon Regional Sorting Depot',
            locationMm: 'ရန်ကုန် ဒေသန္တရ ဌာနခွဲ',
            note: 'Handed to courier for delivery route.',
            noteMm: 'ပို့ဆောင်ရေး လမ်းကြောင်းသို့ လွှဲပြောင်းပါမည်။',
            completed: false,
            current: false,
          },
        ],
      };

      // Confetti celebration
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#b45309', '#f59e0b', '#1c1917', '#10b981'],
        });
      } catch (e) {
        console.error(e);
      }

      setIsProcessing(false);
      setOrderSuccess(newOrder);
      onOrderCompleted(newOrder);
      onClearCart();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        id="modal-checkout"
        className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-stone-200"
      >
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-5 sm:p-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-900/60 rounded-lg text-amber-200 border border-amber-700/40">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-amber-100">
                {t.checkout.title}
              </h2>
              <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.checkout.securityNotice}</span>
              </p>
            </div>
          </div>
          <button
            id="btn-close-checkout"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {orderSuccess ? (
            /* Order Placed Success View */
            <div className="text-center py-8 space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-2xl font-serif font-bold text-stone-900">
                  {t.checkout.orderSuccess}
                </h3>
                <p className="text-sm text-stone-600 mt-1">
                  {t.checkout.orderSuccessSubtitle}{' '}
                  <span className="font-mono font-bold text-stone-900 text-base">
                    {orderSuccess.trackingNumber}
                  </span>
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-lg max-w-md mx-auto border border-stone-200 text-left text-xs space-y-2">
                <div className="flex justify-between text-stone-500">
                  <span>{language === 'mm' ? 'အော်ဒါနံပါတ်:' : 'Order Number:'}</span>
                  <span className="font-mono font-bold text-stone-800">#{orderSuccess.id}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>{language === 'mm' ? 'ငွေပေးချေမှုစနစ်:' : 'Payment Method:'}</span>
                  <span className="font-semibold text-stone-800 uppercase">
                    {orderSuccess.payment.method}
                  </span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>{language === 'mm' ? 'ငွေပေးချေမှု အထောက်အထား:' : 'Receipt Reference:'}</span>
                  <span className="font-mono text-stone-700">{orderSuccess.payment.transactionId}</span>
                </div>
                <div className="flex justify-between text-stone-800 font-bold border-t border-stone-200 pt-2 text-sm">
                  <span>{language === 'mm' ? 'ပေးချေပြီး စုစုပေါင်း:' : 'Total Paid:'}</span>
                  <span>{formatPrice(orderSuccess.total, orderSuccess.total, orderSuccess.currency)}</span>
                </div>
              </div>

              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {t.checkout.emailSentNotice} <strong>{orderSuccess.customer.email}</strong>.
              </p>

              <button
                id="btn-goto-tracking-success"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-semibold tracking-wide shadow transition-colors"
              >
                <span>{t.checkout.viewTracking}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Top 1-Click Express Digital Wallet Bar */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span>{t.checkout.expressTitle}</span>
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium">
                    {language === 'mm' ? 'ချက်ချင်း ငွေပေးချေနိုင်သည်' : 'Fast & Secure Checkout'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* KBZPay Express Button */}
                  <button
                    id="btn-1click-kbzpay"
                    onClick={() => {
                      setSelectedWallet('kbzpay');
                      handleExecutePayment('kbzpay');
                    }}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center p-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-all shadow-xs active:scale-98 border border-blue-700"
                  >
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-amber-300" />
                      <span className="font-bold text-xs">KBZPay</span>
                    </div>
                    <span className="text-[10px] text-blue-200 mt-0.5">1-Click QR Pay</span>
                  </button>

                  {/* WavePay Express Button */}
                  <button
                    id="btn-1click-wavepay"
                    onClick={() => {
                      setSelectedWallet('wavepay');
                      handleExecutePayment('wavepay');
                    }}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center p-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg transition-all shadow-xs active:scale-98 border border-amber-600"
                  >
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      <span className="font-bold text-xs">WavePay</span>
                    </div>
                    <span className="text-[10px] text-stone-900 font-medium mt-0.5">Instant Transfer</span>
                  </button>

                  {/* Apple Pay Express Button */}
                  <button
                    id="btn-1click-applepay"
                    onClick={() => {
                      setSelectedWallet('applepay');
                      handleExecutePayment('applepay');
                    }}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-all shadow-xs active:scale-98"
                  >
                    <div className="flex items-center gap-1.5">
                      <Fingerprint className="w-4 h-4 text-stone-300" />
                      <span className="font-bold text-xs">Apple Pay</span>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-0.5">Touch / Face ID</span>
                  </button>

                  {/* Google Pay Express Button */}
                  <button
                    id="btn-1click-googlepay"
                    onClick={() => {
                      setSelectedWallet('googlepay');
                      handleExecutePayment('googlepay');
                    }}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-stone-50 text-stone-900 rounded-lg transition-all shadow-xs active:scale-98 border border-stone-300"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-blue-600">G</span>
                      <span className="font-bold text-xs">Pay</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-0.5">1-Click Fast</span>
                  </button>
                </div>
              </div>

              {/* Delivery Details Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800">
                    {t.checkout.shippingInfo}
                  </h3>
                  <span className="text-xs text-stone-400">{t.checkout.orManual}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      {t.checkout.fullName}
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full text-xs p-2.5 rounded border border-stone-300 focus:outline-none focus:border-amber-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      {t.checkout.email}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-xs p-2.5 rounded border border-stone-300 focus:outline-none focus:border-amber-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      {t.checkout.phone}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs p-2.5 rounded border border-stone-300 focus:outline-none focus:border-amber-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      {t.checkout.city}
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full text-xs p-2.5 rounded border border-stone-300 focus:outline-none focus:border-amber-800"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      {t.checkout.street}
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="w-full text-xs p-2.5 rounded border border-stone-300 focus:outline-none focus:border-amber-800"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 mb-3">
                  {t.checkout.paymentMethod}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedWallet === 'kbzpay'
                        ? 'border-amber-800 bg-amber-50/60 ring-1 ring-amber-800'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wallet"
                      checked={selectedWallet === 'kbzpay'}
                      onChange={() => setSelectedWallet('kbzpay')}
                      className="text-amber-800"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-stone-900">KBZPay</div>
                      <div className="text-[10px] text-stone-500">QR & Direct</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedWallet === 'card'
                        ? 'border-amber-800 bg-amber-50/60 ring-1 ring-amber-800'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wallet"
                      checked={selectedWallet === 'card'}
                      onChange={() => setSelectedWallet('card')}
                      className="text-amber-800"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-stone-900">Credit / Debit Card</div>
                      <div className="text-[10px] text-stone-500">Visa / Mastercard</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedWallet === 'cod'
                        ? 'border-amber-800 bg-amber-50/60 ring-1 ring-amber-800'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wallet"
                      checked={selectedWallet === 'cod'}
                      onChange={() => setSelectedWallet('cod')}
                      className="text-amber-800"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-stone-900">{t.checkout.cod}</div>
                      <div className="text-[10px] text-stone-500">Pay on Handshake</div>
                    </div>
                  </label>
                </div>

                {/* Card Fields Preview if Card selected */}
                {selectedWallet === 'card' && (
                  <div className="mt-3 p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        {t.checkout.cardNumber}
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full text-xs p-2 rounded border border-stone-300 font-mono bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {t.checkout.expiry}
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full text-xs p-2 rounded border border-stone-300 font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                          {t.checkout.cvv}
                        </label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full text-xs p-2 rounded border border-stone-300 font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Promo Voucher Input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <Tag className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t.cart.couponPlaceholder}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded border border-stone-300 uppercase font-mono tracking-wider focus:outline-none focus:border-amber-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-stone-800 text-stone-200 text-xs font-semibold rounded hover:bg-stone-700"
                >
                  {t.cart.applyCoupon}
                </button>
              </div>
              {discountApplied && (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  ✓ {t.cart.couponApplied}
                </div>
              )}

              {/* Order Total Summary */}
              <div className="border-t border-stone-200 pt-4 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>{t.cart.subtotal}:</span>
                  <span className="font-semibold text-stone-900">
                    {formatPrice(subtotalUsd, subtotalMmk, currency)}
                  </span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>{t.cart.discount} (15%):</span>
                    <span>-{formatPrice(discountUsd, discountMmk, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t.cart.shipping}:</span>
                  <span className="font-semibold text-stone-900">
                    {shippingFeeMmk === 0 ? t.cart.freeShipping : formatPrice(shippingFeeUsd, shippingFeeMmk, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 border-t border-stone-200 pt-2">
                  <span>{t.cart.total}:</span>
                  <span>{formatPrice(totalUsd, totalMmk, currency)}</span>
                </div>
              </div>

              {/* Place Order Primary Action */}
              <button
                id="btn-complete-order-submit"
                onClick={() => handleExecutePayment()}
                disabled={isProcessing || cartItems.length === 0}
                className="w-full h-12 bg-amber-800 hover:bg-amber-700 text-white rounded-lg font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t.checkout.processing}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{t.checkout.completeOrder}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
