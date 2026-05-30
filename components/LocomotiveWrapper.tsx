"use client";

// LocomotiveWrapper.tsx
// WHY THIS EXISTS:
// Locomotive Scroll needs to mount after the DOM is ready (client-side only).
// Next.js renders on the server first, so we use useEffect to initialize
// Locomotive only in the browser. This wrapper handles that safely.
//
// HOW LOCOMOTIVE SCROLL WORKS:
// It replaces the browser's native scroll with a smooth, inertia-based
// scroll. Elements with [data-scroll] attributes get parallax/reveal effects.
// The library watches scroll position and applies CSS transforms.

import { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
}

export default function LocomotiveWrapper({ children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const locoRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic import — Locomotive Scroll only runs in the browser
    // We import it dynamically so Next.js doesn't try to run it server-side
    const initLoco = async () => {
      const LocomotiveScroll = (await import("locomotive-scroll")).default;

      if (!containerRef.current) return;

      locoRef.current = new LocomotiveScroll({
        el: containerRef.current,
        smooth: true,
        smoothMobile: false,   // disable on mobile for performance
        multiplier: 0.9,       // scroll speed (1 = normal, <1 = slower/heavier)
        lerp: 0.08,            // interpolation factor (lower = more inertia)
        class: "is-inview",    // CSS class added when element enters viewport
      });
    };

    initLoco();

    // Cleanup on unmount — destroy the Locomotive instance to prevent memory leaks
    return () => {
      if (locoRef.current) {
        locoRef.current.destroy();
      }
    };
  }, []);

  return (
    <div ref={containerRef} data-scroll-container>
      {children}
    </div>
  );
}