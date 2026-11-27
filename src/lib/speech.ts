/**
 * Browser Web Speech API SpeechRecognition wrapper with Hindi and Indian English support.
 * Free, client-side, zero latency, zero API keys required.
 */

// Web Speech API interface definitions for TypeScript
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export class SpeechRecorder {
  private recognition: ISpeechRecognition | null = null;
  private isListening = false;
  private onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  private onError?: (err: string) => void;

  constructor(lang: string = 'hi-IN') {
    if (typeof window === 'undefined') return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = lang;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const full = final || interim;
        this.onTranscriptUpdate?.(full, Boolean(final));
      };

      this.recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        this.isListening = false;
        this.onError?.('Microphone error or permission denied');
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  public setLanguage(lang: string) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onError?: (err: string) => void
  ) {
    if (!this.recognition) {
      onError?.('Speech Recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    if (this.isListening) return;

    this.onTranscriptUpdate = onTranscript;
    this.onError = onError;
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      onError?.('Microphone is already active or blocked.');
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn(e);
      }
      this.isListening = false;
    }
  }
}
