import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Bot,
  ExternalLink,
  CheckCircle,
  Copy,
  Settings,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Sparkles,
  Phone,
  RefreshCw,
  Bell,
  Check,
  Smartphone,
} from 'lucide-react';
import { Order, Product, TelegramBotConfig, TelegramMessage } from '../types';
import {
  getTelegramConfig,
  saveTelegramConfig,
  getStoredTelegramMessages,
  addTelegramMessage,
  processCustomerBotInput,
  sendRealTelegramApiMessage,
  getTelegramBotMe,
  generateTelegramOrderDirectChatUrl,
} from '../services/telegramBotService';

interface TelegramBotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  language: 'en' | 'mm';
  onSelectProduct?: (product: Product) => void;
  onQuickOrder?: (product: Product) => void;
  onViewOrderTracking?: (orderId: string) => void;
}

export const TelegramBotDrawer: React.FC<TelegramBotDrawerProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  language,
  onSelectProduct,
  onQuickOrder,
  onViewOrderTracking,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [config, setConfig] = useState<TelegramBotConfig>(getTelegramConfig());
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; message?: string; success?: boolean } | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages(getStoredTelegramMessages());
      setConfig(getTelegramConfig());
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend = inputVal) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Add user message
    addTelegramMessage({
      sender: 'user',
      text: trimmed,
    });

    setInputVal('');
    setMessages(getStoredTelegramMessages());

    // Bot response after short natural delay
    setTimeout(() => {
      processCustomerBotInput(trimmed, products, orders);
      setMessages(getStoredTelegramMessages());
    }, 450);
  };

  const handleInlineAction = (action: string, payload?: string) => {
    if (action === 'open_catalog') {
      onClose();
    } else if (action === 'prompt_track') {
      handleSendMessage('/track');
    } else if (action === 'track_order' && payload) {
      if (typeof onViewOrderTracking === 'function') {
        onViewOrderTracking(payload);
        onClose();
      } else {
        handleSendMessage(`/track ${payload}`);
      }
    } else if (action === 'quick_buy' && payload) {
      const prod = products.find((p) => p.id === payload);
      if (prod && typeof onQuickOrder === 'function') {
        onQuickOrder(prod);
        onClose();
      } else {
        handleSendMessage(`/buy ${payload}`);
      }
    } else if (action === 'view_product_detail' && payload) {
      const prod = products.find((p) => p.id === payload);
      if (prod && typeof onSelectProduct === 'function') {
        onSelectProduct(prod);
        onClose();
      }
    } else if (action === 'filter_silk') {
      handleSendMessage('ရိုးရာပိုးထည်');
    } else if (action === 'contact_staff') {
      addTelegramMessage({
        sender: 'bot',
        text: `📞 <b>Ayar Atelier ဖက်ရှင်အတိုင်ပင်ခံနှင့် ဆက်သွယ်ရန်</b>\n\nဖုန်း: +95 9 450 123 456\nTelegram Direct: @AyarAtelier_VIP\nအထူးဝန်ဆောင်မှု အချိန်: 9:00 AM - 8:00 PM Daily`,
        inlineButtons: [
          { text: '💬 Telegram တွင် တိုက်ရိုက်မက်ဆေ့ခ်ျပို့မည်', url: 'https://t.me/AyarAtelier_bot' },
        ],
      });
      setMessages(getStoredTelegramMessages());
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveTelegramConfig(config);
    setTestStatus({
      loading: false,
      success: true,
      message: language === 'mm' ? 'Telegram Bot ဆက်တင်များ သိမ်းဆည်းပြီးပါပြီ' : 'Telegram Bot configurations saved successfully!',
    });
    setTimeout(() => setTestStatus(null), 3500);
  };

  const handleTestPing = async () => {
    setTestStatus({ loading: true });

    // 1. Verify Bot Token and info via Telegram API
    const botMe = await getTelegramBotMe(config.botToken);

    if (!botMe.ok) {
      setTestStatus({
        loading: false,
        success: false,
        message: botMe.error || 'Failed to connect to Telegram Bot API. Please check your token.',
      });
      setTimeout(() => setTestStatus(null), 4500);
      return;
    }

    const botResult = botMe.result;
    const verifiedUsername = botResult?.username || config.botUsername;
    const botFirstName = botResult?.first_name || 'Ayar Atelier Bot';

    // Update config if username changed
    if (botResult?.username && botResult.username !== config.botUsername) {
      const updatedConfig = { ...config, botUsername: botResult.username };
      setConfig(updatedConfig);
      saveTelegramConfig(updatedConfig);
    }

    let alertMessage = language === 'mm'
      ? `Telegram Bot @${verifiedUsername} (${botFirstName}) ချိတ်ဆက်မှု အောင်မြင်ပါသည်။ အသင့်အသုံးပြုနိုင်ပါပြီ။`
      : `Verified @${verifiedUsername} (${botFirstName})! Bot is active & operational.`;

    // 2. If channel/group chat ID is provided, test send message
    if (config.channelChatId) {
      const res = await sendRealTelegramApiMessage(
        config.botToken,
        config.channelChatId,
        `🔔 <b>Ayar Atelier Telegram Bot Integration Ping</b>\n\nStatus: 🟢 ONLINE\nTime: ${new Date().toLocaleString()}\nBot: @${verifiedUsername}\nCommerce Engine: Connected successfully!`
      );
      if (res.success) {
        alertMessage += language === 'mm' ? ' စမ်းသပ်သတိပေးချက် ပို့ပြီးပါပြီ။' : ' Test alert dispatched to channel.';
      }
    }

    // Also inject into simulator messages
    addTelegramMessage({
      sender: 'system',
      text: `🔔 <b>စနစ်စမ်းသပ်မှု အောင်မြင်ပါသည် (SYSTEM TEST PING)</b>\n━━━━━━━━━━━━━━━━━━━━\nBot: <b>@${verifiedUsername}</b> (${botFirstName})\nStatus: 🟢 Active & Verified\nTime: ${new Date().toLocaleTimeString()}`,
    });
    setMessages(getStoredTelegramMessages());

    setTestStatus({
      loading: false,
      success: true,
      message: alertMessage,
    });
    setTimeout(() => setTestStatus(null), 4500);
  };

  const handleCopyMiniAppUrl = () => {
    const miniAppUrl = window.location.origin;
    navigator.clipboard.writeText(miniAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const directTelegramUrl = generateTelegramOrderDirectChatUrl(config.botUsername, 'မင်္ဂလာပါ Ayar Atelier မှ ပိုးထည်ဝတ်စုံများ စိတ်ဝင်စားလို့ပါရှင်');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0e1621] text-stone-100 h-full flex flex-col shadow-2xl border-l border-stone-800">
        {/* Telegram Header */}
        <div className="bg-[#17212b] px-4 py-3 border-b border-[#242f3d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2481cc] to-[#3ca3f0] flex items-center justify-center text-white shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#17212b]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">Ayar Atelier Bot</h3>
                <span className="bg-[#2481cc] text-[9px] text-white px-1 rounded-full font-bold">✓</span>
              </div>
              <p className="text-[11px] text-[#708499] font-mono">
                @{config.botUsername} • <span className="text-emerald-400">bot online</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Real Telegram Link */}
            <a
              href={directTelegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[#708499] hover:text-white rounded hover:bg-[#242f3d] transition-colors"
              title="Open in Official Telegram App"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Toggle Tabs */}
            <button
              onClick={() => setActiveTab(activeTab === 'chat' ? 'settings' : 'chat')}
              className={`p-1.5 rounded transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#2481cc] text-white'
                  : 'text-[#708499] hover:text-white hover:bg-[#242f3d]'
              }`}
              title="Bot Integration Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-[#708499] hover:text-white rounded hover:bg-[#242f3d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher Indicator */}
        <div className="bg-[#17212b] px-4 py-1.5 flex gap-4 text-xs font-semibold border-b border-[#242f3d]">
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-1 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'chat'
                ? 'border-[#2481cc] text-[#2481cc]'
                : 'border-transparent text-[#708499] hover:text-stone-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{language === 'mm' ? 'Bot ဆွေးနွေးမှု / စတိုးဆိုင်' : 'Live Bot Chat & Shop'}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-1 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'settings'
                ? 'border-[#2481cc] text-[#2481cc]'
                : 'border-transparent text-[#708499] hover:text-stone-300'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{language === 'mm' ? 'Bot ချိတ်ဆက်မှု ဆက်တင်များ' : 'Bot API & Webhook'}</span>
          </button>
        </div>

        {/* TAB 1: Chat Stream */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0e1621]">
            {/* Quick Command Suggestions */}
            <div className="p-2 bg-[#17212b]/60 border-b border-[#242f3d] flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
              <span className="text-[#708499] text-[10px] uppercase font-bold shrink-0">Commands:</span>
              <button
                onClick={() => handleSendMessage('/catalog')}
                className="px-2.5 py-1 bg-[#242f3d] hover:bg-[#2481cc] text-stone-200 hover:text-white rounded-full transition-colors shrink-0"
              >
                👗 /catalog
              </button>
              <button
                onClick={() => handleSendMessage('ပိုးထည် ကုတ်အင်္ကျီ')}
                className="px-2.5 py-1 bg-[#242f3d] hover:bg-[#2481cc] text-stone-200 hover:text-white rounded-full transition-colors shrink-0 font-myanmar"
              >
                ✨ ပိုးထည်
              </button>
              <button
                onClick={() => handleSendMessage('/track AYR-8921')}
                className="px-2.5 py-1 bg-[#242f3d] hover:bg-[#2481cc] text-stone-200 hover:text-white rounded-full transition-colors shrink-0"
              >
                📦 /track AYR-8921
              </button>
              <button
                onClick={() => handleSendMessage('/start')}
                className="px-2.5 py-1 bg-[#242f3d] hover:bg-[#2481cc] text-stone-200 hover:text-white rounded-full transition-colors shrink-0"
              >
                🔄 /start
              </button>
            </div>

            {/* Chat Messages Body */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const isSystem = msg.sender === 'system';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isUser ? 'items-end' : isSystem ? 'items-center' : 'items-start'
                    }`}
                  >
                    {isSystem ? (
                      <div className="w-full max-w-sm bg-[#17212b] border border-[#2b5278] rounded-xl p-3 text-xs text-stone-300 shadow-md">
                        {msg.photoUrl && (
                          <img
                            src={msg.photoUrl}
                            alt="Attachment"
                            className="w-full h-32 object-cover rounded-lg mb-2.5 bg-stone-900"
                          />
                        )}
                        <div
                          className="font-myanmar leading-relaxed space-y-1"
                          dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
                        />
                        {msg.inlineButtons && msg.inlineButtons.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[#242f3d] flex flex-col gap-1.5">
                            {msg.inlineButtons.map((btn, bIdx) => (
                              <button
                                key={bIdx}
                                onClick={() => handleInlineAction(btn.action || '', btn.payload)}
                                className="w-full py-1.5 px-3 bg-[#2481cc]/20 hover:bg-[#2481cc] text-[#3ca3f0] hover:text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                              >
                                {btn.text}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="mt-1 text-[9px] text-[#708499] text-right">{msg.timestamp}</div>
                      </div>
                    ) : (
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-[#2b5278] text-white rounded-tr-xs'
                            : 'bg-[#182533] text-stone-200 border border-[#242f3d] rounded-tl-xs'
                        }`}
                      >
                        {msg.photoUrl && (
                          <img
                            src={msg.photoUrl}
                            alt="Preview"
                            className="w-full h-36 object-cover rounded-lg mb-2 bg-stone-900"
                          />
                        )}
                        <div
                          className="font-myanmar break-words"
                          dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
                        />

                        {/* Inline Keyboard Buttons */}
                        {msg.inlineButtons && msg.inlineButtons.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#242f3d] space-y-1.5">
                            {msg.inlineButtons.map((btn, bIdx) => (
                              <button
                                key={bIdx}
                                onClick={() => {
                                  if (btn.url) {
                                    window.open(btn.url, '_blank');
                                  } else {
                                    handleInlineAction(btn.action || '', btn.payload);
                                  }
                                }}
                                className="w-full py-1.5 px-3 bg-[#2481cc]/15 hover:bg-[#2481cc] text-[#4ea4f5] hover:text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                              >
                                <span>{btn.text}</span>
                                {btn.url && <ExternalLink className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        )}

                        <div
                          className={`mt-1.5 text-[9px] text-right ${
                            isUser ? 'text-[#82a7cc]' : 'text-[#708499]'
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-[#17212b] border-t border-[#242f3d]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={
                    language === 'mm'
                      ? 'Telegram Bot ထံသို့ မေးမြန်းရန် (ဥပမာ /catalog, /track)...'
                      : 'Message @AyarAtelier_bot (/catalog, /track)...'
                  }
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="flex-1 bg-[#242f3d] text-xs text-white placeholder-[#708499] px-3.5 py-2.5 rounded-full border border-transparent focus:border-[#2481cc] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className="w-9 h-9 rounded-full bg-[#2481cc] hover:bg-[#3ca3f0] disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: Settings & Real Bot Configuration */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#0e1621] text-xs">
            {/* Status Card */}
            <div className="bg-[#17212b] p-4 rounded-xl border border-[#242f3d]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-sm text-white">Telegram Gateway Status</span>
                </div>
                <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-800">
                  Ready & Synced
                </span>
              </div>
              <p className="text-[#708499] text-[11px] mt-1.5 leading-relaxed font-myanmar">
                {language === 'mm'
                  ? 'အော်ဒါအသစ်များ၊ ငွေပေးချေမှုများနှင့် ပို့ဆောင်ရေး အခြေအနေများကို Telegram Bot မှတစ်ဆင့် အလိုအလျောက် သတိပေးအကြောင်းကြားပေးပါမည်။'
                  : 'Automated order dispatch, instant customer receipt delivery, and courier progression notifications powered by Telegram Bot.'}
              </p>
            </div>

            {/* Test Status feedback */}
            {testStatus && (
              <div
                className={`p-3 rounded-lg border flex items-center gap-2 text-xs font-semibold ${
                  testStatus.success
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-700 text-rose-200'
                }`}
              >
                {testStatus.success ? <CheckCircle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{testStatus.message}</span>
              </div>
            )}

            {/* Config Form */}
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Telegram Bot Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#708499]">@</span>
                  <input
                    type="text"
                    required
                    value={config.botUsername}
                    onChange={(e) => setConfig({ ...config, botUsername: e.target.value.replace('@', '') })}
                    className="w-full bg-[#17212b] border border-[#242f3d] rounded-lg py-2 pl-7 pr-3 text-xs text-white focus:border-[#2481cc] focus:outline-none font-mono"
                    placeholder="AyarAtelier_bot"
                  />
                </div>
                <span className="text-[10px] text-[#708499] mt-0.5 block">
                  Created via @BotFather on Telegram
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Telegram Bot API Token
                </label>
                <input
                  type="text"
                  required
                  value={config.botToken}
                  onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                  className="w-full bg-[#17212b] border border-[#242f3d] rounded-lg p-2 text-xs text-white focus:border-[#2481cc] focus:outline-none font-mono"
                  placeholder="e.g. 7192849102:AAH9fK_DEMO_SECRET_KEY..."
                />
                <span className="text-[10px] text-[#708499] mt-0.5 block font-myanmar">
                  {language === 'mm'
                    ? '@BotFather ထံမှ ရရှိသော HTTP API Access Token ကို ထည့်ပါ'
                    : 'Your confidential Bot token provided by @BotFather'}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Orders Alert Channel / Group Chat ID (Optional)
                </label>
                <input
                  type="text"
                  value={config.channelChatId}
                  onChange={(e) => setConfig({ ...config, channelChatId: e.target.value })}
                  className="w-full bg-[#17212b] border border-[#242f3d] rounded-lg p-2 text-xs text-white focus:border-[#2481cc] focus:outline-none font-mono"
                  placeholder="@ayar_atelier_orders or group chat ID"
                />
                <span className="text-[10px] text-[#708499] mt-0.5 block font-myanmar">
                  {language === 'mm'
                    ? 'အော်ဒါအသစ်များ တိုက်ရိုက်ရောက်ရှိမည့် Telegram Channel သို့မဟုတ် Group Chat ID (ထည့်ထားပါက မက်ဆေ့ခ်ျ တိုက်ရိုက်ပို့ပေးပါမည်)'
                    : 'Destination Channel or Group ID where staff receives real-time order alerts'}
                </span>
              </div>

              {/* Toggles */}
              <div className="bg-[#17212b] p-3 rounded-lg border border-[#242f3d] space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-stone-300 font-semibold font-myanmar">
                    {language === 'mm' ? 'အော်ဒါအသစ်ဝင်လျှင် အသံဖြင့် သတိပေးရန်' : 'Notify on New Order'}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.notifyOnOrder}
                    onChange={(e) => setConfig({ ...config, notifyOnOrder: e.target.checked })}
                    className="w-4 h-4 accent-[#2481cc]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-stone-300 font-semibold font-myanmar">
                    {language === 'mm' ? 'ပို့ဆောင်ရေး ဂိုဒေါင်ထွက်ခွာလျှင် သတိပေးရန်' : 'Notify on Courier Dispatched'}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.notifyOnDispatched}
                    onChange={(e) => setConfig({ ...config, notifyOnDispatched: e.target.checked })}
                    className="w-4 h-4 accent-[#2481cc]"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={testStatus?.loading}
                  className="flex-1 py-2 px-3 bg-[#242f3d] hover:bg-[#2b3a4a] text-stone-200 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus?.loading ? 'animate-spin' : ''}`} />
                  <span>{language === 'mm' ? 'စမ်းသပ်မက်ဆေ့ခ်ျ ပို့မည်' : 'Test Ping'}</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-[#2481cc] hover:bg-[#3ca3f0] text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'mm' ? 'ဆက်တင် သိမ်းမည်' : 'Save Config'}</span>
                </button>
              </div>
            </form>

            {/* Telegram Mini App Setup Guide (TWA) */}
            <div className="bg-[#17212b] p-4 rounded-xl border border-[#242f3d] space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Smartphone className="w-4 h-4 text-[#3ca3f0]" />
                <span>Telegram Web App (Mini App) စနစ်ဖြင့် ဆိုင်ဖွင့်နည်း</span>
              </div>
              <p className="text-[11px] text-[#708499] font-myanmar leading-relaxed">
                ဖောက်သည်များ Telegram App ထဲမှ မထွက်ဘဲ ပိုးထည်များကို စတိုးဆိုင်ဖွင့်၍ တိုက်ရိုက် ကြည့်ရှုဝယ်ယူနိုင်ရန် @BotFather တွင် Mini App အဖြစ် ချက်ချင်း ချိတ်ဆက်နိုင်ပါသည်။
              </p>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#708499] mb-1">
                  Telegram Mini App Web URL (Copy this URL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={window.location.origin}
                    className="flex-1 bg-[#0e1621] border border-[#242f3d] rounded p-1.5 text-[11px] font-mono text-amber-200 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyMiniAppUrl}
                    className="px-3 py-1.5 bg-[#2481cc] text-white rounded text-xs font-semibold flex items-center gap-1 hover:bg-[#3ca3f0] transition-colors"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 3 Step Instruction */}
              <div className="space-y-1.5 text-[11px] text-stone-300 font-myanmar border-t border-[#242f3d] pt-2.5">
                <div><b>အဆင့် (၁):</b> Telegram တွင် <code>@BotFather</code> ထံသို့ သွား၍ <code>/newapp</code> ဟု ရိုက်ပါ။</div>
                <div><b>အဆင့် (၂):</b> သင့် Bot ကို ရွေးချယ်ပြီး အထက်ပါ Web App URL ကို ထည့်ပေးပါ။</div>
                <div><b>အဆင့် (၃):</b> ပြီးပါက ဖောက်သည်များသည် Telegram Bot တွင် <b>"Open Store"</b> ခလုတ်ကို နှိပ်ရုံဖြင့် ဈေးဝယ်ယူနိုင်ပါပြီ။</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
