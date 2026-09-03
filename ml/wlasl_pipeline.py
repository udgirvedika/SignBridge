from __future__ import annotations

import csv
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from landmarks import extract_landmark_vector  # noqa: E402
from backend.preprocessing import PreprocessingConfig, prepare_landmark_sequence  # noqa: E402


@dataclass(frozen=True)
class Sample:
    gloss: str
    split: str
    video_id: str
    signer_id: int | None
    frame_start: int
    frame_end: int
    path: str


def load_wlasl_metadata(metadata_path: Path) -> list[dict]:
    with metadata_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def select_classes(entries: list[dict], class_count: int, classes: list[str] | None) -> list[str]:
    if classes:
        requested = [label.strip() for label in classes if label.strip()]
        available = {entry["gloss"] for entry in entries}
        missing = sorted(set(requested) - available)
        if missing:
            raise ValueError(f"Requested classes not found in WLASL metadata: {missing}")
        return requested

    scored: list[tuple[int, str]] = []
    for entry in entries:
        splits = {inst.get("split") for inst in entry.get("instances", [])}
        if {"train", "val", "test"}.issubset(splits):
            scored.append((len(entry.get("instances", [])), entry["gloss"]))
    scored.sort(key=lambda item: (-item[0], item[1]))
    return [label for _, label in scored[:class_count]]


def find_video(video_id: str, videos_dir: Path) -> Path | None:
    for suffix in (".mp4", ".avi", ".mov", ".mkv", ".webm"):
        candidate = videos_dir / f"{video_id}{suffix}"
        if candidate.exists():
            return candidate
    matches = list(videos_dir.rglob(f"{video_id}.*"))
    return matches[0] if matches else None


def build_manifest(
    entries: list[dict],
    class_names: list[str],
    videos_dir: Path,
) -> list[Sample]:
    selected = set(class_names)
    manifest: list[Sample] = []
    for entry in entries:
        gloss = entry["gloss"]
        if gloss not in selected:
            continue
        for inst in entry.get("instances", []):
            video_path = find_video(str(inst["video_id"]), videos_dir)
            if video_path is None:
                continue
            manifest.append(
                Sample(
                    gloss=gloss,
                    split=inst["split"],
                    video_id=str(inst["video_id"]),
                    signer_id=inst.get("signer_id"),
                    frame_start=int(inst.get("frame_start") or 1),
                    frame_end=int(inst.get("frame_end") or -1),
                    path=str(video_path),
                )
            )
    return manifest


def extract_video_sequence(
    sample: Sample,
    holistic,
    include_face_landmarks: bool,
    every_n_frames: int = 1,
) -> np.ndarray:
    cap = cv2.VideoCapture(sample.path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {sample.path}")

    vectors: list[np.ndarray] = []
    frame_number = 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame_number += 1
            if frame_number < sample.frame_start:
                continue
            if sample.frame_end > 0 and frame_number > sample.frame_end:
                break
            if (frame_number - sample.frame_start) % every_n_frames != 0:
                continue
            vectors.append(
                extract_landmark_vector(
                    holistic,
                    frame,
                    include_face_landmarks=include_face_landmarks,
                )
            )
    finally:
        cap.release()

    if not vectors:
        raise ValueError(f"No frames extracted from {sample.path}")
    return np.stack(vectors).astype(np.float32)


def compute_train_stats(sequences: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    flat = sequences.reshape(-1, sequences.shape[-1])
    non_zero = np.any(np.abs(flat) > 1e-8, axis=1)
    stat_source = flat[non_zero] if np.any(non_zero) else flat
    mean = stat_source.mean(axis=0).astype(np.float32)
    std = stat_source.std(axis=0).astype(np.float32)
    std = np.where(std < 1e-6, 1.0, std).astype(np.float32)
    return mean, std


def write_manifest(path: Path, rows: list[Sample]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(asdict(rows[0]).keys()))
        writer.writeheader()
        for row in rows:
            writer.writerow(asdict(row))


def save_split(output_dir: Path, split: str, x: np.ndarray, y: np.ndarray) -> None:
    np.savez_compressed(output_dir / f"{split}.npz", x=x.astype(np.float32), y=y.astype(np.int64))


def load_processed_split(processed_dir: Path, split: str) -> tuple[np.ndarray, np.ndarray]:
    data = np.load(processed_dir / f"{split}.npz")
    return data["x"].astype(np.float32), data["y"].astype(np.int64)
