"use client";

import { useState, useCallback, useRef } from "react";
import { detectDeepfake, DetectionResult } from "../lib/api";
import ResultCard from "./ResultCard";

interface SelectedFile {
  file: File;
  preview: string;
}

export default function ImageUploader() {
  const [selected, setSelected]       = useState<SelectedFile | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]           = useState<DetectionResult | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelected({ file, preview: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }, []);

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setSelected(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // THE REAL ANALYZE FUNCTION — replaces the fake setTimeout from Phase 1
  const handleAnalyze = async () => {
    if (!selected) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const detectionResult = await detectDeepfake(selected.file);
      setResult(detectionResult);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Is the backend running on port 8000?");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Once we have a result, show ResultCard instead of the uploader
  if (result) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
          <img
            src={selected!.preview}
            alt="Analyzed"
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/60 truncate">{selected!.file.name}</p>
            <p className="text-xs text-white/25 font-mono">
              {(selected!.file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <ResultCard result={result} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => !selected && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
          ${selected ? "border-white/10 cursor-default" : "cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/[0.03]"}
          ${isDragging ? "upload-active" : "border-white/10 bg-white/[0.02]"}
        `}
      >
        {selected ? (
          <div className="fade-in">
            <img
              src={selected.preview}
              alt="Selected"
              className="w-full max-h-72 object-contain rounded-xl"
            />
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-t border-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/70 truncate">{selected.file.name}</p>
                  <p className="text-xs text-white/30 font-mono">
                    {(selected.file.size / 1024).toFixed(1)} KB · {selected.file.type.split("/")[1].toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="flex-shrink-0 w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className={`w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center mb-5 transition-colors duration-300 ${isDragging ? "bg-cyan-500/10 border-cyan-500/30" : "bg-white/[0.03]"}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDragging ? "#22d3ee" : "rgba(255,255,255,0.4)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white/60">
              {isDragging ? "Drop it here" : "Drop an image here"}
            </p>
            <p className="text-xs text-white/25 mt-1.5 font-mono">
              or click to browse · JPG, PNG, WEBP
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 fade-in">
          <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-xs text-red-400 font-mono leading-relaxed">{error}</p>
        </div>
      )}

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={!selected || isAnalyzing}
        className={`
          btn-scan w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300
          ${selected && !isAnalyzing
            ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
            : "bg-white/[0.05] text-white/20 cursor-not-allowed"
          }
        `}
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Analyzing image...
          </span>
        ) : (
          "Analyze Image →"
        )}
      </button>
    </div>
  );
}