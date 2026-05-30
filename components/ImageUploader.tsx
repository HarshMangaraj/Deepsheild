"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { detectDeepfake, DetectionResult } from "../lib/api";
import ResultCard from "./ResultCard";
import gsap from "gsap";

interface SelectedFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

export default function ImageUploader() {
  const [selected, setSelected]       = useState<SelectedFile | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]           = useState<DetectionResult | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const inputRef    = useRef<HTMLInputElement>(null);
  const zoneRef     = useRef<HTMLDivElement>(null);
  const btnRef      = useRef<HTMLButtonElement>(null);
  const resultRef   = useRef<HTMLDivElement>(null);

  // Animate result card in
  useEffect(() => {
    if (result && resultRef.current) {
      gsap.from(resultRef.current, {
        opacity: 0, y: 20, duration: 0.6,
        ease: "power3.out",
      });
    }
  }, [result]);

  const processFile = useCallback((file: File) => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isImage && !isVideo) return;

    setResult(null);
    setError(null);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelected({ file, preview: e.target?.result as string, type: "image" });
      };
      reader.readAsDataURL(file);
    } else {
      // For video, create an object URL for preview
      const url = URL.createObjectURL(file);
      setSelected({ file, preview: url, type: "video" });
    }

    // Animate zone out when file selected
    if (zoneRef.current) {
      gsap.to(zoneRef.current, { scale: 0.99, duration: 0.2, yoyo: true, repeat: 1 });
    }
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
    setSelected(null); setResult(null); setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!selected) return;
    setIsAnalyzing(true); setError(null); setResult(null);

    // Pulse the button while analyzing
    if (btnRef.current) {
      gsap.to(btnRef.current, { opacity: 0.7, duration: 0.4, yoyo: true, repeat: -1 });
    }

    try {
      const detectionResult = await detectDeepfake(selected.file);
      setResult(detectionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Is the backend running on port 8000?");
    } finally {
      setIsAnalyzing(false);
      if (btnRef.current) gsap.killTweensOf(btnRef.current);
    }
  };

  if (result) {
    return (
      <div ref={resultRef} className="w-full space-y-4">
        {/* Thumbnail strip */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-sm border"
          style={{ borderColor: "var(--sand)", background: "var(--parchment)" }}
        >
          {selected?.type === "image" ? (
            <img src={selected.preview} alt="Analyzed" className="w-12 h-12 rounded-sm object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: "var(--sand)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth="1.5" strokeLinecap="round">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" style={{ color: "var(--charcoal)" }}>{selected!.file.name}</p>
            <p className="label-sm">{(selected!.file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button onClick={handleReset} className="label-sm hover:opacity-70 transition-opacity" style={{ color: "var(--brass)" }}>
            ← New file
          </button>
        </div>
        <ResultCard result={result} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Drop zone */}
      <div
        ref={zoneRef}
        onClick={() => !selected && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`upload-zone rounded-sm ${isDragging ? "drag-over" : ""} ${selected ? "cursor-default" : ""}`}
      >
        {selected ? (
          <div>
            {selected.type === "image" ? (
              <img src={selected.preview} alt="Selected" className="w-full max-h-64 object-contain rounded-sm" />
            ) : (
              <video src={selected.preview} className="w-full max-h-64 rounded-sm" controls muted />
            )}
            <div
              className="flex items-center justify-between px-4 py-3 border-t"
              style={{ borderColor: "var(--sand)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ background: "var(--sand)" }}>
                  {selected.type === "image" ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--graphite)" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--graphite)" strokeWidth="2" strokeLinecap="round">
                      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ color: "var(--charcoal)" }}>{selected.file.name}</p>
                  <p className="label-sm">{(selected.file.size / 1024).toFixed(1)} KB · {selected.file.type.split("/")[1].toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="w-6 h-6 flex items-center justify-center hover:opacity-60 transition-opacity"
                style={{ color: "var(--stone)" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div
              className="w-12 h-12 rounded-sm flex items-center justify-center mb-5 border"
              style={{ background: "var(--sand)", borderColor: "var(--mist)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--stone)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </div>
            <p className="text-base font-light mb-1" style={{ color: "var(--charcoal)", fontFamily: "var(--font-display)" }}>
              {isDragging ? "Release to upload" : "Drop an image or video here"}
            </p>
            <p className="label-sm">or click to browse · JPG · PNG · WEBP · MP4</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-sm border"
          style={{ borderColor: "#EAC4B8", background: "#FDF0EC" }}
        >
          <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blush)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm" style={{ color: "var(--blush)", fontFamily: "var(--font-mono)" }}>{error}</p>
        </div>
      )}

      {/* Analyze button */}
      <button
        ref={btnRef}
        onClick={handleAnalyze}
        disabled={!selected || isAnalyzing}
        className="w-full py-3.5 rounded-sm text-sm font-medium tracking-wide transition-colors duration-200"
        style={{
          background: selected && !isAnalyzing ? "var(--charcoal)" : "var(--sand)",
          color: selected && !isAnalyzing ? "var(--cream)" : "var(--stone)",
          cursor: selected && !isAnalyzing ? "pointer" : "not-allowed",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.08em",
        }}
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Analysing…
          </span>
        ) : "Run analysis →"}
      </button>
    </div>
  );
}