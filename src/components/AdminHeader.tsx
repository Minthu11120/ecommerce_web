import React from 'react';
import {
  SlidersHorizontal,
  Package,
  TrendingUp,
  Clock,
  Globe,
  Store,
  RefreshCw,
  Download,
  Server,
  ShieldCheck,
  ArrowLeft,
  Bot,
} from 'lucide-react';
import { Currency, Language } from '../types';
import { translations } from '../data/translations';

interface AdminHeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currency: Currency;
  activeTab: 'inventory' | 'analytics' | 'audit';
  onTabChange: (tab: 'inventory' | 'analytics' | 'audit') => void;
  onBackToStorefront: () => void;
  onSimulateSampleOrder: () => void;
  onExportCsvReport: () => void;
  onOpenCloudHa: () => void;
  totalProductsCount: number;
  lowStockCount: number;
  onOpenStaffLogin?: () => void;
  onOpenTelegramBot?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  language,
  onLanguageChange,
  currency,
  activeTab,
  onTabChange,
  onBackToStorefront,
  onSimulateSampleOrder,
  onExportCsvReport,
  onOpenCloudHa,
  totalProductsCount,
  lowStockCount,
  onOpenStaffLogin,
  onOpenTelegramBot,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      {/* Top Admin Micro-bar: System Status & Language & Admin Identity */}
      <div className="bg-stone-950 px-4 py-1.5 text-xs text-stone-400 border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <button
            onClick={onOpenCloudHa}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 transition-colors text-[11px] font-medium"
            title="Inspect Database & High-Availability Architecture"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.admin.systemStatus}</span>
            <span className="text-emerald-500 font-normal">({t.admin.allSystemsNormal})</span>
          </button>

          <span className="hidden sm:inline text-stone-500 text-[11px]">•</span>

          <span className="hidden sm:inline text-stone-400 text-[11px]">
            {language === 'mm' ? 'စတိုးစီမံခန့်ခွဲမှု စနစ် (Admin Mode)' : 'Staff Management Console'}
          </span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
            <Globe className="w-3 h-3 text-stone-400" />
            <button
              id="admin-lang-btn-en"
              onClick={() => onLanguageChange('en')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                language === 'en' ? 'bg-amber-900/60 text-amber-200 font-semibold' : 'text-stone-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <span className="text-stone-600">|</span>
            <button
              id="admin-lang-btn-mm"
              onClick={() => onLanguageChange('mm')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                language === 'mm' ? 'bg-amber-900/60 text-amber-200 font-semibold' : 'text-stone-400 hover:text-white'
              }`}
            >
              မြန်မာ
            </button>
          </div>

          {/* Admin User Badge & Switcher */}
          <div className="hidden sm:flex items-center gap-1.5 text-stone-300 text-[11px] bg-stone-900 px-2 py-0.5 rounded border border-stone-800 font-mono">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>admin@ayaratelier.com</span>
            {typeof onOpenStaffLogin === 'function' && (
              <button
                id="btn-admin-header-switch"
                onClick={onOpenStaffLogin}
                className="text-[10px] text-amber-400 hover:text-amber-300 ml-1 border-l border-stone-700 pl-1.5 hover:underline cursor-pointer"
                title="Switch Account"
              >
                [{language === 'mm' ? 'အကောင့်ပြောင်း' : 'Switch'}]
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Admin Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          {/* Left: Brand Identity & Mode Badge */}
          <div className="flex items-center gap-4 lg:gap-8">
            <div className="flex items-center gap-2.5">
              <div>
                <span className="font-serif tracking-[0.2em] text-lg sm:text-xl font-bold text-amber-100 uppercase block">
                  AYAR ATELIER
                </span>
                <span className="text-[10px] tracking-[0.25em] text-amber-400 font-mono uppercase block">
                  {t.admin.adminConsole}
                </span>
              </div>
            </div>

            {/* Admin Desktop Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                id="admin-tab-inventory"
                onClick={() => onTabChange('inventory')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTab === 'inventory'
                    ? 'bg-amber-900/70 text-amber-200 border border-amber-700/60'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{t.admin.inventoryTab}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-800 text-stone-300 font-mono">
                  {totalProductsCount}
                </span>
                {lowStockCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                    {lowStockCount} low
                  </span>
                )}
              </button>

              <button
                id="admin-tab-analytics"
                onClick={() => onTabChange('analytics')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-amber-900/70 text-amber-200 border border-amber-700/60'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{t.admin.analyticsTab}</span>
              </button>

              <button
                id="admin-tab-audit"
                onClick={() => onTabChange('audit')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTab === 'audit'
                    ? 'bg-amber-900/70 text-amber-200 border border-amber-700/60'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{t.admin.auditTab}</span>
              </button>
            </nav>
          </div>

          {/* Right Actions: Create Sample Order, Export, and BACK TO STOREFRONT */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="admin-btn-quick-sample-order"
              onClick={onSimulateSampleOrder}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition-colors"
              title={t.admin.generateSampleOrder}
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.admin.generateSampleOrder}</span>
            </button>

            <button
              id="admin-btn-quick-export"
              onClick={onExportCsvReport}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition-colors"
              title={t.admin.exportReport}
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'mm' ? 'အစီရင်ခံစာ (CSV)' : 'Export CSV'}</span>
            </button>

            {/* Telegram Bot Config Button */}
            {onOpenTelegramBot && (
              <button
                id="admin-btn-telegram-config"
                onClick={onOpenTelegramBot}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2481cc]/20 hover:bg-[#2481cc]/35 text-[#5db0f6] hover:text-white rounded-lg text-xs font-medium border border-[#2481cc]/40 transition-colors cursor-pointer"
                title="Telegram Bot Settings & Mini App"
              >
                <Bot className="w-3.5 h-3.5 text-[#3ca3f0]" />
                <span className="hidden xl:inline font-myanmar">{language === 'mm' ? 'Telegram Bot စနစ်' : 'Telegram Bot'}</span>
              </button>
            )}

            {/* Back to Customer Storefront Button */}
            <button
              id="btn-admin-exit-to-storefront"
              onClick={onBackToStorefront}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs sm:text-sm font-semibold tracking-wide shadow-md transition-all active:scale-98 border border-amber-600/50"
            >
              <Store className="w-4 h-4" />
              <span>{t.admin.backToStore}</span>
            </button>
          </div>
        </div>

        {/* Mobile Admin Tabs row */}
        <div className="md:hidden flex items-center justify-around border-t border-stone-800 py-2 text-xs">
          <button
            onClick={() => onTabChange('inventory')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 ${
              activeTab === 'inventory' ? 'bg-amber-900/80 text-amber-200 font-bold' : 'text-stone-400'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{language === 'mm' ? 'ပစ္စည်းစာရင်း' : 'Products'}</span>
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 ${
              activeTab === 'analytics' ? 'bg-amber-900/80 text-amber-200 font-bold' : 'text-stone-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{language === 'mm' ? 'အရောင်း' : 'Sales'}</span>
          </button>
          <button
            onClick={() => onTabChange('audit')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 ${
              activeTab === 'audit' ? 'bg-amber-900/80 text-amber-200 font-bold' : 'text-stone-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{language === 'mm' ? 'မှတ်တမ်း' : 'Logs'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
