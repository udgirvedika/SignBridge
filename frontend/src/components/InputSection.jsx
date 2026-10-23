import React, { useEffect, useRef } from 'react';
import {
  Camera,
  CircleStop,
  ScanLine,
  X,
  AlertCircle,
  ShieldCheck,
  Lightbulb,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export default function InputSection({
  currentInput,
  onClearInput,
  onStartStreaming,
  onStopStreaming,
  streamStatus,
  connectionMessage,
}) {
  const videoRef = useRef(null);
  const isStreaming = streamStatus === 'streaming';
  const isConnecting = streamStatus === 'connecting';
  const isOffline = streamStatus === 'offline';

  useEffect(() => {
    const videoEl = videoRef.current;
    return () => {
      if (videoEl?.srcObject) {
        const tracks = videoEl.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoEl.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" aria-hidden="true" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Live Sign Input
          </h2>
        </div>
        {currentInput && (
          <button
            type="button"
            onClick={onClearInput}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 font-medium px-2.5 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            aria-label="Clear active camera stream"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear Stream</span>
          </button>
        )}
      </div>

      {/* Camera Video Viewport */}
      <div className="relative flex-1 min-h-[320px] sm:min-h-[360px] md:min-h-[380px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 overflow-hidden shadow-sm flex flex-col items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            currentInput ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Webcam feed for sign language translation"
        />

        {/* Error State */}
        {!currentInput && streamStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-zinc-50 dark:bg-zinc-900">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center mb-3 shadow-xs">
              <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 mb-1">
              {connectionMessage?.toLowerCase().includes('permission') ||
              connectionMessage?.toLowerCase().includes('denied') ||
              connectionMessage?.toLowerCase().includes('blocked')
                ? 'Camera Access Required'
                : 'Connection Attention'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 max-w-sm leading-relaxed mb-4">
              {connectionMessage || 'Unable to connect to camera or sign recognition service.'}
            </p>
            {connectionMessage?.toLowerCase().includes('permission') ||
            connectionMessage?.toLowerCase().includes('denied') ||
            connectionMessage?.toLowerCase().includes('blocked') ? (
              <div className="text-xs bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 max-w-xs text-left text-zinc-700 dark:text-zinc-200 space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">To allow camera:</p>
                <p>1. Click the <strong>lock icon 🔒</strong> in your browser address bar.</p>
                <p>2. Set <strong>Camera</strong> to <strong>Allow</strong>.</p>
                <p>3. Click <strong>Start Camera</strong> again below.</p>
              </div>
            ) : (
              <div className="text-xs bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 max-w-xs text-left text-zinc-700 dark:text-zinc-200 space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Quick tip:</p>
                <p>• Start the backend server on port 8000 for live recognition.</p>
                <p>• Or use <strong>Test Sign</strong> on the right to test gestures & translation.</p>
              </div>
            )}
          </div>
        )}

        {/* Camera Idle Placeholder */}
        {!currentInput && streamStatus !== 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-radial from-zinc-100 via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200/90 dark:border-zinc-700 shadow-sm flex items-center justify-center mb-3.5">
              <ScanLine className="w-7 h-7 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
              Live Camera Standby
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed mb-4">
              Click <strong>Start Camera</strong> below to begin translating sign gestures into text.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300/60 dark:border-zinc-700/60 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span>Ensure hands are well-lit and in frame</span>
            </div>
          </div>
        )}

        {/* Live HUD Badges on Active Video */}
        {currentInput && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white border border-white/10 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                <span>Live Feed</span>
              </div>

              {isStreaming ? (
                <div className="flex items-center gap-1 rounded-full bg-indigo-500/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  <Activity className="w-3 h-3" aria-hidden="true" />
                  <span>ML Streaming</span>
                </div>
              ) : isOffline ? (
                <div className="flex items-center gap-1 rounded-full bg-amber-500/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  <span>Backend Standby</span>
                </div>
              ) : isConnecting ? (
                <div className="flex items-center gap-1 rounded-full bg-blue-500/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  <span>Connecting...</span>
                </div>
              ) : null}
            </div>

            <div className="pointer-events-auto">
              <button
                type="button"
                onClick={onClearInput}
                className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                title="Stop & Clear Camera"
                aria-label="Stop and clear camera"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onStartStreaming(videoRef.current)}
          disabled={isConnecting || isStreaming}
          className="flex-1 min-h-[44px] py-2.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Camera className="w-4 h-4" aria-hidden="true" />
          <span>
            {isConnecting
              ? 'Connecting...'
              : isStreaming
                ? 'Camera Active'
                : 'Start Camera'}
          </span>
        </button>

        <button
          type="button"
          onClick={onStopStreaming}
          disabled={!currentInput && !isStreaming && !isConnecting}
          className="min-h-[44px] py-2.5 px-4 bg-zinc-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 dark:bg-zinc-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <CircleStop className="w-4 h-4" aria-hidden="true" />
          <span>Stop</span>
        </button>
      </div>

      {/* Sleek Compact Footer Banner */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Private Stream:</span>
          <span className="hidden sm:inline">Frames processed live in memory</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          <span>Hold signs steady</span>
        </div>
      </div>
    </div>
  );
}
