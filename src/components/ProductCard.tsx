import React from 'react';
import { Heart, Eye, ShoppingBag, Star, Zap } from 'lucide-react';
import { Currency, Language, Product } from '../types';
import { formatPrice, translations } from '../data/translations';

interface ProductCardProps {
  product: Product;
  language: Language;
  currency: Currency;
  lowBandwidth: boolean;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  language,
  currency,
  lowBandwidth,
  isWishlisted,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd,
}) => {
  const t = translations[language];
  const title = language === 'mm' ? product.nameMm : product.name;
  const tagline = language === 'mm' ? product.taglineMm : product.tagline;

  const displayImage = lowBandwidth ? product.lowResImage : product.images[0];

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative flex flex-col bg-white rounded-lg overflow-hidden border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-300"
    >
      {/* Image Container with Badges */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        <img
          src={displayImage}
          alt={title}
          loading="lazy"
          className={`h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-103 ${
            lowBandwidth ? 'filter contrast-105' : ''
          }`}
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.isNew && (
            <span className="bg-stone-900/90 backdrop-blur-xs text-amber-200 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded">
              {language === 'mm' ? 'အသစ်' : 'New Season'}
            </span>
          )}
          {product.stock <= 8 && product.stock > 0 && (
            <span className="bg-rose-900/90 backdrop-blur-xs text-rose-100 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded">
              {language === 'mm' ? `လက်ကျန် ${product.stock} ထည်` : `Only ${product.stock} left`}
            </span>
          )}
          {lowBandwidth && (
            <span className="bg-emerald-900/80 backdrop-blur-xs text-emerald-200 text-[9px] font-medium px-1.5 py-0.5 rounded inline-flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Lite WebP
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          id={`wishlist-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-xs shadow-sm hover:bg-white text-stone-700 transition-transform active:scale-90 hover:text-rose-600 z-10"
          aria-label="Toggle Wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-stone-700'
            }`}
          />
        </button>

        {/* Floating Quick Action Overlay */}
        <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            id={`quick-view-${product.id}`}
            onClick={() => onSelectProduct(product)}
            className="flex-1 bg-stone-900/90 backdrop-blur-xs hover:bg-stone-900 text-stone-100 py-2 px-3 rounded text-xs font-medium tracking-wide flex items-center justify-center gap-1.5 transition-colors shadow"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.catalog.quickView}</span>
          </button>
          <button
            id={`quick-add-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product);
            }}
            className="bg-amber-700/90 hover:bg-amber-600 text-white p-2 rounded text-xs transition-colors shadow flex items-center justify-center"
            title={t.catalog.addToBag}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content & Details */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="uppercase tracking-wider text-[10px] font-medium text-amber-800">
              {product.category.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-1 text-stone-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-xs text-stone-700">{product.rating}</span>
              <span className="text-[10px] text-stone-400">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3
            onClick={() => onSelectProduct(product)}
            className="font-medium text-stone-900 text-sm hover:text-amber-800 cursor-pointer line-clamp-1 transition-colors"
          >
            {title}
          </h3>

          {/* Tagline */}
          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{tagline}</p>
        </div>

        {/* Sizes & Colors Preview */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {product.colors.slice(0, 3).map((col, idx) => (
              <span
                key={idx}
                className="w-3 h-3 rounded-full border border-stone-300 shadow-2xs"
                style={{ backgroundColor: col.hex }}
                title={language === 'mm' ? col.nameMm : col.name}
              />
            ))}
            {product.colors.length > 3 && (
              <span className="text-[10px] text-stone-400 font-mono">+{product.colors.length - 3}</span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium">
            {product.sizes.map((s) => (
              <span key={s} className="px-1 py-0.5 bg-stone-100 rounded text-stone-600">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Price display */}
        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="text-base font-semibold text-stone-900 tracking-tight">
              {formatPrice(product.price, product.priceMmk, currency)}
            </span>
          </div>

          <button
            id={`card-details-btn-${product.id}`}
            onClick={() => onSelectProduct(product)}
            className="text-xs font-semibold text-amber-900 hover:text-amber-700 underline underline-offset-2"
          >
            {t.catalog.viewDetails}
          </button>
        </div>
      </div>
    </div>
  );
};
