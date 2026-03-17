"use client";

import { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";

type Viewer360Props = {
  src: string;
  className?: string;
};

export default function Viewer360({ src, className = "" }: Viewer360Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current || !src) {
      return;
    }

    setLoading(true);
    setError("");

    const viewer = new Viewer({
      container: containerRef.current,
      panorama: src,
      defaultYaw: 0,
      defaultPitch: 0,
      mousewheel: true,
      touchmoveTwoFingers: false,
      navbar: ["zoom", "move", "fullscreen"],
    });

    viewerRef.current = viewer;
    const timeout = window.setTimeout(() => {
      setLoading(false);
      setError("Interactive 360 view could not be loaded. Showing the panorama image instead.");
    }, 6000);
    viewer.addEventListener("panorama-loaded", () => {
      window.clearTimeout(timeout);
      setError("");
      setLoading(false);
    });

    return () => {
      window.clearTimeout(timeout);
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-sm font-medium text-slate-600">
          Loading 360 tour...
        </div>
      )}
      {error ? (
        <div className="relative h-[320px] w-full sm:h-[420px]">
          <img src={src} alt="360 panorama" className="h-full w-full object-cover" />
          <div className="absolute left-4 top-4 max-w-sm rounded-xl bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
            {error}
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="h-[320px] w-full sm:h-[420px]" />
      )}
    </div>
  );
}
