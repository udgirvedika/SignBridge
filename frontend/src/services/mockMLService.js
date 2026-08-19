/**
 * SignBridge Mock ML Service
 * 
 * This module simulates a computer-vision based sign language classification model (e.g. CNN/Transformer).
 * It receives an image file, blob, or sample identifier, and returns a classification prediction.
 * 
 * To replace with a real backend API:
 * Replace `predictSign` implementation with a `fetch()` call to your ML inference server endpoint.
 */

// Dataset of built-in sample signs for quick demonstration
export const SAMPLE_SIGNS = [
  {
    id: 'hello',
    label: 'HELLO',
    confidence: 0.968,
    topPredictions: [
      { label: 'HELLO', confidence: 0.968 },
      { label: 'WELCOME', confidence: 0.021 },
      { label: 'GOODBYE', confidence: 0.011 },
    ],
    // Clean inline SVG representation for preview
    svg: `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="240" fill="#F4F4F5" rx="8"/>
      <g stroke="#27272A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- Open hand waving sign -->
        <path d="M120 180 V 120" />
        <path d="M95 130 V 85 C 95 78 101 72 108 72 C 115 72 121 78 121 85 V 110" />
        <path d="M121 85 C 121 78 127 72 134 72 C 141 72 147 78 147 85 V 110" />
        <path d="M147 90 C 147 83 153 78 160 78 C 167 78 173 83 173 90 V 125" />
        <path d="M173 105 C 173 99 178 94 184 94 C 190 94 195 99 195 105 V 135 C 195 160 170 180 145 180 H 120" />
        <path d="M95 130 C 90 120 78 115 70 122 C 63 128 65 140 75 148 L 98 165" />
      </g>
      <text x="120" y="215" text-anchor="middle" fill="#52525B" font-family="sans-serif" font-size="12" font-weight="500">Sign: HELLO (ASL)</text>
    </svg>`
  },
  {
    id: 'thank_you',
    label: 'THANK YOU',
    confidence: 0.942,
    topPredictions: [
      { label: 'THANK YOU', confidence: 0.942 },
      { label: 'GOOD', confidence: 0.038 },
      { label: 'PLEASE', confidence: 0.020 },
    ],
    svg: `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="240" fill="#F4F4F5" rx="8"/>
      <g stroke="#27272A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- Hand to chin gesture -->
        <circle cx="120" cy="70" r="28" stroke-width="4"/>
        <path d="M110 98 V 140" stroke-width="5"/>
        <path d="M120 90 L 140 100 L 122 80" />
        <path d="M140 100 L 175 125" />
      </g>
      <text x="120" y="215" text-anchor="middle" fill="#52525B" font-family="sans-serif" font-size="12" font-weight="500">Sign: THANK YOU (ASL)</text>
    </svg>`
  },
  {
    id: 'please',
    label: 'PLEASE',
    confidence: 0.915,
    topPredictions: [
      { label: 'PLEASE', confidence: 0.915 },
      { label: 'SORRY', confidence: 0.055 },
      { label: 'MY', confidence: 0.030 },
    ],
    svg: `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="240" fill="#F4F4F5" rx="8"/>
      <g stroke="#27272A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- Circular chest gesture -->
        <circle cx="120" cy="110" r="45" stroke-dasharray="8 6"/>
        <path d="M145 90 L 130 75 L 120 95" />
        <path d="M110 140 V 165" />
      </g>
      <text x="120" y="215" text-anchor="middle" fill="#52525B" font-family="sans-serif" font-size="12" font-weight="500">Sign: PLEASE (ASL)</text>
    </svg>`
  },
  {
    id: 'yes',
    label: 'YES',
    confidence: 0.981,
    topPredictions: [
      { label: 'YES', confidence: 0.981 },
      { label: 'UNDERSTOOD', confidence: 0.012 },
      { label: 'OK', confidence: 0.007 },
    ],
    svg: `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="240" fill="#F4F4F5" rx="8"/>
      <g stroke="#27272A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- Fist nodding gesture -->
        <rect x="90" y="80" width="60" height="65" rx="12" />
        <path d="M120 145 V 175" stroke-width="5" />
        <path d="M100 65 L 120 80 L 140 65" />
      </g>
      <text x="120" y="215" text-anchor="middle" fill="#52525B" font-family="sans-serif" font-size="12" font-weight="500">Sign: YES (ASL)</text>
    </svg>`
  },
  {
    id: 'help',
    label: 'HELP',
    confidence: 0.954,
    topPredictions: [
      { label: 'HELP', confidence: 0.954 },
      { label: 'SUPPORT', confidence: 0.031 },
      { label: 'NEED', confidence: 0.015 },
    ],
    svg: `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="240" fill="#F4F4F5" rx="8"/>
      <g stroke="#27272A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- Fist on open palm -->
        <path d="M60 160 H 180" stroke-width="7" />
        <rect x="100" y="90" width="40" height="50" rx="8" />
        <path d="M120 70 V 90" stroke-width="4" />
      </g>
      <text x="120" y="215" text-anchor="middle" fill="#52525B" font-family="sans-serif" font-size="12" font-weight="500">Sign: HELP (ASL)</text>
    </svg>`
  },
  {
    id: 'water',
    label: 'WATER',
    confidence: 0.927,
    topPredictions: [
      { label: 'WATER', confidence: 0.927 },
      { label: 'DRINK', confidence: 0.051 },
      { label: 'LIQUID', confidence: 0.022 },
    ],
    svg: `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="240" fill="#F4F4F5" rx="8"/>
      <g stroke="#27272A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- 'W' hand shape at chin -->
        <path d="M85 80 L 100 140 L 120 90 L 140 140 L 155 80" />
        <line x1="80" y1="165" x2="160" y2="165" stroke-dasharray="4 4"/>
      </g>
      <text x="120" y="215" text-anchor="middle" fill="#52525B" font-family="sans-serif" font-size="12" font-weight="500">Sign: WATER (ASL)</text>
    </svg>`
  },
  {
    id: 'good',
    label: 'GOOD',
    confidence: 0.973,
    topPredictions: [
      { label: 'GOOD', confidence: 0.973 },
      { label: 'WELL', confidence: 0.018 },
      { label: 'GREAT', confidence: 0.009 },
    ],
    svg: `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="240" fill="#F4F4F5" rx="8"/>
      <g stroke="#27272A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- Good sign hand stroke -->
        <path d="M120 70 L 120 120 L 160 160" />
        <path d="M80 160 H 160" stroke-width="6" />
      </g>
      <text x="120" y="215" text-anchor="middle" fill="#52525B" font-family="sans-serif" font-size="12" font-weight="500">Sign: GOOD (ASL)</text>
    </svg>`
  },
  {
    id: 'friend',
    label: 'FRIEND',
    confidence: 0.939,
    topPredictions: [
      { label: 'FRIEND', confidence: 0.939 },
      { label: 'TOGETHER', confidence: 0.041 },
      { label: 'LINK', confidence: 0.020 },
    ],
    svg: `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="240" fill="#F4F4F5" rx="8"/>
      <g stroke="#27272A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- Interlocking hooks gesture -->
        <path d="M90 100 C 90 80 120 80 120 100 L 120 130" />
        <path d="M150 130 C 150 150 120 150 120 130 L 120 100" />
      </g>
      <text x="120" y="215" text-anchor="middle" fill="#52525B" font-family="sans-serif" font-size="12" font-weight="500">Sign: FRIEND (ASL)</text>
    </svg>`
  }
];

