'use client';

import React, { useState, useEffect } from 'react';
import { Home, Store, Users, Check, Sparkles, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '@/lib/chime';
import { speakHindi } from '@/lib/tts';

interface RoleOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: 'household' | 'vendor';
  currentMember: string;
  currentHouseholdCode: string;
  onComplete: (role: 'household' | 'vendor', member: string, code: string) => void;
}

export default function RoleOnboardingModal({
  isOpen,
  onClose,
  currentRole,
  currentMember,
  currentHouseholdCode,
  onComplete,
}: RoleOnboardingModalProps) {
  const [selectedRole, setSelectedRole] = useState<'household' | 'vendor'>(currentRole || 'household');
  const [member, setMember] = useState(currentMember || 'Kaushal');
  const [householdCode, setHouseholdCode] = useState(currentHouseholdCode || 'SHARMA-402');
  const [vendorName, setVendorName] = useState('Raju Doodhwala');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedRole(currentRole);
    setMember(currentMember);
    setHouseholdCode(currentHouseholdCode);
  }, [currentRole, currentMember, currentHouseholdCode]);

  if (!isOpen) return null;

  const familyMembers = ['Kaushal', 'Mummy', 'Papa', 'Sister', 'Brother', 'Grandpa'];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const activeName = selectedRole === 'household' ? member : vendorName;
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          activeMemberName: activeName,
          householdCode: householdCode
        })
      });

      // Mark onboarding as completed in localStorage
      localStorage.setItem('rozhisaab_onboarded', 'true');

      playSuccessChime();
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      speakHindi(
        selectedRole === 'household' 
          ? `Swagat hai ${member} ji! Ghar ka hisaab shuru karein.` 
          : `Swagat hai ${vendorName}! Vyapari console tayyar hai.`
      );

      onComplete(selectedRole, activeName, householdCode);
      onClose();
    } catch (e) {
      console.error('Failed to save profile during onboarding:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 sm:p-7 relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl p-2 bg-white/10 rounded-2xl backdrop-blur-xs">🎙️</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">RozHisaab (रोज़ हिसाब)</h2>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Voice-First
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 font-medium">
                Aap is app ko kis category ke roop mein istemaal karna chahte hain?
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Category Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* OPTION 1: Household / Family Member */}
            <div
              onClick={() => setSelectedRole('household')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                selectedRole === 'household'
                  ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl shadow-2xs">
                  🏠
                </div>
                {selectedRole === 'household' && (
                  <span className="bg-blue-600 text-white p-1 rounded-full">
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </div>

              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                Ghar Ka Sadasya (Household)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Daily milk (doodh), 20L water cans, presswala, maid & chhutti ka hisaab bolkar note karein.
              </p>

              <div className="text-[11px] text-blue-700 font-bold bg-blue-100/70 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Family Shared Sync Support</span>
              </div>
            </div>

            {/* OPTION 2: Local Vendor / Vyapari */}
            <div
              onClick={() => setSelectedRole('vendor')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                selectedRole === 'vendor'
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shadow-2xs">
                  🛵
                </div>
                {selectedRole === 'vendor' && (
                  <span className="bg-emerald-600 text-white p-1 rounded-full">
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </div>

              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                Local Vyapari (Vendor)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Doodhwala, Water Supplier, Presswala — Apartment route deliveries ek saans mein bolkar note karein.
              </p>

              <div className="text-[11px] text-emerald-700 font-bold bg-emerald-100/70 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Route Voice Delivery Batch</span>
              </div>
            </div>

          </div>

          {/* Sub-Configurations Based on Chosen Role */}
          {selectedRole === 'household' ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Aapka Naam Kya Hai? (Active Family Member)
                </label>
                <div className="flex flex-wrap gap-2">
                  {familyMembers.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMember(m)}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                        member === m
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Other name..."
                    value={familyMembers.includes(member) ? '' : member}
                    onChange={(e) => setMember(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium w-32"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Household Sync Code (Family Share)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Gharwalon ke saath share karein</span>
                </div>
                <input
                  type="text"
                  value={householdCode}
                  onChange={(e) => setHouseholdCode(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-bold tracking-wider px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. SHARMA-402"
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Aapka Vyapar / Dukan Ka Naam
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Raju Doodhwala, Ganga Water Supply"
              />
              <p className="text-[11px] text-slate-500">
                Aapke customers ke WhatsApp hisaab par yahi naam jayega.
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
                selectedRole === 'vendor'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
              }`}
            >
              <span>{isSubmitting ? 'Tayyar ho raha hai...' : 'Shuru Karein (Get Started)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
