'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { SpeechRecorder, isSpeechRecognitionSupported } from '@/lib/speech';

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
    <div className="flex flex-col items-center justify-center w-full px-4 my-6">
      {/* Language Toggle Pill */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full text-xs font-medium mb-4 shadow-inner">
        <button
          onClick={() => setLang('hi-IN')}
          className={`px-3 py-1 rounded-full transition-all ${
            lang === 'hi-IN' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🇮🇳 हिन्दी / Hinglish
        </button>
        <button
          onClick={() => setLang('en-IN')}
          className={`px-3 py-1 rounded-full transition-all ${
            lang === 'en-IN' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          English
        </button>
      </div>

      {/* Main Interactive Mic Button with Ripple Animation */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <>
            <span className="absolute w-36 h-36 rounded-full bg-blue-500 opacity-20 animate-ping" />
            <span className="absolute w-44 h-44 rounded-full bg-blue-400 opacity-15 animate-pulse" />
          </>
        )}

        <button
          onClick={toggleListening}
          disabled={isProcessing}
          aria-label={isListening ? 'Stop listening' : 'Start speaking'}
          className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center text-white transition-all transform active:scale-95 shadow-xl ${
            isListening
              ? 'bg-red-500 shadow-red-500/40 ring-4 ring-red-200'
              : isProcessing
              ? 'bg-amber-500 shadow-amber-500/30 animate-pulse'
              : 'bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <Sparkles className="w-8 h-8 animate-spin mb-1" />
              <span className="text-[11px] font-semibold tracking-wide">नोट हो रहा है...</span>
            </div>
          ) : isListening ? (
            <div className="flex flex-col items-center">
              <MicOff className="w-8 h-8 mb-1" />
              <span className="text-[11px] font-semibold tracking-wide">रोकें (Stop)</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Mic className="w-9 h-9 mb-1" />
              <span className="text-[11px] font-semibold tracking-wide">बोलिए (Speak)</span>
            </div>
          )}
        </button>
      </div>

      {/* Helper Prompt / Live Transcript Banner */}
      <div className="mt-4 min-h-[48px] max-w-md w-full text-center px-4">
        {isListening ? (
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-900 px-4 py-2 rounded-2xl text-sm font-medium animate-pulse">
            <Volume2 className="w-4 h-4 text-blue-600 animate-bounce" />
            <span>{interimTranscript || 'बोलिए, सुन रहे हैं...'}</span>
          </div>
        ) : isProcessing ? (
          <span className="text-sm text-slate-500 font-medium">
            AI entry analyze kar raha hai...
          </span>
        ) : (
          <p className="text-xs text-slate-500">
            जैसे: <span className="text-slate-800 font-medium">"Aaj doodh dedh litre liya, 2 water can aaye aur 1 khali jar diya"</span>
          </p>
        )}

        {errorMsg && (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-red-600 font-medium">
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
