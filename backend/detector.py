# detector.py — Phase 4 update
# Added: GradCAM generation + explainability signals via explainer.py

import torch
import torch.nn.functional as F
import timm
from PIL import Image
from torchvision import transforms
from typing import BinaryIO
import time

from explainer import (
    GradCAM,
    analyze_frequency_domain,
    analyze_image_statistics,
    extract_signals,
)

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]
INPUT_SIZE    = 224
MODEL_NAME    = "efficientnet_b4"
HF_MODEL_ID   = "deepghs/faceswap_det-v0.1"


class DeepfakeDetector:
    def __init__(self):
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
        elif torch.backends.mps.is_available():
            self.device = torch.device("mps")
        else:
            self.device = torch.device("cpu")

        print(f"   Using device: {self.device}")
        self.model     = self._load_model()
        self.gradcam   = GradCAM(self.model)   # ← NEW: attach GradCAM hooks
        self.transform = self._build_transform()

    def _load_model(self) -> torch.nn.Module:
        print(f"   Loading {MODEL_NAME} architecture...")
        model = timm.create_model(MODEL_NAME, pretrained=False, num_classes=1)

        try:
            from huggingface_hub import hf_hub_download
            weights_path = hf_hub_download(repo_id=HF_MODEL_ID, filename="model.pt")
            state_dict = torch.load(weights_path, map_location=self.device)
            if "model" in state_dict:
                state_dict = state_dict["model"]
            elif "state_dict" in state_dict:
                state_dict = state_dict["state_dict"]
            model.load_state_dict(state_dict, strict=False)
            print("   ✅ Loaded fine-tuned deepfake detection weights.")
        except Exception as e:
            print(f"   ⚠️  Falling back to pretrained ImageNet weights ({e})")
            model = timm.create_model(MODEL_NAME, pretrained=True, num_classes=1)

        model.eval()
        model.to(self.device)
        return model

    def _build_transform(self) -> transforms.Compose:
        return transforms.Compose([
            transforms.Resize(INPUT_SIZE),
            transforms.CenterCrop(INPUT_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])

    def predict(self, image_bytes: BinaryIO) -> dict:
        start_time = time.time()

        try:
            img = Image.open(image_bytes)
        except Exception:
            raise ValueError("Could not open image.")

        original_size = img.size
        img = img.convert("RGB")

        # ── INFERENCE ──
        # Phase 4 change: we need gradients for GradCAM, so we CAN'T use
        # torch.no_grad() during the forward pass when explain=True.
        # We run it with gradients, then detach afterward.
        tensor = self.transform(img).unsqueeze(0).to(self.device)

        # Run with gradients so GradCAM can backpropagate
        raw_output      = self.model(tensor)
        fake_probability = torch.sigmoid(raw_output).item()

        # ── GRADCAM ──
        gradcam_map = self.gradcam.generate(tensor)

        # ── FREQUENCY + STATISTICAL ANALYSIS ──
        freq_stats = analyze_frequency_domain(img)
        img_stats  = analyze_image_statistics(img)

        # ── SIGNALS ──
        signals = extract_signals(
            fake_probability=fake_probability,
            freq_stats=freq_stats,
            img_stats=img_stats,
            gradcam_map=gradcam_map,
        )

        # ── VERDICT ──
        verdict    = "FAKE" if fake_probability >= 0.50 else "REAL"
        confidence = fake_probability if verdict == "FAKE" else 1.0 - fake_probability

        processing_time_ms = round((time.time() - start_time) * 1000)

        # Count signals by severity for the summary
        high_count   = sum(1 for s in signals if s["severity"] == "high")
        medium_count = sum(1 for s in signals if s["severity"] == "medium")

        return {
            "verdict":           verdict,
            "confidence":        round(confidence, 4),
            "confidence_pct":    round(confidence * 100, 1),
            "fake_probability":  round(fake_probability, 4),
            "processing_time_ms": processing_time_ms,
            "image_size": {
                "width":  original_size[0],
                "height": original_size[1],
            },
            "model":   MODEL_NAME,
            # ── NEW in Phase 4 ──
            "signals": signals,
            "signal_summary": {
                "high":   high_count,
                "medium": medium_count,
                "total":  len(signals),
            },
        }