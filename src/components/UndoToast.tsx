'use client';

import React, { useEffect, useState } from 'react';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

interface UndoToastProps {
  message: string;
  entryId: string;
  onUndo: (id: string) => void;
  durationSeconds?: number;
}

export default function UndoToast({
  message,
  entryId,
  onUndo,
  durationSeconds = 6
}: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (timeLeft <= 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700 animate-slide-up">
      <div className="flex items-center gap-2.5 overflow-hidden pr-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <p className="text-xs font-medium truncate">{message}</p>
      </div>

      <button
        onClick={() => onUndo(entryId)}
        className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-400/30 flex-shrink-0 transition-all"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Undo ({timeLeft}s)</span>
      </button>
    </div>
  );
}
