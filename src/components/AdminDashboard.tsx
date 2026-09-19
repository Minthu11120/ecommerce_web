import React, { useState } from 'react';
import {
  SlidersHorizontal,
  TrendingUp,
  Package,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  DollarSign,
  Users,
  Clock,
  Download,
  Store,
} from 'lucide-react';
import { Currency, InventoryLog, Language, Order, Product } from '../types';
import { formatPrice, translations } from '../data/translations';
import { AddProductModal } from './AddProductModal';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  inventoryLogs: InventoryLog[];
  language: Language;
  currency: Currency;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  onAddNewProduct: (prod: Product) => void;
  onSimulateSampleOrder: () => void;
  onBackToStorefront?: () => void;
  activeTab?: 'inventory' | 'analytics' | 'audit';
  onTabChange?: (tab: 'inventory' | 'analytics' | 'audit') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  inventoryLogs,
  language,
  currency,
  onUpdateProductStock,
  onAddNewProduct,
  onSimulateSampleOrder,
  onBackToStorefront,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const t = translations[language];
  const [internalTab, setInternalTab] = useState<'inventory' | 'analytics' | 'audit'>('inventory');
  const activeTab = controlledTab || internalTab;
  const setActiveTab = (tab: 'inventory' | 'analytics' | 'audit') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [inventorySearch, setInventorySearch] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Computed metrics
  const totalRevenueMmk = orders.reduce((sum, o) => sum + (o.currency === 'MMK' ? o.total : o.total * 3000), 0);
  const totalRevenueUsd = totalRevenueMmk / 3000;

  const inventoryValueMmk = products.reduce((sum, p) => sum + p.priceMmk * p.stock, 0);
  const inventoryValueUsd = inventoryValueMmk / 3000;

  const lowStockCount = products.filter((p) => p.stock < 10).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(inventorySearch.toLowerCase());
    if (filterLowStockOnly) {
      return matchesSearch && p.stock < 10;
    }
    return matchesSearch;
  });

  const handleExportCsvReport = () => {
    const headers = language === 'mm'
      ? ['ပစ္စည်းကုဒ်', 'ပစ္စည်းအမည်', 'အမျိုးအစား', 'လက်ကျန်အရေအတွက်', 'စျေးနှုန်း (ကျပ်)', 'လက်ကျန်တန်ဖိုးစုစုပေါင်း (ကျပ်)']
      : ['Item Code', 'Product Name', 'Category', 'Stock Level', 'Unit Price (MMK)', 'Total Stock Value (MMK)'];
    const rows = products.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.stock,
      p.priceMmk,
      p.priceMmk * p.stock,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ayar_atelier_sales_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-amber-800">
              {t.admin.tag}
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{t.admin.systemStatus}</span>
              <span className="text-emerald-600 font-normal">({t.admin.allSystemsNormal})</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
            {t.admin.title}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">{t.admin.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onBackToStorefront && (
            <button
              id="btn-admin-header-back-store"
              onClick={onBackToStorefront}
              className="px-3.5 py-2 bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors active:scale-98"
            >
              <Store className="w-3.5 h-3.5 text-amber-200" />
              <span>{t.admin.backToStore}</span>
            </button>
          )}

          <button
            id="btn-top-add-product"
            onClick={() => setShowAddProductModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.admin.addNewProduct}</span>
          </button>

          <button
            id="btn-simulate-order"
            onClick={onSimulateSampleOrder}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
            <span>{t.admin.generateSampleOrder}</span>
          </button>

          <button
            id="btn-export-csv-report"
            onClick={handleExportCsvReport}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.admin.exportReport}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
            {t.admin.stats.totalRevenue}
          </span>
          <div className="text-xl font-bold font-mono text-stone-900 mt-1">
            {formatPrice(totalRevenueUsd, totalRevenueMmk, currency)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">
            {language === 'mm' ? '↑ ယခင်လထက် +၁၈.၄% ပိုတိုးလာသည်' : '↑ +18.4% vs last period'}
          </span>
        </div>

        {/* Active Orders */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
            {t.admin.stats.activeOrders}
          </span>
          <div className="text-xl font-bold font-mono text-stone-900 mt-1">{orders.length}</div>
          <span className="text-[10px] text-stone-500 mt-1 inline-block">
            {language === 'mm' ? 'ပို့ဆောင်ဆဲ / ဆောင်ရွက်ဆဲ' : 'Pending Delivery / In Progress'}
          </span>
        </div>

        {/* Total Inventory Value */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
            {t.admin.stats.inventoryValue}
          </span>
          <div className="text-xl font-bold font-mono text-stone-900 mt-1">
            {formatPrice(inventoryValueUsd, inventoryValueMmk, currency)}
          </div>
          <span className="text-[10px] text-stone-500 mt-1 inline-block">
            {language === 'mm'
              ? `လက်ကျန်စုစုပေါင်း ${products.reduce((s, p) => s + p.stock, 0)} ထည်`
              : `${products.reduce((s, p) => s + p.stock, 0)} units in stock`}
          </span>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
            {t.admin.stats.conversionRate}
          </span>
          <div className="text-xl font-bold font-mono text-stone-900 mt-1">4.2%</div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">
            {language === 'mm' ? 'ပြီးဆုံးအောင်မြင်သော ဝယ်ယူမှုများ' : 'Completed checkouts'}
          </span>
        </div>

        {/* Total Website Visitors */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
            {t.admin.stats.totalVisitors}
          </span>
          <div className="text-xl font-bold font-mono text-stone-900 mt-1 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-700" />
            <span>1,420</span>
          </div>
          <span className="text-[10px] text-stone-500 mt-1 inline-block">
            {language === 'mm' ? 'လက်ရှိ ဝင်ရောက်ကြည့်ရှုသူဦးရေ' : 'Active customer visits'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-6 gap-6 text-xs font-bold uppercase tracking-wider text-stone-600">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-amber-800 text-amber-900'
              : 'border-transparent hover:text-stone-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{t.admin.inventoryTab} ({products.length})</span>
          {lowStockCount > 0 && (
            <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-amber-800 text-amber-900'
              : 'border-transparent hover:text-stone-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t.admin.analyticsTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-amber-800 text-amber-900'
              : 'border-transparent hover:text-stone-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t.admin.auditTab} ({inventoryLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Products & Inventory */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'mm' ? 'ပစ္စည်းကုဒ် သို့မဟုတ် အမည် ရှာရန်...' : 'Search item code or product name...'}
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-white rounded-lg border border-stone-300 text-xs w-52 sm:w-64"
                />
              </div>

              <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterLowStockOnly}
                  onChange={(e) => setFilterLowStockOnly(e.target.checked)}
                  className="rounded text-amber-800"
                />
                <span className="font-semibold text-rose-700">{t.admin.lowStockAlert}</span>
              </label>
            </div>

            <button
              id="btn-add-product-modal"
              onClick={() => setShowAddProductModal(true)}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors self-start"
            >
              <Plus className="w-4 h-4" />
              <span>{t.admin.addNewProduct}</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 uppercase font-semibold tracking-wider">
                <tr>
                  <th className="p-3.5">{t.admin.sku}</th>
                  <th className="p-3.5">{t.admin.product}</th>
                  <th className="p-3.5">{language === 'mm' ? 'အမျိုးအစား' : 'Category'}</th>
                  <th className="p-3.5">{t.admin.price}</th>
                  <th className="p-3.5">{t.admin.stock}</th>
                  <th className="p-3.5">{t.admin.status}</th>
                  <th className="p-3.5 text-right">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-stone-800">{prod.sku}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-9 h-11 object-cover rounded bg-stone-100 border border-stone-200"
                          />
                          {prod.images.length > 1 && (
                            <span
                              className="absolute -bottom-1 -right-1 bg-stone-900 text-amber-200 text-[8px] font-mono font-bold px-1 rounded-full shadow-xs"
                              title={`${prod.images.length} photos`}
                            >
                              +{prod.images.length - 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">{prod.name}</div>
                          <div className="text-[11px] text-stone-500 font-myanmar">{prod.nameMm}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 uppercase tracking-wide text-[10px] font-semibold text-amber-900">
                      {prod.category.replace('_', ' ')}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-stone-800">
                      {formatPrice(prod.price, prod.priceMmk, currency)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-mono font-bold text-sm ${
                          prod.stock < 10 ? 'text-rose-600' : 'text-stone-800'
                        }`}
                      >
                        {prod.stock} {language === 'mm' ? 'ထည်' : 'units'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {prod.stock === 0 ? (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          {t.admin.outOfStock}
                        </span>
                      ) : prod.stock < 10 ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> {t.admin.lowStock}
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          {t.admin.inStock}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => onUpdateProductStock(prod.id, prod.stock + 5)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold text-[11px] transition-colors"
                        title={language === 'mm' ? '+၅ ထည် စတော့ခ်ထည့်ရန်' : 'Restock 5 units'}
                      >
                        +5 {t.admin.restock}
                      </button>
                      <button
                        onClick={() => onUpdateProductStock(prod.id, prod.stock + 20)}
                        className="px-2.5 py-1 bg-amber-800 hover:bg-amber-700 text-white rounded font-semibold text-[11px] transition-colors"
                        title={language === 'mm' ? '+၂၀ ထည် စတော့ခ်ထည့်ရန်' : 'Restock 20 units'}
                      >
                        +20 {t.admin.restock}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Sales Reports */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Performance Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 mb-4">
                {language === 'mm' ? 'အမျိုးအစားအလိုက် အရောင်းစာရင်း' : 'Sales by Product Category'}
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between font-semibold text-stone-700 mb-1">
                    <span>{language === 'mm' ? 'ရိုးရာပိုးထည်နှင့် ခေတ်ဆန်းဒီဇိုင်းများ' : 'Heritage Silk & Traditional Reimagined'}</span>
                    <span>38% (K 42,840,000)</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-800 rounded-full" style={{ width: '38%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-stone-700 mb-1">
                    <span>{language === 'mm' ? 'အပေါ်ထပ်ကုတ်အင်္ကျီနှင့် ခေတ်မီအင်္ကျီရှည်' : 'Technical Outerwear & Trench'}</span>
                    <span>29% (K 32,670,000)</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 rounded-full" style={{ width: '29%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-stone-700 mb-1">
                    <span>{language === 'mm' ? 'ဂါဝန်နှင့် ဝတ်စုံများ' : 'Dresses & Tunics'}</span>
                    <span>18% (K 20,280,000)</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-800 rounded-full" style={{ width: '18%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-stone-700 mb-1">
                    <span>{language === 'mm' ? 'လက်ကိုင်အိတ်နှင့် ကြာချည်အသုံးအဆောင်များ' : 'Handcrafted Bags & Lotus Accessories'}</span>
                    <span>15% (K 16,890,000)</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-600 rounded-full" style={{ width: '15%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Channel Distribution */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 mb-4">
                {language === 'mm' ? 'လူသုံးအများဆုံး ငွေပေးချေမှု နည်းလမ်းများ' : 'Customer Payment Methods Breakdown'}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200">
                  <span className="text-xs font-bold text-blue-900 block">KBZPay QR / Direct</span>
                  <span className="text-2xl font-bold font-mono text-blue-900 mt-1 block">48.6%</span>
                  <span className="text-[10px] text-blue-700">
                    {language === 'mm' ? 'မြန်မာနိုင်ငံတွင် အရောင်းရဆုံး' : 'Highest volume in Myanmar'}
                  </span>
                </div>

                <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200">
                  <span className="text-xs font-bold text-amber-900 block">WavePay Transfer</span>
                  <span className="text-2xl font-bold font-mono text-amber-900 mt-1 block">22.4%</span>
                  <span className="text-[10px] text-amber-700">
                    {language === 'mm' ? 'အမြန်မိုဘိုင်းငွေလွှဲ' : 'Instant mobile transfer'}
                  </span>
                </div>

                <div className="p-4 bg-stone-100 rounded-xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-800 block">Apple Pay &amp; Google Pay</span>
                  <span className="text-2xl font-bold font-mono text-stone-900 mt-1 block">18.2%</span>
                  <span className="text-[10px] text-stone-500">
                    {language === 'mm' ? 'နိုင်ငံတကာမှ ဝယ်ယူမှုများ' : 'International diaspora orders'}
                  </span>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-800 block">Credit / Debit Card</span>
                  <span className="text-2xl font-bold font-mono text-stone-900 mt-1 block">10.8%</span>
                  <span className="text-[10px] text-stone-500">
                    {language === 'mm' ? 'ဘဏ်ကတ်ဖြင့် လုံခြုံစွာ ပေးချေမှု' : 'Secure card payments'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Activity History */}
      {activeTab === 'audit' && (
        <div className="bg-stone-900 text-stone-200 p-6 rounded-xl font-mono text-xs shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <span className="text-amber-400 font-bold">
              {language === 'mm'
                ? 'မကြာသေးမီက ကုန်ပစ္စည်းနှင့် အော်ဒါ လုပ်ဆောင်ချက် မှတ်တမ်း'
                : 'Recent Inventory & Order Activity'}
            </span>
            <span className="text-[10px] text-stone-400">
              {language === 'mm' ? 'အလိုအလျောက် မှတ်တမ်းတင်ထားသည်' : 'Activity Automatically Saved'}
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {inventoryLogs.map((log) => (
              <div key={log.id} className="p-2.5 bg-stone-950/80 rounded border border-stone-800 flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-stone-400">[{log.date}]</span>{' '}
                  <span className="text-amber-300 font-bold">{log.operator}</span>{' '}
                  <span>{language === 'mm' ? 'မှ' : 'updated'}</span>{' '}
                  <span className="text-stone-200 font-semibold">{log.productName}</span>{' '}
                  <span className="text-stone-400">
                    ({log.previousStock} ➔ {log.newStock} {language === 'mm' ? 'ထည်' : 'units'})
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  {language === 'mm' ? 'မှတ်တမ်းတင်ပြီး' : 'Recorded'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rich Add Product Modal with Multi-source Photo Upload */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        language={language}
        onAddNewProduct={onAddNewProduct}
        existingSkus={products.map((p) => p.sku)}
      />
    </div>
  );
};
