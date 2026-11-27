'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, FileText, Send, Settings, Sparkles, Home } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Aaj Ka Log', href: '/', icon: Mic, desktopLabel: 'Voice Dashboard' },
    { label: 'Hisaab Tally', href: '/ledger', icon: FileText, desktopLabel: 'Monthly Ledger' },
    { label: 'Settle / WhatsApp', href: '/settle', icon: Send, desktopLabel: 'WhatsApp Settlement' },
    { label: 'Vendors & Rates', href: '/vendors', icon: Settings, desktopLabel: 'Vendors & Rates' },
  ];

  return (
    <>
      {/* =========================================================================
          DESKTOP TOP NAVIGATION BAR (Visible on md: and larger screens)
          ========================================================================= */}
      <header className="hidden md:block sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-2xs">
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

          {/* Right Status / Household profile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-2xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sharma Household</span>
            </div>
          </div>
        </div>
      </header>

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
    </>
  );
}
