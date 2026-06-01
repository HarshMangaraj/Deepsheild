# video_detector.py — Frame extraction + per-frame deepfake detection
#
# HOW VIDEO DETECTION WORKS:
# A video is just a sequence of images (frames) played at ~24-30fps.
# We can't run every frame — a 10s video at 30fps is 300 frames.
# Instead we SAMPLE: extract one frame every N seconds, analyze each,
# then aggregate into an overall verdict.
#
# WHY OPENCV?
# cv2 is the industry-standard computer vision library. It opens any
# video format and extracts frames as numpy arrays with no external
# binary dependencies like ffmpeg.

import cv2
import numpy as np
from PIL import Image
import io
import tempfile
import os
import time
from typing import BinaryIO


class VideoDeepfakeDetector:
    """
    Extracts frames from a video and runs deepfake detection on each.
    Reuses the already-loaded image DeepfakeDetector — no double loading.
    """

    def __init__(self, image_detector):
        self.detector = image_detector

    def detect(
        self,
        video_bytes: BinaryIO,
        filename: str,
        sample_fps: float = 1.0,
        max_frames: int = 30,
    ) -> dict:
        start_time = time.time()

        # OpenCV needs a real file path, not a buffer — write to temp file
        suffix = os.path.splitext(filename)[-1] or ".mp4"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(video_bytes.read())
            tmp_path = tmp.name

        try:
            frames_data = self._extract_and_analyze(tmp_path, sample_fps, max_frames)
        finally:
            os.unlink(tmp_path)

        if not frames_data:
            raise ValueError("Could not extract frames. Is this a valid MP4/MOV file?")

        fake_count    = sum(1 for f in frames_data if f["verdict"] == "FAKE")
        real_count    = len(frames_data) - fake_count
        fake_ratio    = fake_count / len(frames_data)
        avg_fake_prob = sum(f["fake_probability"] for f in frames_data) / len(frames_data)

        # Lower threshold for video: >40% flagged frames = suspicious video
        overall_verdict    = "FAKE" if fake_ratio >= 0.40 else "REAL"
        overall_confidence = avg_fake_prob if overall_verdict == "FAKE" else 1.0 - avg_fake_prob

        return {
            "verdict":            overall_verdict,
            "confidence":         round(overall_confidence, 4),
            "confidence_pct":     round(overall_confidence * 100, 1),
            "fake_probability":   round(avg_fake_prob, 4),
            "processing_time_ms": round((time.time() - start_time) * 1000),
            "frames_analyzed":    len(frames_data),
            "frames_flagged":     fake_count,
            "frames_clean":       real_count,
            "fake_ratio":         round(fake_ratio, 4),
            "fake_ratio_pct":     round(fake_ratio * 100, 1),
            "frames":             frames_data,
            "model":              self.detector.model_name,
        }

    def _extract_and_analyze(self, video_path: str, sample_fps: float, max_frames: int) -> list:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("OpenCV could not open the video file.")

        video_fps      = cap.get(cv2.CAP_PROP_FPS) or 25.0
        frame_interval = max(1, int(video_fps / sample_fps))

        frames_data = []
        frame_idx   = 0
        sample_idx  = 0

        while cap.isOpened() and sample_idx < max_frames:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                break

            timestamp_sec = frame_idx / video_fps
            frame_rgb     = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img       = Image.fromarray(frame_rgb)

            buf = io.BytesIO()
            pil_img.save(buf, format="JPEG", quality=85)
            buf.seek(0)

            try:
                result = self.detector.predict(buf)
                frames_data.append({
                    "frame_index":      sample_idx,
                    "timestamp_sec":    round(timestamp_sec, 2),
                    "verdict":          result["verdict"],
                    "fake_probability": result["fake_probability"],
                    "confidence_pct":   result["confidence_pct"],
                })
                print(f"   Frame {sample_idx+1}: t={timestamp_sec:.1f}s → {result['verdict']} ({result['confidence_pct']}%)")
            except Exception as e:
                print(f"   Frame {sample_idx+1} skipped: {e}")

            frame_idx  += frame_interval
            sample_idx += 1

        cap.release()
        return frames_data