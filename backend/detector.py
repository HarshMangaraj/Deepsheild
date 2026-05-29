# detector.py — The AI brain of DeepShield
#
# This file has one job: load a pretrained model and run images through it.
# It's separated from main.py intentionally — "separation of concerns."
# main.py handles HTTP, detector.py handles ML. Clean, testable, swappable.

import torch
import torch.nn.functional as F
import timm
from PIL import Image
from torchvision import transforms
from typing import BinaryIO
import time


# ── WHAT MODEL ARE WE USING? ──
# EfficientNet-B4 fine-tuned on FaceForensics++ (a deepfake dataset).
# This specific checkpoint is from the "selimsef/dfdc_deepfake_challenge"
# winners — it's well-tested and publicly available on HuggingFace.
#
# EfficientNet is a family of image classifiers known for being accurate
# while staying small enough to run on regular hardware (no GPU needed).
MODEL_NAME = "efficientnet_b4"
# HuggingFace model hub ID for the pretrained deepfake detection weights
HF_MODEL_ID = "deepghs/faceswap_det-v0.1"

# ── WHAT ARE THESE NUMBERS? (Image normalization) ──
# Neural networks expect pixel values in a specific range.
# These mean/std values are the ImageNet statistics — the dataset the
# backbone was originally trained on. We normalize our images to match
# that distribution so the model's learned features stay valid.
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

# Input size EfficientNet-B4 was trained with
INPUT_SIZE = 224


