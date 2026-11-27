'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import { Save, Check, IndianRupee, Phone, Package, Plus, Sparkles, Mic, Trash2 } from 'lucide-react';
import { playSuccessChime } from '@/lib/chime';

interface Vendor {
  id: string;
  category: string;
  displayName: string;
  unit: string;
  unitRate: number;
  jarDepositBalance: number;
  vendorPhone?: string;
  icon?: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New vendor form state
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('50');
  const [newUnit, setNewUnit] = useState('month');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState('custom');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      if (data.vendors) {
        setVendors(data.vendors);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (vendor: Vendor) => {
    try {
      await fetch('/api/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: vendor.id,
          displayName: vendor.displayName,
          unitRate: vendor.unitRate,
          vendorPhone: vendor.vendorPhone,
          jarDepositBalance: vendor.jarDepositBalance
        })
      });

      playSuccessChime();
      setSavedId(vendor.id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (id: string, field: keyof Vendor, value: any) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleAddCustomVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newName,
          category: newCategory,
          unit: newUnit,
          unitRate: parseFloat(newRate) || 50,
          vendorPhone: newPhone || undefined,
          icon: newCategory === 'car_wash' ? '🚗' : newCategory === 'cook' ? '👨‍🍳' : '🏷️'
        })
      });

      playSuccessChime();
      setNewName('');
      setNewPhone('');
      setShowAddForm(false);
      await fetchVendors();
    } catch (err) {
      console.error(err);
    }
  };

  const quickPresets = [
    { name: 'Ramu Car Wash', category: 'car_wash', unit: 'month', rate: 500, icon: '🚗' },
    { name: 'Nariyal Paani Wala', category: 'custom', unit: 'pieces', rate: 60, icon: '🥥' },
    { name: 'Mali / Gardener', category: 'gardener', unit: 'month', rate: 450, icon: '🪴' },
    { name: 'Cook (Khana Banane Wali)', category: 'cook', unit: 'month', rate: 3500, icon: '👨‍🍳' }
  ];

  const addPreset = async (preset: typeof quickPresets[0]) => {
    try {
      await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: preset.name,
          category: preset.category,
          unit: preset.unit,
          unitRate: preset.rate,
          icon: preset.icon
        })
      });
      playSuccessChime();
      await fetchVendors();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-28 max-w-lg mx-auto shadow-2xl relative border-x border-slate-200">
      <KeyNoticeBanner />

      <header className="px-5 pt-5 pb-3 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              ⚙️ Vendors & Rates Setting
            </h1>
            <p className="text-xs text-slate-500">
              Apne hisaab se unit rate aur phone number set karein
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Naya Vendor</span>
          </button>
        </div>
      </header>

      {/* Voice Add Vendor Highlight Tip */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-3.5 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1">
              <span>Voice se bhi direct add karein!</span>
              <Sparkles className="w-3 h-3 text-emerald-600" />
            </h4>
            <p className="text-[11px] text-emerald-800 font-medium mt-0.5 leading-snug">
              Home screen pe mic dabake boliye: <br />
              <span className="font-semibold text-emerald-950">"Naya vendor add karo: Ramu Car Wash, rate 500 rupaye mahina, phone 9876543210"</span>
            </p>
          </div>
        </div>
      </div>

      {/* Manual Add Form Dropdown */}
      {showAddForm && (
        <form onSubmit={handleAddCustomVendor} className="mx-4 mt-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 animate-slide-up">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Naya Vendor Banayein</h3>
          
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Vendor Ka Naam</label>
            <input
              type="text"
              placeholder="Jaise: Mohan Car Wash"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Rate (₹)</label>
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Unit</label>
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="month">Mahina (Month)</option>
                <option value="litres">Litre</option>
                <option value="cans">Cans</option>
                <option value="pieces">Piece (Kapde)</option>
                <option value="day">Day (Din)</option>
                <option value="meals">Meal (Thali)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">WhatsApp Phone (Optional)</label>
            <input
              type="text"
              placeholder="10 digit number"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-95 shadow-sm"
          >
            Vendor Save Karein
          </button>
        </form>
      )}

      {/* 1-Click Popular Indian Presets */}
      <div className="px-4 mt-4">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          Quick 1-Click Add Presets:
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickPresets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => addPreset(p)}
              className="bg-white border border-slate-200 hover:border-blue-400 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 whitespace-nowrap flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
            >
              <span>{p.icon}</span>
              <span>{p.name.split(' ')[0]} (₹{p.rate})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Existing Vendors List */}
      <div className="p-4 space-y-4">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Aapke Judhe Hue Vendors ({vendors.length}):
        </label>

        {vendors.map(vendor => (
          <div key={vendor.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{vendor.icon || '📦'}</span>
              <input
                type="text"
                value={vendor.displayName}
                onChange={(e) => handleChange(vendor.id, 'displayName', e.target.value)}
                className="font-bold text-sm text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none flex-1 py-0.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                  <IndianRupee className="w-3 h-3 text-slate-400" />
                  Rate (per {vendor.unit}):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={vendor.unitRate}
                    onChange={(e) => handleChange(vendor.id, 'unitRate', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 text-xs">₹</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  WhatsApp Phone:
                </label>
                <input
                  type="text"
                  placeholder="10 digit number"
                  value={vendor.vendorPhone || ''}
                  onChange={(e) => handleChange(vendor.id, 'vendorPhone', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {vendor.category === 'water' && (
              <div className="pt-1">
                <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                  <Package className="w-3 h-3 text-cyan-600" />
                  Pending Empty Jars Count:
                </label>
                <input
                  type="number"
                  value={vendor.jarDepositBalance}
                  onChange={(e) => handleChange(vendor.id, 'jarDepositBalance', parseInt(e.target.value) || 0)}
                  className="w-full bg-cyan-50/50 border border-cyan-200 rounded-xl px-3 py-1.5 font-bold text-cyan-900 focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={() => handleUpdate(vendor)}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              {savedId === vendor.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Rate Update Ho Gaya!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Settings</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <Navbar />
    </main>
  );
}
