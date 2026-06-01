# DeepShield 🛡️

**Forensic deepfake and AI image detection — full-stack portfolio project**

---

## ⚠️ Disclaimer

DeepShield is a portfolio project. It **cannot reliably detect** pure AI-generated images from tools like Stable Diffusion, Midjourney, or DALL-E. Detection works best on face-swap deepfakes and manipulated photographs. This is a known limitation of the field — not specific to this project. Results should never be used as sole evidence in legal or professional contexts.

---

## Overview

DeepShield analyses images and videos for signs of AI manipulation using a ViT (Vision Transformer) model combined with forensic signal analysis — FFT frequency patterns, texture smoothness, sensor noise absence, and spatial artifact detection. Every verdict includes a plain-English breakdown of exactly which signals were found and why.

A dedicated `/resources` page provides Indian legal information, NGO contacts, and a step-by-step guide for victims of non-consensual deepfake imagery.

---

## Features

- Upload images (JPG, PNG, WEBP) or video files (MP4, MOV, WEBM)
- Webcam recording with in-browser analysis
- Verdict with confidence score and animated confidence bar
- 6-signal forensic breakdown explaining each finding
- Per-frame video timeline — colour-coded dot for every analysed frame
- Indian legal resources page with laws, NGO contacts, and reporting steps
- Smooth scroll (Locomotive) and GSAP entrance animations throughout

---

## Tech Stack

**Frontend** — Next.js 14, React 18, TypeScript, Tailwind CSS, GSAP, Locomotive Scroll

**Backend** — FastAPI, PyTorch, Transformers, timm, OpenCV, Pillow, NumPy

**ML** — `dima806/deepfake_vs_real_image_detection` (ViT-base, 76k image training set) with EfficientNet-B4 forensic ensemble fallback

---

## Performance

| Metric | Value |
|---|---|
| Image inference (CPU) | ~2,400ms |
| Video processing (30s clip) | ~60–90s on CPU |
| Frame sampling rate | 1 frame / second |
| Max frames analysed | 30 |
| Max image size | 10 MB |
| Max video size | 100 MB |

---

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- ~500MB disk space for model weights

### Frontend

```bash
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Open `http://localhost:3000`

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

**Download model weights (once, ~350MB)**

```bash
# If HuggingFace is accessible:
python -c "from huggingface_hub import snapshot_download; snapshot_download('dima806/deepfake_vs_real_image_detection')"

# If blocked, download these 3 files manually into backend/model_cache/:
# https://huggingface.co/dima806/deepfake_vs_real_image_detection/resolve/main/config.json
# https://huggingface.co/dima806/deepfake_vs_real_image_detection/resolve/main/model.safetensors
# https://huggingface.co/dima806/deepfake_vs_real_image_detection/resolve/main/preprocessor_config.json
```

```bash
uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for the auto-generated API reference.

---

## Project Structure

```
deepshield/
├── app/
│   ├── page.tsx              # Homepage — image detection
│   ├── video/page.tsx        # Video detection
│   ├── resources/page.tsx    # Indian legal resources
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ImageUploader.tsx
│   ├── ResultCard.tsx
│   ├── SignalBreakdown.tsx
│   ├── VideoUploader.tsx
│   ├── VideoResultCard.tsx
│   └── LocomotiveWrapper.tsx
├── lib/
│   └── api.ts
├── backend/
│   ├── main.py               # FastAPI endpoints
│   ├── detector.py           # Model loading + inference
│   ├── video_detector.py     # Frame extraction + aggregation
│   ├── explainer.py          # FFT + signal extraction
│   ├── model_cache/          # Model weights (gitignored)
│   └── requirements.txt
└── .env.local                # gitignored
```

---

## API

### `POST /detect`
Accepts a single image file. Returns verdict, confidence, and forensic signals.

### `POST /detect/video`
Accepts a video file. Returns overall verdict plus per-frame results array.

### `GET /health`
Returns `{ "status": "ok", "model_loaded": true }`

---

## Known Limitations

| Issue | Reason |
|---|---|
| Cannot detect Midjourney / SD images | Model trained on face-swap data, not text-to-image |
| Slow on CPU | No GPU available in development — GPU reduces inference to ~200ms |
| Video capped at 30 frames | Prevents request timeout on long clips |

---

## Legal Resources

The `/resources` page covers Indian law for deepfake victims including IT Act §66E, §67A, §67, BNS §95 and §96, and IT Rules 2021. Organisations listed: Cyber Crime Portal (1930), iCall TISS, Cyber Peace Foundation, Majlis Legal Centre, and NCW.

---

## License

MIT

---

**Harsh Bardhan Mangaraj** · [LinkedIn](https://linkedin.com/in/harsh-bardhan-mangaraj) · [GitHub](https://github.com/HarshMangaraj)
