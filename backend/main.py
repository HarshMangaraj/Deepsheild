# main.py — DeepShield Backend (updated with video endpoint)

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import io

from detector import DeepfakeDetector
from video_detector import VideoDeepfakeDetector

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🛡️  DeepShield backend starting...")
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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


# ── NEW: Video detection endpoint ──
# Accepts a video file, extracts frames, runs detection on each frame,
# returns per-frame results plus an overall verdict.
@app.post("/detect/video")
async def detect_video(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(400, f"Unsupported video format. Accepted: MP4, MOV, AVI, WEBM.")

    contents = await file.read()
    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(413, "Video too large. Max 100MB.")

    try:
        result = app.state.video_detector.detect(
            video_bytes=io.BytesIO(contents),
            filename=file.filename or "video.mp4",
            sample_fps=1.0,   # 1 frame per second
            max_frames=30,    # max 30 seconds analyzed
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Video analysis failed: {e}")