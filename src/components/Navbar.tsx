'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Mic, 
  FileText, 
  Send, 
  Settings, 
  Users, 
  Share2, 
  Check, 
  Store, 
  Home, 
  UserCheck 
} from 'lucide-react';
import { playSuccessChime } from '@/lib/chime';

export default function Navbar() {
  const pathname = usePathname();
  const [role, setRole] = useState<'household' | 'vendor'>('household');
  const [householdCode, setHouseholdCode] = useState('SHARMA-402');
  const [activeMember, setActiveMember] = useState('Kaushal');
  const [copied, setCopied] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.user) {
        setRole(data.user.role || 'household');
        setHouseholdCode(data.user.householdCode || 'SHARMA-402');
        setActiveMember(data.user.activeMemberName || 'Kaushal');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleToggle = async (newRole: 'household' | 'vendor') => {
    setRole(newRole);
    playSuccessChime();
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      // Trigger a page reload or event so dashboard adapts
      window.dispatchEvent(new CustomEvent('rozhisaab-role-changed', { detail: newRole }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMemberChange = async (member: string) => {
    setActiveMember(member);
    setShowMemberModal(false);
    playSuccessChime();
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeMemberName: member })
      });
      window.dispatchEvent(new CustomEvent('rozhisaab-member-changed', { detail: member }));
    } catch (e) {
      console.error(e);
    }
  };

  const copyHouseholdInvite = () => {
    const text = `Namaste! Join our RozHisaab Family Doorstep Ledger using Household Code: *${householdCode}*. Track daily milk, water & presswala together! https://github.com/kaushalnandaniya/RozHisaab`;
    navigator.clipboard.writeText(text);
    playSuccessChime();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const navItems = [
    { label: 'Aaj Ka Log', href: '/', icon: Mic, desktopLabel: role === 'vendor' ? 'Vyapari Console' : 'Voice Dashboard' },
    { label: 'Hisaab Tally', href: '/ledger', icon: FileText, desktopLabel: role === 'vendor' ? 'Customer Book' : 'Monthly Ledger' },
    { label: 'Settle / WhatsApp', href: '/settle', icon: Send, desktopLabel: role === 'vendor' ? 'Send Bills' : 'WhatsApp Settle' },
    { label: 'Settings', href: '/vendors', icon: Settings, desktopLabel: 'Vendors & Rates' },
  ];

  const familyMembers = ['Kaushal', 'Mummy', 'Papa', 'Sister', 'Grandpa'];

  return (
    <>
      {/* =========================================================================
          DESKTOP TOP NAVIGATION BAR (Visible on md: and larger screens)
          ========================================================================= */}
      <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Branding */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
              <span className="text-xl">🎙️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">RozHisaab</span>
                <span className="text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                  Voice-First Bharat
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Doorstep Daily Household Ledger</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.desktopLabel}</span>
                </Link>
              );
            })}
          </nav>

          {/* Role Switcher & Family Sync Badge */}
          <div className="flex items-center gap-3">
            {/* Role Toggle Button */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => handleRoleToggle('household')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  role === 'household'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ghar (Household)</span>
              </button>

              <button
                onClick={() => handleRoleToggle('vendor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  role === 'vendor'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vyapari (Vendor)</span>
              </button>
            </div>

            {/* Household Code / Family Sync Pill */}
            {role === 'household' ? (
              <div className="flex items-center gap-2 bg-blue-50/70 border border-blue-200/80 px-3 py-1.5 rounded-2xl text-xs">
                <button
                  onClick={() => setShowMemberModal(true)}
                  className="font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{activeMember}</span>
                  <span className="text-[10px] text-blue-400">▾</span>
                </button>

                <span className="text-slate-300">|</span>

                <button
                  onClick={copyHouseholdInvite}
                  className="font-semibold text-blue-700 flex items-center gap-1 hover:text-blue-950"
                  title="Copy Family Household Sync Code"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px] font-bold">{householdCode}</span>
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-blue-400" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl text-xs font-bold text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Raju Doodhwala (Vendor)</span>
              </div>
            )}
            {/* Change / Reconfigure Category Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('rozhisaab-open-onboarding'))}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              title="Change Category / Setup Wizard"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE TOP ROLE & FAMILY HEADER (Visible on < md screens)
          ========================================================================= */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs">
        {/* Mobile Role Switch & Setup */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
            <button
              onClick={() => handleRoleToggle('household')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                role === 'household' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              🏠 Ghar
            </button>
            <button
              onClick={() => handleRoleToggle('vendor')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                role === 'vendor' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              🛵 Vyapari
            </button>
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('rozhisaab-open-onboarding'))}
            className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 p-1 rounded-lg hover:text-slate-800"
            title="Setup / Change Category"
          >
            ⚙️
          </button>
        </div>

        {/* Mobile Member / Code Tag */}
        {role === 'household' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMemberModal(true)}
              className="text-[11px] font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg"
            >
              👤 {activeMember} ▾
            </button>
            <button
              onClick={copyHouseholdInvite}
              className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg flex items-center gap-1"
            >
              <span>{householdCode}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-blue-400" />}
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          MOBILE STICKY BOTTOM NAVIGATION BAR (Visible only on mobile < md screens)
          ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Family Member Switcher Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Aap Kaun Hain? (Active Member)</h3>
            <p className="text-xs text-slate-400 mb-3">Har entry ke saath aapka naam record hoga</p>

            <div className="space-y-1.5">
              {familyMembers.map((m) => (
                <button
                  key={m}
                  onClick={() => handleMemberChange(m)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all ${
                    activeMember === m
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span>{m}</span>
                  {activeMember === m && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowMemberModal(false)}
              className="w-full mt-3 text-xs font-semibold text-slate-500 hover:text-slate-800 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
