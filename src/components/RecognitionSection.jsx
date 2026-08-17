import React from 'react';
import { Plus, Check, Info, ArrowRight } from 'lucide-react';

export default function RecognitionSection({
  prediction,
  onAddToSentence,
  isAnalyzing
}) {
  const confidencePercent = prediction
    ? (prediction.confidence * 100).toFixed(1)
    : '0';

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Recognition
        </label>
        {prediction && (
          <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
            Inference: {prediction.inferenceTimeMs}ms
          </span>
        )}
      </div>

      <div className="flex-1 rounded-md border border-zinc-300 bg-[#FCFCFD] p-5 flex flex-col justify-between min-h-[320px]">
        {isAnalyzing ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-500">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono">Running neural network classification...</p>
          </div>
        ) : prediction ? (
          <div className="flex flex-col justify-between h-full gap-6">
            {/* Top Display: Detected Sign & Primary Confidence */}
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Predicted Sign Class
                </span>
                <div className="flex items-baseline justify-between gap-2 border-b border-zinc-200 pb-3">
                  <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 font-mono">
                    {prediction.label}
                  </h2>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-zinc-800">
                      {confidencePercent}%
                    </span>
                    <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">
                      Confidence
                    </span>
                  </div>
                </div>
              </div>

              {/* Minimal Visual Confidence Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Model Certainty</span>
                  <span className="font-mono text-zinc-700">{prediction.confidence}</span>
                </div>
                <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-zinc-800 h-full transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
              </div>

              {/* Class Probability Distribution Breakdown */}
              {prediction.topPredictions && prediction.topPredictions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Top Probabilities
                  </span>
                  <div className="space-y-1.5 bg-zinc-50 border border-zinc-200 p-2.5 rounded text-xs">
                    {prediction.topPredictions.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className={`font-mono ${idx === 0 ? 'font-semibold text-zinc-900' : 'text-zinc-600'}`}>
                          {item.label}
                        </span>
                        <span className="font-mono text-zinc-600">
                          {(item.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Area */}
            <div className="pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={onAddToSentence}
                className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Sentence</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
              <Info className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="text-sm font-semibold text-zinc-800">No Prediction Available</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Upload a sign language frame or click one of the quick test sample signs on the left to view model output.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
