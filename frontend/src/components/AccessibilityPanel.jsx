import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  Languages,
  Volume2,
  VolumeX,
  Accessibility,
  X,
  Type,
  Minus,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibilityPanel() {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    speakText,
    stopSpeaking,
    isSpeaking,
    speechRate,
    setSpeechRate,
    fontSize,
    setFontSize,
    supportedLanguages,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const panelRef = useRef(null);

  const currentLang = supportedLanguages.find((l) => l.code === language);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={panelRef} className="accessibility-panel-container">
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="accessibility-fab"
        title="Accessibility Options"
        aria-label="Open accessibility panel"
      >
        {isOpen ? (
          <X className="accessibility-fab-icon" />
        ) : (
          <Accessibility className="accessibility-fab-icon" />
        )}
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="accessibility-panel">
          <div className="accessibility-panel-header">
            <Accessibility className="accessibility-panel-header-icon" />
            <span>Accessibility</span>
          </div>

          {/* Theme Toggle */}
          <div className="accessibility-section">
            <label className="accessibility-section-label">Theme</label>
            <button
              type="button"
              onClick={toggleTheme}
              className="accessibility-theme-toggle"
            >
              <div className="accessibility-theme-toggle-track">
                <div
                  className={`accessibility-theme-toggle-thumb ${
                    theme === 'dark' ? 'accessibility-theme-toggle-thumb--dark' : ''
                  }`}
                >
                  {theme === 'dark' ? (
                    <Moon className="accessibility-theme-icon" />
                  ) : (
                    <Sun className="accessibility-theme-icon" />
                  )}
                </div>
              </div>
              <span className="accessibility-theme-label">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>
          </div>

          {/* Language Selector */}
          <div className="accessibility-section">
            <label className="accessibility-section-label">
              <Languages className="accessibility-section-label-icon" />
              Translation Language
            </label>
            <div className="accessibility-lang-wrapper">
              <button
                type="button"
                onClick={() => setLangDropdownOpen((prev) => !prev)}
                className="accessibility-lang-button"
              >
                <span className="accessibility-lang-flag">{currentLang?.flag}</span>
                <span className="accessibility-lang-name">{currentLang?.name}</span>
                <ChevronDown
                  className={`accessibility-lang-chevron ${
                    langDropdownOpen ? 'accessibility-lang-chevron--open' : ''
                  }`}
                />
              </button>

              {langDropdownOpen && (
                <div className="accessibility-lang-dropdown">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`accessibility-lang-option ${
                        language === lang.code ? 'accessibility-lang-option--active' : ''
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                      {language === lang.code && (
                        <span className="accessibility-lang-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Speech Rate */}
          {/* Speech Rate */}
          <div className="accessibility-section">
            <label className="accessibility-section-label" htmlFor="speech-rate-slider">
              <Volume2 className="accessibility-section-label-icon" aria-hidden="true" />
              Speech Rate
            </label>
            <div className="accessibility-speech-rate">
              <input
                id="speech-rate-slider"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="accessibility-range"
                aria-label="Adjust text-to-speech speed rate"
              />
              <span className="accessibility-rate-value">{speechRate.toFixed(1)}x</span>
            </div>
            <div className="accessibility-speech-buttons">
              <button
                type="button"
                onClick={() => speakText('Hello! This is a test of the read aloud feature.', language)}
                className="accessibility-btn accessibility-btn--primary"
                disabled={isSpeaking}
                aria-label="Test text-to-speech voice"
              >
                <Volume2 className="accessibility-btn-icon" aria-hidden="true" />
                Test Voice
              </button>
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="accessibility-btn accessibility-btn--danger"
                  aria-label="Stop speech synthesis"
                >
                  <VolumeX className="accessibility-btn-icon" aria-hidden="true" />
                  Stop
                </button>
              )}
            </div>
          </div>

          {/* Font Size */}
          <div className="accessibility-section">
            <span className="accessibility-section-label">
              <Type className="accessibility-section-label-icon" aria-hidden="true" />
              Font Size
            </span>
            <div className="accessibility-fontsize">
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(75, s - 10))}
                className="accessibility-fontsize-btn"
                disabled={fontSize <= 75}
                aria-label="Decrease application font size"
                title="Decrease font size"
              >
                <Minus className="accessibility-fontsize-btn-icon" aria-hidden="true" />
              </button>
              <span className="accessibility-fontsize-value" aria-live="polite">
                {fontSize}%
              </span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(150, s + 10))}
                className="accessibility-fontsize-btn"
                disabled={fontSize >= 150}
                aria-label="Increase application font size"
                title="Increase font size"
              >
                <Plus className="accessibility-fontsize-btn-icon" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
