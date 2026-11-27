'use client';

import React, { useState } from 'react';
import { 
  Store, 
  Building2, 
  IndianRupee, 
  Phone, 
  Save, 
  Check, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { playSuccessChime } from '@/lib/chime';

interface Customer {
  id: string;
  flatNumber: string;
  customerName: string;
  phone?: string;
  dailyQuantity: number;
  pendingBalance: number;
}

interface VendorSettingsProps {
  businessName: string;
  vendorCategory: string;
  routeName: string;
  merchantUpiPhone: string;
  merchantRate: number;
  customers: Customer[];
  onRefreshCustomers: () => void;
  onRefreshProfile: () => void;
}

export default function VendorSettings({
  businessName: initialBusinessName,
  vendorCategory: initialVendorCategory,
  routeName: initialRouteName,
  merchantUpiPhone: initialUpiPhone,
  merchantRate: initialRate,
  customers,
  onRefreshCustomers,
  onRefreshProfile,
}: VendorSettingsProps) {
  // Form states
  const [businessName, setBusinessName] = useState(initialBusinessName || 'Raju Doodh Dairy');
  const [vendorCategory, setVendorCategory] = useState(initialVendorCategory || 'milk');
  const [routeName, setRouteName] = useState(initialRouteName || 'Gokuldham Heights - Tower A');
  const [merchantUpiPhone, setMerchantUpiPhone] = useState(initialUpiPhone || '9876543210');
  const [merchantRate, setMerchantRate] = useState(initialRate?.toString() || '68');

  React.useEffect(() => {
    if (initialBusinessName) setBusinessName(initialBusinessName);
    if (initialVendorCategory) setVendorCategory(initialVendorCategory);
    if (initialRouteName) setRouteName(initialRouteName);
    if (initialUpiPhone) setMerchantUpiPhone(initialUpiPhone);
    if (initialRate !== undefined) setMerchantRate(initialRate.toString());
  }, [initialBusinessName, initialVendorCategory, initialRouteName, initialUpiPhone, initialRate]);
  
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add Flat modal
  const [showAddFlat, setShowAddFlat] = useState(false);
  const [newFlat, setNewFlat] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newQty, setNewQty] = useState('1.5');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorBusinessName: businessName,
          vendorCategory,
          vendorRouteName: routeName,
          merchantUpiPhone,
          merchantRate: parseFloat(merchantRate) || 68
        })
      });

      playSuccessChime();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onRefreshProfile();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFlat = async (id: string) => {
    if (!confirm('Kya aap is flat ko apne delivery route se hatana chahte hain?')) return;
    try {
      await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
      playSuccessChime();
      onRefreshCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFlatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlat.trim()) return;

    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flatNumber: newFlat.startsWith('Flat') ? newFlat : `Flat ${newFlat}`,
          customerName: newName || 'Resident',
          phone: newPhone || '9876543210',
          dailyQuantity: parseFloat(newQty) || 1.5,
          pendingBalance: 0
        })
      });

      playSuccessChime();
      setShowAddFlat(false);
      setNewFlat('');
      setNewName('');
      setNewPhone('');
      onRefreshCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const samplePreviewMessage = `🙏 *Namaste Gupta Ji*,\n\n*${businessName} - Bill Summary* 📋\n${routeName} • Flat 302\n-----------------------------------\n🥛 *Daily Delivery:* 1.5 L/day (Rate: ₹${merchantRate}/L)\n💰 *Total Payable:* ₹2,040\n\n📲 *Pay via UPI:* upi://pay?pa=${merchantUpiPhone}@upi&pn=${encodeURIComponent(businessName)}&am=2040\n\n_Hisaab generated hands-free via RozHisaab_`;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-2 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            🛵
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Vyapari Route & Business Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              Manage your delivery route, customer flats, selling rate card, and merchant UPI payment ID.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Vyapar & Shop Profile */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Dukan & Vyapar Profile (Business Information)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Customer Bill Details</span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Dukan / Business Ka Naam
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Raju Doodh Dairy"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Customer ke WhatsApp bill par yahi naam dikhega.</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Trade / Business Category
              </label>
              <select
                value={vendorCategory}
                onChange={(e) => setVendorCategory(e.target.value)}
                className="w-full font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="milk">🥛 Doodhwala (Milk Dairy Route)</option>
                <option value="water">💧 Paani Wala (20L Water Can Agency)</option>
                <option value="laundry">👔 Presswala (Ironing & Laundry)</option>
                <option value="tiffin">🍱 Tiffin Service (Daily Dabba Delivery)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Selling Rate (₹ per Litre / Can)
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  step="0.5"
                  required
                  value={merchantRate}
                  onChange={(e) => setMerchantRate(e.target.value)}
                  className="w-full font-bold pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="68"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Daily delivery logs calculate karne ke liye default rate.</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Aapka UPI Mobile Number (Payment Receive Karne Ke Liye)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={merchantUpiPhone}
                  onChange={(e) => setMerchantUpiPhone(e.target.value)}
                  className="w-full font-bold pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="9876543210"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">UPI ID: {merchantUpiPhone}@upi par customers pay karenge.</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Saved Successfully!' : isSaving ? 'Saving...' : 'Save Business Settings'}</span>
          </button>
        </form>
      </div>

      {/* SECTION 2: Route & Flats Management */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Delivery Route & Apartment Flats
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Route: <strong>{routeName}</strong> ({customers.length} Flats Active)
            </p>
          </div>

          <button
            onClick={() => setShowAddFlat(true)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Flat to Route</span>
          </button>
        </div>

        {/* Flats Table / Grid */}
        <div className="space-y-2">
          {customers.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-3 transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-xs bg-slate-900 text-white px-2.5 py-1 rounded-xl">
                  {c.flatNumber}
                </span>
                <div>
                  <span className="font-bold text-slate-900 block">{c.customerName}</span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Daily: <strong>{c.dailyQuantity} L</strong> • Phone: {c.phone || '9876543210'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-black text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-xl">
                  ₹{c.pendingBalance.toFixed(0)} Due
                </span>

                <button
                  onClick={() => handleDeleteFlat(c.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="Remove from Route"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Live WhatsApp Bill Template Preview */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Customer WhatsApp Bill Template (Live Preview)
          </h3>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 font-mono text-xs text-slate-800 whitespace-pre-line shadow-inner">
          {samplePreviewMessage}
        </div>
      </div>

      {/* Add Flat Modal */}
      {showAddFlat && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900">Add Flat to Delivery Route</h3>
              <button onClick={() => setShowAddFlat(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFlatSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Flat Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 602"
                  value={newFlat}
                  onChange={(e) => setNewFlat(e.target.value)}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Resident / Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Agarwal Ji"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Daily Regular Quantity (Litres)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-xl shadow-md transition-all"
              >
                Add Flat to Route
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
