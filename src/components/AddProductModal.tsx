import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Link2,
  Trash2,
  Star,
  Sparkles,
  AlertCircle,
  Check,
  Eye,
  Plus,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Language, Product } from '../types';
import { formatPrice } from '../data/translations';
import { LOW_RES_BLUR } from '../data/mockProducts';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onAddNewProduct: (product: Product) => void;
  existingSkus?: string[];
}

// Curated high-resolution fashion imagery presets representing Ayar Atelier collections
const CURATED_FASHION_PRESETS = [
  {
    id: 'preset-1',
    nameEn: 'Amarapura Mulberry Silk Coat',
    nameMm: 'အမရပူရ ပိုးစစ် ကုတ်အင်္ကျီ',
    category: 'traditional_reimagined' as const,
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=80',
    tag: 'Mulberry Silk',
  },
  {
    id: 'preset-2',
    nameEn: 'Inle Lotus Handwoven Tunic',
    nameMm: 'အင်းလေး ကြာချည် တူနစ်',
    category: 'traditional_reimagined' as const,
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
    tag: 'Lotus Fiber',
  },
  {
    id: 'preset-3',
    nameEn: 'Architectural Trench Coat',
    nameMm: 'ခေတ်မီ မိုးကာကုတ်ရှည်ကြီး',
    category: 'outerwear' as const,
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    tag: 'Technical Shell',
  },
  {
    id: 'preset-4',
    nameEn: 'Hand-Dyed Indigo Linen Kimono',
    nameMm: 'သဘာဝ မဲနယ်ဆိုး လင်နင် ကီမိုနို',
    category: 'outerwear' as const,
    url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80',
    tag: 'Natural Indigo',
  },
  {
    id: 'preset-5',
    nameEn: 'Contemporary Raw Silk Set',
    nameMm: 'ခေတ်ပေါ် ပိုးရိုင်း ဝတ်စုံ',
    category: 'dresses' as const,
    url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=80',
    tag: 'Raw Silk',
  },
  {
    id: 'preset-6',
    nameEn: 'Yangon Urban Tailored Jacket',
    nameMm: 'ရန်ကုန် ခေတ်မီ ဂျာကင်',
    category: 'streetwear' as const,
    url: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1000&q=80',
    tag: 'Tailored',
  },
  {
    id: 'preset-7',
    nameEn: 'Bagan Sand Minimalist Dress',
    nameMm: 'ပုဂံ သဲနုရောင် ဂါဝန်ရှည်',
    category: 'dresses' as const,
    url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=80',
    tag: 'Minimal Drape',
  },
  {
    id: 'preset-8',
    nameEn: 'Handwoven Acheik Structured Top',
    nameMm: 'လက်ရက် လွန်းရာကျော် အင်္ကျီ',
    category: 'tops' as const,
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
    tag: 'Artisan Weave',
  },
];

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  language,
  onAddNewProduct,
  existingSkus = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [nameMm, setNameMm] = useState('');
  const [tagline, setTagline] = useState('');
  const [taglineMm, setTaglineMm] = useState('');
  const [sku, setSku] = useState(() => `AYR-NEW-${Math.floor(100 + Math.random() * 900)}`);
  const [priceMmk, setPriceMmk] = useState<number>(450000);
  const [stock, setStock] = useState<number>(15);
  const [category, setCategory] = useState<Product['category']>('traditional_reimagined');
  const [fabric, setFabric] = useState('100% Handwoven Mulberry Silk & Organic Cotton');
  const [fabricMm, setFabricMm] = useState('၁၀၀% လက်ရက် ပိုးစစ်နှင့် သဘာဝချည်ထည်');
  const [selectedSizes, setSelectedSizes] = useState<('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[]>([
    'S',
    'M',
    'L',
    'XL',
  ]);

  // Image management state
  const [images, setImages] = useState<string[]>([
    CURATED_FASHION_PRESETS[0].url,
  ]);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(true);

  if (!isOpen) return null;

  // Handle file upload via FileReader (converts to data URL)
  const processFiles = (files: FileList | File[]) => {
    setPhotoError(null);
    const fileArr = Array.from(files);

    fileArr.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setPhotoError(
          language === 'mm'
            ? 'ဓာတ်ပုံ ဖိုင်အမျိုးအစား (JPG, PNG, WebP) သာ ထည့်သွင်းနိုင်ပါသည်။'
            : 'Only image files (JPG, PNG, WebP) are supported.'
        );
        return;
      }

      // Check file size (e.g. 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError(
          language === 'mm'
            ? 'ဖိုင်အရွယ်အစား 5MB ထက် မကျော်လွန်ရပါ။'
            : 'File size must be under 5MB.'
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Add from URL
  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setPhotoError(
        language === 'mm'
          ? 'မှန်ကန်သော ဓာတ်ပုံ Link (http:// သို့မဟုတ် https://) ထည့်သွင်းပါ'
          : 'Please provide a valid image link starting with http:// or https://'
      );
      return;
    }

    setImages((prev) => [...prev, trimmed]);
    setUrlInput('');
  };

  // Set image as cover (move to index 0)
  const handleSetCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle size
  const toggleSize = (size: typeof AVAILABLE_SIZES[number]) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    if (images.length === 0) {
      setPhotoError(
        language === 'mm'
          ? 'အနည်းဆုံး ဓာတ်ပုံ (၁) ပုံ ထည့်သွင်းပေးရန် လိုအပ်ပါသည်။'
          : 'Please add at least one product photo.'
      );
      return;
    }

    const calculatedPriceUsd = Math.round(priceMmk / 3000);

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: sku.trim() || `AYR-GEN-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      nameMm: nameMm.trim() || name.trim(),
      tagline: tagline.trim() || 'Modern handcrafted luxury edition',
      taglineMm: taglineMm.trim() || 'ခေတ်မီ အဆင့်မြင့် ဖက်ရှင်ဒီဇိုင်း',
      description:
        'Architecturally sculpted using heritage Myanmar artisanal textiles. Tailored for effortless grace and contemporary silhouettes.',
      descriptionMm:
        'မြန်မာ့ရိုးရာ လက်မှုပညာနှင့် ခေတ်ပေါ်ဒီဇိုင်း ပေါင်းစပ်ထားသော သက်တောင့်သက်သာ လက်ရာမွန် ဖြစ်ပါသည်။',
      price: calculatedPriceUsd,
      priceMmk: priceMmk,
      category: category,
      sizes: selectedSizes.length > 0 ? selectedSizes : ['M', 'L'],
      colors: [
        { name: 'Obsidian Black', nameMm: 'ကျောက်နက်ရောင်', hex: '#1c1917' },
        { name: 'Sand Beige', nameMm: 'သဲနုရောင်', hex: '#d4b996' },
      ],
      images: images,
      lowResImage: images[0] || LOW_RES_BLUR,
      stock: Number(stock) || 10,
      rating: 5.0,
      reviewsCount: 1,
      isNew: true,
      fabric: fabric.trim() || '100% Sustainable Myanmar Silk & Cotton',
      fabricMm: fabricMm.trim() || '၁၀၀% မြန်မာ့ရိုးရာ ပိုးနှင့် ချည်သား',
      careGuide: 'Dry clean only. Store in protective garment cloth.',
      careGuideMm: 'Dry Clean သာလျှော်ပါ။ အဝတ်အိတ်ဖြင့် သပ်ရပ်စွာ ထားရှိပါ။',
      tags: ['New Collection', 'Artisan Handcrafted', 'Sustainable'],
    };

    onAddNewProduct(newProduct);
    onClose();
  };

  const primaryImage = images[0] || CURATED_FASHION_PRESETS[0].url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        id="modal-add-product"
        className="relative w-full max-w-4xl bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Modal Header */}
        <div className="bg-stone-950 text-white px-6 py-4.5 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-900/60 text-amber-300 rounded-xl border border-amber-700/50">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {language === 'mm' ? 'ကုန်ပစ္စည်းအသစ် ထည့်သွင်းခြင်း' : 'Add New Product to Atelier'}
                </h3>
                <span className="text-[10px] bg-amber-800/80 text-amber-200 px-2 py-0.5 rounded-full font-mono uppercase">
                  Staff Admin
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {language === 'mm'
                  ? 'ဓာတ်ပုံများ၊ အထည်သားနှင့် စတော့ခ် အချက်အလက်များ ပြည့်စုံစွာ ထည့်သွင်းပါ'
                  : 'Upload product imagery, define textiles, pricing, and stock metrics'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-add-product-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6">
          {/* ========================================================= */}
          {/* SECTION 1: PHOTO UPLOAD & MANAGEMENT (KEY FOCUS) */}
          {/* ========================================================= */}
          <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    {language === 'mm' ? 'ကုန်ပစ္စည်း ဓာတ်ပုံများ (Product Photos)' : 'Product Photos & Gallery'}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    {language === 'mm'
                      ? 'ဖုန်း/ကွန်ပျူတာမှ ဓာတ်ပုံတင်ခြင်း၊ URL ထည့်ခြင်း သို့မဟုတ် အသင့်နမူနာပုံများ ရွေးချယ်နိုင်သည်'
                      : 'Upload files from device, paste web URLs, or choose curated fashion presets'}
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-full border border-stone-300 text-stone-700 font-semibold self-start sm:self-auto">
                {images.length} {language === 'mm' ? 'ပုံ ထည့်ပြီး' : 'Photos selected'}
              </span>
            </div>

            {/* Error Message if photo issue */}
            {photoError && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{photoError}</span>
              </div>
            )}

            {/* Upload Zone & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Dropzone File Upload */}
              <div
                id="dropzone-add-photo"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-600 bg-amber-50/70 scale-101'
                    : 'border-stone-300 hover:border-amber-700 bg-white hover:bg-stone-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="input-file-product-photo"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-2 shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-stone-800">
                  {language === 'mm'
                    ? 'ဖိုင်ဆွဲထည့်ပါ သို့မဟုတ် ဓာတ်ပုံရွေးရန် နှိပ်ပါ'
                    : 'Drag & Drop photos or Browse device'}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {language === 'mm'
                    ? 'PNG, JPG, WebP (အများဆုံး 5MB)'
                    : 'PNG, JPG, WebP supported (multiple files allowed)'}
                </p>
                <button
                  type="button"
                  id="btn-browse-device-photos"
                  className="mt-3 px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-xs"
                >
                  {language === 'mm' ? 'ဓာတ်ပုံ ရွေးချယ်မည်' : 'Browse Files'}
                </button>
              </div>

              {/* Paste Image URL Input */}
              <div className="flex flex-col justify-between bg-white p-4 rounded-xl border border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>{language === 'mm' ? 'ဓာတ်ပုံ Link (Web URL) ဖြင့် ထည့်ရန်' : 'Add photo via Web Image Link'}</span>
                  </label>
                  <p className="text-[11px] text-stone-500 mb-2.5">
                    {language === 'mm'
                      ? 'Unsplash သို့မဟုတ် အွန်လိုင်း ဓာတ်ပုံလင့်ခ်ကို တိုက်ရိုက် ကူးယူထည့်နိုင်ပါသည်'
                      : 'Paste direct image URL from Unsplash, Google Drive, or web storage'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      id="input-product-image-url"
                      placeholder="https://images.unsplash.com/..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-600 font-mono"
                    />
                    <button
                      type="button"
                      id="btn-add-image-url"
                      onClick={handleAddUrl}
                      className="px-3 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-xs"
                    >
                      {language === 'mm' ? 'ထည့်မည်' : 'Add URL'}
                    </button>
                  </div>
                </div>

                {/* Helpful Note */}
                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>
                    {language === 'mm' ? 'ပထမဆုံးပုံသည် ပင်မမျက်နှာဖုံးပုံ ဖြစ်ပါသည်' : 'First photo acts as the main cover photo'}
                  </span>
                  <span className="text-amber-700 font-medium font-mono text-[10px]">★ Cover</span>
                </div>
              </div>
            </div>

            {/* Curated Presets Carousel / Quick Pick */}
            <div className="mt-4 pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  {language === 'mm' ? 'အသင့်သုံး ဖက်ရှင်ဓာတ်ပုံ နမူနာများ (၁ ချက်နှိပ်ရွေးချယ်ရန်)' : 'Curated Fashion Presets (1-Click Sample Photos)'}
                </span>
                <span className="text-[10px] text-stone-500">
                  {language === 'mm' ? 'စမ်းသပ်ရန် ပုံရွေးချယ်ပါ' : 'Click to add high-res photo'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CURATED_FASHION_PRESETS.slice(0, 4).map((preset) => {
                  const isSelected = images.includes(preset.url);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      id={`btn-preset-photo-${preset.id}`}
                      onClick={() => {
                        if (!images.includes(preset.url)) {
                          setImages((prev) => [...prev, preset.url]);
                        }
                      }}
                      className={`group relative flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/80 ring-1 ring-amber-600'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.nameEn}
                        className="w-10 h-12 object-cover rounded shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-stone-800 truncate">
                          {language === 'mm' ? preset.nameMm : preset.nameEn}
                        </p>
                        <span className="text-[9px] text-amber-700 bg-amber-100/70 px-1 py-0.2 rounded font-mono">
                          {preset.tag}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-700 shrink-0 mr-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currently Selected Photos Gallery */}
            <div className="mt-4 pt-4 border-t border-stone-200">
              <span className="text-xs font-bold text-stone-800 block mb-2">
                {language === 'mm' ? 'ရွေးချယ်ထားသော ဓာတ်ပုံများ (Photo Gallery)' : 'Selected Photos (Gallery & Ordering)'}
              </span>

              {images.length === 0 ? (
                <div className="p-6 bg-white rounded-xl border border-dashed border-stone-300 text-center text-xs text-stone-400">
                  {language === 'mm'
                    ? 'မည်သည့် ဓာတ်ပုံမှ မထည့်ရသေးပါ။ အထက်ပါ နည်းလမ်းများဖြင့် ဓာတ်ပုံထည့်သွင်းပါ။'
                    : 'No photos added yet. Use the upload box or select presets above.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {images.map((imgUrl, idx) => {
                    const isCover = idx === 0;
                    return (
                      <div
                        key={`${imgUrl}-${idx}`}
                        className={`group relative rounded-xl overflow-hidden border bg-white shadow-xs transition-all ${
                          isCover
                            ? 'border-amber-600 ring-2 ring-amber-500/30'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="aspect-[3/4] w-full relative bg-stone-100">
                          <img
                            src={imgUrl}
                            alt={`Product preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Cover Badge */}
                          {isCover ? (
                            <span className="absolute top-1.5 left-1.5 bg-amber-900/90 backdrop-blur-xs text-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                              {language === 'mm' ? 'ပင်မပုံ' : 'Cover'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetCover(idx)}
                              className="absolute top-1.5 left-1.5 bg-stone-900/80 hover:bg-amber-800 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-xs"
                              title="Set as Cover"
                            >
                              <Star className="w-3 h-3" />
                              <span>{language === 'mm' ? 'ပင်မပုံထားရန်' : 'Set Cover'}</span>
                            </button>
                          )}

                          {/* Delete Photo Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1.5 right-1.5 bg-rose-900/90 hover:bg-rose-700 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity shadow-xs"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="p-1.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                          <span>Photo #{idx + 1}</span>
                          {isCover && (
                            <span className="text-amber-700 font-bold">Primary</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: PRODUCT METADATA & SPECS */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Fields */}
            <div className="lg:col-span-2 space-y-4">
              {/* Product Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'mm' ? 'ကုန်ပစ္စည်း အင်္ဂလိပ်အမည် *' : 'Product Title (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    id="input-product-name-en"
                    placeholder="e.g. Amarapura Mulberry Silk Kimono Coat"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-amber-700 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'mm' ? 'ကုန်ပစ္စည်း မြန်မာအမည် (အမည်ရင်း)' : 'Product Title (Myanmar Language)'}
                  </label>
                  <input
                    type="text"
                    id="input-product-name-mm"
                    placeholder="ဥပမာ - အမရပူရ ပိုးစစ် ကီမိုနို ကုတ်အင်္ကျီ"
                    value={nameMm}
                    onChange={(e) => setNameMm(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-amber-700 shadow-xs font-myanmar"
                  />
                </div>
              </div>

              {/* Taglines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'mm' ? 'ဖော်ပြချက်တို (English Tagline)' : 'Subtitle / Tagline (English)'}
                  </label>
                  <input
                    type="text"
                    id="input-product-tagline-en"
                    placeholder="e.g. Handwoven pure mulberry silk with structured lapels"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 text-xs focus:outline-none focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'mm' ? 'ဖော်ပြချက်တို (Myanmar Tagline)' : 'Subtitle / Tagline (Myanmar)'}
                  </label>
                  <input
                    type="text"
                    id="input-product-tagline-mm"
                    placeholder="ဥပမာ - ရိုးရာလက်ရက် ပိုးစစ်နှင့် ခေတ်မီရင်ဖုံးဒီဇိုင်း"
                    value={taglineMm}
                    onChange={(e) => setTaglineMm(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 text-xs focus:outline-none focus:border-amber-700 font-myanmar"
                  />
                </div>
              </div>

              {/* SKU & Category & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'mm' ? 'ပစ္စည်းကုဒ် (SKU/Code)' : 'Item Code (SKU)'}
                  </label>
                  <input
                    type="text"
                    required
                    id="input-product-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 text-xs font-mono focus:outline-none focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'mm' ? 'အမျိုးအစား (Category)' : 'Collection Category'}
                  </label>
                  <select
                    id="select-product-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Product['category'])}
                    className="w-full p-2 rounded-lg border border-stone-300 text-xs bg-white focus:outline-none focus:border-amber-700"
                  >
                    <option value="traditional_reimagined">
                      {language === 'mm' ? 'ရိုးရာပိုးထည် (Heritage Silk)' : 'Heritage Silk Reimagined'}
                    </option>
                    <option value="outerwear">
                      {language === 'mm' ? 'အပေါ်ထပ်ကုတ် (Outerwear)' : 'Outerwear & Trenches'}
                    </option>
                    <option value="streetwear">
                      {language === 'mm' ? 'ခေတ်မီဖက်ရှင် (Streetwear)' : 'Modern Streetwear'}
                    </option>
                    <option value="dresses">
                      {language === 'mm' ? 'ဂါဝန်/ဝတ်စုံ (Dresses)' : 'Artisan Dresses'}
                    </option>
                    <option value="tops">
                      {language === 'mm' ? 'အင်္ကျီ (Tops)' : 'Sculpted Tops'}
                    </option>
                    <option value="accessories">
                      {language === 'mm' ? 'အသုံးအဆောင် (Accessories)' : 'Accessories'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'mm' ? 'စျေးနှုန်း (MMK ကျပ်)' : 'Price (MMK K)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={5000}
                    id="input-product-price"
                    value={priceMmk}
                    onChange={(e) => setPriceMmk(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-stone-300 text-xs font-mono font-bold text-amber-900 focus:outline-none focus:border-amber-700"
                  />
                  <span className="text-[10px] text-stone-500 font-mono">
                    ≈ ${Math.round(priceMmk / 3000)} USD
                  </span>
                </div>
              </div>

              {/* Stock & Fabric */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'mm' ? 'စတင်ထည့်မည့် စတော့ခ်' : 'Initial Stock'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    id="input-product-stock"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-stone-300 text-xs font-mono focus:outline-none focus:border-amber-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'mm' ? 'အထည်သား အညွှန်း (Fabric Detail)' : 'Fabric Composition'}
                  </label>
                  <input
                    type="text"
                    id="input-product-fabric"
                    value={language === 'mm' ? fabricMm : fabric}
                    onChange={(e) => {
                      if (language === 'mm') setFabricMm(e.target.value);
                      else setFabric(e.target.value);
                    }}
                    placeholder="e.g. 100% Handspun Amarapura Mulberry Silk"
                    className="w-full p-2 rounded-lg border border-stone-300 text-xs focus:outline-none focus:border-amber-700"
                  />
                </div>
              </div>

              {/* Sizes Available */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  {language === 'mm' ? 'ရရှိနိုင်သော ဆိုဒ်များ (Available Sizes)' : 'Available Sizes'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((size) => {
                    const isChecked = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        id={`btn-size-toggle-${size}`}
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                          isChecked
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Col: Live Card Preview */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col items-center justify-between">
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-700" />
                    {language === 'mm' ? 'ဆိုင်ရှေ့ပြကွက် နမူနာ' : 'Live Storefront Card'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono bg-emerald-100 px-1.5 py-0.5 rounded">
                    Real-time
                  </span>
                </div>

                {/* Simulated Product Card */}
                <div className="bg-white rounded-xl overflow-hidden border border-stone-200/90 shadow-sm w-full max-w-[220px] mx-auto">
                  <div className="aspect-[3/4] relative bg-stone-100 overflow-hidden">
                    <img
                      src={primaryImage}
                      alt={name || 'New Product'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="bg-stone-900/90 backdrop-blur-xs text-amber-200 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                        {language === 'mm' ? 'အသစ်' : 'New Season'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <span className="text-[10px] text-stone-500 font-mono uppercase block truncate">
                      {category.replace('_', ' ')}
                    </span>
                    <h5 className="text-xs font-bold text-stone-900 truncate mt-0.5">
                      {language === 'mm' ? (nameMm || name || 'ကုန်ပစ္စည်းအမည်') : (name || 'Product Title')}
                    </h5>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {language === 'mm' ? (taglineMm || 'ခေတ်မီဖက်ရှင်') : (tagline || 'Modern edition')}
                    </p>
                    <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-stone-900">
                        {formatPrice(Math.round(priceMmk / 3000), priceMmk)}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {stock} in stock
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-stone-500 text-center">
                {language === 'mm'
                  ? 'အထက်ပါ ဓာတ်ပုံနှင့် စျေးနှုန်းအတိုင်း Storefront တွင် ပြသသွားမည် ဖြစ်သည်'
                  : 'Displays seamlessly in the catalog, lookbook, and product detail modal'}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              id="btn-cancel-add-product"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              {language === 'mm' ? 'မလုပ်တော့ပါ' : 'Cancel'}
            </button>

            <button
              type="submit"
              id="btn-confirm-save-product"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {language === 'mm' ? 'ကုန်ပစ္စည်း သိမ်းဆည်းမည်' : 'Save & Publish Product'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
