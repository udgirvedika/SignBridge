# SignBridge 🤟

**Real-time sign language → text, straight from your webcam.**

SignBridge streams webcam frames to a Python backend, extracts body and hand
landmarks with MediaPipe Holistic, and classifies short landmark sequences into
signs. Recognized signs can be collected into a sentence, translated into 12
languages, and read aloud in the browser.

```text
 Browser (React)            FastAPI backend                      Model
┌──────────────┐  JPEG    ┌──────────────────────────┐      ┌────────────────┐
│ Webcam       │ frames   │ MediaPipe Holistic       │      │ BiGRU (PyTorch)│
│ capture      │ ───────▶ │ → landmark vector/frame  │ ───▶ │ trained on     │
│ @ ~12 FPS    │ WebSocket│ → 30-frame sliding window│      │ WLASL          │
│              │ ◀─────── │ → predict → smoothing    │ ◀─── │ (or rule-based │
│ Sentence /   │ {label,  └──────────────────────────┘      │ fallback)      │
│ TTS / i18n   │ conf}                                      └────────────────┘
└──────────────┘
```

---

## Features

- **Live recognition** over a WebSocket: webcam frames in, `{prediction, confidence}` out
- **MediaPipe Holistic** landmarks (pose + both hands, optional face mesh)
- **Temporal smoothing**: a sign is only emitted when it clears a confidence
  threshold and repeats on consecutive predictions, which cuts flicker