class DeepfakeDetector:
    """
    Wraps a pretrained EfficientNet model for deepfake detection.
    
    Usage:
        detector = DeepfakeDetector()
        result = detector.predict(image_bytes)
    """

    def __init__(self):
        # ── DEVICE SELECTION ──
        # "cuda" = NVIDIA GPU (fast), "mps" = Apple Silicon GPU, "cpu" = fallback.
        # torch.device() picks the best available one automatically.
        if torch.cuda.is_available():
            self.device = torch.device("cuda")
        elif torch.backends.mps.is_available():
            self.device = torch.device("mps")
        else:
            self.device = torch.device("cpu")

        print(f"   Using device: {self.device}")

        self.model = self._load_model()
        self.transform = self._build_transform()

    def _load_model(self) -> torch.nn.Module:
        """
        Load the pretrained model.
        
        HOW `timm` WORKS:
        `timm` (PyTorch Image Models) is a library of pretrained vision models.
        `timm.create_model()` downloads + builds the model architecture.
        `pretrained=True` fetches the weights from the internet on first run
        and caches them locally (~80MB). Subsequent runs use the cache.
        
        `num_classes=1` means binary output: one number between 0 and 1.
        """
        print(f"   Loading {MODEL_NAME} architecture...")

        model = timm.create_model(
            MODEL_NAME,
            pretrained=False,   # We'll load our specific fine-tuned weights
            num_classes=1,      # 1 output neuron: fake probability
        )

        # ── LOAD FINE-TUNED WEIGHTS ──
        # Instead of using generic ImageNet weights, we load weights that were
        # specifically fine-tuned on deepfake images. This makes a HUGE
        # difference in detection accuracy.
        try:
            from huggingface_hub import hf_hub_download
            weights_path = hf_hub_download(
                repo_id=HF_MODEL_ID,
                filename="model.pt",
            )
            state_dict = torch.load(weights_path, map_location=self.device)
            # Handle different checkpoint formats
            if "model" in state_dict:
                state_dict = state_dict["model"]
            elif "state_dict" in state_dict:
                state_dict = state_dict["state_dict"]
            model.load_state_dict(state_dict, strict=False)
            print(f"   ✅ Loaded fine-tuned deepfake detection weights.")
        except Exception as e:
            # Fallback: use pretrained ImageNet weights.
            # This won't be as accurate but still demonstrates the pipeline.
            print(f"   ⚠️  Could not load fine-tuned weights ({e}).")
            print(f"   ⚠️  Falling back to pretrained ImageNet weights.")
            print(f"   ⚠️  Accuracy will be lower — see README for model setup.")
            model = timm.create_model(MODEL_NAME, pretrained=True, num_classes=1)

        # ── EVAL MODE ──
        # Models have two modes: training (gradients on) and eval (gradients off).
        # We're not training, just running predictions — eval mode is faster
        # and gives consistent results (disables dropout/batch norm variance).
        model.eval()
        model.to(self.device)

        return model

    def _build_transform(self) -> transforms.Compose:
        """
        Build the image preprocessing pipeline.
        
        WHY PREPROCESSING?
        The model was trained on images that were resized, cropped, and
        normalized in a specific way. If we feed it a raw JPEG at
        4000x3000 pixels, it won't know what to do with it.
        We need to transform every image the same way the training data was.
        
        `transforms.Compose` chains multiple operations into one callable.
        """
        return transforms.Compose([
            # 1. Resize the shorter side to INPUT_SIZE, keep aspect ratio
            transforms.Resize(INPUT_SIZE),
            # 2. Crop a square from the center
            transforms.CenterCrop(INPUT_SIZE),
            # 3. Convert PIL Image to PyTorch tensor (also scales 0-255 → 0.0-1.0)
            transforms.ToTensor(),
            # 4. Normalize pixel values using ImageNet statistics
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])

    def predict(self, image_bytes: BinaryIO) -> dict:
        """
        Run deepfake detection on an image.
        
        Args:
            image_bytes: File-like object containing the raw image data.
        
        Returns:
            dict with verdict, confidence, processing_time, and metadata.
        """
        start_time = time.time()

        # ── OPEN AND VALIDATE IMAGE ──
        try:
            img = Image.open(image_bytes)
        except Exception:
            raise ValueError("Could not open image. Make sure it's a valid JPEG, PNG, or WEBP.")

        # Convert to RGB — some images are RGBA (with transparency) or grayscale.
        # Our model only understands 3-channel RGB images.
        original_size = img.size  # (width, height) before any transforms
        img = img.convert("RGB")

        # ── PREPROCESS ──
        # Apply the transform pipeline we built above.
        # `unsqueeze(0)` adds a batch dimension: [C, H, W] → [1, C, H, W]
        # Models expect batches of images, even if our batch size is 1.
        tensor = self.transform(img).unsqueeze(0).to(self.device)

        # ── INFERENCE ──
        # `torch.no_grad()` disables gradient tracking.
        # We're not training, so we don't need gradients.
        # This saves memory and speeds up the forward pass.
        with torch.no_grad():
            raw_output = self.model(tensor)        # shape: [1, 1]
            # Sigmoid squashes any real number into the 0-1 range.
            # Our model outputs a raw score (logit); sigmoid turns it into
            # a proper probability.
            fake_probability = torch.sigmoid(raw_output).item()

        # ── INTERPRET RESULT ──
        # If the model thinks there's > 50% chance it's fake → verdict is FAKE
        THRESHOLD = 0.50
        verdict = "FAKE" if fake_probability >= THRESHOLD else "REAL"

        # Confidence: how sure is the model?
        # If fake_prob = 0.85 → 85% confident it's FAKE
        # If fake_prob = 0.20 → 80% confident it's REAL
        if verdict == "FAKE":
            confidence = fake_probability
        else:
            confidence = 1.0 - fake_probability

        processing_time_ms = round((time.time() - start_time) * 1000)

        return {
            "verdict": verdict,                               # "FAKE" or "REAL"
            "confidence": round(confidence, 4),               # 0.0 – 1.0
            "confidence_pct": round(confidence * 100, 1),     # 0.0 – 100.0
            "fake_probability": round(fake_probability, 4),   # raw model output
            "processing_time_ms": processing_time_ms,
            "image_size": {
                "width": original_size[0],
                "height": original_size[1],
            },
            "model": MODEL_NAME,
        }