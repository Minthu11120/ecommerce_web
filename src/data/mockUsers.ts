import { UserProfile } from '../types';

export const DEMO_CUSTOMER: UserProfile = {
  id: 'usr-customer-01',
  name: 'Daw May Thazin',
  email: 'runisn2016@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  role: 'customer',
  oauthProvider: 'google',
  loyaltyPoints: 680,
  tier: 'Gold VIP',
  savedAddresses: [
    {
      id: 'addr-1',
      label: 'Primary Residence',
      name: 'Daw May Thazin',
      street: 'No. 42 Inya Road, Kamayut Township',
      city: 'Yangon',
      phone: '+95 9 450 123 456',
      isDefault: true,
    },
    {
      id: 'addr-2',
      label: 'Mandalay Villa',
      name: 'Daw May Thazin',
      street: '73rd Street, Between 26th & 27th',
      city: 'Mandalay',
      phone: '+95 9 799 112 334',
      isDefault: false,
    },
  ],
  measurements: {
    unit: 'cm',
    chest: 92,
    waist: 74,
    hips: 96,
    height: 168,
  },
  wishlistIds: ['prod-001', 'prod-003'],
  browsingHistory: [
    { productId: 'prod-001', viewedAt: Date.now() - 600000, category: 'traditional_reimagined' },
    { productId: 'prod-002', viewedAt: Date.now() - 300000, category: 'outerwear' },
  ],
};

export const DEMO_ADMIN: UserProfile = {
  id: 'usr-admin-01',
  name: 'U Kyaw Swar (Operations)',
  email: 'admin@ayaratelier.com',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  role: 'admin',
  oauthProvider: 'google',
  loyaltyPoints: 1250,
  tier: 'Platinum Atelier VIP',
  savedAddresses: [
    {
      id: 'addr-admin-1',
      label: 'Ayar Atelier Operations Central',
      name: 'U Kyaw Swar',
      street: 'No. 15 Strand Road, Kyauktada Township',
      city: 'Yangon',
      phone: '+95 1 388 900',
      isDefault: true,
    },
  ],
  measurements: {
    unit: 'cm',
    chest: 104,
    waist: 88,
    hips: 102,
    height: 178,
  },
  wishlistIds: [],
  browsingHistory: [],
};
