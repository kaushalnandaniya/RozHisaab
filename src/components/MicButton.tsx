'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, PlusCircle, HelpCircle, Layers } from 'lucide-react';
import { SpeechRecorder, isSpeechRecognitionSupported } from '@/lib/speech';
import { playMicStartBeep } from '@/lib/chime';

interface MicButtonProps {
  onTranscriptComplete: (transcript: string) => void;
  isProcessing?: boolean;
}

export default function MicButton({ onTranscriptComplete, isProcessing }: MicButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lang, setLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [supported, setSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [intentHint, setIntentHint] = useState<'log' | 'vendor' | 'ask'>('log');

  const recorderRef = useRef<SpeechRecorder | null>(null);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
    recorderRef.current = new SpeechRecorder(lang);
  }, []);

  useEffect(() => {
    if (recorderRef.current) {
      recorderRef.current.setLanguage(lang);
    }
  }, [lang]);

  const toggleListening = () => {
    setErrorMsg(null);
    if (!recorderRef.current) return;

    if (isListening) {
      recorderRef.current.stop();
      setIsListening(false);
      if (interimTranscript.trim()) {
        onTranscriptComplete(interimTranscript);
        setInterimTranscript('');
      }
    } else {
      setInterimTranscript('');
      setIsListening(true);
      playMicStartBeep();
      recorderRef.current.start(
        (transcript, isFinal) => {
          setInterimTranscript(transcript);
          if (isFinal) {
            setIsListening(false);
            onTranscriptComplete(transcript);
            setInterimTranscript('');
          }
        },
        (err) => {
          setIsListening(false);
          setErrorMsg(err);
        }
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 my-5">
      {/* Top Intent Guidance Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-2xl text-[11px] font-semibold mb-4 backdrop-blur-md">
        <button
          onClick={() => setIntentHint('log')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            intentHint === 'log'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Doorstep Log</span>
        </button>

        <button
          onClick={() => setIntentHint('vendor')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            intentHint === 'vendor'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-3 h-3 text-emerald-600" />
          <span>Add Vendor</span>
        </button>

        <button
          onClick={() => setIntentHint('ask')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            intentHint === 'ask'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-3 h-3 text-purple-600" />
          <span>Poocho</span>
        </button>
      </div>

      {/* Main Interactive Mic Button with Ripple & Wave Animations */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <>
            <span className="absolute w-36 h-36 rounded-full bg-blue-500 opacity-25 animate-ping" />
            <span className="absolute w-48 h-48 rounded-full bg-indigo-400 opacity-15 animate-pulse" />
            <div className="absolute -top-3 z-20 bg-red-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce shadow-md">
              Recording Live
            </div>
          </>
        )}

        <button
          onClick={toggleListening}
          disabled={isProcessing}
          aria-label={isListening ? 'Stop listening' : 'Start speaking'}
          className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center text-white transition-all transform active:scale-95 shadow-xl ${
            isListening
              ? 'bg-gradient-to-tr from-red-600 to-rose-500 shadow-red-500/50 ring-4 ring-red-200'
              : isProcessing
              ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/40 animate-pulse'
              : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-indigo-500/35 ring-4 ring-indigo-100'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <Sparkles className="w-8 h-8 animate-spin mb-1" />
              <span className="text-[11px] font-bold tracking-wide">AI Processing...</span>
            </div>
          ) : isListening ? (
            <div className="flex flex-col items-center">
              <MicOff className="w-8 h-8 mb-1" />
              <span className="text-[11px] font-bold tracking-wide">रोकें (Stop)</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Mic className="w-9 h-9 mb-1" />
              <span className="text-[11px] font-bold tracking-wide">बोलिए (Speak)</span>
            </div>
          )}
        </button>
      </div>

      {/* Language Switcher Small Badge */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setLang(l => l === 'hi-IN' ? 'en-IN' : 'hi-IN')}
          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1.5 transition-all"
        >
          <span>🌐 Voice Lang:</span>
          <span className="font-bold text-blue-600">
            {lang === 'hi-IN' ? 'हिन्दी / Hinglish' : 'English'}
          </span>
          <span className="text-[9px] text-slate-400">(Tap to switch)</span>
        </button>
      </div>

      {/* Helper Prompt or Live Transcript Stream */}
      <div className="mt-3 min-h-[52px] max-w-md w-full text-center px-4">
        {isListening ? (
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-950 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xs animate-pulse">
            <Volume2 className="w-4 h-4 text-blue-600 animate-bounce flex-shrink-0" />
            <span className="truncate">{interimTranscript || 'बोलिए, RozHisaab सुन रहा है...'}</span>
          </div>
        ) : isProcessing ? (
          <span className="text-xs text-slate-500 font-medium">
            AI entry analyze karke hisaab me jod raha hai...
          </span>
        ) : intentHint === 'vendor' ? (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-xl py-1.5 px-3">
            बोलें: <span className="font-semibold">"Naya vendor add karo: Ramu Car Wash, rate 500 rupaye mahina, phone 9876543210"</span>
          </p>
        ) : intentHint === 'ask' ? (
          <p className="text-xs text-purple-800 bg-purple-50 border border-purple-200/80 rounded-xl py-1.5 px-3">
            बोलें: <span className="font-semibold">"Is mahine paani ka total kitna hisaab hua?"</span>
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            बोलें: <span className="text-slate-800 font-semibold">"Aaj doodh dedh litre liya, 2 water can aaye aur didi chhutti pe hain"</span>
          </p>
        )}

        {errorMsg && (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-red-600 font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!supported && (
          <p className="mt-2 text-xs text-amber-600 font-medium">
            ⚠️ Best experienced in Chrome or Edge for built-in microphone support.
          </p>
        )}
      </div>
    </div>
  );
}
