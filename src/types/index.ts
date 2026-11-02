export type Language = 'en' | 'mm';
export type Currency = 'MMK';
export type ViewMode = 'catalog' | 'lookbook' | 'tracking' | 'wishlist' | 'admin';

export interface Product {
  id: string;
  sku: string;
  name: string;
  nameMm: string;
  tagline: string;
  taglineMm: string;
  description: string;
  descriptionMm: string;
  price: number;
  priceMmk: number; // in MMK
  category: 'outerwear' | 'traditional_reimagined' | 'streetwear' | 'dresses' | 'tops' | 'accessories';
  sizes: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[];
  colors: {
    name: string;
    nameMm: string;
    hex: string;
  }[];
  images: string[];
  lowResImage: string; // optimized tiny WebP/SVG placeholder
  stock: number;
  rating: number;
  reviewsCount: number;
  isNew?: boolean;
  isFeatured?: boolean;
  fabric: string;
  fabricMm: string;
  careGuide: string;
  careGuideMm: string;
  tags: string[];
  lookbookId?: string;
}

export interface Hotspot {
  productId: string;
  xPercent: number;
  yPercent: number;
  title: string;
  titleMm: string;
  price: number;
}

export interface LookbookItem {
  id: string;
  title: string;
  titleMm: string;
  season: string;
  seasonMm: string;
  image: string;
  lowResImage: string;
  description: string;
  descriptionMm: string;
  hotspots: Hotspot[];
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: {
    name: string;
    nameMm: string;
    hex: string;
  };
  quantity: number;
}

export type OrderStatus =
  | 'confirmed'
  | 'tailoring'
  | 'dispatched'
  | 'transit'
  | 'out_for_delivery'
  | 'delivered';

export interface TrackingStep {
  status: OrderStatus;
  label: string;
  labelMm: string;
  timestamp: string;
  location: string;
  locationMm: string;
  note: string;
  noteMm: string;
  completed: boolean;
  current: boolean;
}

export interface Order {
  id: string;
  trackingNumber: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  currency: Currency;
  status: OrderStatus;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    notes?: string;
  };
  payment: {
    method: 'kbzpay' | 'wavepay' | 'applepay' | 'googlepay' | 'card' | 'cod';
    transactionId: string;
    paidAt: string;
    last4?: string;
    isEncrypted: boolean;
  };
  courier: {
    name: string;
    phone: string;
    vehicle: string;
    currentCoords: { lat: number; lng: number };
    estimatedDelivery: string;
  };
  trackingHistory: TrackingStep[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'customer' | 'admin';
  oauthProvider: 'google' | 'guest';
  loyaltyPoints: number;
  tier: 'Silver' | 'Gold VIP' | 'Platinum Atelier VIP';
  savedAddresses: {
    id: string;
    label: string;
    name: string;
    street: string;
    city: string;
    phone: string;
    isDefault: boolean;
  }[];
  measurements: {
    unit: 'cm' | 'in';
    chest: number;
    waist: number;
    hips: number;
    height: number;
  };
  wishlistIds: string[];
  browsingHistory: {
    productId: string;
    viewedAt: number;
    category: string;
  }[];
}

export interface EmailNotification {
  id: string;
  orderId: string;
  recipientEmail: string;
  subject: string;
  subjectMm: string;
  preview: string;
  htmlContent: string;
  sentAt: string;
  type: 'order_confirmed' | 'order_dispatched' | 'out_for_delivery' | 'loyalty_reward';
  isRead?: boolean;
  read?: boolean;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  changeType: 'sale' | 'restock' | 'adjustment' | 'return';
  amount: number;
  previousStock: number;
  newStock: number;
  date: string;
  operator: string;
}

export interface HighAvailabilityStatus {
  primaryDatabase: {
    region: string;
    status: 'ACTIVE_PRIMARY' | 'FAILING_OVER' | 'STANDBY';
    latencyMs: number;
    connections: number;
    storageUsedGb: number;
    version: string;
  };
  replicaDatabase: {
    region: string;
    status: 'READ_REPLICA' | 'PROMOTED_PRIMARY' | 'SYNCING';
    replicationLagMs: number;
    syncState: 'SYNCHRONOUS' | 'ASYNCHRONOUS';
  };
  loadBalancer: {
    globalAnycastIp: string;
    status: 'HEALTHY';
    activeNodes: number;
    ddosProtection: 'ACTIVE_CLOUD_ARMOR';
  };
  cdnCache: {
    edgeHitRatio: number;
    bandwidthSavedMb: number;
    compression: 'Brotli + AVIF';
  };
  lastFailoverEvent?: {
    timestamp: string;
    triggerReason: string;
    durationMs: number;
    recoveryState: 'SUCCESS';
  };
}

export interface TelegramBotConfig {
  botToken: string;
  botUsername: string;
  channelChatId: string;
  adminChatId: string;
  notifyOnOrder: boolean;
  notifyOnDispatched: boolean;
  notifyOnDelivered: boolean;
  enableTWA: boolean;
  lastPingAt?: string;
}

export interface TelegramInlineButton {
  text: string;
  action?: string;
  url?: string;
  payload?: string;
}

export interface TelegramMessage {
  id: string;
  sender: 'bot' | 'user' | 'system';
  text: string;
  timestamp: string;
  photoUrl?: string;
  inlineButtons?: TelegramInlineButton[];
  orderSnippet?: {
    id: string;
    total: string;
    status: string;
    trackingNumber: string;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          start_param?: string;
        };
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
      };
    };
  }
}
