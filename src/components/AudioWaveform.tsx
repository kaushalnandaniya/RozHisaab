'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AudioWaveformProps {
  isListening: boolean;
  variant?: 'household' | 'vendor';
  barCount?: number;
}

export default function AudioWaveform({
  isListening,
  variant = 'household',
  barCount = 24,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [hasMicStream, setHasMicStream] = useState(false);

  useEffect(() => {
    if (!isListening) {
      // Clean up audio capture
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setHasMicStream(false);
      return;
    }

    // Try to attach real microphone stream for true reactive frequency analysis
    let isCancelled = false;
    async function startAudioCapture() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; // 32 frequency bins
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;
        setHasMicStream(true);
      } catch (err) {
        // Fallback to organic procedural sine-wave animation
        setHasMicStream(false);
      }
    }

    startAudioCapture();

    return () => {
      isCancelled = true;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening]);

  // Render loop on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isListening) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const frequencyData = new Uint8Array(32);

    const isVendor = variant === 'vendor';
    // Wispr-style high-end gradients
    const primaryColor = isVendor ? '#059669' : '#2563eb';
    const secondaryColor = isVendor ? '#10b981' : '#6366f1';
    const highlightColor = isVendor ? '#34d399' : '#a855f7';

    function renderFrame() {
      if (!canvas || !ctx) return;
      phase += 0.08;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyserRef.current && hasMicStream) {
        analyserRef.current.getByteFrequencyData(frequencyData);
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const barWidth = Math.floor(width / (barCount * 1.6));
      const totalWidth = barCount * barWidth + (barCount - 1) * 3;
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < barCount; i++) {
        let normalizedVolume = 0;

        if (hasMicStream && analyserRef.current) {
          // Map bar index to frequency bins
          const freqIndex = Math.min(
            Math.floor((i / barCount) * (frequencyData.length * 0.75)),
            frequencyData.length - 1
          );
          normalizedVolume = frequencyData[freqIndex] / 255;
        } else {
          // Simulated smooth Wispr wave
          const wave1 = Math.sin(phase + i * 0.35);
          const wave2 = Math.cos(phase * 0.8 + i * 0.2);
          normalizedVolume = (wave1 * 0.5 + wave2 * 0.5 + 1) * 0.45;
        }

        // Bell curve envelope so edges stay subtle and center expands
        const centerDistance = Math.abs(i - barCount / 2) / (barCount / 2);
        const envelope = 1 - Math.pow(centerDistance, 1.8);
        const dynamicHeight = Math.max(
          4,
          normalizedVolume * (height * 0.88) * envelope + 3
        );

        const x = startX + i * (barWidth + 3);
        const y = centerY - dynamicHeight / 2;

        // Gradient for each bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + dynamicHeight);
        gradient.addColorStop(0, highlightColor);
        gradient.addColorStop(0.5, secondaryColor);
        gradient.addColorStop(1, primaryColor);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Rounded capsule bar
        const radius = barWidth / 2;
        if (dynamicHeight >= barWidth) {
          ctx.roundRect(x, y, barWidth, dynamicHeight, radius);
        } else {
          ctx.rect(x, y, barWidth, dynamicHeight);
        }
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    }

    renderFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, hasMicStream, barCount, variant]);

  if (!isListening) return null;

  return (
    <div className="flex flex-col items-center justify-center my-2 w-full animate-fadeIn">
      <div className="relative px-3 py-1.5 rounded-2xl bg-slate-900/90 shadow-lg border border-slate-700/60 backdrop-blur-md flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <canvas
          ref={canvasRef}
          width={220}
          height={38}
          className="rounded-lg"
          aria-label="Real-time voice frequency visualizer"
        />
        <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase pr-1">
          Wispr VAD
        </span>
      </div>
    </div>
  );
}
