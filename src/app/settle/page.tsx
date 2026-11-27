'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import { Send, Copy, Check, MessageSquare, IndianRupee, ExternalLink, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { playSuccessChime } from '@/lib/chime';

interface Vendor {
  id: string;
  category: string;
  displayName: string;
  icon?: string;
  vendorPhone?: string;
  unit: string;
  unitRate: number;
}

interface Customer {
  id: string;
  flatNumber: string;
  customerName: string;
  phone?: string;
  dailyQuantity: number;
  pendingBalance: number;
}

export default function SettlePage() {
  const [role, setRole] = useState<'household' | 'vendor'>('household');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendorBusinessName, setVendorBusinessName] = useState('Raju Doodh Dairy');
  const [vendorCategory, setVendorCategory] = useState('milk');
  const [vendorRouteName, setVendorRouteName] = useState('Gokuldham Heights - Tower A');
  const [merchantRate, setMerchantRate] = useState(68);
  const [merchantUpiPhone, setMerchantUpiPhone] = useState('9876543210');
  
  // Selected states
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<any | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paidFlats, setPaidFlats] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('rozhisaab_role') as 'household' | 'vendor' | null;
      if (cached) setRole(cached);
    }
    fetchProfile();
    fetchVendors();
    fetchCustomers();

    const handleRoleChange = (e: any) => {
      setRole(e.detail);
      if (typeof window !== 'undefined') {
        localStorage.setItem('rozhisaab_role', e.detail);
      }
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
        if (typeof window !== 'undefined' && data.user.role) {
          localStorage.setItem('rozhisaab_role', data.user.role);
        }
        if (data.user.vendorBusinessName) setVendorBusinessName(data.user.vendorBusinessName);
        if (data.user.vendorCategory) setVendorCategory(data.user.vendorCategory);
        if (data.user.vendorRouteName) setVendorRouteName(data.user.vendorRouteName);
        if (data.user.merchantRate) setMerchantRate(data.user.merchantRate);
        if (data.user.merchantUpiPhone) setMerchantUpiPhone(data.user.merchantUpiPhone);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      if (data.vendors && data.vendors.length > 0) {
        setVendors(data.vendors);
        setSelectedVendorId(data.vendors[0].id);
        fetchSettlement(data.vendors[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.customers && data.customers.length > 0) {
        setCustomers(data.customers);
        setSelectedCustomerId(data.customers[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettlement = async (vendorId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/settle?vendorId=${vendorId}`);
      const data = await res.json();
      setSummary(data.summary);
      setShareUrl(data.shareUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVendor = (id: string) => {
    setSelectedVendorId(id);
    fetchSettlement(id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    playSuccessChime();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const markCustomerPaid = async (flat: string) => {
    const cust = customers.find(c => c.flatNumber === flat);
    if (!cust) return;

    try {
      await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: cust.id,
          clearBalance: true
        })
      });

      playSuccessChime();
      setPaidFlats(prev => [...prev, flat]);
      await fetchCustomers();
    } catch (e) {
      console.error('Failed to clear customer balance:', e);
    }
  };

  // Selected customer for Vendor mode
  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const getCustomerInvoiceText = (c: Customer) => {
    const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const isWater = vendorCategory === 'water';
    const isLaundry = vendorCategory === 'laundry';
    const isTiffin = vendorCategory === 'tiffin';
    const unitLabel = isWater ? 'Cans' : (isTiffin ? 'Meals' : (isLaundry ? 'Pieces' : 'L'));
    const icon = isWater ? '💧' : (isTiffin ? '🍱' : (isLaundry ? '👔' : '🥛'));
    const itemDesc = isWater ? '20L Water Can' : (isTiffin ? 'Tiffin Meal' : (isLaundry ? 'Ironing' : 'Fresh Milk'));

    return `🙏 *Namaste ${c.customerName}*,\n\n*${vendorBusinessName} - ${month} Bill* 📋\n${c.flatNumber} (${vendorRouteName})\n-----------------------------------\n${icon} *Daily ${itemDesc}:* ${c.dailyQuantity} ${unitLabel}/day (Rate: ₹${merchantRate}/${unitLabel})\n📅 *Days Delivered:* 30 days\n💰 *Total Amount Payable:* ₹${c.pendingBalance.toFixed(0)}\n\n📲 *Pay via UPI:* upi://pay?pa=${merchantUpiPhone}@upi&pn=${encodeURIComponent(vendorBusinessName)}&am=${c.pendingBalance.toFixed(0)}\n\n_Generated hands-free via RozHisaab Vyapari Console_`;
  };

  const getCustomerWhatsAppShareUrl = (c: Customer) => {
    const message = getCustomerInvoiceText(c);
    const cleanPhone = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className={`min-h-screen text-slate-900 pb-24 md:pb-12 ${
      role === 'vendor' ? 'bg-slate-950/5' : 'bg-slate-50/70'
    }`}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mb-4 rounded-2xl overflow-hidden border border-emerald-200/80 shadow-2xs">
          <KeyNoticeBanner />
        </div>

        {/* Top Header */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs mb-6">
          <div className="flex items-center gap-3">
            <span className={`text-3xl p-2 rounded-2xl ${
              role === 'vendor' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {role === 'vendor' ? '💰' : '📲'}
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                {role === 'vendor' 
                  ? 'Grahak Vasooli & Invoicing Console' 
                  : 'Month-End Vendor Settlement & WhatsApp'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {role === 'vendor'
                  ? 'Apartment flats ko WhatsApp bill bhejein aur monthly vasooli track karein'
                  : 'Ek tap mein vendor ko date-wise hisaab card aur UPI payment link bhejein'}
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            HOUSEHOLD MODE: PAYING VENDORS
            ========================================================================= */}
        {role === 'household' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Vendor Picker Column */}
            <div className="md:col-span-5 lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                Kiska Hisaab Bhejna Hai?
              </label>

              <div className="flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {vendors.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVendor(v.id)}
                    className={`p-3.5 rounded-2xl flex items-center gap-3 border transition-all text-left flex-shrink-0 md:flex-shrink w-full ${
                      selectedVendorId === v.id
                        ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                        : 'border-slate-200/80 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-3xl">{v.icon}</span>
                    <div className="flex-1 truncate">
                      <span className="text-sm font-bold text-slate-900 block truncate">{v.displayName}</span>
                      <span className="text-xs text-slate-500 font-medium">Rate: ₹{v.unitRate}/{v.unit}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* WhatsApp Card Column */}
            <div className="md:col-span-7 lg:col-span-8">
              {summary && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-semibold text-slate-400">Payable To Vendor:</span>
                      <h2 className="text-lg font-black text-slate-900">{summary.displayName}</h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-400 block">Total Amount:</span>
                      <span className="text-2xl font-black text-blue-600 flex items-center justify-end">
                        <IndianRupee className="w-5 h-5 stroke-[2.5]" />
                        {summary.totalAmountPayable.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp Message Preview styled like WhatsApp */}
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 font-mono text-xs text-slate-800 whitespace-pre-line relative shadow-inner">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-sans font-bold text-xs mb-3">
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp Message Preview:
                    </div>
                    {summary.whatsappMessage}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>WhatsApp Pe Bhejein</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>

                    {summary.upiPaymentLink && (
                      <a
                        href={summary.upiPaymentLink}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md shadow-indigo-600/20 transition-all"
                        title="Direct UPI Payment via GPay, PhonePe, Paytm, BHIM"
                      >
                        <IndianRupee className="w-4 h-4" />
                        <span>Pay via UPI</span>
                      </a>
                    )}

                    <button
                      onClick={() => copyToClipboard(summary.whatsappMessage)}
                      className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* =========================================================================
              VENDOR MODE: COLLECTING BILLS FROM FLATS / CUSTOMERS
              ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Customer Flat Selector Column */}
            <div className="md:col-span-5 lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                Kiski Vasooli Bhejni Hai? (Select Flat)
              </label>

              <div className="flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {customers.map(c => {
                  const isPaid = paidFlats.includes(c.flatNumber);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all text-left flex-shrink-0 md:flex-shrink w-full ${
                        selectedCustomerId === c.id
                          ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                          : 'border-slate-200/80 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded-lg font-mono">
                            {c.flatNumber}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{c.customerName}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium mt-1 block">
                          Daily: {c.dailyQuantity} L/day
                        </span>
                      </div>

                      <div className="text-right">
                        {isPaid ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="text-xs font-black text-emerald-700 block">
                            ₹{c.pendingBalance.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flat Invoice Card Column */}
            <div className="md:col-span-7 lg:col-span-8">
              {currentCustomer && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-semibold text-slate-400">Customer Invoice:</span>
                      <h2 className="text-lg font-black text-slate-900">
                        {currentCustomer.flatNumber} — {currentCustomer.customerName}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-400 block">Pending Balance:</span>
                      <span className="text-2xl font-black text-emerald-600 flex items-center justify-end">
                        <IndianRupee className="w-5 h-5 stroke-[2.5]" />
                        {currentCustomer.pendingBalance.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Customer WhatsApp Message Preview */}
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 font-mono text-xs text-slate-800 whitespace-pre-line relative shadow-inner">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-sans font-bold text-xs mb-3">
                      <MessageSquare className="w-4 h-4" />
                      Flat WhatsApp Bill Preview:
                    </div>
                    {getCustomerInvoiceText(currentCustomer)}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a
                      href={getCustomerWhatsAppShareUrl(currentCustomer)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>WhatsApp Bill Bhejein</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>

                    <button
                      onClick={() => markCustomerPaid(currentCustomer.flatNumber)}
                      className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-600/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark as Paid</span>
                    </button>

                    <button
                      onClick={() => copyToClipboard(getCustomerInvoiceText(currentCustomer))}
                      className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
