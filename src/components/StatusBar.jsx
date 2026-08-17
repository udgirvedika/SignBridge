import React from 'react';

export default function StatusBar({ modelStatus = 'Ready', totalClasses = 20 }) {
  return (
    <footer className="bg-[#FCFCFD] border-t border-zinc-200 px-4 md:px-6 py-2.5 text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-zinc-400">Model:</span>
          <span className="font-semibold text-zinc-800">SignBridge CNN (v2.1)</span>
        </div>

        <div className="h-3 w-px bg-zinc-300 hidden xs:block" />

        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-zinc-400">Status:</span>
          <span className="inline-flex items-center gap-1 text-zinc-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-zinc-800 inline-block" />
            {modelStatus}
          </span>
        </div>

        <div className="h-3 w-px bg-zinc-300 hidden xs:block" />

        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-zinc-400">Supported signs:</span>
          <span className="font-semibold text-zinc-800">{totalClasses}</span>
        </div>
      </div>

      <div className="text-[11px] text-zinc-400 font-mono">
        Input: 224×224 RGB • Single Frame
      </div>
    </footer>
  );
}
