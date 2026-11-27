'use client';

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Store, 
  Users, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  Phone, 
  IndianRupee,
  Milk,
  Droplets,
  Shirt,
  Sparkle,
  UtensilsCrossed,
  Newspaper
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '@/lib/chime';
import { speakHindi } from '@/lib/tts';

interface RoleOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: 'household' | 'vendor';
  currentMember: string;
  currentHouseholdCode: string;
  currentVendorBusiness?: string;
  currentVendorCategory?: string;
  currentVendorRoute?: string;
  onComplete: (data: {
    role: 'household' | 'vendor';
    activeMemberName: string;
    householdCode: string;
    vendorBusinessName?: string;
    vendorCategory?: string;
    vendorRouteName?: string;
  }) => void;
}

export default function RoleOnboardingModal({
  isOpen,
  onClose,
  currentRole,
  currentMember,
  currentHouseholdCode,
  currentVendorBusiness,
  currentVendorCategory,
  currentVendorRoute,
  onComplete,
}: RoleOnboardingModalProps) {
  // Wizard state
  const [role, setRole] = useState<'household' | 'vendor'>(currentRole || 'household');
  
  // Household form state
  const [member, setMember] = useState(currentMember || 'Kaushal');
  const [householdCode, setHouseholdCode] = useState(currentHouseholdCode || 'SHARMA-402');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'milk', 'water', 'laundry', 'maid'
  ]);

  // Vendor form state
  const [vendorCategory, setVendorCategory] = useState(currentVendorCategory || 'milk');
  const [vendorBusinessName, setVendorBusinessName] = useState(currentVendorBusiness || 'Raju Doodh Dairy');
  const [vendorRouteName, setVendorRouteName] = useState(currentVendorRoute || 'Gokuldham Heights - Tower A');
  const [unitRate, setUnitRate] = useState('68');
  const [vendorPhone, setVendorPhone] = useState('9876543210');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRole(currentRole || 'household');
    setMember(currentMember || 'Kaushal');
    setHouseholdCode(currentHouseholdCode || 'SHARMA-402');
    if (currentVendorBusiness) setVendorBusinessName(currentVendorBusiness);
    if (currentVendorCategory) setVendorCategory(currentVendorCategory);
    if (currentVendorRoute) setVendorRouteName(currentVendorRoute);
  }, [currentRole, currentMember, currentHouseholdCode, currentVendorBusiness, currentVendorCategory, currentVendorRoute]);

  if (!isOpen) return null;

  const familyMembers = ['Kaushal', 'Mummy', 'Papa', 'Sister', 'Brother', 'Grandpa'];

  const householdServices = [
    { id: 'milk', label: '🥛 Doodh (Milk)', desc: '1L, 1.5L daily packets / dairy' },
    { id: 'water', label: '💧 20L Water Jars', desc: 'Can delivery & empty jar deposit' },
    { id: 'laundry', label: '👔 Presswala / Dhobi', desc: 'Ironing shirts, pants & sarees' },
    { id: 'maid', label: '🧹 Kaamwali Didi', desc: 'Daily attendance, chhutti & advance' },
    { id: 'tiffin', label: '🍱 Tiffin Service', desc: 'Daily lunch/dinner dabbas' },
    { id: 'newspaper', label: '📰 Newspaper', desc: 'Morning paper subscription' },
  ];

  const vendorTrades = [
    { id: 'milk', label: '🥛 Doodhwala (Milk Dairy Route)', defaultName: 'Raju Doodh Dairy', defaultRate: '68', unit: 'Litre' },
    { id: 'water', label: '💧 Paani Wala (20L Water Supply)', defaultName: 'Ganga 20L Water Agency', defaultRate: '40', unit: 'Can' },
    { id: 'laundry', label: '👔 Presswala (Ironing & Laundry)', defaultName: 'Mohan Steam Press', defaultRate: '10', unit: 'Piece' },
    { id: 'tiffin', label: '🍱 Tiffin Service (Daily Dabba)', defaultName: 'Maa Ki Rasoi Tiffin', defaultRate: '90', unit: 'Meal' },
  ];

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectVendorTrade = (trade: typeof vendorTrades[0]) => {
    setVendorCategory(trade.id);
    setVendorBusinessName(trade.defaultName);
    setUnitRate(trade.defaultRate);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        role,
        activeMemberName: role === 'household' ? member : vendorBusinessName,
        householdCode: householdCode.toUpperCase(),
        vendorBusinessName,
        vendorCategory,
        vendorRouteName
      };

      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      localStorage.setItem('rozhisaab_onboarded', 'true');
      playSuccessChime();
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

      speakHindi(
        role === 'household'
          ? `Namaste ${member} ji! Aapka Ghar Ka Hisaab shuru ho chuka hai.`
          : `Namaste ${vendorBusinessName}! Aapka Vyapari Route Console shuru ho chuka hai.`
      );

      onComplete(payload);
      onClose();
    } catch (e) {
      console.error('Failed to save profile:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Dynamic Category Header */}
        <div className={`p-6 sm:p-7 text-white transition-all ${
          role === 'household' 
            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
            : 'bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-white/10 rounded-2xl backdrop-blur-xs">
                {role === 'household' ? '🏠' : '🛵'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">RozHisaab Setup</h2>
                  <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                    {role === 'household' ? 'Family Doorstep' : 'Merchant Route'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">
                  {role === 'household' 
                    ? 'Apne ghar ka daily hisaab setup karein (Milk, Water, Presswala, Maid)'
                    : 'Apne vyapar ka delivery route & flat khata setup karein'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6">
          
          {/* Top Persona Toggle */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
              Aapka Category Chuniye (Select Your Role)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Household Tab */}
              <button
                type="button"
                onClick={() => setRole('household')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  role === 'household'
                    ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🏠</span>
                  {role === 'household' && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-900">Ghar Ka Sadasya</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Family member tracking daily doorstep items received at home.
                </p>
              </button>

              {/* Vendor Tab */}
              <button
                type="button"
                onClick={() => setRole('vendor')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  role === 'vendor'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🛵</span>
                  {role === 'vendor' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-900">Local Vyapari (Vendor)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Doodhwala, water supplier or presswala running an apartment delivery route.
                </p>
              </button>
            </div>
          </div>

          {/* =========================================================================
              TRACK 1: HOUSEHOLD SETUP UI (Totally Differentiated)
              ========================================================================= */}
          {role === 'household' && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Member Selection */}
              <div className="bg-blue-50/50 border border-blue-200/70 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Aapka Naam Kya Hai? (Active Family Member)</span>
                  </label>
                  <span className="text-[11px] text-blue-600 font-semibold">Entry par aapka naam dikhega</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {familyMembers.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMember(m)}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                        member === m
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border border-blue-200 text-slate-700 hover:bg-blue-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Other name..."
                    value={familyMembers.includes(member) ? '' : member}
                    onChange={(e) => setMember(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-blue-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium w-28"
                  />
                </div>
              </div>

              {/* Household Sync Code */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-indigo-600" />
                    <span>Household Sync Code (Family Share)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Gharwalon ko yeh code bhejein</span>
                </div>
                <input
                  type="text"
                  value={householdCode}
                  onChange={(e) => setHouseholdCode(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-bold tracking-widest px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. SHARMA-402"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Is code se Mummy, Papa aur aap ek hi ledger share karenge taaki koi dohra doodh na le le.
                </p>
              </div>

              {/* Doorstep Services Selection */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Aapke Ghar Kaun-Kaun Se Vendors Aate Hain?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {householdServices.map((s) => {
                    const isChecked = selectedServices.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isChecked
                            ? 'border-blue-500 bg-blue-50/80 text-blue-950 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{s.label}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">{s.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              TRACK 2: VENDOR / VYAPARI SETUP UI (Totally Differentiated)
              ========================================================================= */}
          {role === 'vendor' && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Business Trade Selector */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Aapka Vyapar Category (Select Business Type)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {vendorTrades.map((t) => {
                    const isSelected = vendorCategory === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectVendorTrade(t)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">{t.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                          Default: ₹{t.defaultRate}/{t.unit}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Business Name & Route Setup */}
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Dukan / Vyapar Ka Naam (Business Name)
                  </label>
                  <input
                    type="text"
                    value={vendorBusinessName}
                    onChange={(e) => setVendorBusinessName(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Raju Doodh Dairy, Shree Ram Water Supply"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Customer ke WhatsApp bill par yahi naam jayega.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Delivery Route / Society
                    </label>
                    <input
                      type="text"
                      value={vendorRouteName}
                      onChange={(e) => setVendorRouteName(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Gokuldham Heights - Tower A"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Selling Rate (₹ per unit)
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="number"
                        value={unitRate}
                        onChange={(e) => setUnitRate(e.target.value)}
                        className="w-full text-xs font-bold pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        placeholder="68"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Aapka UPI Mobile Number (Payment Receive Karne Ke Liye)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                      className="w-full text-xs font-bold pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
                role === 'vendor'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
              }`}
            >
              <span>
                {isSubmitting 
                  ? 'Setup Ho Raha Hai...' 
                  : (role === 'household' ? 'Ghar Ka Dashboard Kholein 🏠' : 'Vyapari Route Console Kholein 🛵')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
