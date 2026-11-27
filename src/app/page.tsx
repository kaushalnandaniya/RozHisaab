'use client';

import React, { useState, useEffect } from 'react';
import MicButton from '@/components/MicButton';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import UndoToast from '@/components/UndoToast';
import Navbar from '@/components/Navbar';
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
  ShieldCheck
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

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
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

  // Manual Add Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualVendorId, setManualVendorId] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualAction, setManualAction] = useState('received');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchEntries(today);
    fetchVendors();
  }, []);

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

    try {
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      const parseData = await parseRes.json();

      // Case 1: ADD VENDOR INTENT
      if (parseData.intent === 'add_vendor') {
        playSuccessChime();
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
        speakHindi(parseData.spokenResponseHindi);
        setAddedVendorNotice(parseData.savedVendor || parseData.newVendor);
        await fetchVendors();
        setIsProcessing(false);
        return;
      }

      // Case 2: QUERY HISAAB INTENT
      if (parseData.intent === 'query_hisaab') {
        speakHindi(parseData.spokenResponseHindi);
        if (parseData.queryAnswer) {
          setQueryAnswer(parseData.queryAnswer);
        }
        setIsProcessing(false);
        return;
      }

      // Case 3: LOG ENTRY INTENT (Default)
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
            entryDate: selectedDate
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

  const testPhrases = [
    { label: '🥛+💧 Milk & Water', text: 'Aaj doodh dedh litre liya aur 2 water can aaye' },
    { label: '👔 Presswala (6 clothes)', text: 'Presswale ko 4 shirt aur 2 pant diye' },
    { label: '🧹 Didi Absent', text: 'Sunita didi aaj chhutti pe hain' },
    { label: '➕ Add Vendor', text: 'Naya vendor add karo: Ramu Car Wash, rate 500 rupaye mahina, phone 9876543210' },
    { label: '❓ Ask Balance', text: 'Is mahine paani ka total kitna hua?' }
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-24 md:pb-12">
      {/* Universal Responsive Navbar (Top on Desktop, Bottom on Mobile) */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Zero-Config Safety Banner */}
        <div className="mb-4 rounded-2xl overflow-hidden border border-emerald-200/80 shadow-2xs">
          <KeyNoticeBanner />
        </div>

        {/* =========================================================================
            RESPONSIVE ADAPTIVE GRID
            - Mobile (< md): Single column stacked layout
            - Desktop (>= md): 2-Column Split (Left: Voice Station, Right: Live Activity & Stats)
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN: VOICE COMMAND CENTER ================= */}
          <div className="md:col-span-5 lg:col-span-5 md:sticky md:top-24 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎙️</span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">Voice Command Center</h2>
                    <p className="text-[11px] text-slate-400 font-medium">Boliye aur turant hisaab note karein</p>
                  </div>
                </div>

                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Ready
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
                  Quick Tap-to-Test Voice Utterances:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {testPhrases.map((p, idx) => (
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

            {/* Desktop Helpful Hint Card */}
            <div className="hidden md:block bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 rounded-3xl p-4 text-xs text-blue-950 shadow-2xs">
              <h4 className="font-bold flex items-center gap-1.5 mb-1 text-blue-900">
                <span>💡 3 Ways to Speak to RozHisaab:</span>
              </h4>
              <ul className="space-y-1 text-[11px] text-blue-800/90 pl-3 list-disc">
                <li><strong>Log:</strong> "Aaj doodh dedh litre liya, 2 can paani aaya"</li>
                <li><strong>Add Vendor:</strong> "Naya vendor: Mohan Car Wash, ₹500 mahina"</li>
                <li><strong>Ask Doubt:</strong> "Is mahine paani ka total kitna hua?"</li>
              </ul>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: LIVE LOGS, STATS & FEED ================= */}
          <div className="md:col-span-7 lg:col-span-7 space-y-4">
            
            {/* Top Stats & Date Switcher Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {dateLabel} Ka Doorstep Kharch
                  </span>
                  <div className="text-2xl font-black text-blue-600 flex items-center gap-0.5 mt-0.5">
                    <IndianRupee className="w-5 h-5 stroke-[2.5]" />
                    <span>{totalToday.toFixed(0)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60 text-xs">
                    <button
                      onClick={() => setDateFilter('today')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        dateLabel === 'Aaj'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Aaj (Today)
                    </button>
                    <button
                      onClick={() => setDateFilter('yesterday')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        dateLabel === 'Kal'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Kal (Yesterday)
                    </button>
                  </div>

                  <button
                    onClick={() => setShowManualModal(true)}
                    className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
                    <span className="hidden sm:inline">Manual Entry</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Query Answer Callout (If user asked a voice question) */}
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
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/ledger"
                    className="text-xs font-bold text-purple-700 bg-white border border-purple-200 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs hover:bg-purple-100"
                  >
                    <span>View Full Ledger</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/settle"
                    className="text-xs font-bold text-white bg-purple-600 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs hover:bg-purple-700"
                  >
                    <span>Settle on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* New Vendor Added Callout */}
            {addedVendorNotice && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl shadow-xs animate-slide-up">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-1 bg-white rounded-2xl shadow-2xs">{addedVendorNotice.icon || '🎉'}</span>
                    <div>
                      <h3 className="text-sm font-extrabold text-emerald-950">
                        Naya Vendor Safalta Se Jud Gaya!
                      </h3>
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

            {/* Doorstep Logs Activity Feed */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {dateLabel} Ke Doorstep Logs ({entries.length})
                </h3>
                {entries.length > 0 && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Auto-saved
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
                Hisaab Save Karein
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
    </div>
  );
}
