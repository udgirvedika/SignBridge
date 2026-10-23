import React, { useEffect, useRef, useState } from 'react';
import Navbar from './components/Navbar';
import InputSection from './components/InputSection';
import RecognitionSection from './components/RecognitionSection';
import TranslationSection from './components/TranslationSection';
import StatusBar from './components/StatusBar';
import AccessibilityPanel from './components/AccessibilityPanel';
import { SignStreamClient } from './services/signStreamClient';
import { useAccessibility } from './context/AccessibilityContext';

const WS_URL =
  import.meta.env.VITE_SIGNBRIDGE_WS_URL ?? 'ws://127.0.0.1:8000/ws/sign-stream';

export default function App() {
  const streamClientRef = useRef(null);
  const staleTimerRef = useRef(null);
  const [currentInput, setCurrentInput] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [sentenceWords, setSentenceWords] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [streamStatus, setStreamStatus] = useState('idle');
  const [connectionMessage, setConnectionMessage] = useState('Camera not started');
  const [, setFrameCount] = useState(0);

  const { speakText, language, translateText } = useAccessibility();

  const showToast = (message) => {
    setToastMessage(message);
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => setToastMessage(null), 3500);
  };

  const clearStaleTimer = () => {
    if (staleTimerRef.current) {
      window.clearTimeout(staleTimerRef.current);
      staleTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearStaleTimer();
      if (streamClientRef.current) {
        streamClientRef.current.stop();
        streamClientRef.current = null;
      }
    };
  }, []);

  const stopStreaming = async ({ silent = false } = {}) => {
    clearStaleTimer();
    if (streamClientRef.current) {
      await streamClientRef.current.stop();
      streamClientRef.current = null;
    }

    setIsAnalyzing(false);
    setStreamStatus('idle');
    setConnectionMessage('Camera stopped');
    setFrameCount(0);
    setPrediction(null);

    if (!silent) {
      showToast('Camera stream stopped');
    }
  };

  const startStreaming = async (videoElement) => {
    if (!videoElement) {
      showToast('Camera preview is not ready yet');
      return;
    }

    if (streamClientRef.current) {
      await stopStreaming({ silent: true });
    }

    clearStaleTimer();
    setPrediction(null);
    setCurrentInput({
      id: `camera_${Date.now()}`,
      name: 'Live webcam stream',
      type: 'camera',
    });
    setStreamStatus('connecting');
    setConnectionMessage('Requesting camera permission');
    setIsAnalyzing(true);
    setFrameCount(0);

    const client = new SignStreamClient({
      onStatusChange: (nextStatus, message) => {
        setStreamStatus(nextStatus);
        setConnectionMessage(message);
        setIsAnalyzing(
          nextStatus === 'connecting' || nextStatus === 'streaming'
        );
      },
      onPrediction: (payload) => {
        setFrameCount((count) => count + 1);

        if (payload?.prediction) {
          clearStaleTimer();
          setPrediction({
            label: String(payload.prediction).toUpperCase(),
            confidence: payload.confidence ?? 0,
            timestamp: new Date().toISOString(),
          });

          // Gracefully clear stale prediction after 5 seconds of inactivity
          staleTimerRef.current = window.setTimeout(() => {
            setPrediction(null);
          }, 5000);
        }
      },
      onError: (error) => {
        console.error('Streaming error:', error);
        clearStaleTimer();
        setPrediction(null);
        showToast(error.message || 'Recognition service encountered an issue');
      },
    });

    streamClientRef.current = client;

    try {
      await client.start(videoElement);
      showToast('Camera active and translating signs');
    } catch (error) {
      console.error('Unable to start stream:', error);
      clearStaleTimer();
      setIsAnalyzing(false);
      setStreamStatus('error');
      setCurrentInput(null);
      streamClientRef.current = null;

      let friendlyMsg = 'Unable to start camera. Please verify device permissions.';
      if (
        error.name === 'NotAllowedError' ||
        error.message?.toLowerCase().includes('permission denied')
      ) {
        friendlyMsg =
          'Camera access blocked. Please allow camera permissions in your browser address bar and try again.';
      } else if (
        error.name === 'NotFoundError' ||
        error.message?.toLowerCase().includes('devices not found')
      ) {
        friendlyMsg = 'No camera detected. Please connect a webcam and try again.';
      }
      setConnectionMessage(friendlyMsg);
      showToast(friendlyMsg);
    }
  };

  const handleClearInput = async () => {
    clearStaleTimer();
    await stopStreaming({ silent: true });
    setCurrentInput(null);
    setPrediction(null);
    setConnectionMessage('Camera not started');
  };

  const handleAddToSentence = () => {
    if (!prediction?.label) {
      return;
    }

    setSentenceWords((previous) => [...previous, prediction.label]);
    showToast(`Added "${prediction.label}" to sentence`);
  };

  const handleClearSentence = () => {
    setSentenceWords([]);
    showToast('Sentence cleared');
  };

  const handleUndoSentence = () => {
    setSentenceWords((previous) => previous.slice(0, -1));
  };

  const handleRemoveWord = (indexToRemove) => {
    setSentenceWords((previous) =>
      previous.filter((_, idx) => idx !== indexToRemove)
    );
  };

  const handleSpeakSentence = async (text) => {
    if (!text || text.trim() === '') {
      return;
    }

    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech is not supported in this browser');
      return;
    }

    if (language !== 'en') {
      const translated = await translateText(text, language);
      speakText(translated, language);
      showToast(`Speaking translated text in ${language}`);
    } else {
      speakText(text, 'en');
      showToast(`Speaking "${text}"`);
    }
  };

  const handleSetDemoPrediction = (demoPred) => {
    clearStaleTimer();
    setPrediction(demoPred);
    showToast(`Detected gesture: "${demoPred.label}"`);
    staleTimerRef.current = window.setTimeout(() => {
      setPrediction(null);
    }, 7000);
  };

  const handleResetAll = async () => {
    clearStaleTimer();
    await stopStreaming({ silent: true });
    setCurrentInput(null);
    setPrediction(null);
    setSentenceWords([]);
    setConnectionMessage('Camera not started');
    showToast('Workspace reset');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9FA] text-zinc-900 selection:bg-zinc-200">
      <Navbar onReset={handleResetAll} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-5">
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-24 right-6 sm:right-24 z-[9998] px-5 py-3 bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 text-sm font-semibold rounded-xl shadow-xl border border-zinc-700 dark:border-zinc-300 transition-all animate-[panel-enter_0.3s_ease]"
          >
            {toastMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          <InputSection
            currentInput={currentInput}
            onClearInput={handleClearInput}
            onStartStreaming={startStreaming}
            onStopStreaming={() => stopStreaming()}
            isAnalyzing={isAnalyzing}
            streamStatus={streamStatus}
            connectionMessage={connectionMessage}
            websocketUrl={WS_URL}
          />

          <RecognitionSection
            prediction={prediction}
            onAddToSentence={handleAddToSentence}
            isAnalyzing={isAnalyzing}
            streamStatus={streamStatus}
            connectionMessage={connectionMessage}
            onSetDemoPrediction={handleSetDemoPrediction}
          />
        </div>

        <TranslationSection
          sentenceWords={sentenceWords}
          onClear={handleClearSentence}
          onUndo={handleUndoSentence}
          onRemoveWord={handleRemoveWord}
          onSpeak={handleSpeakSentence}
        />
      </main>

      <StatusBar modelStatus={streamStatus} />

      <AccessibilityPanel />
    </div>
  );
}
