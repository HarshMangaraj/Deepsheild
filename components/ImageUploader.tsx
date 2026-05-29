"use client";

// WHY "use client"?
// Next.js renders pages on the SERVER by default (for performance/SEO).
// But this component uses React hooks (useState, useCallback) and browser
// APIs (FileReader, drag events) — things that only exist in the browser.
// "use client" tells Next.js: "run this component in the browser, not server."

import { useState, useCallback, useRef } from "react";

// WHAT IS A TYPE/INTERFACE?
// TypeScript lets us describe the shape of data. Here we're saying:
// a SelectedFile always has a `file` (the raw File object from the browser)
// and a `preview` (a base64 data URL string we can put in an <img> src).
interface SelectedFile {
  file: File;
  preview: string;
}

export default function ImageUploader() {
  // STATE — React's way of remembering things between renders.
  // When state changes, React re-draws the component automatically.
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // A ref gives us a direct handle to a DOM element (the hidden file input).
  // We use it so clicking our styled div triggers the native file picker.
  const inputRef = useRef<HTMLInputElement>(null);

  // processFile: takes a File, reads it as a data URL so we can preview it.
  // FileReader is a built-in browser API — no library needed.
  const processFile = useCallback((file: File) => {
    // Only accept images
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelected({
        file,
        preview: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file); // converts image to base64 string
  }, []);

  // Drag-and-drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // prevent browser from opening the file
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // Regular click-to-upload handler
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Simulate analyze (Phase 2 will replace this with a real API call)
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000); // fake 2s "loading"
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* ── Drop zone ── */}
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
          /* ── Image preview ── */
          <div className="fade-in">
            <img
              src={selected.preview}
              alt="Selected"
              className="w-full max-h-72 object-contain rounded-xl"
            />
            {/* Overlay with file info */}
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
                onClick={(e) => { e.stopPropagation(); setSelected(null); }}
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
          /* ── Empty state ── */
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

        {/* Hidden native file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {/* ── Analyze button ── */}
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

      {/* Phase notice */}
      <p className="text-center text-xs text-white/20 font-mono">
        Phase 1 — UI only · Detection coming in Phase 2
      </p>
    </div>
  );
}