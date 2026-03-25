"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { X, Check, Scissors } from "lucide-react";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SnipCropModalProps {
  screenshotDataUrl: string;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

/**
 * Full-screen crop modal.
 * - Displays a screenshot and lets the user drag a selection rectangle.
 * - On confirm, crops the selection to a PNG Blob (stays in memory, never saved).
 * - Uses a tight container (inline-block) so mouse coords === image coords.
 */
export function SnipCropModal({ screenshotDataUrl, onCrop, onCancel }: SnipCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [dragging, setDragging] = useState(false);
  const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  function getRelativePos(clientX: number, clientY: number): { x: number; y: number } {
    const bounds = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(clientX - bounds.left, bounds.width)),
      y: Math.max(0, Math.min(clientY - bounds.top, bounds.height)),
    };
  }

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    const pos = getRelativePos(e.clientX, e.clientY);
    setStartPt(pos);
    setRect(null);
    setDragging(true);
  }

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || !startPt) return;
    const pos = getRelativePos(e.clientX, e.clientY);
    setRect({
      x: Math.min(startPt.x, pos.x),
      y: Math.min(startPt.y, pos.y),
      w: Math.abs(pos.x - startPt.x),
      h: Math.abs(pos.y - startPt.y),
    });
  }, [dragging, startPt]); // eslint-disable-line react-hooks/exhaustive-deps

  function onMouseUp() {
    setDragging(false);
  }

  function confirmCrop() {
    if (!rect || rect.w < 8 || rect.h < 8 || !imgRef.current) return;

    const img = imgRef.current;
    const displayed = img.getBoundingClientRect();

    // Scale factor: displayed px → natural image px
    const scaleX = img.naturalWidth / displayed.width;
    const scaleY = img.naturalHeight / displayed.height;

    // Container and image share the same bounding box (inline-block tight wrap),
    // so no offset calculation is needed.
    const cx = Math.max(0, Math.round(rect.x * scaleX));
    const cy = Math.max(0, Math.round(rect.y * scaleY));
    const cw = Math.min(Math.round(rect.w * scaleX), img.naturalWidth - cx);
    const ch = Math.min(Math.round(rect.h * scaleY), img.naturalHeight - cy);

    if (cw < 1 || ch < 1) return;

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
    canvas.toBlob((blob) => {
      if (blob) onCrop(blob);
    }, "image/png");
  }

  const hasSelection = rect !== null && rect.w >= 8 && rect.h >= 8;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-3.5 flex-shrink-0 border-b"
        style={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[#4F7CFF] flex items-center justify-center flex-shrink-0">
            <Scissors className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Snip Question</p>
            <p className="text-xs text-white/40">
              {hasSelection
                ? `Selected ${Math.round(rect!.w)} × ${Math.round(rect!.h)} px — click "Send to Cosmo" when ready`
                : "Click and drag to draw a box around your question"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          <button
            onClick={confirmCrop}
            disabled={!hasSelection}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition-all"
            style={{
              background: hasSelection
                ? "linear-gradient(135deg, #4F7CFF 0%, #8B7FFF 100%)"
                : "rgba(255,255,255,0.1)",
              opacity: hasSelection ? 1 : 0.4,
              cursor: hasSelection ? "pointer" : "not-allowed",
            }}
          >
            <Check className="h-4 w-4" />
            Send to Cosmo
          </button>
        </div>
      </div>

      {/* ── Screenshot + crop area ───────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-8">

        {/* Tight wrapper — container bbox === image bbox, simplifying coordinate math */}
        <div
          ref={containerRef}
          className="relative"
          style={{
            display: "inline-block",
            cursor: "crosshair",
            userSelect: "none",
            lineHeight: 0,
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <img
            ref={imgRef}
            src={screenshotDataUrl}
            alt="Captured screen"
            draggable={false}
            onLoad={() => setImgLoaded(true)}
            style={{
              display: "block",
              maxWidth: "min(90vw, 1600px)",
              maxHeight: "calc(100vh - 180px)",
              borderRadius: "8px",
            }}
          />

          {/* Dimming overlay outside selection */}
          {imgLoaded && rect && (
            <>
              {/* top strip */}
              <div
                className="absolute inset-x-0 top-0 pointer-events-none"
                style={{ height: rect.y, backgroundColor: "rgba(0,0,0,0.55)" }}
              />
              {/* left strip */}
              <div
                className="absolute left-0 pointer-events-none"
                style={{
                  top: rect.y,
                  width: rect.x,
                  height: rect.h,
                  backgroundColor: "rgba(0,0,0,0.55)",
                }}
              />
              {/* right strip */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: rect.y,
                  left: rect.x + rect.w,
                  right: 0,
                  height: rect.h,
                  backgroundColor: "rgba(0,0,0,0.55)",
                }}
              />
              {/* bottom strip */}
              <div
                className="absolute inset-x-0 pointer-events-none"
                style={{
                  top: rect.y + rect.h,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.55)",
                }}
              />

              {/* Selection border */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: rect.x,
                  top: rect.y,
                  width: rect.w,
                  height: rect.h,
                  border: "2px solid #4F7CFF",
                  boxSizing: "border-box",
                }}
              />

              {/* Corner handles */}
              {[
                [rect.x - 5, rect.y - 5],
                [rect.x + rect.w - 5, rect.y - 5],
                [rect.x - 5, rect.y + rect.h - 5],
                [rect.x + rect.w - 5, rect.y + rect.h - 5],
              ].map(([lx, ly], i) => (
                <div
                  key={i}
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    left: lx,
                    top: ly,
                    width: 10,
                    height: 10,
                    backgroundColor: "#4F7CFF",
                    border: "2px solid #fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  }}
                />
              ))}

              {/* Dimension badge */}
              <div
                className="absolute pointer-events-none rounded-full text-white font-bold"
                style={{
                  left: rect.x,
                  top: Math.max(0, rect.y - 28),
                  fontSize: 11,
                  backgroundColor: "#4F7CFF",
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                {Math.round(rect.w)} × {Math.round(rect.h)}
              </div>
            </>
          )}

          {/* "Click and drag" hint before first selection */}
          {imgLoaded && !rect && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div
                className="text-white text-sm font-semibold px-5 py-3 rounded-2xl"
                style={{
                  backgroundColor: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                ✂️ Click and drag to select your question
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
