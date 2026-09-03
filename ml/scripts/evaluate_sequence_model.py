from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from torch.utils.data import DataLoader, TensorDataset

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml.sign_model import SignSequenceClassifier  # noqa: E402
from ml.wlasl_pipeline import load_processed_split  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a trained SignBridge sequence model.")
    parser.add_argument("--run-dir", type=Path, default=ROOT / "ml/runs/latest")
    parser.add_argument("--processed-dir", type=Path, default=None)
    parser.add_argument("--split", choices=["train", "val", "test"], default="test")
    parser.add_argument("--batch-size", type=int, default=64)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = json.loads((args.run_dir / "model_config.json").read_text(encoding="utf-8"))
    processed_dir = args.processed_dir or ROOT / "ml/processed/wlasl_holistic_15"
    x, y = load_processed_split(processed_dir, args.split)
    if len(x) == 0:
        raise SystemExit(f"No samples in split: {args.split}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = SignSequenceClassifier(
        input_dim=config["input_dim"],
        num_classes=config["num_classes"],
        hidden_size=config["hidden_size"],
        num_layers=config["num_layers"],
        dropout=config["dropout"],
        bidirectional=config.get("bidirectional", True),
    ).to(device)
    model.load_state_dict(torch.load(args.run_dir / "best_model.pt", map_location=device))
    model.eval()

    preds: list[int] = []
    labels: list[int] = []
    loader = DataLoader(TensorDataset(torch.from_numpy(x), torch.from_numpy(y)), batch_size=args.batch_size)
    with torch.no_grad():
        for x_batch, y_batch in loader:
            logits = model(x_batch.to(device))
            preds.extend(torch.argmax(logits, dim=1).cpu().tolist())
            labels.extend(y_batch.tolist())

    print(f"{args.split}_accuracy={accuracy_score(labels, preds):.4f}")
    print(classification_report(labels, preds, target_names=config["class_names"], zero_division=0))
    matrix = confusion_matrix(labels, preds, labels=list(range(len(config["class_names"]))))
    np.savetxt(args.run_dir / f"{args.split}_confusion_matrix.csv", matrix, delimiter=",", fmt="%d")


if __name__ == "__main__":
    main()
