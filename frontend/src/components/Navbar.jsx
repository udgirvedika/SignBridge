import React from 'react';
import { RotateCcw, ShieldCheck, Sun, Moon, Languages } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Navbar({ onReset }) {
  const { theme, toggleTheme, language, supportedLanguages } = useAccessibility();
  const currentLang = supportedLanguages.find((l) => l.code === language);

  return (
    <header className="h-13 bg-[#FCFCFD] border-b border-zinc-200 px-4 md:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-2.5">
          <span className="font-semibold text-zinc-900 tracking-tight text-base">
            SignBridge
          </span>
          <span className="text-xs text-zinc-500 font-medium bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
            Sign Language to Text
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-600">
        {/* Language indicator */}
        {language !== 'en' && (
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 border border-zinc-200 rounded text-zinc-600"
            style={{ background: 'var(--accent-glow)', borderColor: 'rgba(99,102,241,0.15)' }}>
            <Languages className="w-3.5 h-3.5" style={{ color: 'var(--accent-solid)' }} />
            <span className="font-medium" style={{ color: 'var(--accent-solid)' }}>
              {currentLang?.flag} {currentLang?.name}
            </span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-zinc-600">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
          <span>Realtime Backend Streaming</span>
        </div>

        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 rounded transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
          <span className="hidden xs:inline font-medium">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        <button
          type="button"
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
