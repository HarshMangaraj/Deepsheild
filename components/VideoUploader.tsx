"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { detectVideoDeepfake, VideoDetectionResult } from "@/lib/api";
import VideoResultCard from "@/components/VideoResultCard";
import gsap from "gsap";

type Tab = "upload" | "webcam" | "url";

interface SelectedVideo {
  file: File;
  preview: string;
}

export default function VideoUploader() {
  const [tab, setTab]             = useState<Tab>("upload");
  const [selected, setSelected]   = useState<SelectedVideo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [result, setResult]       = useState<VideoDetectionResult | null>(null);
  const [error, setError]         = useState<string | null>(null);

  // Webcam state
  const [webcamActive, setWebcamActive] = useState(false);
  const [recording, setRecording]       = useState(false);
  const [webcamResult, setWebcamResult] = useState<VideoDetectionResult | null>(null);

  const inputRef    = useRef<HTMLInputElement>(null);
  const btnRef      = useRef<HTMLButtonElement>(null);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) return;
    setResult(null); setError(null);
    const url = URL.createObjectURL(file);
    setSelected({ file, preview: url });
  }, []);

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setSelected(null); setResult(null); setError(null); setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Fake progress animation while analyzing
  // WHY FAKE PROGRESS?
  // Video analysis can take 30-60 seconds. A frozen button is confusing.
  // We simulate progress up to 90%, then jump to 100% when done.
  const startProgress = () => {
    setProgress(0);
    const tween = gsap.to({ val: 0 }, {
      val: 90, duration: 40, ease: "power1.out",
      onUpdate: function() { setProgress(Math.round(this.targets()[0].val)); }
    });
    return tween;
  };

  const handleAnalyze = async () => {
    if (!selected) return;
    setIsAnalyzing(true); setError(null); setResult(null);
    const progressTween = startProgress();

    try {
      const res = await detectVideoDeepfake(selected.file);
      progressTween.kill();
      setProgress(100);
      setResult(res);
    } catch (err) {
      progressTween.kill();
      setProgress(0);
      setError(err instanceof Error ? err.message : "Analysis failed. Is the backend running?");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── WEBCAM ──
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setWebcamActive(true);
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setWebcamActive(false);
    setRecording(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], "webcam-recording.webm", { type: "video/webm" });
      stopWebcam();
      setSelected({ file, preview: URL.createObjectURL(blob) });
      setTab("upload");
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  useEffect(() => {
    return () => { stopWebcam(); };
  }, []);

  if (result) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-sm border" style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}>
          <div className="w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: "var(--sand)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth="1.5" strokeLinecap="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" style={{ color: "var(--charcoal)" }}>{selected!.file.name}</p>
            <p className="label-sm">{(selected!.file.size / (1024 * 1024)).toFixed(1)} MB · {result.frames_analyzed} frames analysed</p>
          </div>
          <button onClick={handleReset} className="label-sm hover:opacity-70 transition-opacity" style={{ color: "var(--brass)" }}>
            ← New video
          </button>
        </div>
        <VideoResultCard result={result} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* ── Tabs ── */}
      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        {(["upload", "webcam", "url"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); }}
            className="px-5 py-2.5 text-sm capitalize transition-all"
            style={{
              color: tab === t ? "var(--charcoal)" : "var(--stone)",
              fontFamily: "var(--font-display)",
              fontWeight: tab === t ? 500 : 400,
              borderBottom: tab === t ? "1.5px solid var(--brass)" : "1.5px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t === "url" ? "URL (coming soon)" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Upload tab ── */}
      {tab === "upload" && (
        <>
          <div
            onClick={() => !selected && inputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`upload-zone rounded-sm ${isDragging ? "drag-over" : ""} ${selected ? "cursor-default" : ""}`}
          >
            {selected ? (
              <div>
                <video src={selected.preview} className="w-full max-h-64 rounded-sm" controls muted />
                <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--sand)" }}>
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--charcoal)" }}>{selected.file.name}</p>
                    <p className="label-sm">{(selected.file.size / (1024 * 1024)).toFixed(1)} MB · {selected.file.type.split("/")[1].toUpperCase()}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleReset(); }} className="w-6 h-6 flex items-center justify-center hover:opacity-60" style={{ color: "var(--stone)" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-sm flex items-center justify-center mb-5 border" style={{ background: "var(--sand)", borderColor: "var(--mist)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth="1.5" strokeLinecap="round">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                  </svg>
                </div>
                <p className="text-base font-light mb-1" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>
                  {isDragging ? "Release to upload" : "Drop a video here"}
                </p>
                <p className="label-sm">or click to browse · MP4 · MOV · WEBM · max 100MB</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm" onChange={onFileChange} className="hidden" />
          </div>

          {/* Progress bar */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="label-sm">Analysing frames…</span>
                <span className="label-sm" style={{ fontFamily: "var(--font-mono)" }}>{progress}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ background: "var(--brass)", width: `${progress}%`, transition: "width 0.5s ease" }} />
              </div>
              <p className="label-sm">This may take 30–60 seconds depending on video length.</p>
            </div>
          )}
        </>
      )}

      {/* ── Webcam tab ── */}
      {tab === "webcam" && (
        <div className="space-y-4">
          <div className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full max-h-64 bg-black" />
          </div>
          <div className="flex gap-3">
            {!webcamActive ? (
              <button onClick={startWebcam} className="flex-1 py-3 rounded-sm text-sm" style={{ background: "var(--charcoal)", color: "var(--cream)", fontFamily: "var(--font-mono)" }}>
                Start camera →
              </button>
            ) : !recording ? (
              <button onClick={startRecording} className="flex-1 py-3 rounded-sm text-sm" style={{ background: "var(--blush)", color: "white", fontFamily: "var(--font-mono)" }}>
                ● Start recording
              </button>
            ) : (
              <button onClick={stopRecording} className="flex-1 py-3 rounded-sm text-sm animate-pulse" style={{ background: "var(--charcoal)", color: "var(--cream)", fontFamily: "var(--font-mono)" }}>
                ■ Stop & analyse
              </button>
            )}
            {webcamActive && (
              <button onClick={stopWebcam} className="px-4 py-3 rounded-sm text-sm border" style={{ borderColor: "var(--sand)", color: "var(--graphite)", fontFamily: "var(--font-mono)" }}>
                Cancel
              </button>
            )}
          </div>
          <p className="label-sm">Record a short clip (5–15 seconds). It will be sent for analysis automatically.</p>
        </div>
      )}

      {/* ── URL tab ── */}
      {tab === "url" && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-sm border" style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}>
          <div className="w-12 h-12 rounded-sm flex items-center justify-center mb-5 border" style={{ background: "var(--sand)", borderColor: "var(--mist)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <p className="text-base font-light mb-2" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>URL detection coming soon</p>
          <p className="label-sm max-w-xs">YouTube, Instagram, and Twitter/X URL analysis is in development. Use file upload or webcam for now.</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-sm border" style={{ borderColor: "#EAC4B8", background: "#FDF0EC" }}>
          <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blush)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm" style={{ color: "var(--blush)", fontFamily: "var(--font-mono)" }}>{error}</p>
        </div>
      )}

      {/* ── Analyse button (upload tab only) ── */}
      {tab === "upload" && (
        <button
          ref={btnRef}
          onClick={handleAnalyze}
          disabled={!selected || isAnalyzing}
          className="w-full py-3.5 rounded-sm text-sm font-medium transition-colors duration-200"
          style={{
            background: selected && !isAnalyzing ? "var(--charcoal)" : "var(--sand)",
            color: selected && !isAnalyzing ? "var(--cream)" : "var(--stone)",
            cursor: selected && !isAnalyzing ? "pointer" : "not-allowed",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
          }}
        >
          {isAnalyzing ? "Analysing frames…" : "Analyse video →"}
        </button>
      )}
    </div>
  );
}