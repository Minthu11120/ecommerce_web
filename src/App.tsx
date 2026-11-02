import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Package,
  Heart,
  TrendingUp,
  Zap,
  Store,
  Bot,
} from 'lucide-react';

import {
  CartItem,
  Currency,
  EmailNotification,
  InventoryLog,
  Language,
  Order,
  Product,
  UserProfile,
  ViewMode,
} from './types';

import { lookbookItems } from './data/mockProducts';
import { translations, formatPrice } from './data/translations';
import {
  dbSimulator,
  updateProductStockInDb,
  addNewProductToDb,
} from './services/dbSimulator';
import { emailService } from './services/emailService';
import {
  dispatchTelegramOrderNotification,
  dispatchTelegramStatusUpdate,
  addTelegramMessage,
} from './services/telegramBotService';
import { DEMO_ADMIN, DEMO_CUSTOMER } from './data/mockUsers';

// UI Components
import { Header } from './components/Header';
import { AdminHeader } from './components/AdminHeader';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { LookbookView } from './components/LookbookView';
import { WishlistView } from './components/WishlistView';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { AccountModal } from './components/AccountModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CloudHaModal } from './components/CloudHaModal';
import { EmailSimulatorDrawer } from './components/EmailSimulatorDrawer';
import { PersonalizedRecommendations } from './components/PersonalizedRecommendations';
import { StaffLoginModal } from './components/StaffLoginModal';
import { TelegramBotDrawer } from './components/TelegramBotDrawer';

