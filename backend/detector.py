# detector.py — Phase: Model Swap
#
# PREVIOUS MODEL: EfficientNet-B4 fine-tuned on FaceForensics++
# PROBLEM: FaceForensics++ only contains face-swap deepfakes.
#          Modern AI images (Midjourney, Stable Diffusion, DALL-E)
#          have completely different artifacts — the old model couldn't see them.
#
# NEW MODEL: ViT (Vision Transformer) ensemble approach
# We try models in order of quality, falling back gracefully:
#
# 1. haywoodsloan/AI-Image-Detector-ViT
#    Trained on: Stable Diffusion, Midjourney, DALL-E, real photos
#    Architecture: google/vit-base-patch16-224 fine-tuned
#    Best for: modern text-to-image detection
#
# 2. Organika/sdxl-detector
#    Trained on: SDXL specifically
#    Architecture: ViT fine-tune
#
# 3. EfficientNet fallback (original model)
#    Used only if both above fail to load

import torch
import torch.nn.functional as F
from PIL import Image
from typing import BinaryIO
import time

from explainer import (
    GradCAM,
    analyze_frequency_domain,
    analyze_image_statistics,
    extract_signals,
)

# ── WHAT IS A ViT? ──
# Vision Transformer (ViT) splits an image into patches (like words in a sentence)
# and processes them through a Transformer — the same architecture behind GPT.
# ViTs tend to look at global image structure rather than local textures,
# which makes them better at spotting the "too perfect" quality of AI images.

INPUT_SIZE = 224


