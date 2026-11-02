import React, { useState } from 'react';
import { X, Star, ShieldCheck, Heart, Truck, RotateCcw, Check, Sparkles, Zap, ShoppingBag, CreditCard, Bot } from 'lucide-react';
import { Currency, Language, Product, UserProfile } from '../types';
import { formatPrice, translations } from '../data/translations';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  language: Language;
  currency: Currency;
  lowBandwidth: boolean;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (product: Product, size: string, color: { name: string; nameMm: string; hex: string }, quantity: number) => void;
  onOneClickBuy: (product: Product, size: string, color: { name: string; nameMm: string; hex: string }) => void;
  userProfile: UserProfile;
  onOrderViaTelegram?: (product: Product, size: string, color: { name: string; nameMm: string; hex: string }) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  language,
  currency,
  lowBandwidth,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onOneClickBuy,
  userProfile,
  onOrderViaTelegram,
}) => {
  if (!product) return null;

  const t = translations[language];
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Compute smart size recommendation based on user measurements
  const recommendSize = () => {
    const { chest, unit } = userProfile.measurements;
    const chestCm = unit === 'in' ? chest * 2.54 : chest;
    if (chestCm < 88) return 'S';
    if (chestCm < 98) return 'M';
    if (chestCm < 108) return 'L';
    return 'XL';
  };

  const suggestedSize = recommendSize();

  const handleAdd = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const title = language === 'mm' ? product.nameMm : product.name;
  const description = language === 'mm' ? product.descriptionMm : product.description;
  const fabric = language === 'mm' ? product.fabricMm : product.fabric;
  const care = language === 'mm' ? product.careGuideMm : product.careGuide;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        id="modal-product-detail"
        className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col md:flex-row border border-stone-200"
      >
        {/* Close Button */}
        <button
          id="btn-close-product-detail"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-stone-900/80 text-white hover:bg-stone-900 transition-transform active:scale-95"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Gallery Column */}
        <div className="md:w-1/2 bg-stone-100 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto">
          <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-stone-200 shadow-inner">
            <img
              src={lowBandwidth ? product.lowResImage : product.images[selectedImageIdx] || product.images[0]}
              alt={title}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            {lowBandwidth && (
              <div className="absolute top-3 left-3 bg-emerald-900/90 text-emerald-200 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow">
                <Zap className="w-3.5 h-3.5" />
                <span>Lite Mode Optimized (SVG/WebP)</span>
              </div>
            )}
          </div>

          {/* Thumbnails if multiple images & not low-bandwidth */}
          {!lowBandwidth && product.images.length > 1 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-14 h-18 rounded border-2 overflow-hidden shrink-0 transition-all ${
                    selectedImageIdx === idx ? 'border-amber-800 ring-2 ring-amber-800/20' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Purchase Controls */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh]">
          <div>
            {/* Category & Rating */}
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span className="uppercase tracking-widest font-semibold text-amber-900">
                {product.category.replace('_', ' ')} • SKU: {product.sku}
              </span>
              <div className="flex items-center gap-1 text-stone-700">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold">{product.rating}</span>
                <span className="text-stone-400">({product.reviewsCount} {t.catalog.reviews})</span>
              </div>
            </div>

            {/* Title & Price */}
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 tracking-tight">
              {title}
            </h2>

            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-stone-900">
                {formatPrice(product.price, product.priceMmk, currency)}
              </span>
            </div>

            <p className="mt-3 text-sm text-stone-600 leading-relaxed">{description}</p>

            {/* Sizing & Fit Advisor */}
            <div className="mt-5 p-3 rounded-lg bg-amber-50/70 border border-amber-200/70 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <span className="font-semibold">{t.productDetail.sizeGuide}: </span>
                {t.productDetail.fitRecommendation} <strong className="underline font-bold text-amber-950">Size {suggestedSize}</strong> ({userProfile.measurements.chest}cm chest profile).
              </div>
            </div>

            {/* Size Selector */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  {t.productDetail.selectSize}
                </span>
                <span className="text-xs text-stone-400">Selected: {selectedSize}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    id={`btn-size-${sz}`}
                    onClick={() => setSelectedSize(sz)}
                    className={`min-w-[44px] h-10 px-3 rounded text-xs font-semibold tracking-wide border transition-all ${
                      selectedSize === sz
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-300 hover:border-stone-500'
                    }`}
                  >
                    {sz}
                    {sz === suggestedSize && <span className="ml-1 text-[9px] text-amber-300">★</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  {t.productDetail.selectColor}
                </span>
                <span className="text-xs text-stone-500">
                  {language === 'mm' ? selectedColor.nameMm : selectedColor.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {product.colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all p-0.5 ${
                      selectedColor.hex === c.hex ? 'border-amber-800 ring-2 ring-amber-800/30 scale-105' : 'border-stone-300 hover:scale-105'
                    }`}
                    title={language === 'mm' ? c.nameMm : c.name}
                  >
                    <span className="block w-full h-full rounded-full" style={{ backgroundColor: c.hex }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Fabric & Care Accordion */}
            <div className="mt-5 space-y-2 border-t border-stone-200 pt-3 text-xs text-stone-600">
              <div>
                <span className="font-semibold text-stone-800">{t.productDetail.fabricDetails}:</span>{' '}
                {fabric}
              </div>
              <div>
                <span className="font-semibold text-stone-800">{t.productDetail.careGuide}:</span>{' '}
                {care}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-stone-200 space-y-2.5">
            <div className="flex items-center gap-3">
              {/* Quantity */}
              <div className="flex items-center border border-stone-300 rounded h-11 bg-stone-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-stone-600 hover:bg-stone-200 text-sm font-semibold"
                >
                  -
                </button>
                <span className="px-2 text-sm font-semibold text-stone-800 min-w-[28px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-1 text-stone-600 hover:bg-stone-200 text-sm font-semibold"
                >
                  +
                </button>
              </div>

              {/* Add to Bag */}
              <button
                id="btn-modal-add-to-bag"
                onClick={handleAdd}
                className="flex-1 h-11 bg-stone-900 hover:bg-stone-800 text-white rounded font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors active:scale-98 shadow-sm"
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t.productDetail.addToBag}</span>
                  </>
                )}
              </button>

              {/* Wishlist */}
              <button
                id="btn-modal-toggle-wishlist"
                onClick={() => onToggleWishlist(product.id)}
                className="h-11 w-11 flex items-center justify-center border border-stone-300 rounded hover:bg-stone-50 text-stone-700 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            </div>

            {/* 1-Click Fast Checkout Button */}
            <button
              id="btn-modal-1click-buy"
              onClick={() => onOneClickBuy(product, selectedSize, selectedColor)}
              className="w-full h-11 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t.productDetail.buyNow} (KBZPay / Apple Pay / Cards)</span>
            </button>

            {/* Telegram Bot Order Button */}
            {onOrderViaTelegram && (
              <button
                id="btn-modal-telegram-buy"
                onClick={() => onOrderViaTelegram(product, selectedSize, selectedColor)}
                className="w-full h-10 bg-[#2481cc]/10 hover:bg-[#2481cc]/20 border border-[#2481cc]/40 text-[#1d70b3] hover:text-[#125387] rounded font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Bot className="w-4 h-4 text-[#2481cc]" />
                <span className="font-myanmar">{t.telegram.orderViaBot} (@AyarAtelier_bot)</span>
              </button>
            )}

            <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 pt-1">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-stone-400" /> Express Dispatch
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-bit Encrypted
              </span>
              <span className="flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-stone-400" /> 14-day Free Returns
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
