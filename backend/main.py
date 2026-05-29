# main.py — DeepShield Backend
# This is the entry point for our Python server.
# It defines the API routes (URLs) and handles incoming requests.

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import io

from detector import DeepfakeDetector

# ── WHAT IS A LIFESPAN FUNCTION? ──
# We want to load the AI model ONCE when the server starts,
# not on every single request (loading a model takes ~2-5 seconds).
# FastAPI's `lifespan` context manager lets us run startup/shutdown logic.
# `app.state` is a dict-like object where we store things across requests.

detector_instance = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── STARTUP ──
    print("🛡️  DeepShield backend starting...")
    print("📦  Loading deepfake detection model (this may take a moment)...")
    app.state.detector = DeepfakeDetector()
    print("✅  Model loaded and ready.")
    yield
    # ── SHUTDOWN ──
    print("👋  DeepShield backend shutting down.")


# ── CREATE THE APP ──
app = FastAPI(
    title="DeepShield API",
    description="Deepfake detection backend for the DeepShield portfolio project.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── WHAT IS CORS? ──
# CORS (Cross-Origin Resource Sharing) is a browser security rule.
# When your Next.js app (running on localhost:3000) tries to call this
# Python server (running on localhost:8000), the browser blocks it by default
# because they're on different "origins" (different ports count as different origins).
# We tell the Python server to explicitly ALLOW requests from our frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev server
        "http://127.0.0.1:3000",
    ],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ── HEALTH CHECK ──
# A simple GET route to verify the server is alive.
# Useful for debugging — open http://localhost:8000/health in your browser.
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": hasattr(app.state, "detector"),
    }


# ── MAIN DETECTION ENDPOINT ──
# POST /detect — accepts an image file, returns a prediction.
#
# WHAT IS `UploadFile`?
# FastAPI's built-in type for handling file uploads.
# It gives us the file's bytes, filename, and content type.
#
# WHAT IS `async`?
# Python can handle multiple requests concurrently using async/await.
# While one request is waiting (e.g. reading a file from disk),
# the server can start handling another request instead of sitting idle.
@app.post("/detect")
async def detect_deepfake(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are accepted (JPEG, PNG, WEBP)."
        )

    # Check file size (max 10MB)
    MAX_SIZE = 10 * 1024 * 1024  # 10 MB in bytes
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image too large. Maximum size is 10MB."
        )

    # Run detection
    try:
        result = app.state.detector.predict(io.BytesIO(contents))
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {str(e)}"
        )