class DeepfakeDetector:
    def __init__(self):
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
        elif torch.backends.mps.is_available():
            self.device = torch.device("mps")
        else:
            self.device = torch.device("cpu")

        print(f"   Using device: {self.device}")
        self.model, self.model_name, self.mode = self._load_best_model()
        self.gradcam = GradCAM(self.model) if self.mode == "timm" else None
        self.transform = self._build_transform()

    def _load_best_model(self):
        """
        Try to load models in order of quality.
        Returns (model, model_name, mode) where mode is
        'hf_pipeline' for HuggingFace pipeline models or 'timm' for timm models.
        """

        # ── ATTEMPT 1: HuggingFace pipeline (ViT-based) ──
        # These models use HuggingFace's pipeline API which handles
        # preprocessing automatically — simpler and more reliable.
        hf_models = [
            ("haywoodsloan/AI-Image-Detector-ViT", "ViT AI Image Detector"),
            ("Organika/sdxl-detector",              "SDXL Detector"),
            ("umm-maybe/AI-image-detector",         "AI Image Detector"),
        ]

        for model_id, model_name in hf_models:
            try:
                from transformers import pipeline
                print(f"   Trying {model_name} ({model_id})...")
                pipe = pipeline(
                    "image-classification",
                    model=model_id,
                    device=0 if torch.cuda.is_available() else -1,
                )
                # Quick sanity test
                test_img = Image.new("RGB", (224, 224), color=(128, 128, 128))
                _ = pipe(test_img)
                print(f"   ✅ Loaded {model_name}")
                return pipe, model_name, "hf_pipeline"
            except Exception as e:
                print(f"   ⚠️  {model_name} failed: {e}")
                continue

        # ── ATTEMPT 2: timm EfficientNet with better weights ──
        try:
            import timm
            from huggingface_hub import hf_hub_download
            print("   Trying EfficientNet-B4 with deepfake weights...")
            model = timm.create_model("efficientnet_b4", pretrained=False, num_classes=1)

            # Try several checkpoint sources
            checkpoints = [
                ("deepghs/faceswap_det-v0.1", "model.pt"),
                ("lxyuan/deepfake-image-detect", "pytorch_model.bin"),
            ]
            loaded = False
            for repo, filename in checkpoints:
                try:
                    path = hf_hub_download(repo_id=repo, filename=filename)
                    sd = torch.load(path, map_location=self.device)
                    if isinstance(sd, dict):
                        sd = sd.get("model", sd.get("state_dict", sd))
                    model.load_state_dict(sd, strict=False)
                    loaded = True
                    print(f"   ✅ Loaded EfficientNet from {repo}")
                    break
                except Exception:
                    continue

            if not loaded:
                raise RuntimeError("No checkpoint loaded")

            model.eval().to(self.device)
            return model, "efficientnet_b4", "timm"

        except Exception as e:
            print(f"   ⚠️  EfficientNet with weights failed: {e}")

        # ── ATTEMPT 3: Pretrained EfficientNet (last resort) ──
        print("   ⚠️  Falling back to generic EfficientNet (accuracy will be low)")
        import timm
        model = timm.create_model("efficientnet_b4", pretrained=True, num_classes=1)
        model.eval().to(self.device)
        return model, "efficientnet_b4_pretrained", "timm"

    def _build_transform(self):
        from torchvision import transforms
        return transforms.Compose([
            transforms.Resize(INPUT_SIZE),
            transforms.CenterCrop(INPUT_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
        ])

    def _predict_hf_pipeline(self, img: Image.Image) -> float:
        """
        Run inference using a HuggingFace pipeline model.

        These models return a list like:
        [{"label": "artificial", "score": 0.93}, {"label": "real", "score": 0.07}]

        Label names vary by model so we check for keywords:
        fake/artificial/ai/generated → fake class
        real/authentic/human → real class
        """
        results = self.model(img)

        FAKE_KEYWORDS = {"artificial", "fake", "ai", "generated", "synthetic", "deepfake"}
        REAL_KEYWORDS = {"real", "authentic", "human", "natural", "genuine"}

        fake_score = 0.0
        real_score = 0.0

        for item in results:
            label = item["label"].lower()
            score = item["score"]
            if any(k in label for k in FAKE_KEYWORDS):
                fake_score += score
            elif any(k in label for k in REAL_KEYWORDS):
                real_score += score

        # If we couldn't parse labels, assume first result is the top class
        if fake_score == 0.0 and real_score == 0.0:
            top_label = results[0]["label"].lower()
            top_score = results[0]["score"]
            fake_score = top_score if any(k in top_label for k in FAKE_KEYWORDS) else 0.0
            real_score = top_score if fake_score == 0.0 else 0.0

        # Normalize
        total = fake_score + real_score
        if total > 0:
            return fake_score / total
        return 0.5  # uncertain

    def _predict_timm(self, img: Image.Image) -> float:
        """Run inference using a timm model."""
        tensor = self.transform(img).unsqueeze(0).to(self.device)
        raw = self.model(tensor)
        return torch.sigmoid(raw).item()

    def predict(self, image_bytes: BinaryIO) -> dict:
        start_time = time.time()

        try:
            img = Image.open(image_bytes)
        except Exception:
            raise ValueError("Could not open image. Ensure it's a valid JPEG, PNG, or WEBP.")

        original_size = img.size
        img = img.convert("RGB")

        # ── Run inference ──
        if self.mode == "hf_pipeline":
            fake_probability = self._predict_hf_pipeline(img)
        else:
            fake_probability = self._predict_timm(img)

        # ── GradCAM (timm only) ──
        gradcam_map = None
        if self.mode == "timm" and self.gradcam:
            tensor = self.transform(img).unsqueeze(0).to(self.device)
            self.model(tensor)
            gradcam_map = self.gradcam.generate(tensor)

        # ── Explainability ──
        freq_stats = analyze_frequency_domain(img)
        img_stats  = analyze_image_statistics(img)
        signals    = extract_signals(
            fake_probability=fake_probability,
            freq_stats=freq_stats,
            img_stats=img_stats,
            gradcam_map=gradcam_map,
        )

        # ── Verdict ──
        verdict    = "FAKE" if fake_probability >= 0.50 else "REAL"
        confidence = fake_probability if verdict == "FAKE" else 1.0 - fake_probability

        processing_time_ms = round((time.time() - start_time) * 1000)

        high_count   = sum(1 for s in signals if s["severity"] == "high")
        medium_count = sum(1 for s in signals if s["severity"] == "medium")

        return {
            "verdict":            verdict,
            "confidence":         round(confidence, 4),
            "confidence_pct":     round(confidence * 100, 1),
            "fake_probability":   round(fake_probability, 4),
            "processing_time_ms": processing_time_ms,
            "image_size": {
                "width":  original_size[0],
                "height": original_size[1],
            },
            "model": self.model_name,
            "signals": signals,
            "signal_summary": {
                "high":   high_count,
                "medium": medium_count,
                "total":  len(signals),
            },
        }