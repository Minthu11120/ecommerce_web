import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { Currency, Language, Product } from '../types';
import { formatPrice, translations } from '../data/translations';

interface WishlistViewProps {
  wishlistIds: string[];
  products: Product[];
  language: Language;
  currency: Currency;
  lowBandwidth: boolean;
  onRemoveFromWishlist: (id: string) => void;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
  onExploreCatalog: () => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlistIds,
  products,
  language,
  currency,
  lowBandwidth,
  onRemoveFromWishlist,
  onSelectProduct,
  onQuickAdd,
  onExploreCatalog,
}) => {
  const t = translations[language];
  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-stone-200 pb-6 mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-amber-800 block mb-1">
            {language === 'mm' ? 'သင်ရွေးချယ်ထားသော ဖက်ရှင်များ' : 'Curated Favorites'}
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
            {t.wishlist.title} ({wishlistedProducts.length})
          </h1>
        </div>

        {wishlistedProducts.length > 0 && (
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert(language === 'mm' ? 'Wishlist လင့်ခ် ကူးယူပြီးပါပြီ!' : 'Wishlist link copied to clipboard!');
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3.5 py-2 rounded-lg transition-colors self-start"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Collection</span>
          </button>
        )}
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">{t.wishlist.empty}</h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mb-6">
            {t.wishlist.emptySubtitle}
          </p>
          <button
            onClick={onExploreCatalog}
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-colors"
          >
            <span>{t.wishlist.exploreBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map((prod) => {
            const title = language === 'mm' ? prod.nameMm : prod.name;
            return (
              <div
                key={prod.id}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
                  <img
                    src={lowBandwidth ? prod.lowResImage : prod.images[0]}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onRemoveFromWishlist(prod.id)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 text-rose-600 hover:bg-rose-50 shadow-sm transition-transform active:scale-90"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 flex flex-col flex-grow justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-amber-800 tracking-wider">
                      {prod.category.replace('_', ' ')}
                    </span>
                    <h4
                      onClick={() => onSelectProduct(prod)}
                      className="text-sm font-semibold text-stone-900 hover:text-amber-800 cursor-pointer truncate mt-0.5"
                    >
                      {title}
                    </h4>
                    <div className="text-sm font-bold text-stone-900 mt-1">
                      {formatPrice(prod.price, prod.priceMmk, currency)}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex gap-2">
                    <button
                      onClick={() => onQuickAdd(prod)}
                      className="flex-1 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{t.wishlist.moveToBag}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