/**
 * Predict sign language translation from input file or sample item.
 * @param {File|Object|string} input - Uploaded File object or Sample object
 * @returns {Promise<Object>} Prediction result containing label, confidence, topPredictions, and inference time
 */
export async function predictSign(input) {
  // Artificial latency simulating CNN model forward pass inference (180ms - 280ms)
  const latency = Math.floor(Math.random() * 100) + 180;
  await new Promise(resolve => setTimeout(resolve, latency));

  // If input matches a known sample sign
  if (typeof input === 'object' && input.label) {
    return {
      label: input.label,
      confidence: input.confidence,
      topPredictions: input.topPredictions,
      inferenceTimeMs: latency,
      timestamp: new Date().toISOString()
    };
  }

  // If user uploaded a custom file, generate a realistic deterministic/probabilistic prediction
  const pool = SAMPLE_SIGNS;
  // Use file name or size to pick a consistent sign prediction if user re-uploads
  let seedIndex = 0;
  if (input && input.name) {
    seedIndex = input.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % pool.length;
  } else {
    seedIndex = Math.floor(Math.random() * pool.length);
  }

  const selected = pool[seedIndex];
  const variation = (Math.random() * 0.05 - 0.025); // Slight confidence jitter
  const confidence = Math.min(0.99, Math.max(0.85, Number((selected.confidence + variation).toFixed(3))));

  // Generate top alternative predictions
  const alt1 = pool[(seedIndex + 1) % pool.length].label;
  const alt2 = pool[(seedIndex + 2) % pool.length].label;
  const remaining = Number((1 - confidence).toFixed(3));

  return {
    label: selected.label,
    confidence: confidence,
    topPredictions: [
      { label: selected.label, confidence: confidence },
      { label: alt1, confidence: Number((remaining * 0.65).toFixed(3)) },
      { label: alt2, confidence: Number((remaining * 0.35).toFixed(3)) }
    ],
    inferenceTimeMs: latency,
    timestamp: new Date().toISOString()
  };
}
