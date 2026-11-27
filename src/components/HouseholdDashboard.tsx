'use client';

import React, { useState } from 'react';
import MicButton from '@/components/MicButton';
import { 
  Sparkles, 
  Trash2, 
  Clock, 
  IndianRupee, 
  Calendar, 
  PlusCircle, 
  Users, 
  Share2, 
  Check, 
  Droplets, 
  Milk, 
  Shirt, 
  Sparkle,
  UtensilsCrossed,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { playSuccessChime } from '@/lib/chime';
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
  jarDepositBalance?: number;
}

interface HouseholdDashboardProps {
  activeMember: string;
  householdCode: string;
  entries: Entry[];
  vendors: Vendor[];
  totalToday: number;
  selectedDate: string;
  dateLabel: string;
  isProcessing: boolean;
  queryAnswer: { title: string; summary: string } | null;
  addedVendorNotice: any | null;
  onTranscript: (text: string) => void;
  onDateFilter: (type: 'today' | 'yesterday') => void;
  onDeleteEntry: (id: string) => void;
  onOpenManualModal: () => void;
  onOpenOnboarding: () => void;
}

export default function HouseholdDashboard({
  activeMember,
  householdCode,
  entries,
  vendors,
  totalToday,
  selectedDate,
  dateLabel,
  isProcessing,
  queryAnswer,
  addedVendorNotice,
  onTranscript,
  onDateFilter,
  onDeleteEntry,
  onOpenManualModal,
  onOpenOnboarding,
}: HouseholdDashboardProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(
      `Namaste! Join our RozHisaab Family Doorstep Ledger using Household Code: *${householdCode}*. Track daily milk, water & presswala together! https://github.com/kaushalnandaniya/RozHisaab`
    );
    playSuccessChime();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const householdTestPhrases = [
    { label: '🥛+💧 Milk & Water', text: 'Aaj doodh dedh litre liya aur 2 water can aaye' },
    { label: '👔 Press (6 clothes)', text: 'Presswale ko 4 shirt aur 2 pant diye' },
    { label: '🧹 Didi Leave', text: 'Sunita didi aaj chhutti pe hain' },
    { label: '➕ Add Vendor', text: 'Naya vendor add karo: Ramu Car Wash, rate 500 rupaye mahina, phone 9876543210' },
    { label: '❓ Ask Balance', text: 'Is mahine paani ka total kitna hua?' }
  ];

  // Water vendor empty jar balance
  const waterVendor = vendors.find(v => v.category === 'water');
  const emptyJars = waterVendor?.jarDepositBalance ?? 2;

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Family Sync Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-blue-500/15 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏠</span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Ghar Ka Doorstep Hisaab</h1>
              <span className="text-[10px] bg-white/20 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Family Mode
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              Swagat hai, <strong>{activeMember}</strong> ji! Doodh, paani, presswala aur didi ka hisaab bolkar note karein.
            </p>
          </div>

          {/* Family Sync Pill */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 px-3 self-start sm:self-auto">
            <div>
              <span className="text-[10px] text-blue-200 block font-semibold">Household Sync Code:</span>
              <span className="text-xs font-mono font-black tracking-wider">{householdCode}</span>
            </div>
            <button
              onClick={copyCode}
              className="bg-white text-blue-700 hover:bg-blue-50 active:scale-95 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs transition-all ml-1"
              title="Gharwalon ko WhatsApp invite bhejein"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied!' : 'Invite Family'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Responsive 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: HOUSEHOLD VOICE CENTER ================= */}
        <div className="md:col-span-5 space-y-4 md:sticky md:top-24">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎙️</span>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">Family Voice Station</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Boliye aur turant hisaab note karein</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                👤 {activeMember}
              </span>
            </div>

            {/* Mic Button */}
            <MicButton
              onTranscriptComplete={onTranscript}
              isProcessing={isProcessing}
            />

            {/* Tap-to-Test Voice Inputs */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Tap-to-Test Spoken Hindi Phrases:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {householdTestPhrases.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => onTranscript(p.text)}
                    disabled={isProcessing}
                    className="text-[11px] bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 px-2.5 py-1.5 rounded-xl shadow-2xs active:scale-95 transition-all text-left flex items-center gap-1 font-semibold"
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Spoken Q&A Answer Card */}
          {queryAnswer && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-xs animate-fade-in">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xs mb-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{queryAnswer.title}</span>
              </div>
              <p className="text-xs text-amber-950 font-medium">{queryAnswer.summary}</p>
            </div>
          )}

          {/* Spoken New Vendor Card */}
          {addedVendorNotice && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 shadow-xs animate-fade-in">
              <span className="text-xs font-black text-emerald-900 block mb-1">🎉 Naya Vendor Add Ho Gaya!</span>
              <p className="text-xs text-emerald-800">
                <strong>{addedVendorNotice.displayName}</strong> • Rate: ₹{addedVendorNotice.unitRate}/{addedVendorNotice.unit}
              </p>
            </div>
          )}

          {/* Household Helpful Tips */}
          <div className="hidden md:block bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200/70 rounded-3xl p-4 text-xs text-blue-950 shadow-2xs">
            <h4 className="font-bold flex items-center gap-1.5 mb-1.5 text-blue-900">
              <span>💡 Ghar Ke Hisaab Tips:</span>
            </h4>
            <ul className="space-y-1 text-[11px] text-blue-800/90 pl-3 list-disc">
              <li><strong>Multi-item:</strong> "Aaj doodh dedh litre liya aur 2 water can aaye"</li>
              <li><strong>Empty Jar Deposit:</strong> "2 water can aaye aur 1 khali jar wapas diya"</li>
              <li><strong>Presswala:</strong> "Presswale ko 4 shirt aur 2 pant diye"</li>
              <li><strong>Maid Attendance:</strong> "Sunita didi aaj chhutti pe hain"</li>
            </ul>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: HOUSEHOLD SPEND & LOG FEED ================= */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Top Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Today's Spend */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                {dateLabel} Ka Doorstep Kharch
              </span>
              <div className="text-2xl font-black text-blue-600 flex items-center gap-0.5 mt-1">
                <IndianRupee className="w-5 h-5 stroke-[2.5]" />
                <span>{totalToday.toFixed(0)}</span>
              </div>
            </div>

            {/* Empty Water Jars at Home */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Ghar Pe Khali Water Jar
              </span>
              <div className="text-2xl font-black text-cyan-600 flex items-center gap-1 mt-1">
                <Droplets className="w-5 h-5" />
                <span>{emptyJars} Jars</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Deposit secure</span>
            </div>

            {/* Month-End Settlement Shortcut */}
            <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/70 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">
                  Month-End Bill
                </span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5">Settle via WhatsApp & UPI</span>
              </div>
              <Link
                href="/settle"
                className="mt-2 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
              >
                <span>Hisaab Bhejein</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Date Switcher & Manual Add Action */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => onDateFilter('today')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                  dateLabel === 'Aaj' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aaj ({new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
              </button>
              <button
                onClick={() => onDateFilter('yesterday')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                  dateLabel === 'Kal' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kal
              </button>
            </div>

            <button
              onClick={onOpenManualModal}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Manual Add</span>
            </button>
          </div>

          {/* Entries Feed */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{dateLabel} Ka Doorstep Log</span>
                <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded-full text-slate-600">
                  {entries.length} items
                </span>
              </h3>
              <span className="text-xs font-bold text-blue-600">
                Total: ₹{totalToday.toFixed(0)}
              </span>
            </div>

            {entries.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <span className="text-3xl block mb-2">🥛💧👔</span>
                <p className="text-xs font-bold text-slate-600">Aaj ka koi hisaab log nahi hua hai</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mic dabakar boliye: <em>"Aaj doodh dedh litre liya aur 2 water can aaye"</em>
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 bg-white rounded-xl shadow-2xs">
                        {entry.vendor.icon || '📦'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">
                            {entry.vendor.displayName}
                          </span>
                          {entry.loggedBy && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800">
                              Logged by {entry.loggedBy}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                          <span className="font-bold text-slate-700">
                            {entry.quantity} {entry.unit}
                          </span>
                          <span>•</span>
                          <span className="capitalize text-slate-500">{entry.action}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-900 flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {entry.amountCalculated.toFixed(0)}
                      </span>
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
