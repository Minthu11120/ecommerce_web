import React, { useState } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import { Currency, Language, Order, OrderStatus } from '../types';
import { formatPrice, translations } from '../data/translations';

interface OrderTrackingViewProps {
  orders: Order[];
  language: Language;
  currency: Currency;
  onAdvanceOrderStep: (orderId: string) => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orders,
  language,
  currency,
  onAdvanceOrderStep,
}) => {
  const t = translations[language];

  // Default to first order or latest order
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || 'AYR-8921');

  const currentOrder =
    orders.find(
      (o) =>
        o.id.toLowerCase() === selectedOrderId.toLowerCase() ||
        o.trackingNumber.toLowerCase() === selectedOrderId.toLowerCase()
    ) || orders[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = orders.find(
      (o) =>
        o.id.toLowerCase() === searchQuery.trim().toLowerCase() ||
        o.trackingNumber.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (found) {
      setSelectedOrderId(found.id);
    }
  };

  const stepsList: { key: OrderStatus; label: string; labelMm: string; icon: React.ReactNode }[] = [
    { key: 'confirmed', label: 'Order Confirmed', labelMm: 'အော်ဒါအတည်ပြုပြီး', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'tailoring', label: 'Quality Tailoring', labelMm: 'စစ်ဆေးထုတ်ပိုးခြင်း', icon: <Package className="w-4 h-4" /> },
    { key: 'dispatched', label: 'Dispatched Hub', labelMm: 'ဂိုဒေါင်မှ ထွက်ခွာ', icon: <Truck className="w-4 h-4" /> },
    { key: 'transit', label: 'In Regional Transit', labelMm: 'နယ်မြေခွဲသို့ ပို့ဆောင်', icon: <Navigation className="w-4 h-4" /> },
    { key: 'out_for_delivery', label: 'Out for Delivery', labelMm: 'လာရောက်ပို့ဆောင်နေ', icon: <MapPin className="w-4 h-4" /> },
    { key: 'delivered', label: 'Delivered & Signed', labelMm: 'ပစ္စည်းလက်ခံရရှိ', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const getStepIndex = (status: OrderStatus) => {
    return stepsList.findIndex((s) => s.key === status);
  };

  const currentStepIdx = currentOrder ? getStepIndex(currentOrder.status) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-amber-800 block mb-1">
          {language === 'mm' ? 'ပို့ဆောင်မှု အချိန်နှင့်တပြေးညီ ကြည့်ရန်' : 'Live Delivery Status'}
        </span>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
          {t.tracking.title}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-600">{t.tracking.subtitle}</p>

        {/* Tracking Search Input */}
        <form onSubmit={handleSearch} className="mt-6 flex items-center max-w-md mx-auto gap-2">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.tracking.searchPrompt}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-amber-800 shadow-2xs font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors"
          >
            {t.tracking.searchBtn}
          </button>
        </form>

        {/* Quick order switcher if multiple orders */}
        {orders.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-stone-500">
            <span>{language === 'mm' ? 'လတ်တလော အော်ဒါများ:' : 'Recent Orders:'}</span>
            {orders.map((ord) => (
              <button
                key={ord.id}
                onClick={() => setSelectedOrderId(ord.id)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                  selectedOrderId === ord.id
                    ? 'bg-amber-800 text-white'
                    : 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                }`}
              >
                #{ord.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {currentOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Status Progression & Timeline */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Order Metadata Card */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4 mb-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                    {language === 'mm' ? 'အော်ဒါနံပါတ်' : 'Order Number'}
                  </span>
                  <div className="text-xl font-bold font-mono text-stone-900">
                    #{currentOrder.id}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                    {language === 'mm' ? 'ခြေရာခံကုဒ်' : 'Tracking Code'}
                  </span>
                  <div className="text-sm font-bold font-mono text-amber-900">
                    {currentOrder.trackingNumber}
                  </div>
                </div>
              </div>

              {/* Status Stepper Progress Bar */}
              <div className="relative my-6 px-2">
                <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-700 transition-all duration-700 rounded-full"
                    style={{
                      width: `${((currentStepIdx + 1) / stepsList.length) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between mt-3">
                  {stepsList.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center text-center max-w-[65px]"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                            isCurrent
                              ? 'bg-amber-800 text-white ring-4 ring-amber-100 shadow-xs'
                              : isCompleted
                              ? 'bg-stone-900 text-stone-100'
                              : 'bg-stone-100 text-stone-400 border border-stone-200'
                          }`}
                        >
                          {step.icon}
                        </div>
                        <span
                          className={`text-[9px] mt-1.5 leading-tight font-medium ${
                            isCurrent
                              ? 'text-amber-900 font-bold'
                              : isCompleted
                              ? 'text-stone-800'
                              : 'text-stone-400'
                          }`}
                        >
                          {language === 'mm' ? step.labelMm : step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advance Step Action for Demonstration */}
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-stone-600">
                  <span className="font-semibold text-stone-800">
                    {language === 'mm' ? 'လက်ရှိအခြေအနေ: ' : 'Current Status: '}
                  </span>
                  <span className="uppercase text-amber-800 font-bold">
                    {t.tracking.statusLabels[currentOrder.status]}
                  </span>
                </div>
                {currentOrder.status !== 'delivered' && (
                  <button
                    id="btn-advance-tracking-step"
                    onClick={() => onAdvanceOrderStep(currentOrder.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold rounded shadow-2xs transition-all active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t.tracking.advanceStep}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Historical Milestone Feed */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 mb-4">
                {t.tracking.milestones}
              </h3>
              <div className="relative pl-6 space-y-6 border-l-2 border-stone-200">
                {currentOrder.trackingHistory.map((history, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                        history.completed
                          ? 'border-amber-700 bg-amber-700'
                          : 'border-stone-300'
                      }`}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <h4 className="text-xs font-bold text-stone-900">
                        {language === 'mm' ? history.labelMm : history.label}
                      </h4>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {history.timestamp}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>{language === 'mm' ? history.locationMm : history.location}</span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      {language === 'mm' ? history.noteMm : history.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Courier Delivery & Live Map */}
          <div className="lg:col-span-5 space-y-6">
            {/* Courier Profile Card */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center font-bold text-lg">
                  {currentOrder.courier.name.charAt(3) || 'K'}
                </div>
                <div className="flex-grow">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    {t.tracking.courierAssigned}
                  </span>
                  <h4 className="text-sm font-bold text-stone-900">{currentOrder.courier.name}</h4>
                  <p className="text-xs text-stone-500">{currentOrder.courier.vehicle}</p>
                </div>
                <a
                  href={`tel:${currentOrder.courier.phone}`}
                  className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-700"
                  title={language === 'mm' ? 'ပို့ဆောင်သူထံ ဖုန်းခေါ်မည်' : 'Call Courier'}
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500">{t.tracking.estimatedArrival}:</span>
                <span className="font-bold text-amber-900">
                  {currentOrder.courier.estimatedDelivery}
                </span>
              </div>
            </div>

            {/* Live Delivery Map Graphic */}
            <div className="bg-stone-900 rounded-xl overflow-hidden shadow-lg border border-stone-800 text-white">
              <div className="p-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium text-stone-300">
                    {language === 'mm' ? 'တိုက်ရိုက် ပို့ဆောင်မှု မြေပုံ' : 'Live Delivery Map'}
                  </span>
                </div>
                <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded text-emerald-400 font-medium">
                  {language === 'mm' ? 'လမ်းကြောင်း အချိန်နှင့်တပြေးညီ' : 'Real-Time Updates'}
                </span>
              </div>

              {/* Visual Map Render (Yangon Grid Simulation) */}
              <div className="relative h-60 bg-stone-800 overflow-hidden flex items-center justify-center">
                {/* SVG Street Grid Lines */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f5f5f4" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Lake Inya & River Contour */}
                <div className="absolute top-10 right-14 w-28 h-20 bg-blue-900/30 rounded-full blur-xs pointer-events-none" />
                <span className="absolute top-14 right-20 text-[10px] text-blue-300/60 font-mono uppercase">
                  Inya Lake
                </span>

                {/* Destination Pin */}
                <div className="absolute bottom-12 right-16 flex flex-col items-center z-10">
                  <div className="p-1.5 bg-rose-600 text-white rounded-full shadow-lg">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold bg-stone-900/90 px-1.5 py-0.5 rounded mt-1">
                    {language === 'mm' ? 'ပို့ဆောင်မည့်နေရာ:' : 'Destination:'} {currentOrder.customer.city}
                  </span>
                </div>

                {/* Courier Moving Vehicle Pin */}
                <div
                  className="absolute z-20 flex flex-col items-center transition-all duration-1000"
                  style={{
                    top: currentOrder.status === 'out_for_delivery' ? '45%' : '30%',
                    left: currentOrder.status === 'out_for_delivery' ? '50%' : '35%',
                  }}
                >
                  <div className="relative">
                    <span className="absolute -inset-2 rounded-full bg-amber-400/40 animate-ping" />
                    <div className="relative p-2 bg-amber-500 text-stone-950 rounded-full shadow-xl">
                      <Truck className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-stone-950/90 text-amber-300 px-2 py-0.5 rounded shadow mt-1 border border-stone-700">
                    {currentOrder.courier.name}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-stone-950 text-xs text-stone-400 flex items-center justify-between">
                <span>
                  {language === 'mm'
                    ? 'လမ်းကြောင်း: ရန်ကုန်ဗဟိုဂိုဒေါင် ➔ ကမာရွတ် / အင်းယား'
                    : 'Route: Yangon Central Hub ➔ Kamayut / Inya'}
                </span>
                <span className="text-emerald-400 font-medium">
                  {language === 'mm' ? 'ပုံမှန် ပို့ဆောင်နေပါသည်' : 'On Schedule'}
                </span>
              </div>
            </div>

            {/* Itemized Order Package Details */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
              <h4 className="text-xs uppercase tracking-wider font-bold text-stone-700 mb-3">
                {language === 'mm' ? 'ပါဝင်သော ပစ္စည်းများ' : 'Package Contents'} ({currentOrder.items.length}{' '}
                {language === 'mm' ? 'ထည်' : 'items'})
              </h4>
              <div className="space-y-3">
                {currentOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-12 h-14 object-cover rounded bg-stone-100"
                    />
                    <div className="min-w-0 flex-grow text-xs">
                      <div className="font-semibold text-stone-900 truncate">
                        {language === 'mm' ? item.product.nameMm : item.product.name}
                      </div>
                      <div className="text-stone-500 mt-0.5">
                        {language === 'mm' ? 'ဆိုဒ်:' : 'Size:'} {item.selectedSize} •{' '}
                        {language === 'mm' ? 'အရေအတွက်:' : 'Qty:'} {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
          <Package className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <p className="text-sm text-stone-600">
            {language === 'mm' ? 'အော်ဒါ ခြေရာခံမှတ်တမ်း မတွေ့ရှိပါ' : 'No active tracking records found.'}
          </p>
        </div>
      )}
    </div>
  );
};
