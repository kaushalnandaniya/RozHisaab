'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import { IndianRupee, Filter, ArrowUpRight, CheckCircle, Package, TrendingUp } from 'lucide-react';

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

  const totalEntriesCount = vendors.reduce((acc, v) => acc + v.entries.length, 0);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-24 md:pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mb-4 rounded-2xl overflow-hidden border border-emerald-200/80 shadow-2xs">
          <KeyNoticeBanner />
        </div>

        {/* Top Header Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl p-1 bg-blue-50 rounded-xl">📊</span>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  Mahine Ka Hisaab & Ledger
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Date-wise doorstep breakdown, total units & jar deposit balances
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Entries</span>
                <span className="text-lg font-black text-slate-900">{totalEntriesCount} Logs</span>
              </div>

              <div className="bg-blue-50 border border-blue-200/80 px-5 py-2.5 rounded-2xl text-right">
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">Total Is Mahine</span>
                <span className="text-xl font-black text-blue-600 flex items-center justify-end">
                  <IndianRupee className="w-4 h-4" />
                  {totalMonthlySpend.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pt-4 mt-2 border-t border-slate-100 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sabhi Vendors ({vendors.length})
            </button>
            {vendors.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedCategory(v.category)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  selectedCategory === v.category
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{v.icon}</span>
                <span>{v.displayName.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Grid for Vendor Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => {
            const totalQty = vendor.entries.reduce((sum, e) => {
              return (e.action === 'received' || e.action === 'given') ? sum + e.quantity : sum;
            }, 0);

            const totalCost = vendor.entries.reduce((sum, e) => sum + e.amountCalculated, 0);

            return (
              <div key={vendor.id} className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-2xl shadow-inner" style={{ backgroundColor: `${vendor.color || '#3B82F6'}15` }}>
                        {vendor.icon}
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">{vendor.displayName}</h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Rate: ₹{vendor.unitRate}/{vendor.unit}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">
                        {totalQty} {vendor.unit}
                      </span>
                      <span className="text-sm font-black text-blue-600">
                        ₹{totalCost.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Water Jar Deposit Special Tracker */}
                  {vendor.category === 'water' && (
                    <div className="mt-3 bg-cyan-50 border border-cyan-200/80 rounded-2xl p-3 flex items-center justify-between text-xs text-cyan-950 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-cyan-700" />
                        <span>Pending Empty Jars:</span>
                      </div>
                      <span className="font-extrabold text-cyan-900 bg-cyan-200 px-2.5 py-0.5 rounded-xl">
                        {vendor.jarDepositBalance} Jars
                      </span>
                    </div>
                  )}

                  {/* Date-wise entries */}
                  <div className="mt-3 space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Logs:</h4>
                    {vendor.entries.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">Abhi koi entry nahi hai</p>
                    ) : (
                      vendor.entries.map(e => (
                        <div key={e.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                          <span className="text-slate-500 font-medium">{e.entryDate}</span>
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <span>
                              {e.action === 'absent' ? 'Chhutti' : `${e.quantity} ${e.unit}`}
                            </span>
                            {e.amountCalculated > 0 && (
                              <span className="text-blue-600 font-extrabold">₹{e.amountCalculated}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
