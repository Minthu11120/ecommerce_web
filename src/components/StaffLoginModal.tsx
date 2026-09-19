import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  User,
  Check,
  AlertCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
  Store,
  SlidersHorizontal,
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { translations } from '../data/translations';
import { DEMO_ADMIN, DEMO_CUSTOMER } from '../data/mockUsers';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentProfile: UserProfile;
  onLoginAsAdmin: () => void;
  onLoginAsCustomer: () => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  language,
  currentProfile,
  onLoginAsAdmin,
  onLoginAsCustomer,
}) => {
  const [email, setEmail] = useState('admin@ayaratelier.com');
  const [pin, setPin] = useState('8899');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const t = translations[language];

  const handleStaffFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      // Valid credentials: email containing 'admin' or matching demo pin '8899' or 'admin'
      if (
        (email.trim().toLowerCase() === 'admin@ayaratelier.com' || email.includes('admin')) &&
        (pin.trim() === '8899' || pin.trim().toLowerCase() === 'admin')
      ) {
        onLoginAsAdmin();
        onClose();
      } else {
        setError(
          language === 'mm'
            ? 'အချက်အလက် မှားယွင်းနေပါသည်။ စမ်းသပ်ရန် Demo PIN (8899) ကို အသုံးပြုပါ။'
            : 'Invalid credentials. Please use demo PIN (8899) or quick switcher below.'
        );
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        id="modal-staff-login"
        className="relative w-full max-w-lg bg-stone-900 text-stone-100 rounded-2xl shadow-2xl border border-stone-800 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-stone-950 p-5 sm:p-6 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-900/50 text-amber-300 rounded-xl border border-amber-700/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {language === 'mm' ? 'Staff Portal & အကောင့်စီမံခန့်ခွဲမှု' : 'Staff Access & Account Switcher'}
                </h3>
                <span className="text-[10px] bg-amber-800/80 text-amber-200 px-2 py-0.5 rounded-full font-mono uppercase">
                  Staff
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {language === 'mm'
                  ? 'ဆိုင်စီမံခန့်ခွဲသူများနှင့် ဝန်ထမ်းများ သီးသန့် ဝင်ရောက်ရန်'
                  : 'Restricted to Ayar Atelier staff & operations personnel'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-staff-modal"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Current Active User Session Card */}
          <div className="p-3.5 bg-stone-950/70 rounded-xl border border-stone-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentProfile.avatarUrl}
                alt={currentProfile.name}
                className="w-10 h-10 rounded-full object-cover border border-amber-700/50 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-stone-200 truncate">{currentProfile.name}</p>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                      currentProfile.role === 'admin'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-stone-800 text-stone-300 border-stone-700'
                    }`}
                  >
                    {currentProfile.role === 'admin' ? 'Store Admin' : 'Customer VIP'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 font-mono truncate">{currentProfile.email}</p>
              </div>
            </div>

            <span className="text-[11px] text-emerald-400 font-medium shrink-0 flex items-center gap-1 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>

          {/* Quick 1-Click Role Switcher for Testing */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {language === 'mm' ? 'အလွယ်တကူ စမ်းသပ်ရန် Account Switcher' : 'Quick Demo Role Switcher'}
              </span>
              <span className="text-[11px] text-stone-400">1-Click Test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Customer Demo Account */}
              <button
                id="btn-switch-to-customer-demo"
                onClick={() => {
                  onLoginAsCustomer();
                  onClose();
                }}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  currentProfile.role === 'customer'
                    ? 'bg-amber-950/40 border-amber-600/70 ring-1 ring-amber-600/50'
                    : 'bg-stone-950/50 border-stone-800 hover:border-stone-700 hover:bg-stone-800/40'
                }`}
              >
                {currentProfile.role === 'customer' && (
                  <span className="absolute top-2 right-2 bg-amber-600 text-white rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-stone-800 rounded-lg text-stone-300">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-stone-100">
                    {language === 'mm' ? 'Customer (ဝယ်ယူသူ)' : 'Customer (Demo)'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  {DEMO_CUSTOMER.name} • {DEMO_CUSTOMER.tier}
                </p>
                <div className="mt-2 text-[10px] text-amber-400 font-medium flex items-center gap-1">
                  <span>{language === 'mm' ? 'Customer မျက်နှာပြင်သို့ သွားမည်' : 'Switch to Storefront'}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>

              {/* Option B: Store Admin Account */}
              <button
                id="btn-switch-to-admin-demo"
                onClick={() => {
                  onLoginAsAdmin();
                  onClose();
                }}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  currentProfile.role === 'admin'
                    ? 'bg-amber-950/40 border-amber-600/70 ring-1 ring-amber-600/50'
                    : 'bg-stone-950/50 border-stone-800 hover:border-stone-700 hover:bg-stone-800/40'
                }`}
              >
                {currentProfile.role === 'admin' && (
                  <span className="absolute top-2 right-2 bg-amber-600 text-white rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-amber-900/60 rounded-lg text-amber-300">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-amber-200">
                    {language === 'mm' ? 'Store Admin (ဆိုင်တာဝန်ခံ)' : 'Store Admin (Staff)'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  {DEMO_ADMIN.name} • Operations
                </p>
                <div className="mt-2 text-[10px] text-amber-400 font-medium flex items-center gap-1">
                  <span>{language === 'mm' ? 'Admin Dashboard သို့ ဝင်မည်' : 'Access Admin Dashboard'}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-800 w-full" />
            <span className="bg-stone-900 px-3 text-[11px] text-stone-500 uppercase tracking-widest font-mono shrink-0">
              {language === 'mm' ? 'သို့မဟုတ် Staff Credentials ဖြင့် ဝင်မည်' : 'Or enter credentials'}
            </span>
            <div className="border-t border-stone-800 w-full" />
          </div>

          {/* Admin Credentials Login Form */}
          <form onSubmit={handleStaffFormSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                {language === 'mm' ? 'ဝန်ထမ်း အီးမေးလ်' : 'Staff Email'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ayaratelier.com"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-300">
                  {language === 'mm' ? 'လုံခြုံရေး PIN နံပါတ်' : 'Security PIN / Passcode'}
                </label>
                <span className="text-[10px] text-amber-400/80 font-mono">Demo PIN: 8899</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="8899"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>
            </div>

            <button
              id="btn-submit-staff-login"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (language === 'mm' ? 'အတည်ပြုနေပါသည်...' : 'Authenticating...')
                  : (language === 'mm' ? 'Admin Dashboard သို့ ဝင်ရောက်မည်' : 'Authenticate & Access Admin')}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
