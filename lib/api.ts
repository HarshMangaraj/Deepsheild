// lib/api.ts — updated with video detection types and function

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Image types (unchanged) ──
export interface DetectionSignal {
  id: string;
  name: string;
  description: string;
  severity: "high" | "medium" | "low" | "clean";
  score: number;
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
  signals: DetectionSignal[];
  signal_summary: { high: number; medium: number; total: number };
}

// ── Video types (new) ──
export interface FrameResult {
  frame_index: number;
  timestamp_sec: number;
  verdict: "FAKE" | "REAL";
  fake_probability: number;
  confidence_pct: number;
}

export interface VideoDetectionResult {
  verdict: "FAKE" | "REAL";
  confidence: number;
  confidence_pct: number;
  fake_probability: number;
  processing_time_ms: number;
  frames_analyzed: number;
  frames_flagged: number;
  frames_clean: number;
  fake_ratio: number;
  fake_ratio_pct: number;
  frames: FrameResult[];
  model: string;
}

export interface DetectionError {
  detail: string;
}

// ── API functions ──
export async function detectDeepfake(file: File): Promise<DetectionResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/detect`, { method: "POST", body: formData });
  if (!response.ok) {
    const error: DetectionError = await response.json();
    throw new Error(error.detail || `Server error: ${response.status}`);
  }
  return response.json();
}

export async function detectVideoDeepfake(file: File): Promise<VideoDetectionResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/detect/video`, { method: "POST", body: formData });
  if (!response.ok) {
    const error: DetectionError = await response.json();
    throw new Error(error.detail || `Server error: ${response.status}`);
  }
  return response.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}