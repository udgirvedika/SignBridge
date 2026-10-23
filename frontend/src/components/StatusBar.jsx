import React from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Sparkles, Lock } from 'lucide-react';

export default function StatusBar({ modelStatus = 'idle' }) {
  const getStatusDisplay = () => {
    switch (modelStatus) {
      case 'streaming':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
          label: 'Live Recognition Active',
          sub: 'Ready for signs',
        };
      case 'connecting':
        return {
          icon: <RefreshCw className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-spin" aria-hidden="true" />,
          label: 'Connecting...',
          sub: 'Preparing camera feed',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" aria-hidden="true" />,
          label: 'Attention Required',
          sub: 'Check camera permissions',
        };
      case 'idle':
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-zinc-400" aria-hidden="true" />,
          label: 'Standby Mode',
          sub: 'Click "Start Camera" to begin',
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <footer className="bg-[#FCFCFD] border-t border-zinc-200 dark:border-zinc-800 px-4 md:px-8 py-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {statusInfo.icon}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{statusInfo.label}</span>
          <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">•</span>
          <span className="text-zinc-500 dark:text-zinc-400 hidden sm:inline">{statusInfo.sub}</span>
        </div>

        <div className="h-3.5 w-px bg-zinc-300 dark:bg-zinc-700 hidden md:block" aria-hidden="true" />

        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>Realtime Private Processing</span>
        </div>
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
        <span>Press <strong>Tab</strong> for keyboard navigation</span>
      </div>
    </footer>
  );
}
