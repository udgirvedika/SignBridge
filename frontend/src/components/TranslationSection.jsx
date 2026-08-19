import React, { useState } from 'react';
import { Volume2, RotateCcw, Trash2, Copy, Check } from 'lucide-react';

export default function TranslationSection({
  sentenceWords,
  onClear,
  onUndo,
  onSpeak
}) {
  const [copied, setCopied] = useState(false);
  const fullSentence = sentenceWords.join(' ');

  const handleCopy = () => {
    if (!fullSentence) return;
    navigator.clipboard.writeText(fullSentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-zinc-300 bg-[#FCFCFD] p-5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Translated Text
        </label>
        <span className="text-xs text-zinc-500 font-mono">
          {sentenceWords.length} {sentenceWords.length === 1 ? 'word' : 'words'}
        </span>
      </div>

      {/* Output Container */}
      <div className="min-h-[72px] p-4 bg-zinc-50 border border-zinc-200 rounded flex items-center justify-between gap-4">
        {sentenceWords.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {sentenceWords.map((word, index) => (
              <span
                key={index}
                className="px-2.5 py-1 bg-zinc-200/80 border border-zinc-300 rounded text-xs font-mono font-semibold text-zinc-900 tracking-wide"
              >
                {word}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic">
            Accumulated sentence words will appear here...
          </p>
        )}
      </div>

      {/* Sentence Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200">
        <div className="flex items-center gap-2">
          {/* Speak Button - Visually prominent solid button */}
          <button
            type="button"
            onClick={() => onSpeak(fullSentence)}
            disabled={sentenceWords.length === 0}
            className={`px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-xs font-medium rounded flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-none`}
            title="Read sentence aloud via Text-to-Speech"
          >
            <Volume2 className="w-4 h-4" />
            <span>Speak</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={sentenceWords.length === 0}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-zinc-300 rounded text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-zinc-800" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
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
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-zinc-300 rounded text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Remove last word"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={sentenceWords.length === 0}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-zinc-300 rounded text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Clear all accumulated text"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}
