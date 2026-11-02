import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  User,
  ShieldCheck,
  Search,
  Globe,
  Zap,
  Menu,
  X,
  Bell,
  SlidersHorizontal,
  Server,
  Bot,
} from 'lucide-react';
import { Currency, Language, UserProfile } from '../types';
import { translations } from '../data/translations';

interface HeaderProps {
  currentTab?: string;
  activeView?: string;
  setCurrentTab?: (tab: string) => void;
  onViewChange?: (view: any) => void;
  onOpenCloudHa?: () => void;
  language: Language;
  setLanguage?: (lang: Language) => void;
  onLanguageChange?: (lang: Language) => void;
  currency: Currency;
  setCurrency?: (cur: Currency) => void;
  onCurrencyChange?: (cur: Currency) => void;
  lowBandwidth: boolean;
  setLowBandwidth?: (val: boolean) => void;
  onLowBandwidthToggle?: () => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenEmails?: () => void;
  onOpenEmailNotifications?: () => void;
  unreadEmailsCount?: number;
  emailNotificationCount?: number;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  userProfile?: UserProfile;
  onOpenStaffLogin?: () => void;
  onOpenTelegramBot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeView,
  setCurrentTab,
  onViewChange,
  onOpenCloudHa,
  language,
  setLanguage,
  onLanguageChange,
  currency,
  setCurrency,
  onCurrencyChange,
  lowBandwidth,
  setLowBandwidth,
  onLowBandwidthToggle,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenAccount,
  onOpenEmails,
  onOpenEmailNotifications,
  unreadEmailsCount,
  emailNotificationCount,
  searchQuery = '',
  setSearchQuery,
  userProfile,
  onOpenStaffLogin,
  onOpenTelegramBot,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const t = translations[language];

  const handleSetLanguage = (lang: Language) => {
    if (typeof setLanguage === 'function') setLanguage(lang);
    if (typeof onLanguageChange === 'function') onLanguageChange(lang);
  };

  const handleSetCurrency = (cur: Currency) => {
    if (typeof setCurrency === 'function') setCurrency(cur);
    if (typeof onCurrencyChange === 'function') onCurrencyChange(cur);
  };

  const handleToggleLowBandwidth = () => {
    if (typeof onLowBandwidthToggle === 'function') {
      onLowBandwidthToggle();
    } else if (typeof setLowBandwidth === 'function') {
      setLowBandwidth(!lowBandwidth);
    }
  };

  const handleNavigate = (tab: string) => {
    if (tab === 'cloud' && typeof onOpenCloudHa === 'function') {
      onOpenCloudHa();
      return;
    }
    if (typeof onViewChange === 'function') onViewChange(tab);
    if (typeof setCurrentTab === 'function') setCurrentTab(tab);
  };

  const handleOpenEmails = () => {
    if (typeof onOpenEmails === 'function') onOpenEmails();
    if (typeof onOpenEmailNotifications === 'function') onOpenEmailNotifications();
  };

