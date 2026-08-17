import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import InputSection from './components/InputSection';
import RecognitionSection from './components/RecognitionSection';
import TranslationSection from './components/TranslationSection';
import StatusBar from './components/StatusBar';
import { predictSign, SAMPLE_SIGNS } from './services/mockMLService';

export default function App() {
  const [currentInput, setCurrentInput] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [sentenceWords, setSentenceWords] = useState(['HELLO', 'THANK YOU']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Show toast feedback
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Run mock ML inference when input changes
  const processInput = async (inputData) => {
    setIsAnalyzing(true);
    setPrediction(null);
    try {
      const result = await predictSign(inputData);
      setPrediction(result);
    } catch (err) {
      console.error("Error predicting sign:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle sample selection
  const handleSelectSample = (sample) => {
    setCurrentInput(sample);
    processInput(sample);
  };

  // Handle user image file upload
  const handleFileUpload = (file) => {
    const previewUrl = URL.createObjectURL(file);
    const inputObj = {
      previewUrl,
      name: file.name,
      file,
      id: `custom_${Date.now()}`
    };
    setCurrentInput(inputObj);
    processInput(file);
  };

  // Clear current input
  const handleClearInput = () => {
    setCurrentInput(null);
    setPrediction(null);
  };

  // Add predicted word to sentence
  const handleAddToSentence = () => {
    if (!prediction || !prediction.label) return;
    setSentenceWords((prev) => [...prev, prediction.label]);
    showToast(`Added "${prediction.label}" to sentence`);
  };

  // Clear sentence
  const handleClearSentence = () => {
    setSentenceWords([]);
  };

  // Undo last word
  const handleUndoSentence = () => {
    setSentenceWords((prev) => prev.slice(0, -1));
  };

  // Speak sentence using Browser Speech Synthesis API
  const handleSpeakSentence = (text) => {
    if (!text || text.trim() === '') return;

    if ('speechSynthesis' in window) {
      // Cancel ongoing speech if any
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      showToast(`Speaking: "${text}"`);
    } else {
      showToast(`Speech synthesis not supported in this browser`);
    }
  };

  // Reset entire dashboard
  const handleResetAll = () => {
    setCurrentInput(null);
    setPrediction(null);
    setSentenceWords([]);
    showToast('Reset application workspace');
  };

  // Select initial sample on mount so workspace isn't empty initially
  useEffect(() => {
    if (SAMPLE_SIGNS && SAMPLE_SIGNS.length > 0) {
      handleSelectSample(SAMPLE_SIGNS[0]);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9FA] text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Navbar */}
      <Navbar onReset={handleResetAll} />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-12 right-6 z-50 px-3.5 py-2 bg-zinc-900 text-zinc-100 text-xs font-medium rounded shadow-sm border border-zinc-700 transition-all">
            {toastMessage}
          </div>
        )}

        {/* Split Grid: Left Input vs Right Recognition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <InputSection
            currentInput={currentInput}
            onSelectSample={handleSelectSample}
            onFileUpload={handleFileUpload}
            onClearInput={handleClearInput}
            isAnalyzing={isAnalyzing}
          />

          <RecognitionSection
            prediction={prediction}
            onAddToSentence={handleAddToSentence}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Sentence Translation Section */}
        <TranslationSection
          sentenceWords={sentenceWords}
          onClear={handleClearSentence}
          onUndo={handleUndoSentence}
          onSpeak={handleSpeakSentence}
        />
      </main>

      {/* Bottom Model Status Bar */}
      <StatusBar modelStatus="Ready" totalClasses={20} />
    </div>
  );
}
