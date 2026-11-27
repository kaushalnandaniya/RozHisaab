'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import { Save, Check, IndianRupee, Phone, Package, Plus } from 'lucide-react';

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

      setSavedId(vendor.id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (id: string, field: keyof Vendor, value: any) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-28 max-w-lg mx-auto shadow-2xl relative border-x border-slate-200">
      <KeyNoticeBanner />

      <header className="px-5 pt-5 pb-3 bg-white border-b border-slate-100">
        <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
          ⚙️ Vendors & Rates Setting
        </h1>
        <p className="text-xs text-slate-500">
          Apne hisaab se unit rate aur phone number set karein
        </p>
      </header>

      <div className="p-4 space-y-4">
        {vendors.map(vendor => (
          <div key={vendor.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{vendor.icon}</span>
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
                  <span className="text-emerald-300">Saved successfully!</span>
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
