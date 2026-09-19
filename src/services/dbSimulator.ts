import { HighAvailabilityStatus, InventoryLog, Order, Product, UserProfile } from '../types';
import { initialProducts } from '../data/mockProducts';
import { DEMO_CUSTOMER } from '../data/mockUsers';

export const POSTGRES_DDL_SCHEMA = `-- ==========================================================
-- AYAR ATELIER: ENTERPRISE POSTGRESQL 16 HIGH-AVAILABILITY SCHEMA
-- Scalable Cluster: Multi-AZ Primary + Cross-Region Read Replica
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Accounts & OAuth Profiles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    oauth_provider VARCHAR(50) DEFAULT 'google',
    oauth_subject_id VARCHAR(255),
    role VARCHAR(30) DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
    loyalty_tier VARCHAR(50) DEFAULT 'Silver',
    loyalty_points INTEGER DEFAULT 0,
    sizing_profile JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Apparel Product Catalog & Inventory
CREATE TABLE products (
    id VARCHAR(64) PRIMARY KEY,
    sku VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_mm VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL,
    price_mmk NUMERIC(14, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    fabric_spec JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Customer Orders
CREATE TABLE orders (
    id VARCHAR(64) PRIMARY KEY,
    tracking_number VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    total_amount_usd NUMERIC(10, 2) NOT NULL,
    total_amount_mmk NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'MMK',
    order_status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    payment_method VARCHAR(50) NOT NULL,
    payment_transaction_id VARCHAR(100) NOT NULL,
    is_encrypted_vault BOOLEAN DEFAULT TRUE,
    shipping_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Order Items (Line Items)
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id),
    selected_size VARCHAR(10) NOT NULL,
    selected_color VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_usd NUMERIC(10, 2) NOT NULL
);

-- Real-Time Inventory Audit Trail
CREATE TABLE inventory_audit_log (
    id BIGSERIAL PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id),
    change_type VARCHAR(30) NOT NULL, -- 'sale', 'restock', 'adjustment'
    delta INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    operator VARCHAR(100) DEFAULT 'system_worker',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Browsing History & Behavioral Personalization Vector
CREATE TABLE browsing_events (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255),
    product_id VARCHAR(64) REFERENCES products(id),
    category VARCHAR(64) NOT NULL,
    action VARCHAR(30) DEFAULT 'view',
    viewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- High-performance Indexing for Instant Catalog & Low-latency Filter
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_orders_tracking ON orders(tracking_number);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_browsing_history ON browsing_events(user_email, viewed_at DESC);
`;

