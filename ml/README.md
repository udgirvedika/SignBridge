# SignBridge ML Pipeline

This pipeline trains a lightweight sequence classifier on WLASL videos using the
same MediaPipe Holistic feature vector as the live FastAPI backend:

`pose 33x(x,y,z,visibility) + left hand 21x(x,y,z) + right hand 21x(x,y,z)`.

Face landmarks are optional and must match `SIGNBRIDGE_INCLUDE_FACE_LANDMARKS`
in the backend.

## 1. Install dependencies

From the repo root:

```powershell
pip install -r backend/requirements.txt
```

PyTorch install commands vary by CPU/GPU. Install the build you want from the
official PyTorch selector, then install:

```powershell
pip install scikit-learn matplotlib
```

## 2. Put WLASL videos in place

The metadata is expected at:

```text
ml/dataset/WLASL/start_kit/WLASL_v0.3.json
```

Download videos with the WLASL start kit or your preferred process, and store
them as `<video_id>.mp4` under:

```text
ml/dataset/WLASL/videos
```

You can override paths in every command.

## 3. Preprocess landmarks

Default class count is 15. The official WLASL `train`, `val`, and `test` splits
are preserved.

```powershell
python -m ml.scripts.preprocess_wlasl --class-count 15
```

Useful options:

```powershell
python -m ml.scripts.preprocess_wlasl `
  --metadata ml/dataset/WLASL/start_kit/WLASL_v0.3.json `
  --videos-dir ml/dataset/WLASL/videos `
  --output-dir ml/processed/wlasl_holistic_15 `
  --sequence-length 30 `
  --class-count 15
```

## 4. Train

```powershell
python -m ml.scripts.train_sequence_model --processed-dir ml/processed/wlasl_holistic_15
```

Outputs are written to `ml/runs/<run-name>/`, including:

- `best_model.pt`
- `model_config.json`
- `metrics.json`
- `confusion_matrix.csv`
- `confusion_matrix.png`

## 5. Evaluate

```powershell
python -m ml.scripts.evaluate_sequence_model --run-dir ml/runs/latest
```

## 6. Run Real Inference In The Backend

Point the backend at the trained artifacts:

```powershell
$env:SIGNBRIDGE_MODEL_DIR = "E:\SignBridge\ml\runs\latest"
$env:SIGNBRIDGE_WINDOW_SIZE = "30"
$env:SIGNBRIDGE_INCLUDE_FACE_LANDMARKS = "false"
uvicorn backend.main:app --reload
```

`backend/model.py` returns `unknown` until a valid checkpoint is configured.
The existing WebSocket shape and smoothing behavior are unchanged.
