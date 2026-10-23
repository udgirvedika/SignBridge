import React from 'react';
import { RotateCcw, ShieldCheck, Sun, Moon, Languages } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Navbar({ onReset }) {
  const { theme, toggleTheme, language, supportedLanguages } = useAccessibility();
  const currentLang = supportedLanguages.find((l) => l.code === language);

  return (
    <header className="h-14 sm:h-16 bg-[#FCFCFD] border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <span className="font-black text-sm tracking-wider">SB</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight text-lg sm:text-xl">
              SignBridge
            </h1>
            <span className="hidden sm:inline-block text-xs text-zinc-600 dark:text-zinc-300 font-semibold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-md">
              Sign Language → Text
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
        {/* Active translation language indicator */}
        {language !== 'en' && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg"
            style={{ background: 'var(--accent-glow)', borderColor: 'rgba(99,102,241,0.2)' }}
          >
            <Languages className="w-4 h-4" style={{ color: 'var(--accent-solid)' }} aria-hidden="true" />
            <span className="font-semibold" style={{ color: 'var(--accent-solid)' }}>
              {currentLang?.flag} {currentLang?.name}
            </span>
          </div>
        )}

        {/* User-friendly translation active badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>Live Sign Translation</span>
        </div>

        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="min-h-[38px] flex items-center gap-2 px-3 py-1.5 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg transition-colors cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700" aria-hidden="true" />
          )}
          <span className="hidden xs:inline">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        {/* Reset State Button */}
        <button
          type="button"
          onClick={onReset}
          className="min-h-[38px] flex items-center gap-2 px-3 py-1.5 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg transition-colors cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          title="Reset application and start fresh"
          aria-label="Reset workspace"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span className="hidden xs:inline">Reset</span>
        </button>
      </div>
    </header>
  );
}
