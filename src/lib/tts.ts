/**
 * Browser SpeechSynthesis wrapper for Hindi (hi-IN) and English (en-IN).
 * Zero latency, zero cost, completely offline.
 */

export function speakHindi(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel(); // Stop any pending speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Attempt to select a native Hindi voice if installed on OS/browser
  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi')) 
    || voices.find(v => v.lang === 'en-IN')
    || voices.find(v => v.lang.startsWith('en'));

  if (hindiVoice) {
    utterance.voice = hindiVoice;
    utterance.lang = hindiVoice.lang;
  } else {
    utterance.lang = 'hi-IN';
  }

  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
