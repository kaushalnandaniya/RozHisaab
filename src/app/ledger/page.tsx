'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import { IndianRupee, Filter, ArrowUpRight, CheckCircle, Package } from 'lucide-react';

interface Vendor {
  id: string;
  category: string;
  displayName: string;
  unit: string;
  unitRate: number;
  jarDepositBalance: number;
  icon?: string;
  color?: string;
  entries: Array<{
    id: string;
    entryDate: string;
    quantity: number;
    unit: string;
    action: string;
    amountCalculated: number;
    metadata?: string;
  }>;
}

export default function LedgerPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = selectedCategory === 'all'
    ? vendors
    : vendors.filter(v => v.category === selectedCategory);

  const totalMonthlySpend = vendors.reduce((acc, v) => {
    const vTotal = v.entries.reduce((sum, e) => sum + (e.amountCalculated || 0), 0);
    return acc + vTotal;
  }, 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-28 max-w-lg mx-auto shadow-2xl relative border-x border-slate-200">
      <KeyNoticeBanner />

      <header className="px-5 pt-5 pb-3 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              📊 Mahine Ka Hisaab
            </h1>
            <p className="text-xs text-slate-500">
              Date-wise tally & vendor breakdown
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-medium block">Total Is Mahine</span>
            <span className="text-base font-extrabold text-blue-600 flex items-center justify-end">
              <IndianRupee className="w-3.5 h-3.5" />
              {totalMonthlySpend.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto py-2.5 mt-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sabhi Vendors
          </button>
          {vendors.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedCategory(v.category)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all ${
                selectedCategory === v.category
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{v.icon}</span>
              <span>{v.displayName.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Vendor Breakdown Cards */}
      <div className="p-4 space-y-4">
        {filteredVendors.map(vendor => {
          const totalQty = vendor.entries.reduce((sum, e) => {
            return (e.action === 'received' || e.action === 'given') ? sum + e.quantity : sum;
          }, 0);

          const totalCost = vendor.entries.reduce((sum, e) => sum + e.amountCalculated, 0);

          return (
            <div key={vendor.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{vendor.icon}</span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{vendor.displayName}</h2>
                    <p className="text-xs text-slate-500">
                      Rate: ₹{vendor.unitRate}/{vendor.unit}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">
                    {totalQty} {vendor.unit}
                  </span>
                  <span className="text-xs font-extrabold text-blue-600">
                    ₹{totalCost.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Water Jar Deposit Special Tracker */}
              {vendor.category === 'water' && (
                <div className="mt-2.5 bg-cyan-50 border border-cyan-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs text-cyan-950 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-cyan-700" />
                    <span>Pending Empty Jars (Aapke paas):</span>
                  </div>
                  <span className="font-extrabold text-cyan-800 text-sm bg-cyan-200 px-2 py-0.5 rounded-lg">
                    {vendor.jarDepositBalance} Jars
                  </span>
                </div>
              )}

              {/* Recent Entries Sub-list */}
              <div className="mt-3 space-y-1.5">
                {vendor.entries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">Abhi koi entry nahi hai</p>
                ) : (
                  vendor.entries.map(e => (
                    <div key={e.id} className="flex items-center justify-between text-xs py-1 px-1 rounded-lg hover:bg-slate-50">
                      <span className="text-slate-500 font-medium">{e.entryDate}</span>
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <span>
                          {e.action === 'absent' ? 'Chhutti' : `${e.quantity} ${e.unit}`}
                        </span>
                        {e.amountCalculated > 0 && (
                          <span className="text-slate-900">₹{e.amountCalculated}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Navbar />
    </main>
  );
}