- **Trainable sequence model**: a bidirectional GRU trained on the
  [WLASL](https://github.com/dxli94/WLASL) dataset, with scripts for
  preprocessing, training and evaluation
- **Rule-based fallback**: if no trained checkpoint is found, the backend uses a
  simple hand-shape heuristic so the app still works end to end
- **Sentence builder**: add recognized signs, undo, clear
- **Text-to-speech** via the browser's Web Speech API (adjustable speech rate)
- **Translation** into 12 languages: English, Spanish, French, German, Hindi,
  Telugu, Japanese, Korean, Chinese, Arabic, Portuguese, Russian
- **Accessibility panel**: light/dark theme, font size scaling, language and
  speech settings (saved in `localStorage`)

## Tech stack

| Layer    | Tools |
|----------|-------|
| Frontend | React 19, Vite, Tailwind CSS 4, lucide-react, oxlint |
| Backend  | FastAPI, Uvicorn, WebSockets, OpenCV, MediaPipe 0.10.14, NumPy |
| ML       | PyTorch (BiGRU classifier), scikit-learn, Matplotlib |
| Data     | WLASL (Word-Level American Sign Language) |

## Project structure

```text
SignBridge/
├── backend/
│   ├── main.py            # FastAPI app, WebSocket endpoint, sessions, smoothing
│   ├── landmarks.py       # MediaPipe Holistic setup, frame decoding, landmark vectors
│   ├── preprocessing.py   # Interpolate missing frames, resample, normalize
│   ├── model.py           # Loads trained checkpoint, or falls back to heuristics
│   ├── test_client.py     # Stream your webcam to the backend without the frontend
│   ├── requirements.txt
│   └── README.md          # Backend details
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/    # Navbar, InputSection, RecognitionSection,
│   │   │                  # TranslationSection, StatusBar, AccessibilityPanel
│   │   ├── context/       # AccessibilityContext (theme, language, TTS, font size)
│   │   └── services/      # signStreamClient.js (webcam + WebSocket),
│   │                      # mockMLService.js (leftover demo mock)
│   └── package.json
└── ml/
    ├── sign_model.py      # SignSequenceClassifier (BiGRU)
    ├── wlasl_pipeline.py  # Metadata, manifest, video → landmark extraction
    ├── scripts/
    │   ├── preprocess_wlasl.py
    │   ├── train_sequence_model.py
    │   └── evaluate_sequence_model.py
    ├── dataset/WLASL      # Put the WLASL dataset here (not included)
    └── README.md          # Full ML pipeline guide
```

## Getting started

### Prerequisites

- **Python 3.10 or 3.11** (the pinned `mediapipe==0.10.14` and `numpy==1.26.4`
  are the reason to avoid very new Python versions)
- **Node.js** (a recent LTS, 20.19+ or 22+, for Vite)
- A **webcam**, and a browser that allows camera access

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

- Health check: `http://127.0.0.1:8000/health`
- WebSocket: `ws://127.0.0.1:8000/ws/sign-stream`

With no trained model present, the backend logs a warning and uses the
rule-based fallback. To use a trained model, see [Train your own model](#train-your-own-model).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`), click **Start
Camera**, allow camera access, and start signing. Make sure the backend is
already running.

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

### 3. Test the backend without the frontend

```bash
cd backend
python test_client.py
```

This streams your webcam to the backend at about 12 FPS and prints each
prediction and confidence to the terminal.

## Configuration

### Backend (`backend/.env`)

The backend loads `backend/.env` on startup (it is git-ignored).

| Variable | Default | What it does |
|----------|---------|--------------|
| `SIGNBRIDGE_HOST` | `0.0.0.0` | Host used when running `python main.py` |
| `SIGNBRIDGE_PORT` | `8000` | Port used when running `python main.py` |
| `SIGNBRIDGE_RELOAD` | `true` | Auto-reload when running `python main.py` |
| `SIGNBRIDGE_WINDOW_SIZE` | `30` | Number of frames in the sliding landmark window |
| `SIGNBRIDGE_CONFIDENCE_THRESHOLD` | `0.7` | Minimum confidence before a prediction counts |
| `SIGNBRIDGE_CONSECUTIVE_PREDICTIONS` | `3` | Same prediction needed this many times in a row |
| `SIGNBRIDGE_INCLUDE_FACE_LANDMARKS` | `false` | Add 468 face landmarks (must match how the model was trained) |
| `SIGNBRIDGE_MODEL_DIR` | `ml/runs/latest` | Folder with `best_model.pt` and `model_config.json` |

### Frontend (`frontend/.env`)

| Variable | Default | What it does |
|----------|---------|--------------|
| `VITE_SIGNBRIDGE_WS_URL` | `ws://127.0.0.1:8000/ws/sign-stream` | Backend WebSocket URL |
| `VITE_SIGNBRIDGE_FRAME_FPS` | `12` | Frames sent per second |
| `VITE_SIGNBRIDGE_JPEG_QUALITY` | `0.8` | JPEG quality (0 to 1) |
| `VITE_SIGNBRIDGE_CAPTURE_WIDTH` | `640` | Capture width in px |
| `VITE_SIGNBRIDGE_CAPTURE_HEIGHT` | `480` | Capture height in px |

## WebSocket protocol

**Client → server** (one message per frame):

```json
{ "frame": "<base64-encoded JPEG or PNG, data-URL prefix allowed>" }
```

**Server → client**:

```json
{ "prediction": "hello", "confidence": 0.92 }
```

When there is no confident, stable prediction yet:

```json
{ "prediction": null, "confidence": 0.0 }
```

## How it works

1. **Capture.** The browser grabs webcam frames, encodes them as JPEG, and sends
   them over the WebSocket.
2. **Landmarks.** MediaPipe Holistic turns each frame into one feature vector:
   pose (33 points × x, y, z, visibility) plus left and right hand (21 points × x, y, z each).
   That is **258 values** per frame, or 1,662 with face landmarks enabled.
3. **Window.** Vectors go into a per-connection sliding window (30 frames by
   default). Predictions start once at least 10 frames are buffered.
4. **Preprocess.** Frames where nothing was detected are interpolated, the
   sequence is resampled to a fixed length, and features are normalized with the
   training-set mean and std.
5. **Classify.** The BiGRU outputs class probabilities.
6. **Smooth.** A label is emitted only if its confidence is at least 0.7 and it
   wins 3 predictions in a row. The reported confidence is the average of those 3.

### Fallback recognizer

Without a trained checkpoint, `backend/model.py` uses geometry rules on the most
recent frames. It can output: `HELLO`, `YES`, `NO`, `YOU`, `STOP`, `PEACE`,
`OK`, `I LOVE YOU`, `PROMISE`, and `PLEASE` (two hands close together). This is
a lightweight demo mode, not a trained model, so expect limited accuracy.

## Train your own model

Full details are in [`ml/README.md`](ml/README.md). The short version:

**1. Get WLASL.** `ml/dataset/WLASL` is empty in a fresh clone, so download the
dataset yourself. The scripts expect:

```text
ml/dataset/WLASL/start_kit/WLASL_v0.3.json
ml/dataset/WLASL/videos/<video_id>.mp4
```

**2. Preprocess videos into landmarks** (default: the 15 glosses with the most
samples, keeping the official train/val/test splits):

```bash
python -m ml.scripts.preprocess_wlasl --class-count 15
```

**3. Train** (AdamW, early stopping on validation loss; defaults are 60 epochs,
batch size 32, learning rate 1e-3, hidden size 128, 2 layers, dropout 0.2):

```bash
python -m ml.scripts.train_sequence_model --processed-dir ml/processed/wlasl_holistic_15
```

Each run is saved under `ml/runs/<run-name>/` and copied to `ml/runs/latest/`,
with `best_model.pt`, `model_config.json`, `metrics.json`, and a confusion
matrix as CSV and PNG.

**4. Evaluate:**

```bash
python -m ml.scripts.evaluate_sequence_model --run-dir ml/runs/latest
```

**5. Use it.** The backend picks up `ml/runs/latest` automatically. To point it
elsewhere:

```bash
SIGNBRIDGE_MODEL_DIR=/path/to/run uvicorn main:app --reload
```

## Current status and limitations

- Recognition works on **isolated, word-level signs**, not continuous
  signing or grammar.
- The default model covers a small vocabulary (15 WLASL glosses unless you
  retrain with `--class-count` or `--classes`).
- The default training splits come from WLASL, so accuracy depends on how close
  your lighting, framing, and signing style are to that data.
- Translation uses the free [MyMemory](https://mymemory.translated.net/) API, so
  it needs internet access and is subject to its usage limits.
- The backend CORS policy allows all origins, which is fine for local
  development but should be tightened before any deployment.
- `torch`, `scikit-learn`, and `matplotlib` are unpinned in `requirements.txt`.

## Acknowledgements

- [WLASL](https://github.com/dxli94/WLASL) for the word-level ASL dataset
- [MediaPipe](https://developers.google.com/mediapipe) for Holistic landmark detection
- [FastAPI](https://fastapi.tiangolo.com/), [PyTorch](https://pytorch.org/),
  [React](https://react.dev/), [Vite](https://vite.dev/), and
  [Tailwind CSS](https://tailwindcss.com/)

## License

No license file is included yet. Add one (for example MIT) before sharing the
project more widely.
