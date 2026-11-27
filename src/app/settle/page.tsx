'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import { Send, Copy, Check, MessageSquare, IndianRupee, ExternalLink, Sparkles } from 'lucide-react';
import { playSuccessChime } from '@/lib/chime';

interface Vendor {
  id: string;
  category: string;
  displayName: string;
  icon?: string;
  vendorPhone?: string;
  unit: string;
  unitRate: number;
}

export default function SettlePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      if (data.vendors && data.vendors.length > 0) {
        setVendors(data.vendors);
        setSelectedVendorId(data.vendors[0].id);
        fetchSettlement(data.vendors[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettlement = async (vendorId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/settle?vendorId=${vendorId}`);
      const data = await res.json();
      setSummary(data.summary);
      setShareUrl(data.shareUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVendor = (id: string) => {
    setSelectedVendorId(id);
    fetchSettlement(id);
  };

  const copyToClipboard = () => {
    if (summary?.whatsappMessage) {
      navigator.clipboard.writeText(summary.whatsappMessage);
      playSuccessChime();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-24 md:pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mb-4 rounded-2xl overflow-hidden border border-emerald-200/80 shadow-2xs">
          <KeyNoticeBanner />
        </div>

        {/* Top Header */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-emerald-50 rounded-2xl">📲</span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                Month-End Settlement & WhatsApp
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Ek tap mein vendor ko date-wise hisaab card aur UPI payment link bhejein
              </p>
            </div>
          </div>
        </div>

        {/* Responsive Grid: Left (Vendor Selector), Right (WhatsApp Preview Card) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Vendor Picker Column */}
          <div className="md:col-span-5 lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
              Kiska Hisaab Bhejna Hai?
            </label>

            <div className="flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {vendors.map(v => (
                <button
                  key={v.id}
                  onClick={() => handleSelectVendor(v.id)}
                  className={`p-3.5 rounded-2xl flex items-center gap-3 border transition-all text-left flex-shrink-0 md:flex-shrink w-full ${
                    selectedVendorId === v.id
                      ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="text-3xl">{v.icon}</span>
                  <div className="flex-1 truncate">
                    <span className="text-sm font-bold text-slate-900 block truncate">{v.displayName}</span>
                    <span className="text-xs text-slate-500 font-medium">Rate: ₹{v.unitRate}/{v.unit}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp Card Column */}
          <div className="md:col-span-7 lg:col-span-8">
            {summary && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">Payable To Vendor:</span>
                    <h2 className="text-lg font-black text-slate-900">{summary.displayName}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 block">Total Amount:</span>
                    <span className="text-2xl font-black text-blue-600 flex items-center justify-end">
                      <IndianRupee className="w-5 h-5 stroke-[2.5]" />
                      {summary.totalAmountPayable.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Message Preview styled like WhatsApp */}
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 font-mono text-xs text-slate-800 whitespace-pre-line relative shadow-inner">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-sans font-bold text-xs mb-3">
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp Message Preview:
                  </div>
                  {summary.whatsappMessage}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>WhatsApp Pe Bhejein</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>

                  <button
                    onClick={copyToClipboard}
                    className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Message'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
