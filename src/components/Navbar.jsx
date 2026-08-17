import React from 'react';
import { ShieldCheck, RotateCcw, HelpCircle } from 'lucide-react';

export default function Navbar({ onReset }) {
  return (
    <header className="h-13 bg-[#FCFCFD] border-b border-zinc-200 px-4 md:px-6 flex items-center justify-between shrink-0">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-2.5">
          <span className="font-semibold text-zinc-900 tracking-tight text-base">SignBridge</span>
          <span className="text-xs text-zinc-500 font-medium bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
            Sign Language → Text
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 text-xs text-zinc-600">
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-zinc-600">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
          <span>Local ML Inference</span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 rounded transition-colors"
          title="Reset application state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden xs:inline font-medium">Reset</span>
        </button>
      </div>
    </header>
  );
}
