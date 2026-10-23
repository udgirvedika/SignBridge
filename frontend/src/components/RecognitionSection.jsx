import React from 'react';
import { CheckCircle2, Eye, Plus, Sparkles, Hand, Wand2 } from 'lucide-react';
import { SAMPLE_SIGNS } from '../services/mockMLService';

function confidencePercent(prediction) {
  if (!prediction) {
    return '0.0';
  }

  return (prediction.confidence * 100).toFixed(1);
}

function getConfidenceRating(confidence) {
  const percent = confidence * 100;
  if (percent >= 85) return 'High Accuracy';
  if (percent >= 70) return 'Good Match';
  return 'Possible Match';
}

export default function RecognitionSection({
  prediction,
  onAddToSentence,
  isAnalyzing,
  onSetDemoPrediction,
}) {
  const percent = confidencePercent(prediction);
  const confidenceValue = prediction?.confidence ?? 0;
  const rating = getConfidenceRating(confidenceValue);

  const handleTriggerDemo = () => {
    if (onSetDemoPrediction) {
      const sample = SAMPLE_SIGNS[Math.floor(Math.random() * SAMPLE_SIGNS.length)];
      onSetDemoPrediction({
        label: sample.label,
        confidence: sample.confidence,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
            <Hand className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" aria-hidden="true" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Live Recognition
          </h2>
        </div>

        {/* Visual Status Indicator (Icon + Text) */}
        <div>
          {prediction ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Sign Detected</span>
            </span>
          ) : isAnalyzing ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full shadow-xs">
              <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>Detecting Gestures</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              <span>Standby</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Recognition Card (Matches Video Viewport Height) */}
      <div className="relative flex-1 min-h-[320px] sm:min-h-[360px] md:min-h-[380px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-[#FCFCFD] dark:bg-zinc-900 p-6 flex flex-col justify-between shadow-sm">
        {isAnalyzing && !prediction ? (
          /* Analyzing / Detecting Gestures State */
          <div className="flex-1 flex flex-col items-center justify-center gap-3.5 text-center p-4">
            <div className="w-14 h-14 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shadow-xs">
              <Eye className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" aria-hidden="true" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Watching for Gestures
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Hold your sign steadily inside the camera view. Recognized words will appear here instantly.
              </p>
            </div>
          </div>
        ) : prediction ? (
          /* Active Recognized Sign State */
          <div className="flex flex-col justify-between h-full gap-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Recognized Sign
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {rating}
                </span>
              </div>

              {/* Huge High-Contrast Detected Sign Word */}
              <div className="py-2 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-5xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 select-all">
                  {prediction.label}
                </h3>
              </div>

              {/* Match Quality Meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  <span>Recognition Confidence</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{percent}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-400 h-full transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${percent}%` }}
                    role="progressbar"
                    aria-valuenow={parseFloat(percent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Recognition match confidence"
                  />
                </div>
              </div>
            </div>

            {/* Helpful Confirmation Prompt */}
            <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-3 flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Click <strong>Add to Sentence</strong> below to append this word.</span>
            </div>
          </div>
        ) : (
          /* Idle / No Sign State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shadow-xs">
              <Sparkles className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Awaiting Sign Input
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Start your camera on the left and perform signs in front of the lens. Words will be recognized in real time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button Row (Matches Left Button Row Height Exactly) */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onAddToSentence}
          disabled={!prediction?.label}
          className="flex-1 min-h-[44px] py-2.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>
            {prediction?.label
              ? `Add "${prediction.label}" to Sentence`
              : 'Add to Sentence'}
          </span>
        </button>

        {/* Demo Gesture Sample Button */}
        <button
          type="button"
          onClick={handleTriggerDemo}
          className="min-h-[44px] py-2.5 px-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          title="Simulate a test sign gesture"
          aria-label="Test a sample sign gesture"
        >
          <Wand2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span className="hidden sm:inline">Test Sign</span>
        </button>
      </div>

      {/* Sleek Compact Footer Banner (Matches Left Footer Banner Height Exactly) */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
          Status: {isAnalyzing ? (prediction ? 'Sign ready to add' : 'Actively detecting') : 'Awaiting camera'}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {prediction ? 'Press button to add' : 'Real-time ready'}
        </span>
      </div>
    </div>
  );
}
