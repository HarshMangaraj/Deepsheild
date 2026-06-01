from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import io
import os

from detector import DeepfakeDetector
from video_detector import VideoDeepfakeDetector

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024
MAX_VIDEO_SIZE = 100 * 1024 * 1024


def download_model_if_needed():
    """
    Download model weights on first startup.
    On Render, HuggingFace is accessible so this works automatically.
    Subsequent startups skip the download (already cached).
    """
    local_dir = os.path.join(os.path.dirname(__file__), "model_cache")
    weights_exist = (
        os.path.exists(os.path.join(local_dir, "model.safetensors")) or
        os.path.exists(os.path.join(local_dir, "pytorch_model.bin"))
    )

    if not weights_exist:
        print("📥  model_cache not found — downloading from HuggingFace...")
        try:
            from huggingface_hub import snapshot_download
            path = snapshot_download(
                repo_id="dima806/deepfake_vs_real_image_detection",
                local_dir=local_dir,
                ignore_patterns=["*.msgpack", "*.h5", "flax_model*", "tf_model*"],
            )
            print(f"✅  Model downloaded to {path}")
        except Exception as e:
            print(f"⚠️  Model download failed: {e}")
            print("⚠️  Will use forensic fallback mode.")
    else:
        print("✅  model_cache found — skipping download.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🛡️  DeepShield backend starting...")
    download_model_if_needed()
    print("📦  Loading model...")
    app.state.detector       = DeepfakeDetector()
    app.state.video_detector = VideoDeepfakeDetector(app.state.detector)
    print("✅  Models ready.")
    yield
    print("👋  Shutting down.")


app = FastAPI(
    title="DeepShield API",
    description="Deepfake detection for images and video.",
    version="2.0.0",
    lifespan=lifespan,
)

# Allow requests from Vercel frontend and localhost
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_URL", ""),   # set this in Render env vars
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_origin_regex=r"https://.*\.vercel\.app",  # allow all Vercel preview URLs
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": hasattr(app.state, "detector")}


@app.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only image files accepted.")
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(413, "Image too large. Max 10MB.")
    try:
        return app.state.detector.predict(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(500, f"Detection failed: {e}")


@app.post("/detect/video")
async def detect_video(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(400, "Unsupported video format. Accepted: MP4, MOV, AVI, WEBM.")
    contents = await file.read()
    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(413, "Video too large. Max 100MB.")
    try:
        return app.state.video_detector.detect(
            video_bytes=io.BytesIO(contents),
            filename=file.filename or "video.mp4",
            sample_fps=1.0,
            max_frames=30,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Video analysis failed: {e}")