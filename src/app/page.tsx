'use client';

import React, { useState, useEffect } from 'react';
import MicButton from '@/components/MicButton';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import UndoToast from '@/components/UndoToast';
import Navbar from '@/components/Navbar';
import { speakHindi } from '@/lib/tts';
import { 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  IndianRupee,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastLoggedEntryId, setLastLoggedEntryId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [totalToday, setTotalToday] = useState(0);
  const [todayDisplay, setTodayDisplay] = useState('');

  // Load today's entries on mount
  useEffect(() => {
    setTodayDisplay(new Date().toLocaleDateString('hi-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }));
    fetchTodayEntries();
  }, []);

  const fetchTodayEntries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/entries?date=${today}`);
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

  const handleTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;
    setIsProcessing(true);

    try {
      // Step 1: Parse natural spoken sentence
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      const parseData = await parseRes.json();

      if (!parseData.items || parseData.items.length === 0) {
        speakHindi('Aapki aawaaz samajh nahi aayi, kripya dohraiye');
        setIsProcessing(false);
        return;
      }

      // Step 2: Save each extracted vendor entry
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
            rawTranscript: transcript
          })
        });
        const createData = await createRes.json();
        if (createData.entry) {
          lastId = createData.entry.id;
        }
      }

      // Step 3: Audio read-back & visual celebration
      speakHindi(parseData.spokenResponseHindi);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 } });

      if (lastId) {
        setLastLoggedEntryId(lastId);
        setToastMessage(parseData.spokenResponseHindi);
      }

      await fetchTodayEntries();
    } catch (err) {
      console.error('Error processing voice entry:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = async (id: string) => {
    try {
      await fetch(`/api/entries?id=${id}`, { method: 'DELETE' });
      setLastLoggedEntryId(null);
      setToastMessage(null);
      speakHindi('Entry wapas le li gayi');
      await fetchTodayEntries();
    } catch (err) {
      console.error('Failed to undo:', err);
    }
  };

  const testPhrases = [
    'Aaj doodh dedh litre liya aur 2 water can aaye',
    'Presswale ko 4 shirt aur 2 pant diye',
    'Sunita didi aaj chhutti pe hain',
    '1 khali jar wapas diya aur 1 can liya'
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-28 max-w-lg mx-auto shadow-2xl relative border-x border-slate-200">
      {/* Zero-Config Safety Banner */}
      <KeyNoticeBanner />

      {/* Top Header */}
      <header className="px-5 pt-5 pb-3 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎙️</span>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                RozHisaab <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Voice-First</span>
              </h1>
              <p className="text-xs text-slate-500 capitalize flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {todayDisplay}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-medium block">Aaj ka kharch</span>
            <span className="text-base font-extrabold text-blue-600 flex items-center justify-end">
              <IndianRupee className="w-3.5 h-3.5" />
              {totalToday.toFixed(0)}
            </span>
          </div>
        </div>
      </header>

      {/* Voice Mic Core Interaction */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/60 pb-2">
        <MicButton
          onTranscriptComplete={handleTranscript}
          isProcessing={isProcessing}
        />

        {/* Quick Demo Voice Shortcuts for Judges/Testing */}
        <div className="px-4 pb-4">
          <p className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Quick Test Utterances (Tap to Simulate Voice):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {testPhrases.map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => handleTranscript(phrase)}
                disabled={isProcessing}
                className="text-[11px] bg-white border border-slate-200 hover:border-blue-400 text-slate-700 px-2.5 py-1.5 rounded-xl shadow-sm active:scale-95 transition-all text-left truncate max-w-full"
              >
                "{phrase}"
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Logged Activity Feed */}
      <section className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Aaj Ke Doorstep Logs ({entries.length})
          </h2>
          {entries.length > 0 && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Auto-saved
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center my-4">
            <span className="text-4xl block mb-2">🚪</span>
            <p className="text-sm font-semibold text-slate-700">Aaj abhi tak koi entry nahi hui</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Darwaza band karte hi mic dabayein aur boliye — doodh, paani, laundry ya maid ka hisaab 3 second mein note ho jayega.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {entries.map((entry) => {
              const meta = entry.metadata ? JSON.parse(entry.metadata) : {};
              return (
                <div
                  key={entry.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-inner"
                      style={{ backgroundColor: `${entry.vendor.color || '#3B82F6'}15` }}
                    >
                      {entry.vendor.icon || '📦'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {entry.vendor.displayName}
                        </h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          entry.action === 'absent'
                            ? 'bg-red-100 text-red-700'
                            : entry.action === 'advance'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {entry.action === 'absent' ? 'Chhutti' : entry.action === 'advance' ? 'Advance' : 'Received'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium mt-0.5">
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
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{entry.amountCalculated.toFixed(0)}
                      </span>
                    )}
                    <button
                      onClick={() => handleUndo(entry.id)}
                      className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
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

      {/* 5-Second Undo Toast */}
      {lastLoggedEntryId && toastMessage && (
        <UndoToast
          message={toastMessage}
          entryId={lastLoggedEntryId}
          onUndo={handleUndo}
          durationSeconds={6}
        />
      )}

      {/* Bottom Sticky Navigation */}
      <Navbar />
    </main>
  );
}
