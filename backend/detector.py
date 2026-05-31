# detector.py — dima806/deepfake_vs_real_image_detection
#
# WHY THIS MODEL:
# - 99.27% accuracy on 76,000 image test set (Real + Fake faces)
# - Has a preprocessor_config.json so it loads cleanly
# - Author-recommended threshold: use 0.8 instead of 0.5 to reduce false positives
#   on modern AI images (concept drift from newer generators)
# - Labels: "Real" / "Fake" — clean and unambiguous

import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
from typing import BinaryIO
import time

from explainer import (
    analyze_frequency_domain,
    analyze_image_statistics,
    extract_signals,
)

MODEL_ID   = "dima806/deepfake_vs_real_image_detection"
MODEL_NAME = "deepfake_vs_real_image_detection (ViT)"

# Author recommends raising threshold to reduce false positives on modern images
# 0.5 = default (too many false positives)
# 0.75 = conservative (fewer false positives, may miss some fakes)
FAKE_THRESHOLD = 0.75

# Standard ViT preprocessing — same as google/vit-base-patch16-224
VIT_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
])


class DeepfakeDetector:
    def __init__(self):
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
        elif torch.backends.mps.is_available():
            self.device = torch.device("mps")
        else:
            self.device = torch.device("cpu")

        print(f"   Using device: {self.device}")
        self.model, self.id2label = self._load_model()
        self.model_name = MODEL_NAME

    def _load_model(self):
        from transformers import AutoModelForImageClassification
        from huggingface_hub import snapshot_download

        print(f"   Downloading {MODEL_NAME}...")
        local_dir = snapshot_download(
            repo_id=MODEL_ID,
            ignore_patterns=["*.msgpack", "*.h5", "flax_model*", "tf_model*"],
        )
        print(f"   Loading weights...")
        model = AutoModelForImageClassification.from_pretrained(
            local_dir, local_files_only=True,
        )
        model.eval().to(self.device)

        print(f"   ✅ {MODEL_NAME} loaded.")
        print(f"   Label map: {model.config.id2label}")
        print(f"   Fake threshold: {FAKE_THRESHOLD} (raised from 0.5 to reduce false positives)")
        return model, model.config.id2label

    def predict(self, image_bytes: BinaryIO) -> dict:
        start_time = time.time()

        try:
            img = Image.open(image_bytes)
        except Exception:
            raise ValueError("Could not open image.")

        original_size = img.size
        img           = img.convert("RGB")

        tensor = VIT_TRANSFORM(img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(pixel_values=tensor)
            probs   = F.softmax(outputs.logits, dim=-1)[0]

        FAKE_KEYWORDS = {"fake", "deepfake", "artificial", "synthetic"}
        REAL_KEYWORDS = {"real", "realism", "authentic", "human", "genuine"}

        fake_probability = 0.5
        results_log = []

        for idx, prob in enumerate(probs):
            label = self.id2label.get(idx, str(idx))
            score = prob.item()
            results_log.append({"label": label, "score": round(score, 4)})
            if any(k in label.lower() for k in FAKE_KEYWORDS):
                fake_probability = score
            elif any(k in label.lower() for k in REAL_KEYWORDS):
                fake_probability = 1.0 - score

        print(f"   Results: {results_log}")
        print(f"   fake_probability={fake_probability:.4f} | threshold={FAKE_THRESHOLD}")

        freq_stats = analyze_frequency_domain(img)
        img_stats  = analyze_image_statistics(img)
        signals    = extract_signals(
            fake_probability=fake_probability,
            freq_stats=freq_stats,
            img_stats=img_stats,
            gradcam_map=None,
        )

        # Use raised threshold to reduce false positives
        verdict    = "FAKE" if fake_probability >= FAKE_THRESHOLD else "REAL"
        confidence = fake_probability if verdict == "FAKE" else 1.0 - fake_probability

        return {
            "verdict":            verdict,
            "confidence":         round(confidence, 4),
            "confidence_pct":     round(confidence * 100, 1),
            "fake_probability":   round(fake_probability, 4),
            "processing_time_ms": round((time.time() - start_time) * 1000),
            "image_size":         {"width": original_size[0], "height": original_size[1]},
            "model":              self.model_name,
            "signals":            signals,
            "signal_summary": {
                "high":   sum(1 for s in signals if s["severity"] == "high"),
                "medium": sum(1 for s in signals if s["severity"] == "medium"),
                "total":  len(signals),
            },
        }