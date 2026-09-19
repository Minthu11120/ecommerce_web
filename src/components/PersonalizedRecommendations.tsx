import React from 'react';
import { Sparkles, History, ArrowRight } from 'lucide-react';
import { Currency, Language, Product, UserProfile } from '../types';
import { formatPrice, translations } from '../data/translations';

interface PersonalizedRecommendationsProps {
  products: Product[];
  userProfile: UserProfile;
  language: Language;
  currency: Currency;
  lowBandwidth: boolean;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  products,
  userProfile,
  language,
  currency,
  lowBandwidth,
  onSelectProduct,
  onQuickAdd,
}) => {
  const t = translations[language];

  // Derive top affinities from browsing history
  const history = userProfile.browsingHistory || [];
  const recentProductIds = history.map((h) => h.productId);
  const mostRecentProduct = products.find((p) => p.id === recentProductIds[0]);

  // Find category preferences
  const categoryCounts: Record<string, number> = {};
  history.forEach((h) => {
    categoryCounts[h.category] = (categoryCounts[h.category] || 0) + 1;
  });

  const preferredCategories = Object.keys(categoryCounts).sort(
    (a, b) => categoryCounts[b] - categoryCounts[a]
  );

  // Recommended products based on category affinity, excluding what's already prominently viewed if possible
  const recommended = products
    .filter((p) => preferredCategories.length === 0 || preferredCategories.includes(p.category))
    .slice(0, 4);

  // If no recommendations yet, fall back to featured products
  const finalRecommended = recommended.length > 0 ? recommended : products.slice(0, 4);

  // Recently viewed list
  const recentlyViewedProducts = history
    .map((h) => products.find((p) => p.id === h.productId))
    .filter((p): p is Product => p !== undefined)
    .slice(0, 4);

  return (
    <div className="my-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Primary Personalized Recommendations */}
      <div className="bg-stone-100/70 rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-amber-800 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{t.recommendations.title}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              {mostRecentProduct
                ? t.recommendations.becauseYouViewed.replace(
                    '{item}',
                    language === 'mm' ? mostRecentProduct.nameMm : mostRecentProduct.name
                  )
                : t.recommendations.subtitle}
            </h2>
          </div>
          <span className="text-xs text-stone-500 bg-white px-3 py-1.5 rounded-full border border-stone-200 self-start sm:self-center">
            {language === 'mm' ? 'စနစ်မှ သင့်အတွက် အလိုအလျောက် ရွေးချယ်မှု' : 'Adaptive Style Matching Engine'}
          </span>
        </div>

        {/* Product Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {finalRecommended.map((product) => {
            const title = language === 'mm' ? product.nameMm : product.name;
            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group bg-white rounded-lg p-3 border border-stone-200/70 hover:border-amber-700 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="aspect-[3/4] w-full rounded overflow-hidden bg-stone-100 mb-3 relative">
                  <img
                    src={lowBandwidth ? product.lowResImage : product.images[0]}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 bg-stone-900/80 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold">
                    {product.category.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-stone-900 line-clamp-1 group-hover:text-amber-800">
                    {title}
                  </h4>
                  <div className="text-xs font-bold text-stone-800 mt-1">
                    {formatPrice(product.price, product.priceMmk, currency)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recently Viewed Strip */}
      {recentlyViewedProducts.length > 0 && (
        <div className="border-t border-stone-200 pt-8">
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <History className="w-4 h-4 text-stone-500" />
            <span>{t.recommendations.recentlyViewed}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentlyViewedProducts.map((p) => {
              const pTitle = language === 'mm' ? p.nameMm : p.name;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white border border-stone-200/60 hover:border-stone-400 cursor-pointer transition-colors"
                >
                  <img
                    src={lowBandwidth ? p.lowResImage : p.images[0]}
                    alt={pTitle}
                    className="w-12 h-16 object-cover rounded bg-stone-100 shrink-0"
                  />
                  <div className="min-w-0 flex-grow">
                    <p className="text-xs font-medium text-stone-800 truncate">{pTitle}</p>
                    <p className="text-[11px] font-bold text-stone-900 mt-0.5">
                      {formatPrice(p.price, p.priceMmk, currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
