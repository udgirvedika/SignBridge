import json
import logging
import os
import sys
from pathlib import Path

import numpy as np

from preprocessing import PreprocessingConfig, prepare_landmark_sequence

logger = logging.getLogger("signbridge.backend.model")
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    import torch
    from ml.sign_model import SignSequenceClassifier
except Exception as exc:  # pragma: no cover - supports running without training deps.
    torch = None
    SignSequenceClassifier = None
    logger.warning("PyTorch model support unavailable: %s", exc)


class SignBridgeModel:
    def __init__(self) -> None:
        self.model = None
        self.class_names: list[str] = []
        self.preprocessing = PreprocessingConfig()
        self.device = None
        model_dir = Path(os.getenv("SIGNBRIDGE_MODEL_DIR", ROOT / "ml/runs/latest"))
        self.load(model_dir)

    def load(self, model_dir: Path) -> None:
        config_path = model_dir / "model_config.json"
        weights_path = model_dir / "best_model.pt"
        if torch is None or SignSequenceClassifier is None:
            return
        if not config_path.exists() or not weights_path.exists():
            logger.warning("No trained SignBridge model found at %s", model_dir)
            return

        config = json.loads(config_path.read_text(encoding="utf-8"))
        self.class_names = list(config["class_names"])
        self.preprocessing = PreprocessingConfig(**config["preprocessing"])
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = SignSequenceClassifier(
            input_dim=config["input_dim"],
            num_classes=config["num_classes"],
            hidden_size=config["hidden_size"],
            num_layers=config["num_layers"],
            dropout=config["dropout"],
            bidirectional=config.get("bidirectional", True),
        ).to(self.device)
        self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
        self.model.eval()
        logger.info("Loaded SignBridge model from %s", model_dir)

    def predict(self, landmark_sequence: np.ndarray) -> tuple[str, float]:
        if self.model is None or torch is None:
            return "unknown", 0.0
        if landmark_sequence.ndim != 2 or landmark_sequence.size == 0:
            return "unknown", 0.0

        prepared = prepare_landmark_sequence(landmark_sequence, self.preprocessing)
        with torch.no_grad():
            inputs = torch.from_numpy(prepared).unsqueeze(0).to(self.device)
            probabilities = torch.softmax(self.model(inputs), dim=1).cpu().numpy()[0]
        class_idx = int(np.argmax(probabilities))
        return self.class_names[class_idx], float(probabilities[class_idx])


_MODEL = SignBridgeModel()


def predict(landmark_sequence: np.ndarray) -> tuple[str, float]:
    return _MODEL.predict(landmark_sequence)
