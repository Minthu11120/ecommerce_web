import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag, Plus, Minus } from 'lucide-react';
import { CartItem, Currency, Language } from '../types';
import { formatPrice, translations } from '../data/translations';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  language: Language;
  currency: Currency;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onProceedToCheckout: () => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  language,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onClearCart,
}) => {
  if (!isOpen) return null;

  const t = translations[language];
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);

  const subtotalUsd = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const subtotalMmk = cartItems.reduce((sum, item) => sum + item.product.priceMmk * item.quantity, 0);

  const discountRate = discountApplied ? 0.15 : 0;
  const discountUsd = subtotalUsd * discountRate;
  const discountMmk = subtotalMmk * discountRate;

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          id="drawer-cart"
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-stone-200"
        >
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-800" />
              <h2 className="text-base font-bold font-serif text-stone-900">
                {t.cart.title} ({cartItems.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-stone-200 text-stone-500 hover:text-stone-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-stone-100">
            {cartItems.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-stone-500 font-medium">{t.cart.empty}</p>
              </div>
            ) : (
              cartItems.map((item, idx) => {
                const title = language === 'mm' ? item.product.nameMm : item.product.name;
                return (
                  <div key={idx} className="pt-4 first:pt-0 flex gap-3.5">
                    <img
                      src={item.product.images[0]}
                      alt={title}
                      className="w-16 h-20 object-cover rounded bg-stone-100 shrink-0"
                    />

                    <div className="flex-grow flex flex-col justify-between text-xs">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-stone-900 line-clamp-1">{title}</h4>
                          <button
                            onClick={() => onRemoveItem(idx)}
                            className="text-stone-400 hover:text-rose-600 ml-2"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-stone-500 mt-0.5">
                          Size: <span className="font-semibold text-stone-700">{item.selectedSize}</span> •{' '}
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full align-middle border border-stone-300 ml-0.5"
                            style={{ backgroundColor: item.selectedColor.hex }}
                          />{' '}
                          {language === 'mm' ? item.selectedColor.nameMm : item.selectedColor.name}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Increment/Decrement */}
                        <div className="flex items-center border border-stone-200 rounded bg-stone-50">
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                            className="p-1 hover:bg-stone-200 text-stone-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                            className="p-1 hover:bg-stone-200 text-stone-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-bold text-stone-900 text-xs">
                          {formatPrice(
                            item.product.price * item.quantity,
                            item.product.priceMmk * item.quantity,
                            currency
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-stone-200 bg-stone-50/80 space-y-3">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.cart.couponPlaceholder}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-grow text-xs px-3 py-1.5 bg-white border border-stone-300 rounded font-mono uppercase"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-stone-800 text-stone-100 text-xs font-semibold rounded hover:bg-stone-700"
                >
                  {t.cart.applyCoupon}
                </button>
              </form>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 pt-1">
                <div className="flex justify-between">
                  <span>{t.cart.subtotal}</span>
                  <span className="font-semibold text-stone-900">
                    {formatPrice(subtotalUsd, subtotalMmk, currency)}
                  </span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>{t.cart.discount} (15%)</span>
                    <span>-{formatPrice(discountUsd, discountMmk, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t.cart.shipping}</span>
                  <span className="font-semibold text-stone-900">
                    {shippingFeeMmk === 0 ? t.cart.freeShipping : formatPrice(shippingFeeUsd, shippingFeeMmk, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 border-t border-stone-200 pt-2">
                  <span>{t.cart.total}</span>
                  <span>{formatPrice(totalUsd, totalMmk, currency)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                id="btn-proceed-to-checkout"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full h-11 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-all active:scale-98"
              >
                <span>{t.cart.checkoutBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-stone-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted 1-Click Payments (KBZPay, WavePay, Apple Pay)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
