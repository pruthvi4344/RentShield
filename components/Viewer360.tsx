"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";

type Viewer360Props = {
  src: string;
  className?: string;
};

export default function Viewer360({ src, className = "" }: Viewer360Props) {
  return <Viewer360Instance key={src} src={src} className={className} />;
}

function Viewer360Instance({ src, className = "" }: Viewer360Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const isReadyRef = useRef(false);
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; startYaw: number; startPitch: number }>({
    active: false,
    startX: 0,
    startY: 0,
    startYaw: 0,
    startPitch: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current || !src) {
      return;
    }

    let viewer: Viewer;
    try {
      viewer = new Viewer({
        container: containerRef.current,
        defaultYaw: 0,
        defaultPitch: 0,
        defaultZoomLvl: 30,
        mousewheel: true,
        mousemove: false,
        touchmoveTwoFingers: false,
        keyboard: "always",
        moveSpeed: 1.1,
        navbar: ["moveLeft", "moveRight", "zoom", "fullscreen"],
      });
    } catch (initError) {
      const message = initError instanceof Error ? initError.message : "Interactive 360 view could not be initialized.";
      window.setTimeout(() => {
        setLoading(false);
        setError(`${message} Showing the panorama image instead.`);
      }, 0);
      return;
    }

    viewerRef.current = viewer;
    const timeout = window.setTimeout(() => {
      setLoading(false);
      setError("Interactive 360 view could not be loaded. Showing the panorama image instead.");
    }, 12000);

    viewer.addEventListener("ready", () => {
      window.clearTimeout(timeout);
      setError("");
      setLoading(false);
      isReadyRef.current = true;
    });

    viewer.addEventListener("panorama-error", (event) => {
      window.clearTimeout(timeout);
      const panoramaEvent = event as Event & { error?: Error };
      const reason = panoramaEvent.error?.message ? ` (${panoramaEvent.error.message})` : "";
      setLoading(false);
      isReadyRef.current = false;
      setError(`Interactive 360 view could not be loaded${reason}. Showing the panorama image instead.`);
    });

    const containerElement = containerRef.current;
    const normalizeYaw = (value: number): number => {
      if (!Number.isFinite(value)) return 0;
      return Math.atan2(Math.sin(value), Math.cos(value));
    };

    const getClientPoint = (event: MouseEvent | TouchEvent): { x: number; y: number } | null => {
      if ("touches" in event) {
        if (event.touches.length > 0) {
          return { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
        if (event.changedTouches.length > 0) {
          return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
        }
        return null;
      }
      return { x: event.clientX, y: event.clientY };
    };

    const clampPitch = (value: number): number => {
      return Math.max(-1.35, Math.min(1.35, value));
    };

    const onStartDrag = (event: MouseEvent | TouchEvent) => {
      if ("button" in event && event.button !== 0) {
        return;
      }
      if (!isReadyRef.current) {
        return;
      }

      const point = getClientPoint(event);
      if (!point) {
        return;
      }
      try {
        const position = viewer.getPosition();
        dragRef.current = {
          active: true,
          startX: point.x,
          startY: point.y,
          startYaw: position.yaw,
          startPitch: position.pitch,
        };
        containerElement.style.cursor = "grabbing";
      } catch {
        dragRef.current.active = false;
      }
      if (event.cancelable) event.preventDefault();
    };

    const onMoveDrag = (event: MouseEvent | TouchEvent) => {
      if (!dragRef.current.active) {
        return;
      }

      const point = getClientPoint(event);
      if (!point) {
        return;
      }

      const deltaX = point.x - dragRef.current.startX;
      const deltaY = point.y - dragRef.current.startY;
      const nextYaw = normalizeYaw(dragRef.current.startYaw - deltaX * 0.005);
      const nextPitch = clampPitch(dragRef.current.startPitch - deltaY * 0.004);
      try {
        viewer.rotate({ yaw: nextYaw, pitch: nextPitch });
      } catch {
        // Ignore if viewer is not ready during a transition.
      }
      if (event.cancelable) event.preventDefault();
    };

    const stopDrag = (event: MouseEvent | TouchEvent) => {
      if (!dragRef.current.active) {
        return;
      }

      dragRef.current.active = false;
      containerElement.style.cursor = "grab";
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    containerElement.style.touchAction = "none";
    containerElement.style.cursor = "grab";
    containerElement.addEventListener("mousedown", onStartDrag, { capture: true });
    containerElement.addEventListener("touchstart", onStartDrag, { capture: true, passive: false });
    window.addEventListener("mousemove", onMoveDrag, { capture: true });
    window.addEventListener("touchmove", onMoveDrag, { capture: true, passive: false });
    window.addEventListener("mouseup", stopDrag, { capture: true });
    window.addEventListener("touchend", stopDrag, { capture: true });
    window.addEventListener("touchcancel", stopDrag, { capture: true });

    void viewer.setPanorama(src, { showLoader: false }).catch((loadError: unknown) => {
      window.clearTimeout(timeout);
      const message = loadError instanceof Error ? loadError.message : "Unable to load this panorama file.";
      setLoading(false);
      isReadyRef.current = false;
      setError(`Interactive 360 view could not be loaded (${message}). Showing the panorama image instead.`);
    });

    return () => {
      window.clearTimeout(timeout);
      isReadyRef.current = false;
      containerElement.removeEventListener("mousedown", onStartDrag, { capture: true });
      containerElement.removeEventListener("touchstart", onStartDrag, { capture: true });
      window.removeEventListener("mousemove", onMoveDrag, { capture: true });
      window.removeEventListener("touchmove", onMoveDrag, { capture: true });
      window.removeEventListener("mouseup", stopDrag, { capture: true });
      window.removeEventListener("touchend", stopDrag, { capture: true });
      window.removeEventListener("touchcancel", stopDrag, { capture: true });
      containerElement.style.cursor = "";
      containerElement.style.touchAction = "";
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [src]);

  function rotateBy(deltaYaw: number) {
    const viewer = viewerRef.current;
    if (!viewer) return;

    try {
      const position = viewer.getPosition();
      viewer.rotate({ yaw: position.yaw + deltaYaw, pitch: position.pitch });
    } catch {
      // Ignore rotate errors if viewer is mid-transition.
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-sm font-medium text-slate-600">
          Loading 360 tour...
        </div>
      )}
      {error ? (
        <PanoramaFallback src={src} message={error} />
      ) : (
        <>
          <div ref={containerRef} className="h-[320px] w-full touch-none sm:h-[420px]" />
          {!loading && (
            <>
              <div className="absolute inset-y-0 left-2 z-10 flex items-center">
                <button
                  type="button"
                  onClick={() => rotateBy(-0.35)}
                  className="rounded-full bg-slate-900/70 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-900/85"
                  aria-label="Rotate left"
                >
                  LEFT
                </button>
              </div>
              <div className="absolute inset-y-0 right-2 z-10 flex items-center">
                <button
                  type="button"
                  onClick={() => rotateBy(0.35)}
                  className="rounded-full bg-slate-900/70 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-900/85"
                  aria-label="Rotate right"
                >
                  RIGHT
                </button>
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white">
                Drag, swipe, or use LEFT/RIGHT
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

type PanoramaFallbackProps = {
  src: string;
  message: string;
};

function PanoramaFallback({ src, message }: PanoramaFallbackProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ active: boolean; startX: number; startY: number; startPositionX: number; startPositionY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    startPositionX: 50,
    startPositionY: 50,
  });
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [renderInfo, setRenderInfo] = useState<{ width: number; height: number; overflowX: number; overflowY: number } | null>(null);

  useEffect(() => {
    if (!viewportRef.current) return;

    const viewportElement = viewportRef.current;
    let canceled = false;
    const image = new Image();

    const calculate = () => {
      if (canceled || !viewportRef.current || !image.naturalWidth || !image.naturalHeight) return;
      const rect = viewportElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const scale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const overflowX = Math.max(0, width - rect.width);
      const overflowY = Math.max(0, height - rect.height);

      setRenderInfo({ width, height, overflowX, overflowY });
      setPositionX(50);
      setPositionY(50);
    };

    image.onload = calculate;
    image.src = src;

    const resizeObserver = new ResizeObserver(() => {
      calculate();
    });
    resizeObserver.observe(viewportElement);

    return () => {
      canceled = true;
      resizeObserver.disconnect();
    };
  }, [src]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startPositionX: positionX,
      startPositionY: positionY,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStateRef.current.active) return;
    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    const speedX = renderInfo?.overflowX ? 0.12 : 0;
    const speedY = renderInfo?.overflowY ? 0.12 : 0;
    const nextX = dragStateRef.current.startPositionX - deltaX * speedX;
    const nextY = dragStateRef.current.startPositionY - deltaY * speedY;
    setPositionX(Math.max(0, Math.min(100, nextX)));
    setPositionY(Math.max(0, Math.min(100, nextY)));
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current.active = false;
  }

  return (
    <div className="relative h-[320px] w-full sm:h-[420px]">
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        className="relative h-full w-full touch-none cursor-grab overflow-hidden bg-slate-900 active:cursor-grabbing"
      >
        <img
          src={src}
          alt="360 panorama"
          className="absolute left-0 top-0 max-w-none select-none object-cover"
          style={
            renderInfo
              ? {
                  width: `${renderInfo.width}px`,
                  height: `${renderInfo.height}px`,
                  transform: `translate3d(${-((renderInfo.overflowX * positionX) / 100)}px, -${((renderInfo.overflowY * positionY) / 100)}px, 0)`,
                }
              : {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }
          }
          draggable={false}
        />
      </div>
      <div className="absolute left-4 top-4 max-w-sm rounded-xl bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
        {message}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white">
        Drag left/right/up/down to pan preview (not full 360)
      </div>
    </div>
  );
}
