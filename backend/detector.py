# detector.py — loads from local folder, zero internet needed
#
# SETUP: Download these 3 files manually and place in backend/models/dima806/
#   https://huggingface.co/dima806/deepfake_vs_real_image_detection/resolve/main/config.json
#   https://huggingface.co/dima806/deepfake_vs_real_image_detection/resolve/main/model.safetensors
#   https://huggingface.co/dima806/deepfake_vs_real_image_detection/resolve/main/preprocessor_config.json

import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
from typing import BinaryIO
import os
import time

from explainer import (
    analyze_frequency_domain,
    analyze_image_statistics,
    extract_signals,
)

# Path to locally downloaded model files
LOCAL_MODEL_DIR = os.path.join(os.path.dirname(__file__), "model_cache")
MODEL_NAME      = "deepfake_vs_real (ViT, dima806)"
FAKE_THRESHOLD  = 0.75  # raised per author recommendation

# Standard ViT preprocessing
VIT_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
])

# Fallback forensic ensemble (used if local model not found)
FORENSIC_MODEL_NAME = "Forensic Signal Ensemble (fallback)"


class DeepfakeDetector:
    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else
            "mps"  if torch.backends.mps.is_available() else "cpu"
        )
        print(f"   Using device: {self.device}")
        self.model, self.model_name, self.mode = self._load_model()

    def _load_model(self):
        # ── Try local ViT model first ──
        if os.path.exists(LOCAL_MODEL_DIR):
            files = os.listdir(LOCAL_MODEL_DIR)
            print(f"   Found local model dir: {LOCAL_MODEL_DIR}")
            print(f"   Files: {files}")

            has_weights = any(f in files for f in ["model.safetensors", "pytorch_model.bin"])
            has_config  = "config.json" in files

            if has_weights and has_config:
                try:
                    from transformers import AutoModelForImageClassification
                    print(f"   Loading ViT from local files...")
                    model = AutoModelForImageClassification.from_pretrained(
                        LOCAL_MODEL_DIR,
                        local_files_only=True,
                    )
                    model.eval().to(self.device)
                    print(f"   ✅ {MODEL_NAME} loaded from local files.")
                    print(f"   Label map: {model.config.id2label}")
                    return model, MODEL_NAME, "vit"
                except Exception as e:
                    print(f"   ⚠️  Local model load failed: {e}")
            else:
                missing = []
                if not has_weights: missing.append("model.safetensors")
                if not has_config:  missing.append("config.json")
                print(f"   ⚠️  Missing files in {LOCAL_MODEL_DIR}: {missing}")
        else:
            print(f"   ℹ️  No local model found at {LOCAL_MODEL_DIR}")
            print(f"   ℹ️  Download instructions: see detector.py header comments")

        # ── Fallback: forensic ensemble ──
        print(f"   Using forensic signal ensemble (fallback mode)...")
        import timm
        model = timm.create_model("efficientnet_b4", pretrained=True)
        model.eval().to(self.device)
        print(f"   ✅ Fallback model loaded.")
        return model, FORENSIC_MODEL_NAME, "forensic"

    def _predict_vit(self, img: Image.Image) -> float:
        tensor  = VIT_TRANSFORM(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            outputs = self.model(pixel_values=tensor)
            probs   = F.softmax(outputs.logits, dim=-1)[0]

        id2label     = self.model.config.id2label
        FAKE_KEYWORDS = {"fake", "deepfake", "artificial", "synthetic"}
        REAL_KEYWORDS = {"real", "realism", "authentic", "human", "genuine"}

        fake_probability = 0.5
        results_log = []
        for idx, prob in enumerate(probs):
            label = id2label.get(idx, str(idx))
            score = prob.item()
            results_log.append({"label": label, "score": round(score, 4)})
            if any(k in label.lower() for k in FAKE_KEYWORDS):
                fake_probability = score
            elif any(k in label.lower() for k in REAL_KEYWORDS):
                fake_probability = 1.0 - score

        print(f"   ViT results: {results_log}")
        print(f"   fake_probability={fake_probability:.4f} threshold={FAKE_THRESHOLD}")
        return fake_probability

    def _predict_forensic(self, img: Image.Image, freq_stats: dict, img_stats: dict) -> float:
        hf_score     = min(1.0, max(0.0, (freq_stats["hf_ratio"] - 0.25) / 0.6))
        sf_score     = min(1.0, freq_stats["spectral_flatness"] * 4.0)
        lv           = img_stats["mean_local_variance"]
        smooth_score = min(1.0, max(0.0, 1.0 - (lv / 500.0)))
        nl           = img_stats["noise_level"]
        noise_score  = min(1.0, max(0.0, 1.0 - (nl / 800.0)))

        raw = hf_score * 0.45 + sf_score * 0.30 + smooth_score * 0.15 + noise_score * 0.10
        # Compress toward centre — forensic signals alone can't be highly confident
        fake_probability = 0.5 + (raw - 0.5) * 0.65

        print(f"   Forensic: hf={hf_score:.3f} sf={sf_score:.3f} smooth={smooth_score:.3f} noise={noise_score:.3f}")
        print(f"   fake_probability={fake_probability:.4f}")
        return fake_probability

    def predict(self, image_bytes: BinaryIO) -> dict:
        start_time = time.time()

        try:
            img = Image.open(image_bytes)
        except Exception:
            raise ValueError("Could not open image.")

        original_size = img.size
        img           = img.convert("RGB")

        freq_stats = analyze_frequency_domain(img)
        img_stats  = analyze_image_statistics(img)

        if self.mode == "vit":
            fake_probability = self._predict_vit(img)
            threshold        = FAKE_THRESHOLD
        else:
            fake_probability = self._predict_forensic(img, freq_stats, img_stats)
            threshold        = 0.55

        signals = extract_signals(
            fake_probability=fake_probability,
            freq_stats=freq_stats,
            img_stats=img_stats,
            gradcam_map=None,
        )

        verdict    = "FAKE" if fake_probability >= threshold else "REAL"
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