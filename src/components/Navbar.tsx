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
  UserCheck,
  Building2,
  SlidersHorizontal
} from 'lucide-react';
import { playSuccessChime } from '@/lib/chime';

export default function Navbar() {
  const pathname = usePathname();
  const [role, setRole] = useState<'household' | 'vendor'>('household');
  const [householdCode, setHouseholdCode] = useState('SHARMA-402');
  const [activeMember, setActiveMember] = useState('Kaushal');
  const [vendorBusinessName, setVendorBusinessName] = useState('Raju Doodh Dairy');
  const [vendorRouteName, setVendorRouteName] = useState('Gokuldham Heights - Tower A');
  const [copied, setCopied] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('rozhisaab_role') as 'household' | 'vendor' | null;
      if (cached) setRole(cached);
    }
    fetchProfile();

    const handleRoleChange = (e: any) => {
      setRole(e.detail);
      if (typeof window !== 'undefined') {
        localStorage.setItem('rozhisaab_role', e.detail);
      }
    };
    const handleMemberChange = (e: any) => {
      setActiveMember(e.detail);
    };

    window.addEventListener('rozhisaab-role-changed', handleRoleChange);
    window.addEventListener('rozhisaab-member-changed', handleMemberChange);

    return () => {
      window.removeEventListener('rozhisaab-role-changed', handleRoleChange);
      window.removeEventListener('rozhisaab-member-changed', handleMemberChange);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.user) {
        setRole(data.user.role || 'household');
        setHouseholdCode(data.user.householdCode || 'SHARMA-402');
        setActiveMember(data.user.activeMemberName || 'Kaushal');
        setVendorBusinessName(data.user.vendorBusinessName || 'Raju Doodh Dairy');
        setVendorRouteName(data.user.vendorRouteName || 'Gokuldham Heights - Tower A');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleToggle = async (newRole: 'household' | 'vendor') => {
    setRole(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rozhisaab_role', newRole);
    }
    playSuccessChime();
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
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

  // Highly differentiated navigation items
  const householdNavItems = [
    { label: 'Aaj Ka Log', href: '/', icon: Mic, desktopLabel: 'Doorstep Voice Log' },
    { label: 'Mahine Ka Ledger', href: '/ledger', icon: FileText, desktopLabel: 'Monthly Ledger' },
    { label: 'Settle Bills', href: '/settle', icon: Send, desktopLabel: 'Settle via WhatsApp & UPI' },
    { label: 'Mere Vendors', href: '/vendors', icon: Settings, desktopLabel: 'Vendors & Rates' },
  ];

  const vendorNavItems = [
    { label: 'Route Run', href: '/', icon: Mic, desktopLabel: 'Route Voice Run' },
    { label: 'Grahak Khata', href: '/ledger', icon: FileText, desktopLabel: 'Apartment Customer Book' },
    { label: 'Vasooli & Bills', href: '/settle', icon: Send, desktopLabel: 'Vasooli & Invoices' },
    { label: 'Rate Card', href: '/vendors', icon: Settings, desktopLabel: 'Rate Card & Route' },
  ];

  const navItems = role === 'vendor' ? vendorNavItems : householdNavItems;
  const familyMembers = ['Kaushal', 'Mummy', 'Papa', 'Sister', 'Grandpa'];

  return (
    <>
      {/* =========================================================================
          DESKTOP TOP NAVIGATION BAR
          ========================================================================= */}
      <header className={`hidden md:block sticky top-0 z-40 transition-colors shadow-xs ${
        role === 'vendor'
          ? 'bg-slate-900 border-b border-slate-800 text-white'
          : 'bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Category Branding */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md transition-all group-hover:scale-105 ${
              role === 'vendor'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/20'
                : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-blue-500/20'
            }`}>
              <span className="text-xl">{role === 'vendor' ? '🛵' : '🎙️'}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight">RozHisaab</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs ${
                  role === 'vendor'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-blue-600 text-white'
                }`}>
                  {role === 'vendor' ? '🛵 Vyapari Console' : '🏠 Ghar Ka Hisaab'}
                </span>
              </div>
              <p className={`text-[11px] font-medium ${role === 'vendor' ? 'text-slate-400' : 'text-slate-400'}`}>
                {role === 'vendor' ? `${vendorBusinessName} • ${vendorRouteName}` : 'Doorstep Daily Household Ledger'}
              </p>
            </div>
          </Link>

          {/* Differentiated Nav Links */}
          <nav className={`flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-inner ${
            role === 'vendor'
              ? 'bg-slate-800/80 border-slate-700/60'
              : 'bg-slate-100/80 border-slate-200/60'
          }`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? (role === 'vendor' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-blue-700 shadow-xs')
                      : (role === 'vendor' ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50')
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? (role === 'vendor' ? 'text-white' : 'text-blue-600') : 'opacity-60'}`} />
                  <span>{item.desktopLabel}</span>
                </Link>
              );
            })}
          </nav>

          {/* Role Switcher & Family Sync Badge */}
          <div className="flex items-center gap-3">
            
            {/* Mode Switcher Pill */}
            <div className={`flex items-center p-1 rounded-2xl border text-xs font-bold ${
              role === 'vendor' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => handleRoleToggle('household')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  role === 'household'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ghar</span>
              </button>

              <button
                onClick={() => handleRoleToggle('vendor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  role === 'vendor'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Vyapari</span>
              </button>
            </div>

            {/* Persona Specific Badges */}
            {role === 'household' ? (
              <div className="flex items-center gap-2 bg-blue-50/70 border border-blue-200/80 px-3 py-1.5 rounded-2xl text-xs">
                <button
                  onClick={() => setShowMemberModal(true)}
                  className="font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1"
                  title="Switch Active Family Member"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{activeMember}</span>
                  <span className="text-[10px] text-blue-400">▾</span>
                </button>

                <span className="text-slate-300">|</span>

                <button
                  onClick={copyHouseholdInvite}
                  className="font-semibold text-blue-700 flex items-center gap-1 hover:text-blue-950"
                  title="Copy Household Code"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px] font-bold">{householdCode}</span>
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-blue-400" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-800 border border-emerald-500/30 px-3 py-1.5 rounded-2xl text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{vendorBusinessName}</span>
              </div>
            )}

            {/* Setup Wizard Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('rozhisaab-open-onboarding'))}
              className={`p-2 rounded-xl transition-all ${
                role === 'vendor'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title="Open Setup Wizard / Change Category"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE TOP CATEGORY HEADER
          ========================================================================= */}
      <div className={`md:hidden px-4 py-2 flex items-center justify-between text-xs border-b ${
        role === 'vendor' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-2">
          {/* Mobile Role Switch */}
          <div className={`flex items-center p-0.5 rounded-xl border text-[11px] font-bold ${
            role === 'vendor' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => handleRoleToggle('household')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                role === 'household' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-400'
              }`}
            >
              🏠 Ghar
            </button>
            <button
              onClick={() => handleRoleToggle('vendor')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                role === 'vendor' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-400'
              }`}
            >
              🛵 Vyapari
            </button>
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('rozhisaab-open-onboarding'))}
            className={`text-[11px] font-bold p-1 px-2 rounded-lg border ${
              role === 'vendor' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            ⚙️ Setup
          </button>
        </div>

        {/* Member or Business Tag */}
        {role === 'household' ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowMemberModal(true)}
              className="text-[11px] font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg"
            >
              👤 {activeMember}
            </button>
            <button
              onClick={copyHouseholdInvite}
              className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg flex items-center gap-1"
            >
              <span>{householdCode}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-blue-400" />}
            </button>
          </div>
        ) : (
          <div className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg truncate max-w-[140px]">
            {vendorBusinessName}
          </div>
        )}
      </div>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION BAR
          ========================================================================= */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md px-2 py-1 shadow-lg border-t ${
        role === 'vendor' ? 'bg-slate-900/95 border-slate-800 text-slate-400' : 'bg-white/95 border-slate-200 text-slate-500'
      }`}>
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
                    ? (role === 'vendor' ? 'text-emerald-400 font-black' : 'text-blue-600 font-bold')
                    : 'hover:text-slate-900 font-medium'
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
