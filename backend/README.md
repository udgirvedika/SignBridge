# SignBridge Backend

This backend receives webcam frames over a WebSocket, extracts MediaPipe
landmarks, buffers a 30-frame sequence, and returns smoothed sign predictions
in real time.

## Run it

Create and activate a virtual environment, then install dependencies:

```bash
pip install -r requirements.txt
```

Set values in `.env` if you want to change the host, port, smoothing, or face
landmark toggle.

To use a trained WLASL model, point the backend at the saved run directory:

```bash
SIGNBRIDGE_MODEL_DIR=../ml/runs/latest
SIGNBRIDGE_WINDOW_SIZE=30
SIGNBRIDGE_INCLUDE_FACE_LANDMARKS=false
```

Start the backend from the `backend` folder:

```bash
uvicorn main:app --reload
```

The default server is available at `http://127.0.0.1:8000`, and the WebSocket
endpoint is:

```text
ws://127.0.0.1:8000/ws/sign-stream
```

## WebSocket message formats

Incoming message from the frontend or test client:

```json
{
  "frame": "<base64-encoded-jpeg-or-png>"
}
```

Outgoing message from the backend:

```json
{
  "prediction": "hello",
  "confidence": 0.92
}
```

If the backend does not yet have a confident, stable prediction, it returns:

```json
{
  "prediction": null,
  "confidence": 0.0
}
```

## Frontend wiring

The Vite frontend reads its WebSocket URL and capture settings from
`frontend/.env`:

```text
VITE_SIGNBRIDGE_WS_URL=ws://127.0.0.1:8000/ws/sign-stream
VITE_SIGNBRIDGE_FRAME_FPS=12
VITE_SIGNBRIDGE_JPEG_QUALITY=0.8
```

Start the frontend from the `frontend` folder with:

```bash
npm run dev
```

## Notes

- `main.py` owns the FastAPI app, WebSocket endpoint, session lifecycle, and
  temporal smoothing.
- `landmarks.py` owns MediaPipe Holistic setup, frame decoding, and fixed-length
  landmark vector extraction.
- `preprocessing.py` owns missing-frame interpolation, temporal resampling, and
  normalization. The ML scripts and live backend both use this file.
- `model.py` loads `SIGNBRIDGE_MODEL_DIR/best_model.pt` plus
  `model_config.json` and returns `unknown` until a trained checkpoint exists.
- `test_client.py` streams webcam frames directly to the backend at roughly
  12 FPS so you can test the pipeline without the frontend.

See `../ml/README.md` for WLASL preprocessing, training, evaluation, and model
artifact commands.