const DB_PRODUCTS_KEY = 'ayar_products_db_v1';
const DB_ORDERS_KEY = 'ayar_orders_db_v1';
const DB_INVENTORY_LOGS_KEY = 'ayar_inv_logs_db_v1';
const DB_USER_KEY = 'ayar_user_session_v1';
const DB_CLUSTER_KEY = 'ayar_cluster_ha_v1';

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(DB_PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading products from local store', e);
  }
  return initialProducts;
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(DB_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products', e);
  }
}

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(DB_ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading orders', e);
  }
  // Initial demo order
  const initialOrder: Order = {
    id: 'AYR-8921',
    trackingNumber: 'TRK-98420-MM',
    createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    items: [
      {
        product: initialProducts[0],
        selectedSize: 'M',
        selectedColor: { name: 'Obsidian Black', nameMm: 'ကျောက်နက်ရောင်', hex: '#1c1917' },
        quantity: 1,
      },
      {
        product: initialProducts[4],
        selectedSize: 'L',
        selectedColor: { name: 'Cloud White', nameMm: 'မိုးတိမ် အဖြူရောင်', hex: '#fafaf9' },
        quantity: 1,
      },
    ],
    subtotal: 1014000,
    discount: 0,
    shippingFee: 0,
    total: 1014000,
    currency: 'MMK',
    status: 'transit',
    customer: {
      name: 'Dr. Thant Zin',
      email: 'runisn2016@gmail.com',
      phone: '+95 9 450 123 456',
      address: 'No. 42 Inya Road, Kamayut Township',
      city: 'Yangon',
      postalCode: '11041',
      notes: 'Please ring bell upon arrival',
    },
    payment: {
      method: 'kbzpay',
      transactionId: 'KBZ-TX-88392104',
      paidAt: new Date(Date.now() - 3600000 * 25).toISOString(),
      isEncrypted: true,
    },
    courier: {
      name: 'Ko Aung Myint',
      phone: '+95 9 799 888 123',
      vehicle: 'Electric Courier Van #08',
      currentCoords: { lat: 16.8172, lng: 96.1384 },
      estimatedDelivery: 'Today by 4:30 PM',
    },
    trackingHistory: [
      {
        status: 'confirmed',
        label: 'Order Verified',
        labelMm: 'အော်ဒါ အတည်ပြုပြီးပါပြီ',
        timestamp: 'Yesterday at 10:15 AM',
        location: 'Yangon Central Fulfillment Hub',
        locationMm: 'ရန်ကုန် ပင်မ ဖြန့်ချိရေးဌာန',
        note: 'Payment authorized via 1-Click KBZPay gateway with 256-bit token',
        noteMm: 'KBZPay ဖြင့် ငွေပေးချေမှု အောင်မြင်ပါသည်။',
        completed: true,
        current: false,
      },
      {
        status: 'tailoring',
        label: 'Quality Inspection & Garment Packaging',
        labelMm: 'အရည်အသွေး စစ်ဆေးထုတ်ပိုးခြင်း',
        timestamp: 'Yesterday at 02:40 PM',
        location: 'Ayar Artisan Atelier, Amarapura Unit',
        locationMm: 'အမရပူရ လက်ရက်အလုပ်ရုံ',
        note: 'Garments inspected, hand-steamed, and wrapped in protective organic cotton sleeve.',
        noteMm: 'အထည်များကို အထူးစစ်ဆေးပြီး ဂရုတစိုက် ထုပ်ပိုးထားပါသည်။',
        completed: true,
        current: false,
      },
      {
        status: 'dispatched',
        label: 'Dispatched from Dispatch Center',
        labelMm: 'ပင်မဂိုဒေါင်မှ ထွက်ခွာပါပြီ',
        timestamp: 'Yesterday at 06:10 PM',
        location: 'Yangon Sorting Facility (Insein Rd)',
        locationMm: 'ရန်ကုန် အင်းစိန်ဌာနခွဲ',
        note: 'Package assigned to regional distribution route.',
        noteMm: 'ပို့ဆောင်ရေး လမ်းကြောင်းသို့ လွှဲပြောင်းပြီးပါပြီ။',
        completed: true,
        current: false,
      },
      {
        status: 'transit',
        label: 'In Transit to Local Distribution Depot',
        labelMm: 'နယ်မြေခွဲသို့ ပို့ဆောင်နေပါသည်',
        timestamp: 'Today at 09:20 AM',
        location: 'Kamayut / Sanchaung Courier Center',
        locationMm: 'ကမာရွတ် / စမ်းချောင်း ဌာနခွဲ',
        note: 'Arrived at destination district; awaiting final courier dispatch.',
        noteMm: 'ဒေသန္တရ ဌာနခွဲသို့ ရောက်ရှိနေပါသည်။',
        completed: true,
        current: true,
      },
      {
        status: 'out_for_delivery',
        label: 'Out for Delivery with Courier',
        labelMm: 'ပို့ဆောင်ရေးဝန်ထမ်းမှ လာရောက်ပို့နေပါသည်',
        timestamp: 'Expected Today',
        location: 'Inya Road Sector, Kamayut',
        locationMm: 'အင်းလျားလမ်း ကမာရွတ်',
        note: 'Courier Ko Aung Myint will contact recipient before arrival.',
        noteMm: 'ပို့ဆောင်သူမှ ရောက်ရှိခါနီး ဖုန်းဆက်ပါမည်။',
        completed: false,
        current: false,
      },
      {
        status: 'delivered',
        label: 'Delivered & Signed',
        labelMm: 'ပစ္စည်းလက်ခံရရှိပြီး',
        timestamp: 'Pending Delivery',
        location: 'Destination Address',
        locationMm: 'ပို့ဆောင်ရမည့် နေရာ',
        note: 'Recipient signature or contact-free delivery photo required.',
        noteMm: 'လက်မှတ်ရေးထိုး၍ လက်ခံယူရပါမည်။',
        completed: false,
        current: false,
      },
    ],
  };

  saveStoredOrders([initialOrder]);
  return [initialOrder];
}

