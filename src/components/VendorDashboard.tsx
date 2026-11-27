'use client';

import React, { useState } from 'react';
import MicButton from '@/components/MicButton';
import { 
  Sparkles, 
  Store, 
  Building2, 
  Phone, 
  IndianRupee, 
  Send, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { playSuccessChime } from '@/lib/chime';
import confetti from 'canvas-confetti';

interface Customer {
  id: string;
  flatNumber: string;
  customerName: string;
  phone?: string;
  dailyQuantity: number;
  pendingBalance: number;
}

interface VendorDashboardProps {
  businessName: string;
  vendorCategory: string;
  routeName: string;
  customers: Customer[];
  isProcessing: boolean;
  vendorBatchNotice: any[] | null;
  onTranscript: (text: string) => void;
  onRefreshCustomers: () => void;
  onOpenOnboarding: () => void;
}

export default function VendorDashboard({
  businessName,
  vendorCategory,
  routeName,
  customers,
  isProcessing,
  vendorBatchNotice,
  onTranscript,
  onRefreshCustomers,
  onOpenOnboarding,
}: VendorDashboardProps) {
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newFlat, setNewFlat] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newQty, setNewQty] = useState('1.5');
  const [statusLog, setStatusLog] = useState<{ [flat: string]: string }>({});

  const vendorPresets = [
    { label: '🛵 Route Run (Flats 402, 501, 104)', text: 'Flat 402 dedh litre, Flat 501 do litre, Flat 104 chhutti' },
    { label: '🥛 Flat 302 Extra Milk', text: 'Flat 302 mein do litre doodh diya' },
    { label: '🏖️ Flat 104 Chhutti', text: 'Flat 104 Patel ji aaj chhutti pe hain' },
    { label: '💧 2 Water Jars Delivered', text: 'Flat 501 mein 2 water can diye' }
  ];

  const totalReceivables = customers.reduce((sum, c) => sum + (c.pendingBalance || 0), 0);

  const handleQuickLog = async (flat: string, qty: number, isAbsent: boolean = false) => {
    try {
      playSuccessChime();
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      setStatusLog(prev => ({
        ...prev,
        [flat]: isAbsent ? 'Absent' : `Delivered ${qty}L`
      }));

      // Simulate sending parsed route batch
      await onTranscript(isAbsent ? `${flat} chhutti` : `${flat} ${qty} litre`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
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
          dailyQuantity: parseFloat(newQty) || 1.0,
          pendingBalance: (parseFloat(newQty) || 1.0) * 68 * 15 // 15 days pending
        })
      });

      playSuccessChime();
      setShowAddCustomerModal(false);
      setNewFlat('');
      setNewName('');
      setNewPhone('');
      onRefreshCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const getWhatsAppInvoiceLink = (c: Customer) => {
    const text = `🙏 *Namaste ${c.customerName}*,\n\n*${businessName} - Bill Summary* 📋\nDelivery Route: ${routeName}\n${c.flatNumber}\n-----------------------------------\nDaily Supply: ${c.dailyQuantity} L/day\n💰 *Total Pending Balance:* ₹${c.pendingBalance.toFixed(0)}\n\n📲 *Pay via UPI:* upi://pay?pa=9876543210@upi&pn=${encodeURIComponent(businessName)}&am=${c.pendingBalance.toFixed(0)}\n\n_Generated via RozHisaab Vyapari Console_`;
    const cleanPhone = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Merchant Commercial Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl text-emerald-400">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">{businessName}</h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Vyapari Console
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Route: <strong>{routeName}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenOnboarding}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <span>⚙️ Route Setup</span>
            </button>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Flat</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Route Flats</span>
            <span className="text-xl font-black text-white mt-0.5 block">{customers.length} Flats</span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today Deliveries</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">
              {Object.keys(statusLog).filter(k => !statusLog[k].includes('Absent')).length || customers.length - 1} Done
            </span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Flats on Leave</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">
              {Object.keys(statusLog).filter(k => statusLog[k].includes('Absent')).length || 1} Chhutti
            </span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Vasooli Due</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 flex items-center">
              <IndianRupee className="w-4 h-4" />
              {totalReceivables.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Route Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: VENDOR VOICE ROUTE STATION ================= */}
        <div className="md:col-span-5 space-y-4 md:sticky md:top-24">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎙️</span>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">Route Voice Station</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Poore route ki delivery ek saans mein boliye</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Route Mode
              </span>
            </div>

            {/* Mic Button */}
            <MicButton
              onTranscriptComplete={onTranscript}
              isProcessing={isProcessing}
            />

            {/* Vendor Voice Presets */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Tap-to-Test Route Voice Presets:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {vendorPresets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => onTranscript(p.text)}
                    disabled={isProcessing}
                    className="text-[11px] bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 px-2.5 py-1.5 rounded-xl shadow-2xs active:scale-95 transition-all text-left flex items-center gap-1 font-semibold"
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Spoken Batch Route Delivery Notice */}
          {vendorBatchNotice && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 shadow-xs animate-fade-in">
              <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Route Deliveries Successfully Updated!</span>
              </div>
              <div className="space-y-1">
                {vendorBatchNotice.map((d, i) => (
                  <div key={i} className="text-xs text-emerald-800 flex items-center justify-between">
                    <span className="font-bold">{d.flatNumber}:</span>
                    <span>{d.action === 'absent' ? '🏖️ Chhutti' : `🥛 ${d.quantity}L Delivered`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Boy Speech Syntax Cheat Sheet */}
          <div className="bg-slate-900 text-slate-200 rounded-3xl p-4 text-xs border border-slate-800 shadow-xs">
            <h4 className="font-black text-white flex items-center gap-1.5 mb-2">
              <span>🛵 Fast Voice Route Syntax:</span>
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <p className="bg-slate-800/80 p-2 rounded-xl font-mono text-[10px] text-emerald-400">
                "Flat 402 dedh litre, Flat 501 do litre, Flat 104 chhutti"
              </p>
              <ul className="pl-3 list-disc space-y-1 text-slate-400">
                <li>Automatic multi-flat batch detection</li>
                <li>Flat balances auto-increase with delivery rate</li>
                <li>Absent flats noted without charging customer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: APARTMENT ROUTE RUN SHEET ================= */}
        <div className="md:col-span-7 space-y-4">
          
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  {routeName} — Route Customer Book
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Daily flat deliveries & monthly receivables</p>
              </div>

              <span className="text-xs font-black text-emerald-600">
                Total Due: ₹{totalReceivables.toFixed(0)}
              </span>
            </div>

            {/* Flat Customer Cards */}
            <div className="space-y-3 mt-3">
              {customers.map((c) => {
                const todayStatus = statusLog[c.flatNumber];
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded-lg font-mono">
                          {c.flatNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{c.customerName}</span>
                        {todayStatus && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                            todayStatus.includes('Absent') 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {todayStatus}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                        <span>Daily: <strong>{c.dailyQuantity} L</strong></span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">
                          Pending: ₹{c.pendingBalance.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Quick 1-Tap Delivery Buttons */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                      <button
                        onClick={() => handleQuickLog(c.flatNumber, 1.0)}
                        className="text-[10px] font-bold px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg active:scale-95 transition-all"
                      >
                        +1L
                      </button>
                      <button
                        onClick={() => handleQuickLog(c.flatNumber, 1.5)}
                        className="text-[10px] font-bold px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg active:scale-95 transition-all"
                      >
                        +1.5L
                      </button>
                      <button
                        onClick={() => handleQuickLog(c.flatNumber, 2.0)}
                        className="text-[10px] font-bold px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg active:scale-95 transition-all"
                      >
                        +2L
                      </button>
                      <button
                        onClick={() => handleQuickLog(c.flatNumber, 0, true)}
                        className="text-[10px] font-bold px-2 py-1 bg-white hover:bg-amber-50 text-slate-500 hover:text-amber-700 border border-slate-200 rounded-lg active:scale-95 transition-all"
                        title="Mark Absent today"
                      >
                        Chhutti
                      </button>

                      {/* Send Bill Button */}
                      <a
                        href={getWhatsAppInvoiceLink(c)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                        title="Send WhatsApp Bill"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>Bill</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Add Customer Flat Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900">Add Flat to Delivery Route</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Flat Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 602"
                  value={newFlat}
                  onChange={(e) => setNewFlat(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Resident / Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Agarwal Ji"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Daily Quantity (Litres / Cans)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
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
