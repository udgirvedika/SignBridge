import numpy as np

DUMMY_LABELS = ("hello", "thanks", "yes", "no", "please")


def predict(landmark_sequence: np.ndarray) -> tuple[str, float]:
    """
    Placeholder model hook.

    Replace this with your real model inference call. The backend expects a
    (window_size, feature_dim) array and returns a (label, confidence) pair.
    """
    if landmark_sequence.ndim != 2 or landmark_sequence.size == 0:
        return "unknown", 0.0

    magnitude = float(np.mean(np.abs(landmark_sequence)))
    bucket = min(int(magnitude * 1000) % len(DUMMY_LABELS), len(DUMMY_LABELS) - 1)
    predicted_label = DUMMY_LABELS[bucket]

    non_zero_ratio = float(np.count_nonzero(landmark_sequence) / landmark_sequence.size)
    confidence = float(min(0.95, 0.45 + non_zero_ratio))
    return predicted_label, confidence
