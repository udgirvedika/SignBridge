import base64
from typing import Iterable

import cv2
import numpy as np
from mediapipe.python.solutions import holistic as mp_holistic

POSE_LANDMARK_COUNT = 33
HAND_LANDMARK_COUNT = 21
FACE_LANDMARK_COUNT = 468

def create_holistic(include_face_landmarks: bool) -> mp_holistic.Holistic:
    return mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        enable_segmentation=False,
        refine_face_landmarks=include_face_landmarks,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )


def decode_base64_frame(frame_b64: str) -> np.ndarray:
    if "," in frame_b64:
        frame_b64 = frame_b64.split(",", 1)[1]

    frame_bytes = base64.b64decode(frame_b64)
    frame_array = np.frombuffer(frame_bytes, dtype=np.uint8)
    frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)

    if frame is None:
        raise ValueError("Unable to decode frame bytes into an image")

    return frame


def _flatten_landmarks(
    landmark_list: Iterable,
    expected_count: int,
    values_per_landmark: int,
    include_visibility: bool = False,
) -> list[float]:
    flattened: list[float] = []

    if landmark_list is None:
        return [0.0] * (expected_count * values_per_landmark)

    for landmark in landmark_list:
        flattened.extend([landmark.x, landmark.y, landmark.z])
        if include_visibility:
            flattened.append(getattr(landmark, "visibility", 0.0))

    missing_values = (expected_count * values_per_landmark) - len(flattened)
    if missing_values > 0:
        flattened.extend([0.0] * missing_values)

    return flattened


def extract_landmark_vector(
    holistic: mp_holistic.Holistic,
    frame: np.ndarray,
    include_face_landmarks: bool,
) -> np.ndarray:
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = holistic.process(rgb_frame)

    pose = _flatten_landmarks(
        getattr(results.pose_landmarks, "landmark", None),
        expected_count=POSE_LANDMARK_COUNT,
        values_per_landmark=4,
        include_visibility=True,
    )
    left_hand = _flatten_landmarks(
        getattr(results.left_hand_landmarks, "landmark", None),
        expected_count=HAND_LANDMARK_COUNT,
        values_per_landmark=3,
    )
    right_hand = _flatten_landmarks(
        getattr(results.right_hand_landmarks, "landmark", None),
        expected_count=HAND_LANDMARK_COUNT,
        values_per_landmark=3,
    )

    features = pose + left_hand + right_hand

    if include_face_landmarks:
        face = _flatten_landmarks(
            getattr(results.face_landmarks, "landmark", None),
            expected_count=FACE_LANDMARK_COUNT,
            values_per_landmark=3,
        )
        features.extend(face)

    return np.asarray(features, dtype=np.float32)
