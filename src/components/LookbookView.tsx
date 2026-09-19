import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { Currency, Language, LookbookItem, Product } from '../types';
import { lookbookItems } from '../data/mockProducts';
import { formatPrice, translations } from '../data/translations';

interface LookbookViewProps {
  language: Language;
  currency: Currency;
  lowBandwidth: boolean;
  onSelectProductById: (productId: string) => void;
  products: Product[];
}

export const LookbookView: React.FC<LookbookViewProps> = ({
  language,
  currency,
  lowBandwidth,
  onSelectProductById,
  products,
}) => {
  const t = translations[language];
  const [activeLookbookIdx, setActiveLookbookIdx] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const currentLook = lookbookItems[activeLookbookIdx] || lookbookItems[0];
  const title = language === 'mm' ? currentLook.titleMm : currentLook.title;
  const season = language === 'mm' ? currentLook.seasonMm : currentLook.season;
  const description = language === 'mm' ? currentLook.descriptionMm : currentLook.description;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-amber-800 block mb-2">
          {season}
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          {t.lookbook.title}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
          {t.lookbook.subtitle}
        </p>
      </div>

      {/* Seasonal Collection Tabs */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {lookbookItems.map((item, idx) => (
          <button
            key={item.id}
            id={`lookbook-tab-${idx}`}
            onClick={() => {
              setActiveLookbookIdx(idx);
              setActiveHotspot(null);
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all ${
              activeLookbookIdx === idx
                ? 'bg-stone-900 text-amber-100 shadow-md scale-102'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            {language === 'mm' ? item.titleMm.split('•')[0] : item.title.split('•')[0]}
          </button>
        ))}
      </div>

      {/* Main Interactive Editorial Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editorial Photo with Hotspot Pins */}
        <div className="lg:col-span-8 relative aspect-[4/5] sm:aspect-[16/11] bg-stone-900 rounded-xl overflow-hidden shadow-2xl border border-stone-200">
          <img
            src={lowBandwidth ? currentLook.lowResImage : currentLook.image}
            alt={title}
            className="w-full h-full object-cover object-center"
          />

          {/* Dark gradient for atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent pointer-events-none" />

          {/* Interactive Hotspot Pins */}
          {currentLook.hotspots.map((spot, idx) => {
            const prod = products.find((p) => p.id === spot.productId);
            const isHovered = activeHotspot === spot.productId;
            const spotTitle = language === 'mm' ? spot.titleMm : spot.title;

            return (
              <div
                key={idx}
                className="absolute z-20"
                style={{ top: `${spot.yPercent}%`, left: `${spot.xPercent}%` }}
              >
                {/* Glowing Pulsing Pin */}
                <button
                  id={`hotspot-pin-${spot.productId}`}
                  onClick={() => onSelectProductById(spot.productId)}
                  onMouseEnter={() => setActiveHotspot(spot.productId)}
                  className="relative group/pin -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                  aria-label={`Shop ${spotTitle}`}
                >
                  <span className="absolute -inset-2 rounded-full bg-amber-400/40 animate-ping" />
                  <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white text-stone-900 shadow-xl border-2 border-amber-600 font-bold text-xs hover:scale-110 transition-transform">
                    +
                  </span>
                </button>

                {/* Hotspot Card Popover */}
                {isHovered && prod && (
                  <div
                    className="absolute top-8 left-1/2 -translate-x-1/2 w-56 p-3 bg-stone-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-stone-700 text-stone-100 z-30 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setActiveHotspot(null)}
                  >
                    <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-1">
                      {prod.category.replace('_', ' ')}
                    </div>
                    <div className="text-xs font-semibold text-white line-clamp-1">{spotTitle}</div>
                    <div className="text-xs font-bold text-amber-200 mt-1">
                      {formatPrice(prod.price, prod.priceMmk, currency)}
                    </div>
                    <button
                      onClick={() => onSelectProductById(spot.productId)}
                      className="mt-2 w-full py-1 px-2 bg-amber-700 hover:bg-amber-600 text-white rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>{t.lookbook.shopThisLook}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Bottom Overlay Info on Photo */}
          <div className="absolute bottom-6 left-6 right-6 text-white pointer-events-none">
            <span className="text-xs uppercase tracking-widest text-amber-300 font-semibold block">
              {season}
            </span>
            <h2 className="text-2xl font-serif font-bold tracking-tight">{title}</h2>
          </div>
        </div>

        {/* Right Editorial Sidebar: Story & Tagged Pieces */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs">
            <h3 className="font-serif font-bold text-lg text-stone-900 mb-2">{title}</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{description}</p>
            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-amber-800 font-medium">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t.lookbook.tagHint}</span>
            </div>
          </div>

          {/* Featured Garments in this Look */}
          <div className="bg-stone-50 p-6 rounded-xl border border-stone-200/80">
            <h4 className="text-xs uppercase tracking-wider font-bold text-stone-700 mb-4">
              {language === 'mm' ? 'ဤဖက်ရှင်တွင် ပါဝင်သော ဒီဇိုင်းများ' : 'Pieces Featured in this Look'}
            </h4>
            <div className="space-y-3">
              {currentLook.hotspots.map((spot) => {
                const prod = products.find((p) => p.id === spot.productId);
                if (!prod) return null;
                const spotTitle = language === 'mm' ? prod.nameMm : prod.name;

                return (
                  <div
                    key={spot.productId}
                    className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-stone-200/70 hover:border-amber-700 transition-colors group cursor-pointer"
                    onClick={() => onSelectProductById(spot.productId)}
                  >
                    <img
                      src={lowBandwidth ? prod.lowResImage : prod.images[0]}
                      alt={spotTitle}
                      className="w-14 h-18 object-cover rounded bg-stone-100 shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <div className="text-xs font-semibold text-stone-900 group-hover:text-amber-800 truncate">
                        {spotTitle}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {formatPrice(prod.price, prod.priceMmk, currency)}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 mt-1">
                        <span>{t.catalog.viewDetails}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
