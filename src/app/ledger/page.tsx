'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import CustomerCalendarModal from '@/components/CustomerCalendarModal';
import { IndianRupee, Filter, ArrowUpRight, CheckCircle, Package, TrendingUp, Building2, User, Calendar, Download, Printer, FileSpreadsheet } from 'lucide-react';

interface CustomerDelivery {
  id: string;
  customerId: string;
  deliveryDate: string;
  quantity: number;
  unit: string;
  action: string;
  amount: number;
  notes?: string;
}

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

interface Customer {
  id: string;
  flatNumber: string;
  customerName: string;
  phone?: string;
  dailyQuantity: number;
  pendingBalance: number;
  deliveries?: CustomerDelivery[];
}

export default function LedgerPage() {
  const [role, setRole] = useState<'household' | 'vendor'>('household');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendorBusinessName, setVendorBusinessName] = useState('Raju Doodh Dairy');
  const [vendorRouteName, setVendorRouteName] = useState('Gokuldham Heights - Tower A');
  const [merchantUpiPhone, setMerchantUpiPhone] = useState('9876543210');
  const [merchantRate, setMerchantRate] = useState(68);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCalendarCustomer, setSelectedCalendarCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchVendors();
    fetchCustomers();

    const handleRoleChange = (e: any) => {
      setRole(e.detail);
    };
    window.addEventListener('rozhisaab-role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('rozhisaab-role-changed', handleRoleChange);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.user) {
        setRole(data.user.role || 'household');
        if (data.user.vendorBusinessName) setVendorBusinessName(data.user.vendorBusinessName);
        if (data.user.vendorRouteName) setVendorRouteName(data.user.vendorRouteName);
        if (data.user.merchantUpiPhone) setMerchantUpiPhone(data.user.merchantUpiPhone);
        if (data.user.merchantRate) setMerchantRate(data.user.merchantRate);
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateDelivery = async (customerId: string, date: string, quantity: number, action: string) => {
    try {
      await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, deliveryDate: date, quantity, action })
      });
      await fetchCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const downloadSocietyLedgerCSV = () => {
    const today = new Date();
    const monthYear = today.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    
    // Structured CSV for Society / RWA Manager
    const headers = [
      'Flat Number',
      'Resident Name',
      'Phone Number',
      'Daily Quantity (Litres)',
      'Estimated Monthly Supply (Litres)',
      'Milk Rate (INR/L)',
      'Pending Receivables (INR)',
      'Payment Status'
    ];

    const rows = customers.map(c => [
      `"${c.flatNumber}"`,
      `"${c.customerName}"`,
      `"${c.phone || '9876543210'}"`,
      c.dailyQuantity,
      (c.dailyQuantity * 30).toFixed(0),
      merchantRate,
      c.pendingBalance.toFixed(0),
      c.pendingBalance <= 0 ? 'Cleared / Paid' : 'Pending Payment'
    ]);

    const csvContent = [
      `# ${vendorBusinessName} — Apartment Route Ledger (${vendorRouteName})`,
      `# Month: ${monthYear} | Exported: ${today.toLocaleDateString('en-IN')}`,
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RozHisaab_${vendorRouteName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printSocietyStatement = () => {
    window.print();
  };

  const filteredVendors = selectedCategory === 'all'
    ? vendors
    : vendors.filter(v => v.category === selectedCategory);

  const totalMonthlySpend = vendors.reduce((acc, v) => {
    const vTotal = v.entries.reduce((sum, e) => sum + (e.amountCalculated || 0), 0);
    return acc + vTotal;
  }, 0);

  const totalEntriesCount = vendors.reduce((acc, v) => acc + v.entries.length, 0);
  const totalReceivables = customers.reduce((sum, c) => sum + (c.pendingBalance || 0), 0);

  return (
    <div className={`min-h-screen text-slate-900 pb-24 md:pb-12 ${
      role === 'vendor' ? 'bg-slate-950/5' : 'bg-slate-50/70'
    }`}>
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
                <span className={`text-2xl p-1.5 rounded-xl ${
                  role === 'vendor' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {role === 'vendor' ? '📖' : '📊'}
                </span>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  {role === 'vendor' 
                    ? `${vendorBusinessName} — Grahak Khata & Delivery Tally` 
                    : 'Mahine Ka Doorstep Ledger & Tally'}
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {role === 'vendor'
                  ? `Route: ${vendorRouteName} • Per-flat monthly delivery summary and receivables`
                  : 'Date-wise doorstep breakdown, total units & jar deposit balances'}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {role === 'vendor' ? 'Total Route Flats' : 'Total Entries'}
                </span>
                <span className="text-lg font-black text-slate-900">
                  {role === 'vendor' ? `${customers.length} Flats` : `${totalEntriesCount} Logs`}
                </span>
              </div>

              <div className={`border px-5 py-2.5 rounded-2xl text-right ${
                role === 'vendor' ? 'bg-emerald-50 border-emerald-200/80' : 'bg-blue-50 border-blue-200/80'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  role === 'vendor' ? 'text-emerald-700' : 'text-blue-500'
                }`}>
                  {role === 'vendor' ? 'Total Vasooli Due' : 'Total Is Mahine'}
                </span>
                <span className={`text-xl font-black flex items-center justify-end ${
                  role === 'vendor' ? 'text-emerald-700' : 'text-blue-600'
                }`}>
                  <IndianRupee className="w-4 h-4" />
                  {role === 'vendor' ? totalReceivables.toFixed(0) : totalMonthlySpend.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Society Export & Audit Action Bar */}
        {role === 'vendor' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-emerald-200/80 rounded-3xl p-4 shadow-2xs mb-6 print:hidden">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Society Route Reports & Audit</h2>
                <p className="text-[11px] text-slate-500">Download formatted CSV for society RWA or print monthly billing statements</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadSocietyLedgerCSV}
                className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Export Ledger (CSV)</span>
              </button>

              <button
                onClick={printSocietyStatement}
                className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            HOUSEHOLD LEDGER: VENDOR EXPENSE TALLY
            ========================================================================= */}
        {role === 'household' ? (
          <div className="space-y-6">
            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
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
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{v.icon}</span>
                  <span>{v.displayName.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Vendor Cards Grid */}
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
        ) : (
          /* =========================================================================
              VENDOR LEDGER: APARTMENT ROUTE CUSTOMER KHATA
              ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map(c => (
              <div key={c.id} className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-xl font-mono">
                        {c.flatNumber}
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{c.customerName}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Daily: {c.dailyQuantity} L</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block">Pending Balance:</span>
                      <span className="text-base font-black text-emerald-700 flex items-center justify-end">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {c.pendingBalance.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-50 text-slate-600">
                      <span>Monthly Estimated Supply:</span>
                      <span className="font-bold text-slate-900">{(c.dailyQuantity * 30).toFixed(0)} Litres</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-50 text-slate-600">
                      <span>Unit Rate:</span>
                      <span className="font-bold text-slate-900">₹68 / Litre</span>
                    </div>
                    <div className="flex items-center justify-between py-1 text-slate-600">
                      <span>Phone / WhatsApp:</span>
                      <span className="font-mono text-slate-800">{c.phone || '9876543210'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedCalendarCustomer(c)}
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95"
                  >
                    <span>📅 दूध का पर्चा</span>
                  </button>
                  <a
                    href={`/settle`}
                    className="text-xs font-bold text-slate-700 hover:text-emerald-700"
                  >
                    View Invoice →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Customer 30-Day Milk Delivery Calendar Modal */}
        {selectedCalendarCustomer && (
          <CustomerCalendarModal
            customer={selectedCalendarCustomer}
            businessName={vendorBusinessName}
            routeName={vendorRouteName}
            merchantUpiPhone={merchantUpiPhone}
            merchantRate={merchantRate}
            isOpen={Boolean(selectedCalendarCustomer)}
            onClose={() => setSelectedCalendarCustomer(null)}
            onUpdateDelivery={handleUpdateDelivery}
          />
        )}

      </div>
    </div>
  );
}
