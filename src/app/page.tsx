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
  ChevronRight
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
  
  // Date selection (default today)
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
    { label: '👔 Presswala', text: 'Presswale ko 4 shirt aur 2 pant diye' },
    { label: '🧹 Didi Leave', text: 'Sunita didi aaj chhutti pe hain' },
    { label: '➕ Add Vendor', text: 'Naya vendor add karo: Ramu Car Wash, rate 500 rupaye mahina, phone 9876543210' },
    { label: '❓ Ask Doubt', text: 'Is mahine paani ka total kitna hua?' }
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-28 max-w-lg mx-auto shadow-2xl relative border-x border-slate-200">
      <KeyNoticeBanner />

      {/* Top Header */}
      <header className="px-5 pt-4 pb-3 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl p-1 bg-blue-50 rounded-xl shadow-2xs">🎙️</span>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                RozHisaab 
                <span className="text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                  Voice-First
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Hands-Free Daily Doorstep Ledger
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">{dateLabel} Ka Total</span>
            <span className="text-lg font-black text-blue-600 flex items-center justify-end">
              <IndianRupee className="w-4 h-4" />
              {totalToday.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Date Quick Switcher Bar */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                dateLabel === 'Aaj'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Aaj (Today)
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                dateLabel === 'Kal'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kal (Yesterday)
            </button>
          </div>

          <button
            onClick={() => setShowManualModal(true)}
            className="text-[11px] font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>Manual Entry</span>
          </button>
        </div>
      </header>

      {/* Voice Core Mic Section */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/60 pb-3">
        <MicButton
          onTranscriptComplete={handleTranscript}
          isProcessing={isProcessing}
        />

        {/* Quick Demo Voice Shortcuts for Testing */}
        <div className="px-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Quick Test Utterances (Tap to Test Voice Intents):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {testPhrases.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleTranscript(p.text)}
                disabled={isProcessing}
                className="text-[11px] bg-white border border-slate-200 hover:border-blue-500 text-slate-700 px-2.5 py-1.5 rounded-xl shadow-2xs active:scale-95 transition-all text-left flex items-center gap-1"
              >
                <span className="font-semibold text-slate-900">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Query Answer Callout (If user asked a question) */}
      {queryAnswer && (
        <section className="mx-4 mt-4 p-4 bg-purple-50 border border-purple-200 rounded-3xl shadow-xs animate-slide-up">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              <h3 className="text-sm font-bold text-purple-950">{queryAnswer.title}</h3>
            </div>
            <button
              onClick={() => setQueryAnswer(null)}
              className="text-purple-400 hover:text-purple-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs font-semibold text-purple-900 mt-2 leading-relaxed">
            {queryAnswer.summary}
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/ledger"
              className="text-[11px] font-bold text-purple-700 bg-white border border-purple-200 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs hover:bg-purple-100"
            >
              <span>Ledger View</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
            <Link
              href="/settle"
              className="text-[11px] font-bold text-white bg-purple-600 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs hover:bg-purple-700"
            >
              <span>Settle on WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </section>
      )}

      {/* New Vendor Added Callout */}
      {addedVendorNotice && (
        <section className="mx-4 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-3xl shadow-xs animate-slide-up">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{addedVendorNotice.icon || '🎉'}</span>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Naya Vendor Safalta Se Jud Gaya!
                </h3>
                <p className="text-xs text-emerald-800 font-medium">
                  {addedVendorNotice.displayName} • ₹{addedVendorNotice.unitRate}/{addedVendorNotice.unit}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAddedVendorNotice(null)}
              className="text-emerald-400 hover:text-emerald-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* Doorstep Logs Feed */}
      <section className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {dateLabel} Ke Doorstep Logs ({entries.length})
          </h2>
          {entries.length > 0 && (
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified & Saved
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center my-3 shadow-2xs">
            <span className="text-4xl block mb-2">🚪</span>
            <p className="text-sm font-bold text-slate-800">{dateLabel} abhi tak koi entry nahi hui</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Darwaza band hote hi mic dabayein aur boliye — doodh, paani, laundry ya kaamwali didi ka hisaab 3 second mein note ho jayega.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {entries.map((entry) => {
              const meta = entry.metadata ? JSON.parse(entry.metadata) : {};
              return (
                <div
                  key={entry.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-inner flex-shrink-0"
                      style={{ backgroundColor: `${entry.vendor.color || '#3B82F6'}15` }}
                    >
                      {entry.vendor.icon || '📦'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {entry.vendor.displayName}
                        </h3>
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

                  <div className="flex items-center gap-2">
                    {entry.amountCalculated > 0 && (
                      <span className="text-sm font-black text-slate-900">
                        ₹{entry.amountCalculated.toFixed(0)}
                      </span>
                    )}
                    <button
                      onClick={() => handleUndo(entry.id)}
                      className="text-slate-300 hover:text-red-500 p-1.5 rounded-xl hover:bg-red-50 transition-colors"
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
      </section>

      {/* Manual Add Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200">
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

      <Navbar />
    </main>
  );
}
