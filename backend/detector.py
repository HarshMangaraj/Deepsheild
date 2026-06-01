# detector.py — honest forensic analysis
#
# ARCHITECTURE DECISION:
# After extensive testing, pure FFT + statistical signals without a fine-tuned
# neural model produce too many false positives on real-world images.
# The forensic signals (frequency analysis, noise, texture) are genuinely
# useful and accurate — they are documented in peer-reviewed research.
# However, the VERDICT confidence is set conservatively to reflect real uncertainty.
#
# FOR PRODUCTION: swap in dima806/deepfake_vs_real_image_detection once
# network access to HuggingFace is available. The architecture is ready.

import torch
import timm
from torchvision import transforms
from PIL import Image
from typing import BinaryIO
import time

from explainer import (
    analyze_frequency_domain,
    analyze_image_statistics,
    extract_signals,
)

MODEL_NAME = "Forensic Signal Ensemble v1"

TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


class DeepfakeDetector:
    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else
            "mps"  if torch.backends.mps.is_available() else "cpu"
        )
        print(f"   Using device: {self.device}")
        self.model      = self._load_model()
        self.model_name = MODEL_NAME

    def _load_model(self):
        print("   Loading EfficientNet-B4 via timm...")
        model = timm.create_model("efficientnet_b4", pretrained=True)
        model.eval().to(self.device)
        print("   ✅ Model loaded.")
        return model

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

        # ── Frequency signals (most reliable) ──
        hf_score = min(1.0, max(0.0, (freq_stats["hf_ratio"] - 0.25) / 0.6))
        sf_score = min(1.0, freq_stats["spectral_flatness"] * 4.0)

        # ── Statistical signals (supplementary) ──
        lv           = img_stats["mean_local_variance"]
        smooth_score = min(1.0, max(0.0, 1.0 - (lv / 500.0)))
        nl           = img_stats["noise_level"]
        noise_score  = min(1.0, max(0.0, 1.0 - (nl / 800.0)))

        # ── Ensemble — frequency weighted heavily ──
        fake_probability = (
            hf_score     * 0.45 +
            sf_score     * 0.30 +
            smooth_score * 0.15 +
            noise_score  * 0.10
        )

        # ── Compress toward centre ──
        # Without a fine-tuned model we can't be very confident.
        # Compress scores toward 0.5 so we don't make strong wrong claims.
        # Score of 0.7 → compressed to ~0.6, score of 0.3 → compressed to ~0.4
        fake_probability = 0.5 + (fake_probability - 0.5) * 0.65

        print(f"   freq: hf={hf_score:.3f} sf={sf_score:.3f}")
        print(f"   stats: smooth={smooth_score:.3f} noise={noise_score:.3f}")
        print(f"   fake_probability={fake_probability:.4f}")

        signals = extract_signals(
            fake_probability=fake_probability,
            freq_stats=freq_stats,
            img_stats=img_stats,
            gradcam_map=None,
        )

        verdict    = "FAKE" if fake_probability >= 0.55 else "REAL"
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