from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import torch
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml.sign_model import SignSequenceClassifier  # noqa: E402
from ml.wlasl_pipeline import load_processed_split  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a SignBridge sequence model.")
    parser.add_argument("--processed-dir", type=Path, default=ROOT / "ml/processed/wlasl_holistic_15")
    parser.add_argument("--runs-dir", type=Path, default=ROOT / "ml/runs")
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--hidden-size", type=int, default=128)
    parser.add_argument("--num-layers", type=int, default=2)
    parser.add_argument("--dropout", type=float, default=0.2)
    parser.add_argument("--patience", type=int, default=8)
    return parser.parse_args()


def make_loader(x: np.ndarray, y: np.ndarray, batch_size: int, shuffle: bool) -> DataLoader:
    dataset = TensorDataset(torch.from_numpy(x), torch.from_numpy(y))
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)


def run_epoch(model, loader, criterion, optimizer, device) -> tuple[float, float]:
    model.train(optimizer is not None)
    losses: list[float] = []
    preds: list[int] = []
    labels: list[int] = []
    for x_batch, y_batch in loader:
        x_batch = x_batch.to(device)
        y_batch = y_batch.to(device)
        if optimizer:
            optimizer.zero_grad(set_to_none=True)
        logits = model(x_batch)
        loss = criterion(logits, y_batch)
        if optimizer:
            loss.backward()
            optimizer.step()
        losses.append(float(loss.detach().cpu()))
        preds.extend(torch.argmax(logits, dim=1).detach().cpu().tolist())
        labels.extend(y_batch.detach().cpu().tolist())
    return float(np.mean(losses)), float(accuracy_score(labels, preds))


def predict_all(model, loader, device) -> tuple[list[int], list[int]]:
    model.eval()
    labels: list[int] = []
    preds: list[int] = []
    with torch.no_grad():
        for x_batch, y_batch in loader:
            logits = model(x_batch.to(device))
            preds.extend(torch.argmax(logits, dim=1).cpu().tolist())
            labels.extend(y_batch.tolist())
    return labels, preds


def main() -> None:
    args = parse_args()
    metadata = json.loads((args.processed_dir / "metadata.json").read_text(encoding="utf-8"))
    train_x, train_y = load_processed_split(args.processed_dir, "train")
    val_x, val_y = load_processed_split(args.processed_dir, "val")
    test_x, test_y = load_processed_split(args.processed_dir, "test")
    if len(train_x) == 0 or len(val_x) == 0:
        raise SystemExit("Training and validation splits must both contain samples.")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = SignSequenceClassifier(
        input_dim=train_x.shape[-1],
        num_classes=len(metadata["class_names"]),
        hidden_size=args.hidden_size,
        num_layers=args.num_layers,
        dropout=args.dropout,
    ).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)

    run_name = datetime.now().strftime("wlasl_%Y%m%d_%H%M%S")
    run_dir = args.runs_dir / run_name
    run_dir.mkdir(parents=True, exist_ok=True)
    best_path = run_dir / "best_model.pt"

    loaders = {
        "train": make_loader(train_x, train_y, args.batch_size, True),
        "val": make_loader(val_x, val_y, args.batch_size, False),
        "test": make_loader(test_x, test_y, args.batch_size, False) if len(test_x) else None,
    }

    best_val_loss = float("inf")
    epochs_without_improvement = 0
    history: list[dict[str, float]] = []
    for epoch in range(1, args.epochs + 1):
        train_loss, train_acc = run_epoch(model, loaders["train"], criterion, optimizer, device)
        val_loss, val_acc = run_epoch(model, loaders["val"], criterion, None, device)
        history.append(
            {"epoch": epoch, "train_loss": train_loss, "train_acc": train_acc, "val_loss": val_loss, "val_acc": val_acc}
        )
        print(f"epoch={epoch} train_loss={train_loss:.4f} train_acc={train_acc:.3f} val_loss={val_loss:.4f} val_acc={val_acc:.3f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            epochs_without_improvement = 0
            torch.save(model.state_dict(), best_path)
        else:
            epochs_without_improvement += 1
            if epochs_without_improvement >= args.patience:
                break

    model.load_state_dict(torch.load(best_path, map_location=device))
    eval_loader = loaders["test"] or loaders["val"]
    split_name = "test" if loaders["test"] else "val"
    labels, preds = predict_all(model, eval_loader, device)
    report = classification_report(
        labels,
        preds,
        target_names=metadata["class_names"],
        labels=list(range(len(metadata["class_names"]))),
        zero_division=0,
        output_dict=True,
    )
    matrix = confusion_matrix(labels, preds, labels=list(range(len(metadata["class_names"]))))
    np.savetxt(run_dir / "confusion_matrix.csv", matrix, delimiter=",", fmt="%d")
    fig, ax = plt.subplots(figsize=(10, 8))
    image = ax.imshow(matrix, interpolation="nearest", cmap="Blues")
    ax.figure.colorbar(image, ax=ax)
    ax.set(
        xticks=np.arange(len(metadata["class_names"])),
        yticks=np.arange(len(metadata["class_names"])),
        xticklabels=metadata["class_names"],
        yticklabels=metadata["class_names"],
        ylabel="True label",
        xlabel="Predicted label",
        title=f"{split_name.title()} confusion matrix",
    )
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")
    fig.tight_layout()
    fig.savefig(run_dir / "confusion_matrix.png", dpi=160)
    plt.close(fig)

    config = {
        "input_dim": int(train_x.shape[-1]),
        "num_classes": len(metadata["class_names"]),
        "hidden_size": args.hidden_size,
        "num_layers": args.num_layers,
        "dropout": args.dropout,
        "bidirectional": True,
        "class_names": metadata["class_names"],
        "include_face_landmarks": metadata["include_face_landmarks"],
        "preprocessing": metadata["preprocessing"],
    }
    (run_dir / "model_config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")
    metrics = {
        "history": history,
        f"{split_name}_accuracy": float(accuracy_score(labels, preds)),
        f"{split_name}_classification_report": report,
    }
    (run_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    latest = args.runs_dir / "latest"
    if latest.exists() or latest.is_symlink():
        if latest.is_dir() and not latest.is_symlink():
            shutil.rmtree(latest)
        else:
            latest.unlink()
    shutil.copytree(run_dir, latest)
    print(f"Saved run to {run_dir}")
    print(f"Updated latest copy at {latest}")


if __name__ == "__main__":
    main()
