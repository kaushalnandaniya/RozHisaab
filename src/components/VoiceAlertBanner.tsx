'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, X, Mic, Edit3, HelpCircle } from 'lucide-react';

export interface VoiceAlert {
  type: 'warning' | 'error';
  title: string;
  reason: string;
  rawTranscript: string;
  suggestion?: string;
}

interface VoiceAlertBannerProps {
  alert: VoiceAlert | null;
  onDismiss: () => void;
  onRetry: () => void;
  onManualOpen: () => void;
}

export default function VoiceAlertBanner({
  alert,
  onDismiss,
  onRetry,
  onManualOpen,
}: VoiceAlertBannerProps) {
  if (!alert) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-400/80 rounded-3xl p-4 sm:p-5 shadow-lg shadow-amber-500/10 mb-4 animate-fade-in relative">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/30 text-lg mt-0.5">
            ⚠️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-amber-950 tracking-tight">
                {alert.title || 'Hisaab Update Nahi Hua (Quantity/Balance Not Updated)'}
              </h3>
              <span className="text-[10px] bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Attention Required
              </span>
            </div>

            <p className="text-xs text-amber-900 font-semibold mt-1">
              {alert.reason}
            </p>

            {alert.rawTranscript && (
              <div className="mt-2 bg-white/90 border border-amber-300/80 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium inline-flex items-center gap-1.5 shadow-2xs">
                <span className="text-slate-400 font-bold">Aapne bola:</span>
                <span className="italic font-semibold text-slate-900 font-mono">"{alert.rawTranscript}"</span>
              </div>
            )}

            {alert.suggestion && (
              <p className="text-[11px] text-amber-800/90 mt-2 font-medium flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span><strong>Tip:</strong> {alert.suggestion}</span>
              </p>
            )}

            {/* Quick Action Recovery Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-amber-300/50">
              <button
                onClick={onRetry}
                className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Dobara Boliye (Retry Voice)</span>
              </button>

              <button
                onClick={onManualOpen}
                className="bg-white hover:bg-slate-50 border border-amber-300 text-amber-950 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>Manual Theek Karein</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-amber-700 hover:text-amber-950 p-1.5 rounded-xl hover:bg-amber-200/50 transition-colors"
          title="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
