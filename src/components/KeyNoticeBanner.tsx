'use client';

import React, { useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export default function KeyNoticeBanner() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="w-full bg-emerald-50 border-b border-emerald-200/80 px-4 py-2 text-xs text-emerald-900 flex items-center justify-between">
      <div className="flex items-center gap-1.5 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>100% Zero-Config & Free: Built-in Speech + Rule-Based Parser Active</span>
      </div>

      <button
        onClick={() => setShowInfo(!showInfo)}
        className="text-emerald-700 hover:text-emerald-950 p-1 flex-shrink-0"
        title="More info"
      >
        <Info className="w-4 h-4" />
      </button>

      {showInfo && (
        <div className="absolute top-10 right-4 z-50 bg-white border border-slate-200 rounded-xl p-3 shadow-xl max-w-xs text-slate-700 text-xs">
          <p className="font-semibold text-slate-900 mb-1">Zero Secret Keys Required!</p>
          <p className="mb-2 text-slate-600">
            RozHisaab runs locally with your browser's Web Speech API and an offline Hindi/Hinglish parser.
          </p>
          <p className="text-[11px] text-slate-500">
            Optional: Add <code>GEMINI_API_KEY</code> or <code>GROQ_API_KEY</code> in <code>.env</code> for enhanced LLM reasoning.
          </p>
        </div>
      )}
    </div>
  );
}