export function saveStoredOrders(orders: Order[]): void {
  try {
    localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders', e);
  }
}

export function getStoredInventoryLogs(): InventoryLog[] {
  try {
    const raw = localStorage.getItem(DB_INVENTORY_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading inventory logs', e);
  }
  const defaultLogs: InventoryLog[] = [
    {
      id: 'log-1',
      productId: 'prod-001',
      productName: 'Amarapura Mulberry Silk Kimono Coat',
      changeType: 'sale',
      amount: -1,
      previousStock: 15,
      newStock: 14,
      date: new Date(Date.now() - 3600000 * 25).toLocaleTimeString(),
      operator: 'order_worker_cron',
    },
    {
      id: 'log-2',
      productId: 'prod-002',
      productName: 'Monsoon Waterproof Oversized Trench',
      changeType: 'restock',
      amount: +5,
      previousStock: 4,
      newStock: 9,
      date: new Date(Date.now() - 3600000 * 48).toLocaleTimeString(),
      operator: 'inventory_lead_admin',
    },
  ];
  return defaultLogs;
}

export function logInventoryChange(
  productId: string,
  productName: string,
  changeType: 'sale' | 'restock' | 'adjustment' | 'return',
  amount: number,
  previousStock: number,
  newStock: number,
  operator = 'admin_portal'
): void {
  const current = getStoredInventoryLogs();
  const newLog: InventoryLog = {
    id: `log-${Date.now()}`,
    productId,
    productName,
    changeType,
    amount,
    previousStock,
    newStock,
    date: new Date().toLocaleTimeString(),
    operator,
  };
  const updated = [newLog, ...current].slice(0, 50);
  try {
    localStorage.setItem(DB_INVENTORY_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(DB_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading user profile', e);
  }

  return { ...DEMO_CUSTOMER };
}

export function saveStoredUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(DB_USER_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error(e);
  }
}

// High Availability Cluster State
export function getClusterStatus(): HighAvailabilityStatus {
  try {
    const raw = localStorage.getItem(DB_CLUSTER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  return {
    primaryDatabase: {
      region: 'asia-southeast1 (Singapore / Primary)',
      status: 'ACTIVE_PRIMARY',
      latencyMs: 14,
      connections: 42,
      storageUsedGb: 18.4,
      version: 'PostgreSQL 16.2 (Cloud SQL HA)',
    },
    replicaDatabase: {
      region: 'asia-east1 (Taiwan / Synchronous Standby)',
      status: 'READ_REPLICA',
      replicationLagMs: 1.2,
      syncState: 'SYNCHRONOUS',
    },
    loadBalancer: {
      globalAnycastIp: '34.149.208.91 (Global VIP)',
      status: 'HEALTHY',
      activeNodes: 6,
      ddosProtection: 'ACTIVE_CLOUD_ARMOR',
    },
    cdnCache: {
      edgeHitRatio: 94.6,
      bandwidthSavedMb: 842.8,
      compression: 'Brotli + AVIF',
    },
  };
}

export function saveClusterStatus(status: HighAvailabilityStatus): void {
  try {
    localStorage.setItem(DB_CLUSTER_KEY, JSON.stringify(status));
  } catch (e) {
    console.error(e);
  }
}

export interface SqlQueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
  planNotes: string;
}

export function runSimulatedSqlQuery(query: string): SqlQueryResult {
  const cleanQuery = query.trim().toUpperCase();
  const startTime = performance.now();
  const products = getStoredProducts();
  const orders = getStoredOrders();

  if (cleanQuery.includes('SELECT') && cleanQuery.includes('FROM PRODUCTS') && cleanQuery.includes('STOCK < 15')) {
    const filtered = products.filter((p) => p.stock < 15);
    return {
      columns: ['id', 'sku', 'name', 'category', 'stock', 'price_usd'],
      rows: filtered.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        stock: p.stock,
        price_usd: `$${p.price.toFixed(2)}`,
      })),
      rowCount: filtered.length,
      executionTimeMs: Number((performance.now() - startTime + 1.8).toFixed(2)),
      planNotes: 'Index Scan using idx_products_stock on products (cost=0.15..8.28 rows=3)',
    };
  }

  if (cleanQuery.includes('SELECT') && cleanQuery.includes('FROM ORDERS')) {
    return {
      columns: ['id', 'tracking_number', 'total', 'currency', 'status', 'payment_method'],
      rows: orders.map((o) => ({
        id: o.id,
        tracking_number: o.trackingNumber,
        total: `$${o.total.toFixed(2)}`,
        currency: o.currency,
        status: o.status,
        payment_method: o.payment.method,
      })),
      rowCount: orders.length,
      executionTimeMs: Number((performance.now() - startTime + 2.1).toFixed(2)),
      planNotes: 'Seq Scan on orders (cost=0.00..12.50 rows=1 width=320)',
    };
  }

  // Default products table query
  return {
    columns: ['sku', 'name', 'category', 'stock', 'rating', 'price_usd'],
    rows: products.slice(0, 6).map((p) => ({
      sku: p.sku,
      name: p.name,
      category: p.category,
      stock: p.stock,
      rating: `★ ${p.rating}`,
      price_usd: `$${p.price.toFixed(2)}`,
    })),
    rowCount: products.length,
    executionTimeMs: Number((performance.now() - startTime + 1.4).toFixed(2)),
    planNotes: 'Bitmap Heap Scan on products (cost=4.25..15.10 rows=8)',
  };
}

