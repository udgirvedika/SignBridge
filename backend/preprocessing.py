from __future__ import annotations

from dataclasses import dataclass

import numpy as np


DEFAULT_SEQUENCE_LENGTH = 30


@dataclass(frozen=True)
class PreprocessingConfig:
    sequence_length: int = DEFAULT_SEQUENCE_LENGTH
    feature_dim: int | None = None
    normalize: bool = True
    mean: list[float] | None = None
    std: list[float] | None = None


def interpolate_missing_frames(sequence: np.ndarray) -> np.ndarray:
    sequence = np.asarray(sequence, dtype=np.float32)
    if sequence.ndim != 2:
        raise ValueError("Expected a 2D landmark sequence")

    fixed = sequence.copy()
    frame_has_signal = np.any(np.abs(fixed) > 1e-8, axis=1)
    if not np.any(frame_has_signal):
        return fixed

    frame_idx = np.arange(fixed.shape[0])
    valid_idx = frame_idx[frame_has_signal]
    for feature_idx in range(fixed.shape[1]):
        values = fixed[:, feature_idx]
        fixed[:, feature_idx] = np.interp(frame_idx, valid_idx, values[frame_has_signal])
    return fixed.astype(np.float32)


def resample_sequence(sequence: np.ndarray, target_length: int) -> np.ndarray:
    sequence = np.asarray(sequence, dtype=np.float32)
    if sequence.ndim != 2:
        raise ValueError("Expected a 2D landmark sequence")
    if target_length <= 0:
        raise ValueError("target_length must be positive")
    if len(sequence) == 0:
        return np.zeros((target_length, sequence.shape[1]), dtype=np.float32)
    if len(sequence) == target_length:
        return sequence.astype(np.float32)
    if len(sequence) == 1:
        return np.repeat(sequence, target_length, axis=0).astype(np.float32)

    old_positions = np.linspace(0.0, 1.0, num=len(sequence), dtype=np.float32)
    new_positions = np.linspace(0.0, 1.0, num=target_length, dtype=np.float32)
    resampled = np.empty((target_length, sequence.shape[1]), dtype=np.float32)
    for feature_idx in range(sequence.shape[1]):
        resampled[:, feature_idx] = np.interp(
            new_positions, old_positions, sequence[:, feature_idx]
        )
    return resampled


def normalize_sequence(
    sequence: np.ndarray,
    mean: np.ndarray | list[float] | None,
    std: np.ndarray | list[float] | None,
) -> np.ndarray:
    sequence = np.asarray(sequence, dtype=np.float32)
    if mean is None or std is None:
        return sequence

    mean_array = np.asarray(mean, dtype=np.float32)
    std_array = np.asarray(std, dtype=np.float32)
    std_array = np.where(std_array < 1e-6, 1.0, std_array)
    return ((sequence - mean_array) / std_array).astype(np.float32)


def prepare_landmark_sequence(
    sequence: np.ndarray,
    config: PreprocessingConfig,
) -> np.ndarray:
    sequence = np.asarray(sequence, dtype=np.float32)
    if sequence.ndim != 2:
        raise ValueError("Expected a 2D landmark sequence")
    if config.feature_dim is not None and sequence.shape[1] != config.feature_dim:
        raise ValueError(
            f"Expected feature_dim={config.feature_dim}, got {sequence.shape[1]}"
        )

    sequence = interpolate_missing_frames(sequence)
    sequence = resample_sequence(sequence, config.sequence_length)
    if config.normalize:
        sequence = normalize_sequence(sequence, config.mean, config.std)
    return sequence.astype(np.float32)
