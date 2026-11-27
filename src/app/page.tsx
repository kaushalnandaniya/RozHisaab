'use client';

import React, { useState, useEffect } from 'react';
import MicButton from '@/components/MicButton';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import UndoToast from '@/components/UndoToast';
import Navbar from '@/components/Navbar';
import RoleOnboardingModal from '@/components/RoleOnboardingModal';
import { speakHindi } from '@/lib/tts';
import { playSuccessChime } from '@/lib/chime';
import { 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  IndianRupee,
  Calendar,
  PlusCircle,
  HelpCircle,
  Layers,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Package,
  ShieldCheck,
  User,
  Store,
  Home,
  Send,
  Building2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

interface Entry {
  id: string;
  vendorId: string;
  quantity: number;
  unit: string;
  action: string;
  amountCalculated: number;
  metadata?: string;
  loggedBy?: string;
  createdAt: string;
  vendor: {
    displayName: string;
    icon?: string;
    color?: string;
    category: string;
  };
}

interface Vendor {
  id: string;
  displayName: string;
  category: string;
  unit: string;
  unitRate: number;
  icon?: string;
}

interface Customer {
  id: string;
  flatNumber: string;
  customerName: string;
  phone?: string;
  dailyQuantity: number;
  pendingBalance: number;
}

export default function HomePage() {
  const [role, setRole] = useState<'household' | 'vendor'>('household');
  const [activeMember, setActiveMember] = useState('Kaushal');
  const [householdCode, setHouseholdCode] = useState('SHARMA-402');
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastLoggedEntryId, setLastLoggedEntryId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [totalToday, setTotalToday] = useState(0);
  
  // Date selection
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateLabel, setDateLabel] = useState<string>('Aaj');

  // Query Answer banner
  const [queryAnswer, setQueryAnswer] = useState<{ title: string; summary: string } | null>(null);

  // New Vendor celebration banner
  const [addedVendorNotice, setAddedVendorNotice] = useState<any | null>(null);

  // Vendor route batch confirmation banner
  const [vendorBatchNotice, setVendorBatchNotice] = useState<any[] | null>(null);

  // Manual Add Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [manualVendorId, setManualVendorId] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualAction, setManualAction] = useState('received');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchProfile();
    fetchEntries(today);
    fetchVendors();
    fetchCustomers();

    // Check if initial role/category onboarding is needed
    if (typeof window !== 'undefined') {
      const onboarded = localStorage.getItem('rozhisaab_onboarded');
      if (!onboarded) {
        setShowOnboardingModal(true);
      }
    }

    const handleRoleChange = (e: any) => {
      setRole(e.detail);
    };
    const handleMemberChange = (e: any) => {
      setActiveMember(e.detail);
    };
    const handleOpenOnboarding = () => {
      setShowOnboardingModal(true);
    };

    window.addEventListener('rozhisaab-role-changed', handleRoleChange);
    window.addEventListener('rozhisaab-member-changed', handleMemberChange);
    window.addEventListener('rozhisaab-open-onboarding', handleOpenOnboarding);

    return () => {
      window.removeEventListener('rozhisaab-role-changed', handleRoleChange);
      window.removeEventListener('rozhisaab-member-changed', handleMemberChange);
      window.removeEventListener('rozhisaab-open-onboarding', handleOpenOnboarding);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.user) {
        setRole(data.user.role || 'household');
        setActiveMember(data.user.activeMemberName || 'Kaushal');
        setHouseholdCode(data.user.householdCode || 'SHARMA-402');
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
        if (data.vendors.length > 0) {
          setManualVendorId(data.vendors[0].id);
        }
      }
    } catch (e) {
      console.error(e);
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

  const fetchEntries = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/entries?date=${dateStr}`);
      const data = await res.json();
      if (data.entries) {
        setEntries(data.entries);
        const sum = data.entries.reduce((acc: number, curr: Entry) => acc + (curr.amountCalculated || 0), 0);
        setTotalToday(sum);
      }
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  };

  const setDateFilter = (type: 'today' | 'yesterday') => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
      setDateLabel('Kal');
    } else {
      setDateLabel('Aaj');
    }
    const iso = d.toISOString().split('T')[0];
    setSelectedDate(iso);
    fetchEntries(iso);
  };

  const handleTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    setQueryAnswer(null);
    setAddedVendorNotice(null);
    setVendorBatchNotice(null);

    try {
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      const parseData = await parseRes.json();

      // Case 1: VENDOR DELIVERY ROUTE (Vyapari Mode)
      if (parseData.intent === 'vendor_delivery' && parseData.deliveries) {
        playSuccessChime();
        confetti({ particleCount: 45, spread: 70, origin: { y: 0.8 } });
        speakHindi(parseData.spokenResponseHindi);
        setVendorBatchNotice(parseData.deliveries);
        await fetchCustomers();
        setIsProcessing(false);
        return;
      }

      // Case 2: ADD VENDOR INTENT
      if (parseData.intent === 'add_vendor') {
        playSuccessChime();
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
        speakHindi(parseData.spokenResponseHindi);
        setAddedVendorNotice(parseData.savedVendor || parseData.newVendor);
        await fetchVendors();
        setIsProcessing(false);
        return;
      }

      // Case 3: QUERY HISAAB INTENT
      if (parseData.intent === 'query_hisaab') {
        speakHindi(parseData.spokenResponseHindi);
        if (parseData.queryAnswer) {
          setQueryAnswer(parseData.queryAnswer);
        }
        setIsProcessing(false);
        return;
      }

      // Case 4: LOG ENTRY INTENT (Household Mode)
      if (!parseData.items || parseData.items.length === 0) {
        speakHindi('Aapki aawaaz samajh nahi aayi, kripya dohraiye');
        setIsProcessing(false);
        return;
      }

      let lastId: string | null = null;
      for (const item of parseData.items) {
        const createRes = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorCategory: item.vendorCategory,
            vendorName: item.vendorName,
            quantity: item.quantity,
            unit: item.unit,
            action: item.action,
            emptyReturned: item.emptyReturned,
            itemsDetail: item.itemsDetail,
            advanceAmount: item.advanceAmount,
            notes: item.notes,
            rawTranscript: transcript,
            entryDate: selectedDate,
            loggedBy: activeMember
          })
        });
        const createData = await createRes.json();
        if (createData.entry) {
          lastId = createData.entry.id;
        }
      }

      playSuccessChime();
      speakHindi(parseData.spokenResponseHindi);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 } });

      if (lastId) {
        setLastLoggedEntryId(lastId);
        setToastMessage(parseData.spokenResponseHindi);
      }

      await fetchEntries(selectedDate);
    } catch (err) {
      console.error('Error processing voice entry:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find(v => v.id === manualVendorId);
    if (!vendor) return;

    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorCategory: vendor.category,
          vendorName: vendor.displayName,
          quantity: parseFloat(manualQty) || 1,
          unit: vendor.unit,
          action: manualAction,
          entryDate: selectedDate,
          loggedBy: activeMember,
          rawTranscript: 'Manual entry'
        })
      });

      playSuccessChime();
      setShowManualModal(false);
      await fetchEntries(selectedDate);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUndo = async (id: string) => {
    try {
      await fetch(`/api/entries?id=${id}`, { method: 'DELETE' });
      setLastLoggedEntryId(null);
      setToastMessage(null);
      speakHindi('Entry wapas le li gayi');
      await fetchEntries(selectedDate);
    } catch (err) {
      console.error('Failed to undo:', err);
    }
  };

  const householdTestPhrases = [
    { label: '🥛+💧 Milk & Water', text: 'Aaj doodh dedh litre liya aur 2 water can aaye' },
    { label: '👔 Press (6 clothes)', text: 'Presswale ko 4 shirt aur 2 pant diye' },
    { label: '🧹 Didi Leave', text: 'Sunita didi aaj chhutti pe hain' },
    { label: '➕ Add Vendor', text: 'Naya vendor add karo: Ramu Car Wash, rate 500 rupaye mahina, phone 9876543210' },
    { label: '❓ Ask Balance', text: 'Is mahine paani ka total kitna hua?' }
  ];

  const vendorTestPhrases = [
    { label: '🛵 Route Batch', text: 'Flat 402 dedh litre, Flat 501 do litre, Flat 104 chhutti' },
    { label: '🥛 Flat 302', text: 'Flat 302 mein dedh litre doodh diya' },
    { label: '🏖️ Flat 104 Leave', text: 'Flat 104 Patel ji aaj chhutti pe hain' }
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-24 md:pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Zero-Config Safety Banner */}
        <div className="mb-4 rounded-2xl overflow-hidden border border-emerald-200/80 shadow-2xs">
          <KeyNoticeBanner />
        </div>

        {/* =========================================================================
            RESPONSIVE ADAPTIVE 2-COLUMN GRID
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN: VOICE COMMAND CENTER ================= */}
          <div className="md:col-span-5 lg:col-span-5 md:sticky md:top-24 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎙️</span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">
                      {role === 'vendor' ? 'Vyapari Voice Route Station' : 'Voice Command Center'}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {role === 'vendor' ? 'Bolkar poore route ki delivery note karein' : 'Boliye aur turant hisaab note karein'}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  role === 'vendor' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {role === 'vendor' ? 'Vendor Mode' : `Member: ${activeMember}`}
                </span>
              </div>

              {/* Animated Interactive Mic */}
              <MicButton
                onTranscriptComplete={handleTranscript}
                isProcessing={isProcessing}
              />

              {/* Quick Test Voice Chips */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Tap-to-Test Voice Inputs ({role === 'vendor' ? 'Vendor Presets' : 'Household Presets'}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(role === 'vendor' ? vendorTestPhrases : householdTestPhrases).map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTranscript(p.text)}
                      disabled={isProcessing}
                      className="text-[11px] bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 px-2.5 py-1.5 rounded-xl shadow-2xs active:scale-95 transition-all text-left flex items-center gap-1 font-semibold"
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Helper Hint Card */}
            <div className="hidden md:block bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 rounded-3xl p-4 text-xs text-blue-950 shadow-2xs">
              <h4 className="font-bold flex items-center gap-1.5 mb-1 text-blue-900">
                <span>{role === 'vendor' ? '🛵 Vyapari Voice Tips:' : '🏠 Ghar Ke Hisaab Tips:'}</span>
              </h4>
              {role === 'vendor' ? (
                <ul className="space-y-1 text-[11px] text-blue-800/90 pl-3 list-disc">
                  <li>"Flat 402 dedh litre, Flat 501 do litre, Flat 104 chhutti"</li>
                  <li>Ek hi saans mein 5 flats ka delivery note ho jata hai.</li>
                  <li>Month-end pe sabhi customers ko WhatsApp hisaab ek tap mein bhejein.</li>
                </ul>
              ) : (
                <ul className="space-y-1 text-[11px] text-blue-800/90 pl-3 list-disc">
                  <li><strong>Family Code:</strong> Share <code>{householdCode}</code> with family so everyone logs together.</li>
                  <li><strong>Log:</strong> "Aaj doodh dedh litre liya, 2 can paani aaya"</li>
                  <li><strong>Add Vendor:</strong> "Naya vendor: Mohan Car Wash, ₹500 mahina"</li>
                  <li><strong>Ask:</strong> "Is mahine paani ka total kitna hua?"</li>
                </ul>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: LIVE LOGS OR VENDOR CUSTOMER BOOK ================= */}
          <div className="md:col-span-7 lg:col-span-7 space-y-4">
            
            {/* Top Stats & Date Switcher Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {role === 'vendor' ? 'Customer Route Collections Due' : `${dateLabel} Ka Doorstep Kharch`}
                  </span>
                  <div className="text-2xl font-black text-blue-600 flex items-center gap-0.5 mt-0.5">
                    <IndianRupee className="w-5 h-5 stroke-[2.5]" />
                    <span>
                      {role === 'vendor' 
                        ? customers.reduce((sum, c) => sum + c.pendingBalance, 0).toFixed(0)
                        : totalToday.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {role === 'household' && (
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60 text-xs">
                      <button
                        onClick={() => setDateFilter('today')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          dateLabel === 'Aaj' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        Aaj
                      </button>
                      <button
                        onClick={() => setDateFilter('yesterday')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          dateLabel === 'Kal' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        Kal
                      </button>
                    </div>
                  )}

                  {role === 'household' ? (
                    <button
                      onClick={() => setShowManualModal(true)}
                      className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 shadow-2xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
                      <span>Manual Add</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      {customers.length} Active Flats
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor Route Batch Notice */}
            {vendorBatchNotice && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl shadow-xs animate-slide-up">
                <div className="flex items-start justify-between pb-2 border-b border-emerald-200/60">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🛵</span>
                    <div>
                      <h3 className="text-sm font-extrabold text-emerald-950">Route Deliveries Recorded!</h3>
                      <p className="text-[11px] text-emerald-800">Flat-wise hisaab update ho gaya</p>
                    </div>
                  </div>
                  <button onClick={() => setVendorBatchNotice(null)} className="text-emerald-400 hover:text-emerald-700 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {vendorBatchNotice.map((d, i) => (
                    <div key={i} className="bg-white border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900 shadow-2xs">
                      {d.flatNumber}: {d.action === 'absent' ? 'Chhutti' : `${d.quantity}L`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Query Answer Callout */}
            {queryAnswer && (
              <div className="p-5 bg-purple-50 border border-purple-200 rounded-3xl shadow-xs animate-slide-up">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    <div>
                      <h3 className="text-sm font-bold text-purple-950">{queryAnswer.title}</h3>
                      <p className="text-[11px] text-purple-700 font-medium">Spoken Voice Answer</p>
                    </div>
                  </div>
                  <button onClick={() => setQueryAnswer(null)} className="text-purple-400 hover:text-purple-700 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-purple-900 mt-2.5 leading-relaxed bg-white/70 p-3 rounded-2xl border border-purple-200/60">
                  {queryAnswer.summary}
                </p>
              </div>
            )}

            {/* New Vendor Added Callout */}
            {addedVendorNotice && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl shadow-xs animate-slide-up">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-1 bg-white rounded-2xl shadow-2xs">{addedVendorNotice.icon || '🎉'}</span>
                    <div>
                      <h3 className="text-sm font-extrabold text-emerald-950">Naya Vendor Safalta Se Jud Gaya!</h3>
                      <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                        {addedVendorNotice.displayName} • Rate: ₹{addedVendorNotice.unitRate}/{addedVendorNotice.unit}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setAddedVendorNotice(null)} className="text-emerald-400 hover:text-emerald-700 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* IF VENDOR MODE: CUSTOMER LISTING */}
            {role === 'vendor' ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Customer Delivery Route ({customers.length} Flats)
                  </h3>
                  <span className="text-xs text-blue-600 font-bold">Raju Bhai Milk Route</span>
                </div>

                <div className="space-y-2.5">
                  {customers.map((c) => {
                    const waText = `Namaste ${c.customerName}! Raju Doodhwala yahan. November mahine ka doodh hisaab: Pending ₹${c.pendingBalance}. Please pay via UPI. Dhanyawad!`;
                    const waUrl = `https://wa.me/91${c.phone}?text=${encodeURIComponent(waText)}`;
                    return (
                      <div key={c.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shadow-inner">
                            {c.flatNumber.replace('Flat ', '')}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{c.customerName} ({c.flatNumber})</h4>
                            <p className="text-xs text-slate-500 font-medium">Daily: {c.dailyQuantity} Litres • Phone: {c.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Pending Bill</span>
                            <span className="text-sm font-black text-slate-900">₹{c.pendingBalance}</span>
                          </div>

                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl shadow-xs transition-all active:scale-95"
                            title="Send WhatsApp Bill"
                          >
                            <Send className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* IF HOUSEHOLD MODE: DOORSTEP LOGS FEED */
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {dateLabel} Ke Doorstep Logs ({entries.length})
                  </h3>
                  {entries.length > 0 && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Family Synced
                    </span>
                  )}
                </div>

                {entries.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center my-4">
                    <span className="text-4xl block mb-2">🚪</span>
                    <p className="text-sm font-bold text-slate-800">{dateLabel} abhi tak koi entry nahi hui</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Darwaza band hote hi mic dabayein aur boliye — doodh, paani, laundry ya maid ka hisaab 3 second mein note ho jayega.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {entries.map((entry) => {
                      const meta = entry.metadata ? JSON.parse(entry.metadata) : {};
                      return (
                        <div
                          key={entry.id}
                          className="bg-slate-50/60 border border-slate-200/70 hover:border-blue-200 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner flex-shrink-0"
                              style={{ backgroundColor: `${entry.vendor.color || '#3B82F6'}15` }}
                            >
                              {entry.vendor.icon || '📦'}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">
                                  {entry.vendor.displayName}
                                </h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  entry.action === 'absent'
                                    ? 'bg-red-100 text-red-700'
                                    : entry.action === 'advance'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {entry.action === 'absent' ? 'Chhutti' : entry.action === 'advance' ? 'Advance' : 'Received'}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                                {entry.action === 'absent' ? (
                                  'Chhutti note ho gayi'
                                ) : entry.action === 'advance' ? (
                                  `₹${entry.amountCalculated} cash advance`
                                ) : (
                                  `${entry.quantity} ${entry.unit}`
                                )}
                                {meta.emptyReturned ? ` • ${meta.emptyReturned} khali wapas` : ''}
                                {entry.loggedBy ? ` • by ${entry.loggedBy}` : ''}
                              </p>

                              {meta.items && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {Object.entries(meta.items).map(([k, v]) => `${v} ${k}`).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {entry.amountCalculated > 0 && (
                              <span className="text-base font-black text-slate-900">
                                ₹{entry.amountCalculated.toFixed(0)}
                              </span>
                            )}
                            <button
                              onClick={() => handleUndo(entry.id)}
                              className="text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Manual Add Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Manual Entry Add Karein</h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Vendor Chunein</label>
                <select
                  value={manualVendorId}
                  onChange={(e) => setManualVendorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.icon} {v.displayName} (₹{v.unitRate}/{v.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.25"
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Action</label>
                  <select
                    value={manualAction}
                    onChange={(e) => setManualAction(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="received">Liya / Delivered</option>
                    <option value="absent">Chhutti / Absent</option>
                    <option value="given">Diya (Press)</option>
                    <option value="advance">Cash Advance</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all"
              >
                Hisaab Save Karein ({activeMember})
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5-Second Undo Toast */}
      {lastLoggedEntryId && toastMessage && (
        <UndoToast
          message={toastMessage}
          entryId={lastLoggedEntryId}
          onUndo={handleUndo}
          durationSeconds={6}
        />
      )}

      {/* Initial Category & Role Onboarding Wizard */}
      <RoleOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        currentRole={role}
        currentMember={activeMember}
        currentHouseholdCode={householdCode}
        onComplete={(newRole, newMember, newCode) => {
          setRole(newRole);
          setActiveMember(newMember);
          setHouseholdCode(newCode);
        }}
      />
    </div>
  );
}