export function advanceOrderStatus(orderId: string): Order | null {
  const orders = getStoredOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) return null;

  const order = orders[index];
  const orderSteps: Order['status'][] = ['confirmed', 'tailoring', 'dispatched', 'transit', 'out_for_delivery', 'delivered'];
  const currentIdx = orderSteps.indexOf(order.status);
  if (currentIdx >= orderSteps.length - 1) return order;

  const nextStatus = orderSteps[currentIdx + 1];
  const stepLabels: Record<Order['status'], { label: string; labelMm: string; loc: string; locMm: string; note: string; noteMm: string }> = {
    confirmed: {
      label: 'Order Confirmed & Paid',
      labelMm: 'အော်ဒါအတည်ပြုပြီး',
      loc: 'Yangon Central Hub',
      locMm: 'ရန်ကုန် ပင်မဌာန',
      note: 'Payment authorized.',
      noteMm: 'ငွေပေးချေမှု အောင်မြင်ပါသည်။',
    },
    tailoring: {
      label: 'Garment Finishing & Steam Press',
      labelMm: 'အထည်ချုပ်လုပ် စစ်ဆေးနေပါသည်',
      loc: 'Ayar Master Atelier',
      locMm: 'အထည်ချုပ်လုပ်ဌာန',
      note: 'Master tailors performing seam calibration.',
      noteMm: 'လက်ချုပ်ကျွမ်းကျင်သူများ စစ်ဆေးနေပါသည်။',
    },
    dispatched: {
      label: 'Dispatched from Fulfillment Hub',
      labelMm: 'ဂိုဒေါင်မှ ထွက်ခွာပါပြီ',
      loc: 'Yangon Regional Sorting Depot',
      locMm: 'ရန်ကုန် ဒေသန္တရ ဌာနခွဲ',
      note: 'Package assigned to courier route.',
      noteMm: 'ပို့ဆောင်ရေး လမ်းကြောင်းသို့ လွှဲပြောင်းပါပြီ။',
    },
    transit: {
      label: 'In Regional Transit',
      labelMm: 'နယ်မြေခွဲသို့ ပို့ဆောင်နေပါသည်',
      loc: 'Inya / Kamayut Transit Sector',
      locMm: 'အင်းလျား/ကမာရွတ် နယ်မြေ',
      note: 'Driver moving toward delivery district.',
      noteMm: 'ပို့ဆောင်မည့် မြို့နယ်သို့ ဦးတည်နေပါသည်။',
    },
    out_for_delivery: {
      label: 'Out for Delivery (Approaching Destination)',
      labelMm: 'ပစ္စည်းပို့ဆောင်သူ ရောက်ရှိနေပါပြီ',
      loc: 'Customer Neighborhood',
      locMm: 'သင့်လိပ်စာအနီး ရောက်ရှိနေပါသည်',
      note: 'Courier Ko Aung Myint is arriving shortly.',
      noteMm: 'ပို့ဆောင်သူ မကြာမီ ဆက်သွယ်ပါမည်။',
    },
    delivered: {
      label: 'Delivered & Customer Signed',
      labelMm: 'ပစ္စည်းလက်ခံရရှိပြီးပါပြီ',
      loc: 'Customer Doorstep',
      locMm: 'လက်ခံသူထံသို့ အရောက်ပို့ပြီး',
      note: 'Package signed and completed. Enjoy your luxury garments!',
      noteMm: 'အော်ဒါပြီးဆုံးပါပြီ။ အားပေးမှုအတွက် ကျေးဇူးတင်ပါသည်။',
    },
  };

  const meta = stepLabels[nextStatus];
  const newHistoryStep = {
    status: nextStatus,
    label: meta.label,
    labelMm: meta.labelMm,
    timestamp: 'Just now',
    location: meta.loc,
    locationMm: meta.locMm,
    note: meta.note,
    noteMm: meta.noteMm,
    completed: true,
    current: true,
  };

  const updatedHistory = order.trackingHistory.map((h) => ({ ...h, current: false }));
  updatedHistory.unshift(newHistoryStep);

  const updatedOrder: Order = {
    ...order,
    status: nextStatus,
    trackingHistory: updatedHistory,
  };

  orders[index] = updatedOrder;
  saveStoredOrders(orders);
  return updatedOrder;
}

