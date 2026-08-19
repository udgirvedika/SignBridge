import React, { useEffect, useRef } from 'react';
import { Camera, CircleStop, ScanLine, X } from 'lucide-react';

function statusTone(streamStatus) {
  if (streamStatus === 'streaming') {
    return 'bg-emerald-500';
  }

  if (streamStatus === 'connecting') {
    return 'bg-amber-500';
  }

  if (streamStatus === 'error') {
    return 'bg-rose-500';
  }

  return 'bg-zinc-400';
}

export default function InputSection({
  currentInput,
  onClearInput,
  onStartStreaming,
  onStopStreaming,
  isAnalyzing,
  streamStatus,
  connectionMessage,
  websocketUrl,
}) {
  const videoRef = useRef(null);
  const isStreaming = streamStatus === 'streaming';
  const isConnecting = streamStatus === 'connecting';

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Live Sign Input
        </label>
        {currentInput && (
          <button
            type="button"
            onClick={onClearInput}
            className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1 font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear Stream
          </button>
        )}
      </div>

      <div className="relative flex-1 min-h-[320px] rounded-md border border-zinc-300 bg-[#FCFCFD] overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover transition-opacity ${
            currentInput ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {!currentInput && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.06),_transparent_55%),linear-gradient(180deg,_#fcfcfd_0%,_#f4f4f5_100%)]">
            <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4">
              <ScanLine className="w-6 h-6 text-zinc-700" />
            </div>
            <p className="text-sm font-semibold text-zinc-900 mb-1">
              Start the webcam stream
            </p>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
              The browser captures frames locally and sends them to the FastAPI
              backend over WebSocket for real-time landmark extraction and
              prediction.
            </p>
          </div>
        )}

        {currentInput && (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${statusTone(streamStatus)}`} />
            <span>{connectionMessage}</span>
          </div>
        )}
      </div>

      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-zinc-800">Backend stream</span>
          <span className="font-mono text-[11px] text-zinc-500">
            {websocketUrl}
          </span>
        </div>
        <p className="mt-2 leading-relaxed">
          Use `localhost` or HTTPS in development if the browser blocks camera
          access on an insecure origin.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onStartStreaming(videoRef.current)}
          disabled={isConnecting || isStreaming}
          className="flex-1 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded text-xs font-medium transition-colors shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>
            {isConnecting
              ? 'Connecting...'
              : isStreaming
                ? 'Streaming Live'
                : 'Start Camera'}
          </span>
        </button>

        <button
          type="button"
          onClick={onStopStreaming}
          disabled={!isStreaming && !isConnecting}
          className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-300 text-zinc-700 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <CircleStop className="w-4 h-4" />
          <span>Stop</span>
        </button>
      </div>

      <div className="pt-2 border-t border-zinc-200 flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Stream Notes
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
            <p className="font-medium text-zinc-800">Frame window</p>
            <p className="mt-1 text-zinc-500">
              The backend waits for 30 frames before predictions begin.
            </p>
          </div>
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
            <p className="font-medium text-zinc-800">Stability gate</p>
            <p className="mt-1 text-zinc-500">
              A sign must repeat across consecutive windows before it is shown.
            </p>
          </div>
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
            <p className="font-medium text-zinc-800">Current mode</p>
            <p className="mt-1 text-zinc-500">
              {isAnalyzing
                ? 'Streaming to backend in real time'
                : 'Waiting for webcam stream'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
