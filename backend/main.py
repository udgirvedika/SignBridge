import json
import logging
import os
from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Deque
from uuid import uuid4

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from landmarks import create_holistic, decode_base64_frame, extract_landmark_vector
from model import predict


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ[key.strip()] = value.strip()


BASE_DIR = Path(__file__).resolve().parent
load_env_file(BASE_DIR / ".env")

WINDOW_SIZE = int(os.getenv("SIGNBRIDGE_WINDOW_SIZE", "30"))
CONFIDENCE_THRESHOLD = float(os.getenv("SIGNBRIDGE_CONFIDENCE_THRESHOLD", "0.7"))
CONSECUTIVE_PREDICTION_COUNT = int(
    os.getenv("SIGNBRIDGE_CONSECUTIVE_PREDICTIONS", "3")
)
INCLUDE_FACE_LANDMARKS = (
    os.getenv("SIGNBRIDGE_INCLUDE_FACE_LANDMARKS", "false").lower() == "true"
)
HOST = os.getenv("SIGNBRIDGE_HOST", "0.0.0.0")
PORT = int(os.getenv("SIGNBRIDGE_PORT", "8000"))
RELOAD = os.getenv("SIGNBRIDGE_RELOAD", "true").lower() == "true"

logger = logging.getLogger("signbridge.backend")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="SignBridge Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@dataclass
class TemporalSmoothingState:
    recent_predictions: Deque[str] = field(
        default_factory=lambda: deque(maxlen=CONSECUTIVE_PREDICTION_COUNT)
    )
    recent_confidences: Deque[float] = field(
        default_factory=lambda: deque(maxlen=CONSECUTIVE_PREDICTION_COUNT)
    )
    last_emitted_prediction: str | None = None


@dataclass
class SessionState:
    session_id: str
    landmark_window: Deque[np.ndarray]
    holistic: object
    smoothing: TemporalSmoothingState


active_sessions: dict[str, SessionState] = {}
# TODO: If you later need cross-endpoint session lookups, move this into a small session manager.


def build_session_state() -> SessionState:
    session_id = str(uuid4())
    return SessionState(
        session_id=session_id,
        landmark_window=deque(maxlen=WINDOW_SIZE),
        holistic=create_holistic(include_face_landmarks=INCLUDE_FACE_LANDMARKS),
        smoothing=TemporalSmoothingState(),
    )


def smooth_prediction(
    prediction: str,
    confidence: float,
    smoothing_state: TemporalSmoothingState,
) -> tuple[str | None, float]:
    if confidence < CONFIDENCE_THRESHOLD:
        smoothing_state.recent_predictions.clear()
        smoothing_state.recent_confidences.clear()
        return None, 0.0

    smoothing_state.recent_predictions.append(prediction)
    smoothing_state.recent_confidences.append(confidence)

    if len(smoothing_state.recent_predictions) < CONSECUTIVE_PREDICTION_COUNT:
        return None, 0.0

    if len(set(smoothing_state.recent_predictions)) != 1:
        return None, 0.0

    averaged_confidence = sum(smoothing_state.recent_confidences) / len(
        smoothing_state.recent_confidences
    )
    smoothing_state.last_emitted_prediction = prediction
    return prediction, float(averaged_confidence)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws/sign-stream")
async def sign_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    session = build_session_state()
    active_sessions[session.session_id] = session
    logger.info("WebSocket connected: %s", session.session_id)

    try:
        while True:
            raw_message = await websocket.receive_text()

            try:
                payload = json.loads(raw_message)
                frame_b64 = payload["frame"]

                frame = decode_base64_frame(frame_b64)
                landmark_vector = extract_landmark_vector(
                    session.holistic,
                    frame,
                    include_face_landmarks=INCLUDE_FACE_LANDMARKS,
                )
                session.landmark_window.append(landmark_vector)

                prediction_payload = {"prediction": None, "confidence": 0.0}

                if len(session.landmark_window) == WINDOW_SIZE:
                    landmark_sequence = np.array(
                        session.landmark_window, dtype=np.float32
                    )
                    predicted_label, confidence = predict(landmark_sequence)
                    smoothed_prediction, smoothed_confidence = smooth_prediction(
                        predicted_label,
                        confidence,
                        session.smoothing,
                    )
                    prediction_payload = {
                        "prediction": smoothed_prediction,
                        "confidence": (
                            smoothed_confidence if smoothed_prediction else 0.0
                        ),
                    }

                await websocket.send_json(prediction_payload)
            except KeyError:
                logger.warning(
                    "WebSocket %s sent a payload without a frame key",
                    session.session_id,
                )
                await websocket.send_json({"prediction": None, "confidence": 0.0})
            except Exception as exc:
                logger.exception(
                    "Frame processing failed for session %s: %s",
                    session.session_id,
                    exc,
                )
                await websocket.send_json({"prediction": None, "confidence": 0.0})
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: %s", session.session_id)
    finally:
        session.landmark_window.clear()
        session.smoothing.recent_predictions.clear()
        session.smoothing.recent_confidences.clear()
        session.holistic.close()
        active_sessions.pop(session.session_id, None)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=HOST, port=PORT, reload=RELOAD)