export function updateProductStockInDb(productId: string, newStock: number): void {
  const products = getStoredProducts();
  const prod = products.find((p) => p.id === productId);
  if (!prod) return;

  const prev = prod.stock;
  prod.stock = Math.max(0, newStock);
  saveStoredProducts(products);

  logInventoryChange(
    prod.id,
    prod.name,
    newStock > prev ? 'restock' : 'adjustment',
    newStock - prev,
    prev,
    prod.stock,
    'admin_inventory_mgr'
  );
}

export function addNewProductToDb(newProd: Product): void {
  const products = getStoredProducts();
  const updated = [newProd, ...products];
  saveStoredProducts(updated);

  logInventoryChange(
    newProd.id,
    newProd.name,
    'restock',
    newProd.stock,
    0,
    newProd.stock,
    'admin_sku_onboarding'
  );
}

export function triggerFailover(): void {
  const current = getClusterStatus();
  current.primaryDatabase.status = 'ACTIVE_PRIMARY';
  current.replicaDatabase.status = 'PROMOTED_PRIMARY';
  current.lastFailoverEvent = {
    timestamp: new Date().toISOString(),
    triggerReason: 'SIMULATED_PRIMARY_INSTANCE_MAINTENANCE',
    durationMs: 1140,
    recoveryState: 'SUCCESS',
  };
  saveClusterStatus(current);
}

export const dbSimulator = {
  getProducts: getStoredProducts,
  saveProducts: saveStoredProducts,
  getOrders: getStoredOrders,
  saveOrder: (newOrder: Order) => {
    const orders = getStoredOrders();
    const updated = [newOrder, ...orders.filter((o) => o.id !== newOrder.id)];
    saveStoredOrders(updated);
  },
  advanceOrderStatus,
  getInventoryLogs: getStoredInventoryLogs,
  getUserProfile: getStoredUserProfile,
  saveUserProfile: saveStoredUserProfile,
  getHAStatus: getClusterStatus,
  triggerFailover,
};