export default function App() {
  // Global App State
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('MMK');
  const [lowBandwidth, setLowBandwidth] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ViewMode>('catalog');
  const [adminActiveTab, setAdminActiveTab] = useState<'inventory' | 'analytics' | 'audit'>('inventory');

  // Products & Inventory
  const [products, setProducts] = useState<Product[]>(() => dbSimulator.getProducts());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Customer Shopping State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ayar_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ayar_wishlist');
    return saved ? JSON.parse(saved) : ['prod-01', 'prod-03'];
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => dbSimulator.getUserProfile());

  // Orders & Cloud State
  const [orders, setOrders] = useState<Order[]>(() => dbSimulator.getOrders());
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(() => dbSimulator.getInventoryLogs());
  const [emails, setEmails] = useState<EmailNotification[]>(() => emailService.getEmails());
  const [clusterStatus, setClusterStatus] = useState(() => dbSimulator.getHAStatus());

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isCloudHaOpen, setIsCloudHaOpen] = useState(false);
  const [isEmailDrawerOpen, setIsEmailDrawerOpen] = useState(false);
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);
  const [isTelegramBotOpen, setIsTelegramBotOpen] = useState(false);
  const [isTelegramMiniApp, setIsTelegramMiniApp] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ayar_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('ayar_wishlist', JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  // Telegram Web App (TWA) Integration & Auto-Detection
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        setIsTelegramMiniApp(true);
        if (tg.initDataUnsafe?.user) {
          const tgUser = tg.initDataUnsafe.user;
          const fullName = `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim();
          if (fullName) {
            setUserProfile((prev) => ({
              ...prev,
              name: fullName,
              email: tgUser.username ? `${tgUser.username}@telegram.org` : prev.email,
            }));
          }
        }
      } catch (err) {
        console.warn('Telegram WebApp check:', err);
      }
    }
  }, []);

  const t = translations[language];

  // Cart operations
  const handleAddToCart = (product: Product, size: string, color: Product['colors'][0], quantity: number) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor.name === color.name
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, selectedSize: size, selectedColor: color, quantity }];
    });
    setIsCartOpen(true);
  };

  const handleQuickAdd = (product: Product) => {
    handleAddToCart(product, product.sizes[0] || 'M', product.colors[0], 1);
  };

  const handleOneClickBuy = (product: Product, size?: string, color?: Product['colors'][0]) => {
    const chosenSize = size || product.sizes[0] || 'M';
    const chosenColor = color || product.colors[0];
    setCartItems([{ product, selectedSize: chosenSize, selectedColor: chosenColor, quantity: 1 }]);
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  const handleOrderViaTelegram = (product: Product, size?: string, color?: Product['colors'][0]) => {
    const chosenSize = size || product.sizes[0] || 'M';
    const chosenColor = color || product.colors[0];

    // Seed bot message conversation
    addTelegramMessage({
      sender: 'user',
      text: `မင်္ဂလာပါ ${product.nameMm} (${product.name}) အထည်ကို Telegram Bot မှ ဝယ်ယူလိုပါသည် 👗`,
    });

    addTelegramMessage({
      sender: 'bot',
      text: `✨ <b>${product.nameMm} (${product.name})</b>\n\nအရွယ်အစား: <b>${chosenSize}</b>\nအရောင်: <b>${chosenColor.nameMm || chosenColor.name}</b>\nကျသင့်ငွေ: <b>K ${product.priceMmk.toLocaleString()}</b>\n\nအောက်ပါခလုတ်ကို နှိပ်၍ ငွေပေးချေမှုကို အတည်ပြုနိုင်ပါသည်ရှင် -`,
      photoUrl: product.images[0],
      inlineButtons: [
        { text: '💳 အတည်ပြု၍ ငွေပေးချေမည် (Confirm & Pay)', action: 'quick_buy', payload: product.id },
        { text: '🛍️ စျေးဝယ်အိတ်ထဲ ထည့်မည်', action: 'add_to_cart', payload: product.id },
      ],
    });

    setIsTelegramBotOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Wishlist operations
  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Product Selection & Browsing History Logging for Adaptive Recommendations
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);

    // Append to user's browsing history
    const updatedHistory = [
      { productId: product.id, viewedAt: new Date().toISOString(), category: product.category },
      ...userProfile.browsingHistory.filter((h) => h.productId !== product.id),
    ].slice(0, 10);

    const updatedProfile = { ...userProfile, browsingHistory: updatedHistory };
    setUserProfile(updatedProfile);
    dbSimulator.saveUserProfile(updatedProfile);
  };

  // Order Completion Flow
  const handleOrderCompleted = (newOrder: Order) => {
    // 1. Save order to PostgreSQL simulator
    dbSimulator.saveOrder(newOrder);
    setOrders(dbSimulator.getOrders());

    // 2. Reduce inventory stock for purchased items
    newOrder.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.product.id);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity);
        updateProductStockInDb(prod.id, newStock);
      }
    });
    setProducts(dbSimulator.getProducts());
    setInventoryLogs(dbSimulator.getInventoryLogs());

    // 3. Send automated transactional email
    const email = emailService.sendOrderConfirmationEmail(newOrder);
    setEmails(emailService.getEmails());

    // 4. Send automated Telegram Bot receipt & notify sales channel
    dispatchTelegramOrderNotification(newOrder);
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.HapticFeedback?.notificationOccurred('success');
      } catch (e) {
        // ignore
      }
    }

    // 5. Boost user loyalty points
    const ptsEarned = Math.floor(newOrder.total * 0.1);
    const updatedProfile = {
      ...userProfile,
      loyaltyPoints: userProfile.loyaltyPoints + ptsEarned,
    };
    setUserProfile(updatedProfile);
    dbSimulator.saveUserProfile(updatedProfile);
  };

  // Courier Progression Flow (Advancing fulfillment status & firing automated emails)
  const handleAdvanceOrderStep = (orderId: string) => {
    const updated = dbSimulator.advanceOrderStatus(orderId);
    if (updated) {
      setOrders(dbSimulator.getOrders());

      // Send automated Telegram notification
      dispatchTelegramStatusUpdate(updated, updated.status);

      // Send automated status update email for dispatched or delivered
      if (updated.status === 'dispatched') {
        emailService.sendOrderDispatchedEmail(updated);
        setEmails(emailService.getEmails());
      } else if (updated.status === 'delivered') {
        emailService.sendOrderDeliveredEmail(updated);
        setEmails(emailService.getEmails());
      }
    }
  };

  // Admin inventory updates
  const handleUpdateProductStock = (productId: string, newStock: number) => {
    updateProductStockInDb(productId, newStock);
    setProducts(dbSimulator.getProducts());
    setInventoryLogs(dbSimulator.getInventoryLogs());
  };

  const handleAddNewProduct = (newProd: Product) => {
    addNewProductToDb(newProd);
    setProducts(dbSimulator.getProducts());
    setInventoryLogs(dbSimulator.getInventoryLogs());
  };

  const handleSimulateSampleOrder = () => {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const orderId = `AYR-${Math.floor(2000 + Math.random() * 7000)}`;
    const sampleOrder: Order = {
      id: orderId,
      trackingNumber: `TRK-${Math.floor(10000 + Math.random() * 90000)}-MM`,
      createdAt: new Date().toISOString(),
      items: [{ product: randomProduct, selectedSize: 'M', selectedColor: randomProduct.colors[0], quantity: 1 }],
      subtotal: randomProduct.priceMmk,
      discount: 0,
      shippingFee: 0,
      total: randomProduct.priceMmk,
      currency: 'MMK',
      status: 'confirmed',
      customer: {
        name: 'Daw Khin Sandar',
        email: 'khinsandar.atelier@gmail.com',
        phone: '+95 9 250 888 777',
        address: 'No. 88 Shwe Taung Gyar, Bahan',
        city: 'Yangon',
        postalCode: '11201',
      },
      payment: {
        method: 'kbzpay',
        transactionId: `KBZ-TX-${Date.now().toString().slice(-7)}`,
        paidAt: new Date().toISOString(),
        isEncrypted: true,
      },
      courier: {
        name: 'Ko Min Thu',
        phone: '+95 9 444 333 222',
        vehicle: 'Express Electric Van #12',
        currentCoords: { lat: 16.815, lng: 96.152 },
        estimatedDelivery: 'Tomorrow Morning',
      },
      trackingHistory: [
        {
          status: 'confirmed',
          label: 'Order Confirmed via KBZPay QR',
          labelMm: 'KBZPay ဖြင့် ငွေချေအတည်ပြုပြီး',
          timestamp: 'Just now',
          location: 'Yangon Central Fulfillment',
          locationMm: 'ရန်ကုန် ပင်မဌာန',
          note: 'Transaction committed to PostgreSQL WAL logs.',
          noteMm: 'ဒေတာဘေ့စ်တွင် သိမ်းဆည်းပြီးပါပြီ။',
          completed: true,
          current: true,
        },
      ],
    };

    handleOrderCompleted(sampleOrder);
  };

  // High availability failover
  const handleTriggerFailover = () => {
    dbSimulator.triggerFailover();
    setClusterStatus(dbSimulator.getHAStatus());
  };

  // Role Authentication Switch Handlers
  const handleLoginAsAdmin = () => {
    const adminUser = { ...DEMO_ADMIN };
    setUserProfile(adminUser);
    dbSimulator.saveUserProfile(adminUser);
    setActiveView('admin');
    setIsStaffLoginOpen(false);
  };

  const handleLoginAsCustomer = () => {
    const customerUser = { ...DEMO_CUSTOMER };
    setUserProfile(customerUser);
    dbSimulator.saveUserProfile(customerUser);
    setActiveView('catalog');
    setIsStaffLoginOpen(false);
  };

  // Export CSV report for admin
  const handleExportCsvReport = () => {
    const headers = language === 'mm'
      ? ['ပစ္စည်းကုဒ်', 'ပစ္စည်းအမည်', 'အမျိုးအစား', 'လက်ကျန်စတော့ခ်', 'စျေးနှုန်း (MMK)', 'အခြေအနေ']
      : ['SKU', 'Product Name', 'Category', 'Stock Level', 'Price (MMK)', 'Status'];

    const rows = products.map((p) => [
      p.sku,
      `"${(language === 'mm' ? p.nameMm : p.name).replace(/"/g, '""')}"`,
      p.category,
      p.stock,
      p.priceMmk,
      p.stock === 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : 'In Stock',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ayar_atelier_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameMm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0; // featured default
  });

  return (
    <div className={`min-h-screen flex flex-col bg-[#faf8f5] text-stone-900 ${lowBandwidth ? 'low-bandwidth-mode' : ''}`}>
      {/* Top Header: Distinct Layout for Customer Storefront vs Admin Management */}
      {/* Dynamic Header: Staff Admin Header vs Customer Storefront Header */}
      {activeView === 'admin' ? (
        <AdminHeader
          language={language}
          onLanguageChange={setLanguage}
          currency={currency}
          activeTab={adminActiveTab}
          onTabChange={setAdminActiveTab}
          onBackToStorefront={() => setActiveView('catalog')}
          onSimulateSampleOrder={handleSimulateSampleOrder}
          onExportCsvReport={handleExportCsvReport}
          onOpenCloudHa={() => setIsCloudHaOpen(true)}
          totalProductsCount={products.length}
          lowStockCount={products.filter((p) => p.stock < 10).length}
          onOpenStaffLogin={() => setIsStaffLoginOpen(true)}
          onOpenTelegramBot={() => setIsTelegramBotOpen(true)}
        />
      ) : (
        <Header
          language={language}
          setLanguage={setLanguage}
          onLanguageChange={setLanguage}
          currency={currency}
          setCurrency={setCurrency}
          onCurrencyChange={setCurrency}
          lowBandwidth={lowBandwidth}
          setLowBandwidth={setLowBandwidth}
          onLowBandwidthToggle={() => setLowBandwidth(!lowBandwidth)}
          activeView={activeView}
          currentTab={activeView}
          onViewChange={setActiveView}
          setCurrentTab={(tab) => {
            if (tab === 'cloud') {
              setIsCloudHaOpen(true);
            } else {
              setActiveView(tab as any);
            }
          }}
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          wishlistCount={wishlistIds.length}
          emailNotificationCount={emails.filter((e) => !e.read).length}
          unreadEmailsCount={emails.filter((e) => !e.read).length}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAccount={() => setIsAccountOpen(true)}
          onOpenCloudHa={() => setIsCloudHaOpen(true)}
          onOpenEmails={() => setIsEmailDrawerOpen(true)}
          onOpenEmailNotifications={() => setIsEmailDrawerOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          userProfile={userProfile}
          onOpenStaffLogin={() => setIsStaffLoginOpen(true)}
          onOpenTelegramBot={() => setIsTelegramBotOpen(true)}
        />
      )}

      {/* Telegram Mini App Top Ribbon if running in Telegram Web App */}
      {isTelegramMiniApp && (
        <div className="bg-[#2481cc] text-white text-xs px-4 py-1.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 shrink-0 text-white" />
            <span className="font-semibold">Telegram WebApp Active</span>
            <span className="hidden sm:inline text-blue-100 text-[11px]">• Direct In-Bot Checkout &amp; Order Sync</span>
          </div>
          <button
            onClick={() => setIsTelegramBotOpen(true)}
            className="text-[11px] bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-full font-medium transition-colors cursor-pointer"
          >
            {language === 'mm' ? 'Bot စကားပြောခန်းဖွင့်မည်' : 'Open Bot Chat'}
          </button>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-grow">
        {/* VIEW 1: CATALOG VIEW */}
        {activeView === 'catalog' && (
          <div className="space-y-12">
            {/* Hero Banner Section */}
            <section className="relative overflow-hidden bg-stone-900 text-stone-100 border-b border-stone-800">
              <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80"
                  alt="Ayar Atelier Collection"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent z-10" />

              <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col justify-center">
                <span className="text-xs uppercase tracking-[0.3em] font-semibold text-amber-400 mb-3 block">
                  {t.hero.season}
                </span>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight max-w-2xl leading-[1.1]">
                  {t.hero.title}
                </h1>
                <p className="mt-4 text-xs sm:text-base text-stone-300 max-w-xl font-light leading-relaxed">
                  {t.hero.subtitle}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    id="hero-explore-lookbook"
                    onClick={() => setActiveView('lookbook')}
                    className="px-6 py-3 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-98"
                  >
                    <span>{t.hero.exploreBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    id="hero-view-heritage"
                    onClick={() => setSelectedCategory('traditional_reimagined')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-stone-100 border border-stone-700 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    {t.categories.traditional_reimagined}
                  </button>
                </div>

                {/* Low bandwidth indicator chip */}
                {lowBandwidth && (
                  <div className="mt-6 flex items-center gap-2 text-xs text-amber-300 bg-amber-950/80 border border-amber-800/60 px-3 py-1.5 rounded-full w-fit">
                    <Zap className="w-3.5 h-3.5 fill-amber-300" />
                    <span>Lite Network Mode active: SVG placeholders reduce bandwidth consumption by 85%.</span>
                  </div>
                )}
              </div>
            </section>

            {/* Catalog Controls: Category Pills & Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none text-xs font-semibold uppercase tracking-wider">
                  {[
                    { key: 'all', label: t.categories.all },
                    { key: 'traditional_reimagined', label: t.categories.traditional_reimagined },
                    { key: 'outerwear', label: t.categories.outerwear },
                    { key: 'streetwear', label: t.categories.streetwear },
                    { key: 'dresses', label: t.categories.dresses },
                    { key: 'tops', label: t.categories.tops },
                    { key: 'accessories', label: t.categories.accessories },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`px-3.5 py-2 rounded-full whitespace-nowrap transition-all ${
                        selectedCategory === cat.key
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search and Sort Filter Controls */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-grow sm:w-60">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={t.catalog.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-amber-800 shadow-2xs"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    aria-label="Sort products"
                    className="text-xs py-2 px-3 bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-amber-800 text-stone-700 font-medium"
                  >
                    <option value="featured">{t.catalog.sortBy}: Featured</option>
                    <option value="price-asc">{t.catalog.filterPriceLow}</option>
                    <option value="price-desc">{t.catalog.filterPriceHigh}</option>
                    <option value="rating">Top Customer Rating</option>
                  </select>
                </div>
              </div>

              {/* Product Grid */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
                    Showing {sortedProducts.length} handcrafted pieces
                  </span>
                  <span className="text-xs text-stone-400">Hand-finished in Yangon &amp; Mandalay</span>
                </div>

                {sortedProducts.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-2xl border border-stone-200">
                    <p className="text-stone-500 text-sm">No garments found matching your filter.</p>
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSearchQuery('');
                      }}
                      className="mt-4 text-xs font-semibold text-amber-800 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {sortedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        language={language}
                        currency={currency}
                        lowBandwidth={lowBandwidth}
                        isWishlisted={wishlistIds.includes(product.id)}
                        onSelectProduct={handleSelectProduct}
                        onToggleWishlist={handleToggleWishlist}
                        onQuickAdd={handleQuickAdd}
                        onOrderViaTelegram={handleOrderViaTelegram}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Personalized Recommendations Engine */}
            <PersonalizedRecommendations
              products={products}
              userProfile={userProfile}
              language={language}
              currency={currency}
              lowBandwidth={lowBandwidth}
              onSelectProduct={handleSelectProduct}
              onQuickAdd={handleQuickAdd}
            />
          </div>
        )}

        {/* VIEW 2: LOOKBOOK VIEW */}
        {activeView === 'lookbook' && (
          <LookbookView
            lookbooks={lookbookItems}
            products={products}
            language={language}
            currency={currency}
            lowBandwidth={lowBandwidth}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {/* VIEW 3: LIVE ORDER TRACKING VIEW */}
        {activeView === 'tracking' && (
          <OrderTrackingView
            orders={orders}
            language={language}
            currency={currency}
            onAdvanceOrderStep={handleAdvanceOrderStep}
          />
        )}

        {/* VIEW 4: WISHLIST VIEW */}
        {activeView === 'wishlist' && (
          <WishlistView
            wishlistIds={wishlistIds}
            products={products}
            language={language}
            currency={currency}
            lowBandwidth={lowBandwidth}
            onRemoveFromWishlist={handleToggleWishlist}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={handleQuickAdd}
            onExploreCatalog={() => setActiveView('catalog')}
          />
        )}

        {/* VIEW 5: ADMIN DASHBOARD (ROLE-GUARDED) */}
        {activeView === 'admin' && (
          userProfile.role === 'admin' ? (
            <AdminDashboard
              products={products}
              orders={orders}
              inventoryLogs={inventoryLogs}
              language={language}
              currency={currency}
              onUpdateProductStock={handleUpdateProductStock}
              onAddNewProduct={handleAddNewProduct}
              onSimulateSampleOrder={handleSimulateSampleOrder}
              onBackToStorefront={() => setActiveView('catalog')}
              activeTab={adminActiveTab}
              onTabChange={setAdminActiveTab}
              onOpenTelegramBot={() => setIsTelegramBotOpen(true)}
            />
          ) : (
            <div className="max-w-xl mx-auto my-20 px-6 py-12 bg-stone-900 text-stone-100 rounded-2xl shadow-xl border border-stone-800 text-center space-y-6">
              <div className="w-16 h-16 bg-amber-950/80 text-amber-300 rounded-2xl flex items-center justify-center mx-auto border border-amber-800/60 shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {language === 'mm' ? 'Staff Authentication လိုအပ်ပါသည်' : 'Staff Access Restricted'}
                </h2>
                <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                  {language === 'mm'
                    ? 'Ayar Atelier စတိုးဆိုင် စီမံခန့်ခွဲမှု (Admin Console) သို့ ဝင်ရောက်ရန်အတွက် သီးသန့် ဝန်ထမ်းအကောင့် လိုအပ်ပါသည်။ Customer အကောင့်ဖြင့် ဝင်ရောက်ခွင့် မရှိပါ။'
                    : 'The Store Admin Console is strictly reserved for store operations and inventory personnel. Customer accounts cannot access internal sales and database logs.'}
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  id="btn-access-denied-login-admin"
                  onClick={() => setIsStaffLoginOpen(true)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
                >
                  <Lock className="w-4 h-4" />
                  <span>{language === 'mm' ? 'Staff Login ဝင်မည်' : 'Staff Login & Switch'}</span>
                </button>
                <button
                  id="btn-access-denied-back-store"
                  onClick={() => setActiveView('catalog')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl transition-all"
                >
                  <span>{language === 'mm' ? 'စတိုးဆိုင်သို့ ပြန်သွားမည်' : 'Back to Storefront'}</span>
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Footer: Admin Operations Footer vs Customer Storefront Footer */}
      {activeView === 'admin' ? (
        <footer className="bg-stone-950 text-stone-400 text-xs border-t border-stone-800 py-6 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-serif text-sm font-bold text-amber-200 tracking-wider">AYAR ATELIER</span>
              <span className="text-[10px] bg-stone-900 border border-stone-800 text-stone-300 px-2 py-0.5 rounded font-mono uppercase">
                {translations[language].admin.adminConsole}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={() => setIsCloudHaOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{language === 'mm' ? 'စနစ်ကျန်းမာရေးနှင့် Cloud အချက်အလက်' : 'System Health & High Availability'}</span>
              </button>
              <span className="text-stone-700">•</span>
              <button
                id="footer-admin-back-store"
                onClick={() => setActiveView('catalog')}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                <span>{translations[language].admin.backToStore}</span>
              </button>
            </div>

            <div className="text-stone-500 text-[11px]">
              © {new Date().getFullYear()} Ayar Atelier Operations. Staff Access Only.
            </div>
          </div>
        </footer>
      ) : (
        <footer className="bg-stone-900 text-stone-400 text-xs border-t border-stone-800 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-serif text-lg font-bold text-white tracking-widest uppercase">
                  Ayar Atelier
                </span>
                <span className="text-[10px] bg-amber-900/80 text-amber-200 border border-amber-700/60 px-1.5 py-0.5 rounded uppercase font-mono">
                  Atelier Luxury
                </span>
              </div>
              <p className="text-stone-400 text-xs leading-relaxed">
                Synthesizing Myanmar's centuries-old lotus and acheik silk weaving traditions with
                contemporary architectural tailoring.
              </p>
              <div className="mt-4 flex items-center gap-2 text-stone-400 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>100% Certified Authentic Lotus &amp; Acheik Silk</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white uppercase tracking-wider mb-3">Collections</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => { setActiveView('catalog'); setSelectedCategory('traditional_reimagined'); }} className="hover:text-white">
                    Heritage Lotus Silk
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveView('catalog'); setSelectedCategory('outerwear'); }} className="hover:text-white">
                    Monsoon Weatherproof Trenches
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveView('catalog'); setSelectedCategory('streetwear'); }} className="hover:text-white">
                    Yangon Modern Streetwear
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveView('lookbook')} className="hover:text-white">
                    Season Lookbook 2025
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white uppercase tracking-wider mb-3">Services</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setActiveView('tracking')} className="hover:text-white">
                    Real-time GPS Tracking
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsAccountOpen(true)} className="hover:text-white">
                    Custom Fit Sizing Profile
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsCloudHaOpen(true)} className="hover:text-white">
                    High-Availability Architecture
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsEmailDrawerOpen(true)} className="hover:text-white">
                    Transactional Notifications
                  </button>
                </li>
                {/* Discreet Staff Login Link */}
                <li className="pt-2 border-t border-stone-800">
                  <button
                    id="footer-staff-login-btn"
                    onClick={() => setIsStaffLoginOpen(true)}
                    className="text-stone-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors text-[11px]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-500 hover:text-amber-400" />
                    <span>{language === 'mm' ? 'Staff Login (ဝန်ထမ်း ဝင်ရောက်ရန်)' : 'Staff Login & Admin Access'}</span>
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white uppercase tracking-wider mb-3">Digital Wallets &amp; Security</h4>
              <p className="text-stone-400 mb-3 leading-relaxed">
                Instant 1-click checkout supported across KBZPay, WavePay, Apple Pay, and Google Pay.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-stone-800 text-stone-300 px-2 py-1 rounded text-[10px] font-mono">KBZPay QR</span>
                <span className="bg-stone-800 text-stone-300 px-2 py-1 rounded text-[10px] font-mono">WavePay</span>
                <span className="bg-stone-800 text-stone-300 px-2 py-1 rounded text-[10px] font-mono">Apple Pay</span>
                <span className="bg-stone-800 text-stone-300 px-2 py-1 rounded text-[10px] font-mono">Google Pay</span>
                <span className="bg-stone-800 text-stone-300 px-2 py-1 rounded text-[10px] font-mono">256-bit AES</span>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-800 py-6 text-center text-stone-500 text-[11px]">
            © {new Date().getFullYear()} Ayar Atelier Co., Ltd. Yangon • Mandalay • Singapore. All rights reserved.
          </div>
        </footer>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          language={language}
          currency={currency}
          lowBandwidth={lowBandwidth}
          isWishlisted={wishlistIds.includes(selectedProduct.id)}
          userProfile={userProfile}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          onOneClickBuy={handleOneClickBuy}
          onOrderViaTelegram={handleOrderViaTelegram}
        />
      )}

      {/* CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        language={language}
        currency={currency}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        onClearCart={handleClearCart}
        onOrderViaTelegram={() => {
          setIsCartOpen(false);
          setIsTelegramBotOpen(true);
        }}
      />

      {/* CHECKOUT MODAL */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setActiveView('tracking');
        }}
        cartItems={cartItems}
        userProfile={userProfile}
        language={language}
        currency={currency}
        onOrderCompleted={handleOrderCompleted}
        onClearCart={handleClearCart}
        onOpenTelegramBot={() => {
          setIsCheckoutOpen(false);
          setIsTelegramBotOpen(true);
        }}
      />

      {/* USER ACCOUNT & OAUTH MODAL */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        userProfile={userProfile}
        orders={orders}
        language={language}
        currency={currency}
        onUpdateProfile={(up) => {
          setUserProfile(up);
          dbSimulator.saveUserProfile(up);
        }}
        onSelectOrderForTracking={(orderId) => {
          setActiveView('tracking');
        }}
        onOpenStaffLogin={() => {
          setIsAccountOpen(false);
          setIsStaffLoginOpen(true);
        }}
      />

      {/* STAFF LOGIN & ROLE SWITCHER MODAL */}
      <StaffLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        language={language}
        currentProfile={userProfile}
        onLoginAsAdmin={handleLoginAsAdmin}
        onLoginAsCustomer={handleLoginAsCustomer}
      />

      {/* CLOUD HA & POSTGRESQL ARCHITECTURE MODAL */}
      <CloudHaModal
        isOpen={isCloudHaOpen}
        onClose={() => setIsCloudHaOpen(false)}
        language={language}
        clusterStatus={clusterStatus}
        onTriggerFailover={handleTriggerFailover}
      />

      {/* AUTOMATED EMAIL NOTIFICATIONS DRAWER */}
      <EmailSimulatorDrawer
        isOpen={isEmailDrawerOpen}
        onClose={() => setIsEmailDrawerOpen(false)}
        emails={emails}
        language={language}
        onSelectOrderTracking={(orderId) => {
          setActiveView('tracking');
        }}
      />

      {/* FLOATING TELEGRAM BOT COMMERCE LAUNCHER */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 group">
        <button
          id="btn-floating-telegram-bot"
          onClick={() => setIsTelegramBotOpen(true)}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#2481cc] to-[#3ca3f0] hover:from-[#1d70b3] hover:to-[#2481cc] text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-95 border-2 border-white/40 cursor-pointer"
          title={language === 'mm' ? 'Telegram Bot စတိုးဆိုင်ဖွင့်မည်' : 'Open Telegram Bot Store'}
          aria-label="Open Telegram Bot Store"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>

      {/* TELEGRAM BOT COMMERCE DRAWER */}
      <TelegramBotDrawer
        isOpen={isTelegramBotOpen}
        onClose={() => setIsTelegramBotOpen(false)}
        products={products}
        orders={orders}
        language={language}
        onSelectProduct={handleSelectProduct}
        onQuickOrder={(prod) => {
          handleOneClickBuy(prod, prod.sizes[0] || 'M', prod.colors[0]);
        }}
        onViewOrderTracking={(orderId) => {
          setActiveView('tracking');
        }}
      />
    </div>
  );
}
