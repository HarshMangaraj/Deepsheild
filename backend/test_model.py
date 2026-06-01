import sys
import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
from transformers import AutoModelForImageClassification
import os

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model_cache")

print("Loading model...")
model = AutoModelForImageClassification.from_pretrained(MODEL_DIR, local_files_only=True)
model.eval()
print(f"Labels: {model.config.id2label}")

img_path = sys.argv[1] if len(sys.argv) > 1 else None
if not img_path:
    print("Usage: python test_model.py path/to/image.jpg")
    sys.exit(1)

img = Image.open(img_path).convert("RGB")

t = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
])

tensor = t(img).unsqueeze(0)
with torch.no_grad():
    out   = model(pixel_values=tensor)
    probs = F.softmax(out.logits, dim=-1)[0]

print("\nResults:")
for idx, p in enumerate(probs):
    print(f"  {model.config.id2label[idx]}: {p.item():.4f}")

fake_prob = None
for idx, p in enumerate(probs):
    if "fake" in model.config.id2label[idx].lower():
        fake_prob = p.item()

if fake_prob is not None:
    print(f"\nfake_probability = {fake_prob:.4f}")
    print(f"At threshold 0.50 → {'FAKE' if fake_prob >= 0.50 else 'REAL'}")
    print(f"At threshold 0.75 → {'FAKE' if fake_prob >= 0.75 else 'REAL'}")