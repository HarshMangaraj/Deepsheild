#!/usr/bin/env python3
"""
test_detector.py — Quick sanity check for the backend.

Run this BEFORE connecting the frontend to make sure the model loads
and returns sensible output.

Usage:
    python test_detector.py                        # uses a generated test image
    python test_detector.py path/to/image.jpg     # tests a real image
"""

import sys
import json
import io
from PIL import Image

def create_test_image() -> io.BytesIO:
    """Creates a simple 256x256 RGB test image in memory."""
    img = Image.new("RGB", (256, 256), color=(120, 160, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf

def main():
    print("🛡️  DeepShield Backend — Detector Test")
    print("=" * 45)

    # Load detector
    print("\n1. Loading DeepfakeDetector...")
    from detector import DeepfakeDetector
    detector = DeepfakeDetector()
    print("   ✅ Detector loaded.")

    # Get test image
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        print(f"\n2. Using image: {image_path}")
        with open(image_path, "rb") as f:
            image_data = io.BytesIO(f.read())
    else:
        print("\n2. No image provided — using generated test image (256x256 blue square).")
        image_data = create_test_image()

    # Run prediction
    print("\n3. Running prediction...")
    result = detector.predict(image_data)

    # Display result
    print("\n" + "=" * 45)
    print("📊  RESULT:")
    print(json.dumps(result, indent=2))
    print("=" * 45)

    verdict_emoji = "🔴 FAKE" if result["verdict"] == "FAKE" else "🟢 REAL"
    print(f"\nVerdict:    {verdict_emoji}")
    print(f"Confidence: {result['confidence_pct']}%")
    print(f"Time:       {result['processing_time_ms']}ms")
    print("\n✅ Backend is working correctly.")


if __name__ == "__main__":
    main()