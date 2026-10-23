import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, RotateCcw, Trash2, Copy, Check, Languages, MessageSquare, X } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function TranslationSection({
  sentenceWords,
  onClear,
  onUndo,
  onRemoveWord,
  onSpeak,
}) {
  const [copied, setCopied] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const {
    language,
    translateText,
    speakText,
    stopSpeaking,
    isSpeaking,
    supportedLanguages,
  } = useAccessibility();

  const fullSentence = sentenceWords.join(' ');
  const currentLang = supportedLanguages.find((l) => l.code === language);

  // Auto-translate when sentence or language changes
  useEffect(() => {
    let cancelled = false;

    async function doTranslate() {
      if (!fullSentence.trim() || language === 'en') {
        setTranslatedText('');
        return;
      }

      setIsTranslating(true);
      try {
        const result = await translateText(fullSentence, language);
        if (!cancelled) {
          setTranslatedText(result);
        }
      } catch {
        if (!cancelled) setTranslatedText('');
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    }

    doTranslate();
    return () => {
      cancelled = true;
    };
  }, [fullSentence, language, translateText]);

  const handleCopy = () => {
    if (!fullSentence) return;
    const textToCopy = translatedText || fullSentence;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const textToSpeak = translatedText || fullSentence;
    if (!textToSpeak.trim()) return;

    speakText(textToSpeak, language);
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-[#FCFCFD] dark:bg-zinc-900 p-5 sm:p-6 shadow-sm">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" aria-hidden="true" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Constructed Sentence
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {language !== 'en' && (
            <span className="translation-badge text-xs sm:text-sm">
              <Languages className="w-3.5 h-3.5" aria-hidden="true" />
              {currentLang?.flag} {currentLang?.name}
            </span>
          )}
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-lg">
            {sentenceWords.length} {sentenceWords.length === 1 ? 'word' : 'words'}
          </span>
        </div>
      </div>

      {/* Words Box */}
      <div className="min-h-[76px] p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/90 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-4">
        {sentenceWords.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {sentenceWords.map((word, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 shadow-xs transition-all group"
              >
                <span>{word}</span>
                <button
                  type="button"
                  onClick={() => onRemoveWord?.(index)}
                  className="w-4 h-4 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors cursor-pointer"
                  title={`Remove ${word}`}
                  aria-label={`Remove word ${word}`}
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 italic">
            Recognized words will assemble here into your sentence. Perform signs or click "Test Sign" to build a phrase.
          </p>
        )}
      </div>

      {/* Translated Row (shown when target language is not English) */}
      {language !== 'en' && sentenceWords.length > 0 && (
        <div
          className="min-h-[52px] p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.06) 100%)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Languages
                  className="w-4 h-4 text-indigo-500"
                  style={{ color: 'var(--accent-solid)' }}
                  aria-hidden="true"
                />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--accent-solid)' }}
                >
                  {currentLang?.name} Translation
                </span>
              </div>
              {isTranslating ? (
                <div className="flex items-center gap-2 py-0.5">
                  <div
                    className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: 'var(--border-color)',
                      borderTopColor: 'var(--accent-solid)',
                    }}
                  />
                  <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Translating sentence...</span>
                </div>
              ) : (
                <p className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                  {translatedText}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Read Aloud Button */}
          <button
            type="button"
            onClick={handleReadAloud}
            disabled={sentenceWords.length === 0}
            className={`read-aloud-btn min-h-[42px] px-4 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none shadow-sm ${
              isSpeaking ? 'speaking-indicator' : ''
            }`}
            title={isSpeaking ? 'Stop reading aloud' : 'Read sentence aloud via speech synthesis'}
            aria-label={isSpeaking ? 'Stop reading aloud' : 'Read sentence aloud'}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4" aria-hidden="true" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                <span>Read Aloud</span>
              </>
            )}
          </button>

          {/* Speak Original (only when translated) */}
          {language !== 'en' && translatedText && (
            <button
              type="button"
              onClick={() => onSpeak(fullSentence)}
              disabled={sentenceWords.length === 0}
              className="min-h-[42px] px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              title="Speak original English text"
              aria-label="Speak original English text"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              <span>Speak English</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={sentenceWords.length === 0}
            className="min-h-[42px] px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200/90 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            aria-label="Copy sentence to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Editing Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={sentenceWords.length === 0}
            className="min-h-[42px] px-3 py-2 bg-zinc-100 hover:bg-zinc-200/90 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            title="Remove last added word"
            aria-label="Undo last word"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Undo</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={sentenceWords.length === 0}
            className="min-h-[42px] px-3 py-2 bg-zinc-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 dark:bg-zinc-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            title="Clear entire accumulated sentence"
            aria-label="Clear all sentence text"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </section>
  );
}
