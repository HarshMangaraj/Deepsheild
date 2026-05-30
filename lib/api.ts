// lib/api.ts — Phase 4 update: added DetectionSignal type and signal fields

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── NEW in Phase 4 ──
export interface DetectionSignal {
  id: string;
  name: string;
  description: string;
  severity: "high" | "medium" | "low" | "clean";
  score: number;       // 0.0 – 1.0
  category: "model" | "frequency" | "statistical" | "spatial";
}

export interface DetectionResult {
  verdict: "FAKE" | "REAL";
  confidence: number;
  confidence_pct: number;
  fake_probability: number;
  processing_time_ms: number;
  image_size: { width: number; height: number };
  model: string;
  // ── NEW in Phase 4 ──
  signals: DetectionSignal[];
  signal_summary: { high: number; medium: number; total: number };
}

export interface DetectionError {
  detail: string;
}

export async function detectDeepfake(file: File): Promise<DetectionResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/detect`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error: DetectionError = await response.json();
    throw new Error(error.detail || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}