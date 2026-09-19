import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Award,
  MapPin,
  Package,
  Scissors,
  LogOut,
  Check,
  ExternalLink,
  Lock,
  SlidersHorizontal,
  ArrowRight,
} from 'lucide-react';
import { Currency, Language, Order, UserProfile } from '../types';
import { translations } from '../data/translations';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  orders: Order[];
  language: Language;
  currency: Currency;
  onUpdateProfile: (updated: UserProfile) => void;
  onSelectOrderForTracking: (orderId: string) => void;
  onOpenStaffLogin?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  orders,
  language,
  currency,
  onUpdateProfile,
  onSelectOrderForTracking,
  onOpenStaffLogin,
}) => {
  if (!isOpen) return null;

  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'profile' | 'sizing' | 'addresses' | 'orders'>('profile');
  const [isOauthConnecting, setIsOauthConnecting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sizing inputs
  const [chest, setChest] = useState(userProfile.measurements.chest);
  const [waist, setWaist] = useState(userProfile.measurements.waist);
  const [hips, setHips] = useState(userProfile.measurements.hips);
  const [height, setHeight] = useState(userProfile.measurements.height);
  const [unit, setUnit] = useState<'cm' | 'in'>(userProfile.measurements.unit);

  const handleSaveSizing = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...userProfile,
      measurements: { chest, waist, hips, height, unit },
    };
    onUpdateProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSimulateGoogleOauth = () => {
    setIsOauthConnecting(true);
    setTimeout(() => {
      const updated: UserProfile = {
        ...userProfile,
        name: 'Runis N.',
        email: 'runisn2016@gmail.com',
        oauthProvider: 'google',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      };
      onUpdateProfile(updated);
      setIsOauthConnecting(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        id="modal-account"
        className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col border border-stone-200"
      >
        {/* Header with Account Profile */}
        <div className="bg-stone-900 text-stone-100 p-5 sm:p-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3.5">
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-amber-600/60 shadow"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">{userProfile.name}</h2>
                <span className="bg-amber-900/60 text-amber-200 border border-amber-700/50 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {userProfile.tier}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    userProfile.role === 'admin'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-stone-800 text-stone-300 border-stone-700'
                  }`}
                >
                  {userProfile.role === 'admin'
                    ? (language === 'mm' ? 'ဆိုင်တာဝန်ခံ (Staff Admin)' : 'Staff Admin')
                    : (language === 'mm' ? 'ဝယ်ယူသူ (Customer)' : 'Customer Account')}
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">{userProfile.email}</p>
            </div>
          </div>
          <button
            id="btn-close-account"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 gap-6 text-xs font-semibold uppercase tracking-wider text-stone-600">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            {language === 'mm' ? 'အကောင့်အချက်အလက်' : 'Profile & Account'}
          </button>
          <button
            onClick={() => setActiveTab('sizing')}
            className={`py-3.5 border-b-2 transition-colors ${
              activeTab === 'sizing'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            {t.account.sizingProfile}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            {t.account.orderHistory} ({orders.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Account Security Card */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      {language === 'mm' ? 'လုံခြုံစိတ်ချရသော အကောင့်' : 'Account Security & Login'}
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {language === 'mm'
                        ? 'သင့်အကောင့်ကို Google ဖြင့် ချိတ်ဆက်ထားပြီး အချက်အလက်များနှင့် မှာယူမှုများကို လုံခြုံစွာ ထိန်းသိမ်းထားပါသည်။'
                        : 'Your account is connected with Google. Personal details and order records are securely protected.'}
                    </p>
                    <span className="inline-block mt-2 text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-emerald-800 font-medium">
                      ✓ {language === 'mm' ? 'Google ဖြင့် ချိတ်ဆက်ပြီး' : 'Connected with Google'}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-reconnect-oauth"
                  onClick={handleSimulateGoogleOauth}
                  disabled={isOauthConnecting}
                  className="px-3 py-2 bg-white hover:bg-stone-100 border border-stone-300 rounded text-xs font-semibold text-stone-800 shadow-2xs flex items-center justify-center gap-2 shrink-0 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-stone-500" />
                  <span>
                    {isOauthConnecting
                      ? (language === 'mm' ? 'ချိတ်ဆက်နေပါသည်...' : 'Connecting...')
                      : (language === 'mm' ? 'Google အကောင့် ချိတ်ဆက်မည်' : 'Connect Google')}
                  </span>
                </button>
              </div>

              {/* VIP Loyalty Points Status */}
              <div className="p-5 bg-gradient-to-br from-amber-50 to-stone-50 rounded-xl border border-amber-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                      {t.account.membershipTier}: {userProfile.tier}
                    </span>
                  </div>
                  <span className="text-sm font-bold font-mono text-amber-900">
                    {userProfile.loyaltyPoints} {language === 'mm' ? 'မှတ်' : 'PTS'}
                  </span>
                </div>

                <div className="h-2 bg-amber-200/70 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-amber-700 rounded-full"
                    style={{ width: `${(userProfile.loyaltyPoints / 1000) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-amber-800">
                  <span>{language === 'mm' ? 'လက်ရှိ: Gold VIP အဆင့်' : 'Current: Gold Tier'}</span>
                  <span>
                    {language === 'mm'
                      ? 'Platinum VIP အဆင့်သို့ ရောက်ရှိရန် ၃၂၀ မှတ် လိုပါသေးသည်'
                      : '320 pts to Platinum VIP'}
                  </span>
                </div>
              </div>

              {/* Saved Shipping Addresses */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
                  {t.account.savedAddresses}
                </h4>
                <div className="space-y-2">
                  {userProfile.savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-stone-900">{addr.name} ({addr.label})</div>
                        <div className="text-stone-600 mt-0.5">{addr.street}, {addr.city}</div>
                        <div className="text-stone-500 font-mono mt-0.5">{addr.phone}</div>
                      </div>
                      {addr.isDefault && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                          {language === 'mm' ? 'မူလလိပ်စာ' : 'Default'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Demo Account Switcher */}
              {onOpenStaffLogin && (
                <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-stone-800 block">
                      {language === 'mm' ? 'အကောင့်ပြောင်းလဲ စမ်းသပ်ခြင်း' : 'Demo Account Switcher'}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {language === 'mm'
                        ? 'Customer နှင့် Store Admin အကောင့်များအကြား အလွယ်တကူ ပြောင်းလဲစမ်းသပ်ရန်'
                        : 'Quickly toggle between Customer and Store Admin test personas'}
                    </span>
                  </div>
                  <button
                    id="btn-account-modal-open-switcher"
                    onClick={() => {
                      onClose();
                      onOpenStaffLogin();
                    }}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto border border-stone-300 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-stone-600" />
                    <span>{language === 'mm' ? 'အကောင့်ပြောင်းရန်' : 'Switch Account'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sizing' && (
            /* Smart Fit Sizing Profile */
            <form onSubmit={handleSaveSizing} className="space-y-5">
              <div className="p-4 bg-amber-50/70 rounded-lg border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                <Scissors className="w-4 h-4 text-amber-700 inline mr-1.5 -mt-0.5" />
                {language === 'mm'
                  ? 'သင့်ကိုယ်ခန္ဓာ အတိုင်းအတာများကို ထည့်သွင်းထားပါက ရိုးရာပိုးထည်များနှင့် ဝတ်စုံများအတွက် အသင့်တော်ဆုံး ဆိုဒ်ကို အကြံပြုပေးပါမည်။'
                  : 'Save your body measurements to receive personalized size recommendations across all traditional silks, outerwear, and dresses.'}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-stone-700">
                  {language === 'mm' ? 'အတိုင်းအတာ ယူနစ်:' : 'Measurement Unit:'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUnit('cm')}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      unit === 'cm' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    Centimeters (cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('in')}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      unit === 'in' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    Inches (in)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {t.account.chest} ({unit})
                  </label>
                  <input
                    type="number"
                    value={chest}
                    onChange={(e) => setChest(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded border border-stone-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {t.account.waist} ({unit})
                  </label>
                  <input
                    type="number"
                    value={waist}
                    onChange={(e) => setWaist(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded border border-stone-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {t.account.hips} ({unit})
                  </label>
                  <input
                    type="number"
                    value={hips}
                    onChange={(e) => setHips(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded border border-stone-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {t.account.height} ({unit})
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded border border-stone-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.account.saveProfile}</span>
                </button>
                {savedSuccess && (
                  <span className="text-xs text-emerald-600 font-semibold animate-pulse">
                    {language === 'mm'
                      ? '✓ အတိုင်းအတာများ သိမ်းဆည်းပြီးပါပြီ'
                      : '✓ Body Measurements Saved Successfully!'}
                  </span>
                )}
              </div>
            </form>
          )}

          {activeTab === 'orders' && (
            /* Order History List */
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs">{t.account.noOrders}</div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900 text-sm">#{ord.id}</span>
                        <span className="text-[10px] uppercase font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {language === 'mm' ? 'ခြေရာခံနံပါတ်:' : 'Tracking:'}{' '}
                        <span className="font-mono font-semibold">{ord.trackingNumber}</span> •{' '}
                        {ord.items.length} {language === 'mm' ? 'ထည်' : 'items'}
                      </p>
                      <div className="text-xs font-bold text-stone-800 mt-1">
                        {language === 'mm' ? 'ကျသင့်ငွေ:' : 'Total:'} K {ord.total.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectOrderForTracking(ord.id);
                      }}
                      className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded shadow-xs flex items-center justify-center gap-1.5 transition-colors self-start sm:self-center"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{language === 'mm' ? 'အော်ဒါခြေရာခံမည်' : 'Track Order'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
