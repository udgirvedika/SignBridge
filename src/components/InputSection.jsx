import React, { useRef, useState } from 'react';
import { Upload, Camera, Image as ImageIcon, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SAMPLE_SIGNS } from '../services/mockMLService';

export default function InputSection({
  currentInput,
  onSelectSample,
  onFileUpload,
  onClearInput,
  isAnalyzing
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraNotice, setCameraNotice] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileUpload(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const triggerCameraNotice = () => {
    setCameraNotice(true);
    setTimeout(() => setCameraNotice(false), 3000);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Sign Input Area
        </label>
        {currentInput && (
          <button
            onClick={onClearInput}
            className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1 font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear Input
          </button>
        )}
      </div>

      {/* Main Drag-and-Drop / Preview Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-1 min-h-[280px] sm:min-h-[320px] rounded-md border transition-all flex flex-col items-center justify-center p-4 bg-[#FCFCFD] ${
          isDragging
            ? 'border-zinc-500 bg-zinc-100/70'
            : 'border-zinc-300 hover:border-zinc-400'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          id="sign-image-upload"
        />

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center p-6">
            <RefreshCw className="w-7 h-7 text-zinc-700 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-800">Processing Sign Frame...</p>
              <p className="text-xs text-zinc-500">Extracting feature vectors</p>
            </div>
          </div>
        ) : currentInput ? (
          <div className="w-full h-full flex flex-col items-center justify-between gap-3 py-2">
            <div className="relative flex-1 w-full max-h-[240px] flex items-center justify-center overflow-hidden rounded bg-zinc-100 border border-zinc-200 p-2">
              {currentInput.previewUrl ? (
                <img
                  src={currentInput.previewUrl}
                  alt="Sign input preview"
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : currentInput.svg ? (
                <div
                  className="w-full h-full max-h-[220px] flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: currentInput.svg }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <ImageIcon className="w-8 h-8 text-zinc-400" />
                  <span className="text-xs font-mono">{currentInput.name}</span>
                </div>
              )}
            </div>

            <div className="w-full flex items-center justify-between text-xs text-zinc-500 px-1 pt-1 border-t border-zinc-200">
              <span className="truncate max-w-[200px] font-mono">
                {currentInput.name || currentInput.label || 'Input Frame'}
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-zinc-700 hover:text-zinc-900 font-medium underline underline-offset-2"
              >
                Replace image
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4 max-w-xs">
            <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-zinc-800 mb-1">
              Drag & drop sign image here
            </p>
            <p className="text-xs text-zinc-500 mb-4">
              Supports PNG, JPG, or WebP sign language frames
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded text-xs font-medium transition-colors shadow-none cursor-pointer"
            >
              Browse Image
            </button>
          </div>
        )}
      </div>

      {/* Camera Input Button & Notice */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerCameraNotice}
            className="flex-1 py-2 px-3 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-300 text-zinc-700 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-zinc-600" />
            <span>Camera Input</span>
            <span className="text-[10px] text-zinc-500 bg-zinc-200/70 px-1.5 py-0.2 rounded">Unavailable</span>
          </button>
        </div>

        {cameraNotice && (
          <div className="p-2.5 bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs rounded flex items-center justify-between">
            <span>Camera stream requires backend video pipeline. Use image upload or sample signs below.</span>
            <button onClick={() => setCameraNotice(false)} className="text-zinc-500 hover:text-zinc-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Preset Sample Sign Quick Selector */}
      <div className="pt-2 border-t border-zinc-200 flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Or Quick Test With Sample Signs
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {SAMPLE_SIGNS.map((sample) => {
            const isSelected = currentInput && currentInput.id === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample)}
                className={`py-1.5 px-2 text-xs font-mono rounded border text-center transition-colors cursor-pointer truncate ${
                  isSelected
                    ? 'bg-zinc-900 text-zinc-100 border-zinc-900'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
                title={`Test with '${sample.label}' sign`}
              >
                {sample.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