  const activeTab = currentTab || activeView || 'catalog';
  const emailBadgeCount = unreadEmailsCount ?? emailNotificationCount ?? 0;

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      {/* Top micro-bar: Low-Bandwidth Indicator & Fast Currency/Lang */}
      <div className="bg-stone-950 px-4 py-1 text-xs text-stone-400 border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-stone-400 font-medium tracking-wide">
            {t.hero.freeShippingNotice}
          </span>
          <button
            id="btn-toggle-low-bandwidth-top"
            onClick={handleToggleLowBandwidth}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              lowBandwidth
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
            }`}
            title="Toggle Low-Bandwidth / Lite Mode"
          >
            <Zap className={`w-3 h-3 ${lowBandwidth ? 'text-emerald-400 fill-emerald-400' : 'text-amber-400'}`} />
            <span>{lowBandwidth ? t.lowBandwidth.active : t.nav.dataSaver}</span>
            {lowBandwidth && <span className="text-[10px] bg-emerald-800/80 px-1 rounded">-82%</span>}
          </button>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
            <Globe className="w-3 h-3 text-stone-400" />
            <button
              id="lang-btn-en"
              onClick={() => handleSetLanguage('en')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                language === 'en' ? 'bg-amber-900/60 text-amber-200 font-semibold' : 'text-stone-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <span className="text-stone-600">|</span>
            <button
              id="lang-btn-mm"
              onClick={() => handleSetLanguage('mm')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                language === 'mm' ? 'bg-amber-900/60 text-amber-200 font-semibold' : 'text-stone-400 hover:text-white'
              }`}
            >
              မြန်မာ
            </button>
          </div>

          {/* Currency Display (MMK only) */}
          <div className="flex items-center gap-1.5 bg-stone-900/90 px-2 py-0.5 rounded border border-stone-800 text-[11px] font-semibold text-amber-300 tracking-wider">
            <span>MMK (K)</span>
          </div>

          {/* User Account Role Indicator & Quick Switcher */}
          {userProfile && (
            <div className="hidden sm:flex items-center gap-1.5 bg-stone-900 px-2 py-0.5 rounded border border-stone-800 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-stone-300 font-medium truncate max-w-[130px]">
                {userProfile.name}
              </span>
              <span className="text-[10px] text-amber-400 font-mono border-l border-stone-800 pl-1.5">
                {userProfile.role === 'admin' ? 'Staff Admin' : 'Customer'}
              </span>
              {typeof onOpenStaffLogin === 'function' && (
                <button
                  id="btn-header-quick-switch"
                  onClick={onOpenStaffLogin}
                  className="text-[10px] text-stone-400 hover:text-amber-300 pl-1 hover:underline cursor-pointer"
                  title="Switch Demo Account"
                >
                  [{language === 'mm' ? 'အကောင့်ပြောင်း' : 'Switch'}]
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Identity */}
          <div className="flex items-center gap-8">
            <button
              id="brand-logo-btn"
              onClick={() => handleNavigate('catalog')}
              className="text-left group cursor-pointer"
            >
              <span className="font-serif tracking-[0.22em] text-xl sm:text-2xl font-bold text-amber-100 group-hover:text-amber-200 transition-colors uppercase block">
                AYAR ATELIER
              </span>
              <span className="text-[10px] tracking-[0.25em] text-stone-400 uppercase block font-sans">
                {language === 'mm' ? 'ခေတ်မီ အဆင့်မြင့် ဖက်ရှင်' : 'Haute Heritage & Tailoring'}
              </span>
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                id="nav-catalog"
                onClick={() => handleNavigate('catalog')}
                className={`px-3.5 py-1.5 text-xs tracking-wider uppercase font-medium rounded transition-colors ${
                  activeTab === 'catalog'
                    ? 'text-amber-300 bg-stone-800/80 font-semibold'
                    : 'text-stone-300 hover:text-amber-200 hover:bg-stone-800/40'
                }`}
              >
                {t.nav.catalog}
              </button>
              <button
                id="nav-lookbook"
                onClick={() => handleNavigate('lookbook')}
                className={`px-3.5 py-1.5 text-xs tracking-wider uppercase font-medium rounded transition-colors ${
                  activeTab === 'lookbook'
                    ? 'text-amber-300 bg-stone-800/80 font-semibold'
                    : 'text-stone-300 hover:text-amber-200 hover:bg-stone-800/40'
                }`}
              >
                {t.nav.lookbook}
              </button>
              <button
                id="nav-tracking"
                onClick={() => handleNavigate('tracking')}
                className={`px-3.5 py-1.5 text-xs tracking-wider uppercase font-medium rounded transition-colors ${
                  activeTab === 'tracking'
                    ? 'text-amber-300 bg-stone-800/80 font-semibold'
                    : 'text-stone-300 hover:text-amber-200 hover:bg-stone-800/40'
                }`}
              >
                {t.nav.trackOrder}
              </button>
              <button
                id="nav-wishlist"
                onClick={() => handleNavigate('wishlist')}
                className={`px-3.5 py-1.5 text-xs tracking-wider uppercase font-medium rounded transition-colors ${
                  activeTab === 'wishlist'
                    ? 'text-amber-300 bg-stone-800/80 font-semibold'
                    : 'text-stone-300 hover:text-amber-200 hover:bg-stone-800/40'
                }`}
              >
                {t.nav.wishlist}
                {wishlistCount > 0 && (
                  <span className="ml-1.5 bg-stone-700 text-stone-200 text-[10px] px-1.5 py-0.2 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Input */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center bg-stone-800 rounded-md px-2.5 py-1 border border-stone-700">
                  <Search className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder={language === 'mm' ? 'ဒီဇိုင်း သို့မဟုတ် အထည် ရှာရန်...' : 'Search garments, silk...'}
                    value={searchQuery}
                    onChange={(e) => {
                      if (typeof setSearchQuery === 'function') setSearchQuery(e.target.value);
                    }}
                    className="bg-transparent text-xs text-stone-100 placeholder-stone-500 focus:outline-none w-36 sm:w-48"
                    autoFocus
                  />
                  <button onClick={() => setSearchOpen(false)} className="text-stone-400 hover:text-white ml-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  id="btn-search-toggle"
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-stone-300 hover:text-amber-200 rounded-full hover:bg-stone-800 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Email Notifications Drawer Button */}
            <button
              id="btn-email-drawer"
              onClick={handleOpenEmails}
              className="p-2 text-stone-300 hover:text-amber-200 rounded-full hover:bg-stone-800 transition-colors relative"
              title="Automated Email Notification Stream"
            >
              <Bell className="w-4 h-4" />
              {emailBadgeCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-stone-900 animate-pulse" />
              )}
            </button>

            {/* Telegram Bot Commerce Button */}
            {onOpenTelegramBot && (
              <button
                id="btn-telegram-bot-header"
                onClick={onOpenTelegramBot}
                className="hidden sm:flex items-center gap-1.5 bg-[#2481cc]/20 hover:bg-[#2481cc]/35 border border-[#2481cc]/50 text-[#5db0f6] hover:text-white px-2.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer"
                title={t.telegram.title}
              >
                <Bot className="w-3.5 h-3.5 text-[#3ca3f0]" />
                <span className="hidden md:inline font-myanmar">{t.telegram.openBot}</span>
              </button>
            )}

            {/* User Account */}
            <button
              id="btn-user-account"
              onClick={onOpenAccount}
              className="p-2 text-stone-300 hover:text-amber-200 rounded-full hover:bg-stone-800 transition-colors"
              title={t.nav.account}
            >
              <User className="w-4 h-4" />
            </button>

            {/* Shopping Bag */}
            <button
              id="btn-header-cart"
              onClick={onOpenCart}
              className="flex items-center gap-2 bg-amber-700/90 hover:bg-amber-600 text-stone-50 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all shadow-sm"
              title={t.nav.bag}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-semibold">{cartCount}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              id="btn-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-300 hover:text-white rounded-md hover:bg-stone-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-950 border-b border-stone-800 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top">
          <button
            onClick={() => {
              handleNavigate('catalog');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-stone-200 hover:bg-stone-900 rounded"
          >
            {t.nav.catalog}
          </button>
          <button
            onClick={() => {
              handleNavigate('lookbook');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-stone-200 hover:bg-stone-900 rounded"
          >
            {t.nav.lookbook}
          </button>
          <button
            onClick={() => {
              handleNavigate('tracking');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-stone-200 hover:bg-stone-900 rounded"
          >
            {t.nav.trackOrder}
          </button>
          <button
            onClick={() => {
              handleNavigate('wishlist');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-stone-200 hover:bg-stone-900 rounded flex justify-between"
          >
            <span>{t.nav.wishlist}</span>
            {wishlistCount > 0 && (
              <span className="bg-stone-700 text-xs px-2 py-0.5 rounded-full">{wishlistCount}</span>
            )}
          </button>
          {onOpenTelegramBot && (
            <button
              onClick={() => {
                onOpenTelegramBot();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-[#4ea4f5] bg-[#2481cc]/15 hover:bg-[#2481cc]/30 rounded flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#3ca3f0]" />
                <span className="font-myanmar">{t.telegram.openBot}</span>
              </div>
              <span className="text-[10px] bg-[#2481cc] text-white px-2 py-0.5 rounded-full font-bold">Mini App</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};

