// lib/api.ts — DeepShield API client
//
// WHY A SEPARATE FILE FOR THIS?
// Keeping all fetch/API logic here means:
// - Components stay clean (they just call functions, not raw fetch)
// - If the backend URL or request format changes, you fix it in ONE place
// - Easy to mock in tests later

// WHY NEXT_PUBLIC_?
// Next.js runs some code on the server, some in the browser.
// `NEXT_PUBLIC_` prefix tells Next.js: "expose this variable to the browser too."
// Without it, process.env.API_URL would be undefined on the client side.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── TYPES ──
// TypeScript interfaces describe the shape of our data.
// This matches exactly what detector.py returns.
export interface DetectionResult {
  verdict: "FAKE" | "REAL";
  confidence: number;        // 0.0 – 1.0
  confidence_pct: number;    // 0.0 – 100.0
  fake_probability: number;  // raw model output
  processing_time_ms: number;
  image_size: {
    width: number;
    height: number;
  };
  model: string;
}

export interface DetectionError {
  detail: string;
}

// ── MAIN FUNCTION ──
// Takes a File object (from the browser's file picker / drag-drop),
// sends it to the Python backend, returns the parsed result.
//
// WHY `async/await`?
// Network requests take time. `async/await` lets us write code that
// "waits" for the response without freezing the browser tab.
// Under the hood it's the same as `.then().catch()` — just cleaner syntax.
export async function detectDeepfake(file: File): Promise<DetectionResult> {
  // FormData is the browser's way of packaging files for HTTP upload.
  // The key "file" must match the parameter name in FastAPI: `file: UploadFile`
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/detect`, {
    method: "POST",
    body: formData,
    // NOTE: Do NOT set Content-Type header manually when using FormData.
    // The browser sets it automatically with the correct boundary string.
    // Setting it yourself breaks multipart parsing on the server.
  });

  // `response.ok` is true for 2xx status codes (200, 201, etc.)
  if (!response.ok) {
    const error: DetectionError = await response.json();
    throw new Error(error.detail || `Server error: ${response.status}`);
  }

  const result: DetectionResult = await response.json();
  return result;
}

// ── HEALTH CHECK ──
// Useful for showing "backend offline" warnings in the UI.
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}