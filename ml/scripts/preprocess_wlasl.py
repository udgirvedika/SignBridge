from __future__ import annotations

import argparse
import json
import shutil
import sys
from collections import Counter
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "backend") not in sys.path:
    sys.path.insert(0, str(ROOT / "backend"))

from backend.landmarks import create_holistic  # noqa: E402
from backend.preprocessing import PreprocessingConfig, prepare_landmark_sequence  # noqa: E402
from ml.wlasl_pipeline import (  # noqa: E402
    build_manifest,
    compute_train_stats,
    extract_video_sequence,
    load_wlasl_metadata,
    save_split,
    select_classes,
    write_manifest,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Preprocess WLASL videos into landmarks.")
    parser.add_argument("--metadata", type=Path, default=ROOT / "ml/dataset/WLASL/start_kit/WLASL_v0.3.json")
    parser.add_argument("--videos-dir", type=Path, default=ROOT / "ml/dataset/WLASL/videos")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "ml/processed/wlasl_holistic_15")
    parser.add_argument("--class-count", type=int, default=15)
    parser.add_argument("--classes", nargs="*", default=None)
    parser.add_argument("--sequence-length", type=int, default=30)
    parser.add_argument("--include-face-landmarks", action="store_true")
    parser.add_argument("--every-n-frames", type=int, default=1)
    parser.add_argument("--overwrite", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.output_dir.exists() and args.overwrite:
        shutil.rmtree(args.output_dir)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    entries = load_wlasl_metadata(args.metadata)
    class_names = select_classes(entries, args.class_count, args.classes)
    class_to_idx = {label: idx for idx, label in enumerate(class_names)}
    manifest = build_manifest(entries, class_names, args.videos_dir)
    if not manifest:
        raise SystemExit(
            f"No matching videos found in {args.videos_dir}. Store videos as <video_id>.mp4 or pass --videos-dir."
        )

    write_manifest(args.output_dir / "manifest.csv", manifest)
    by_split: dict[str, list[tuple[np.ndarray, int]]] = {"train": [], "val": [], "test": []}
    failed: list[dict[str, str]] = []

    holistic = create_holistic(include_face_landmarks=args.include_face_landmarks)
    try:
        for index, sample in enumerate(manifest, start=1):
            try:
                raw = extract_video_sequence(
                    sample,
                    holistic,
                    include_face_landmarks=args.include_face_landmarks,
                    every_n_frames=args.every_n_frames,
                )
                prepared = prepare_landmark_sequence(
                    raw,
                    PreprocessingConfig(
                        sequence_length=args.sequence_length,
                        feature_dim=raw.shape[1],
                        normalize=False,
                    ),
                )
                by_split[sample.split].append((prepared, class_to_idx[sample.gloss]))
                print(f"[{index}/{len(manifest)}] {sample.split} {sample.gloss} {sample.video_id}")
            except Exception as exc:
                failed.append({"video_id": sample.video_id, "gloss": sample.gloss, "error": str(exc)})
    finally:
        holistic.close()

    if not by_split["train"]:
        raise SystemExit("No training samples were processed successfully.")

    train_x = np.stack([item[0] for item in by_split["train"]])
    mean, std = compute_train_stats(train_x)
    prep_config = PreprocessingConfig(
        sequence_length=args.sequence_length,
        feature_dim=train_x.shape[-1],
        normalize=True,
        mean=mean.tolist(),
        std=std.tolist(),
    )

    for split, rows in by_split.items():
        if rows:
            x = np.stack([prepare_landmark_sequence(row[0], prep_config) for row in rows])
            y = np.asarray([row[1] for row in rows], dtype=np.int64)
        else:
            x = np.zeros((0, args.sequence_length, train_x.shape[-1]), dtype=np.float32)
            y = np.zeros((0,), dtype=np.int64)
        save_split(args.output_dir, split, x, y)

    signers_by_split = {
        split: {
            sample.signer_id
            for sample in manifest
            if sample.split == split and sample.signer_id is not None
        }
        for split in ("train", "val", "test")
    }
    metadata = {
        "class_names": class_names,
        "class_to_idx": class_to_idx,
        "include_face_landmarks": args.include_face_landmarks,
        "preprocessing": prep_config.__dict__,
        "split_counts": {
            split: dict(Counter(label for _, label in rows)) for split, rows in by_split.items()
        },
        "signer_overlap": {
            "train_val": sorted(signers_by_split["train"] & signers_by_split["val"]),
            "train_test": sorted(signers_by_split["train"] & signers_by_split["test"]),
            "val_test": sorted(signers_by_split["val"] & signers_by_split["test"]),
        },
        "failed": failed,
    }
    (args.output_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Saved processed dataset to {args.output_dir}")


if __name__ == "__main__":
    main()
