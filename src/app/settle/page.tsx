'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import KeyNoticeBanner from '@/components/KeyNoticeBanner';
import { Send, Copy, Check, MessageSquare, IndianRupee, ExternalLink } from 'lucide-react';

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-28 max-w-lg mx-auto shadow-2xl relative border-x border-slate-200">
      <KeyNoticeBanner />

      <header className="px-5 pt-5 pb-3 bg-white border-b border-slate-100">
        <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
          📲 Month-End Settlement & WhatsApp
        </h1>
        <p className="text-xs text-slate-500">
          Dispute-free settlement card with UPI link
        </p>
      </header>

      {/* Vendor Horizontal Selector */}
      <div className="p-4 bg-white border-b border-slate-100">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Kiska hisaab bhejna hai?
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {vendors.map(v => (
            <button
              key={v.id}
              onClick={() => handleSelectVendor(v.id)}
              className={`p-3 rounded-2xl flex flex-col items-center min-w-[90px] border transition-all text-center ${
                selectedVendorId === v.id
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <span className="text-2xl mb-1">{v.icon}</span>
              <span className="text-xs font-bold text-slate-800 truncate w-full">{v.displayName.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-400 font-medium">₹{v.unitRate}/{v.unit}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generated WhatsApp Card Preview */}
      <div className="p-4">
        {summary && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-400">Payable to:</span>
                <h2 className="text-base font-bold text-slate-900">{summary.displayName}</h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 block">Kul hisaab:</span>
                <span className="text-xl font-extrabold text-blue-600 flex items-center justify-end">
                  <IndianRupee className="w-4 h-4" />
                  {summary.totalAmountPayable}
                </span>
              </div>
            </div>

            {/* WhatsApp Text Preview Box styled like WhatsApp bubble */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 font-mono text-xs text-slate-800 whitespace-pre-line relative shadow-inner">
              <div className="flex items-center gap-1.5 text-emerald-800 font-sans font-bold text-xs mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp Message Preview:
              </div>
              {summary.whatsappMessage}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md shadow-emerald-600/20 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp pe Bhejein</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <button
                onClick={copyToClipboard}
                className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-semibold py-3 px-4 rounded-2xl flex items-center justify-center gap-1.5 text-xs transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <Navbar />
    </main>
  );
}
