"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, ScanLine, Loader2, AlertTriangle } from "lucide-react";
import type {
  Mode,
  QRData,
  QRCustomization,
  BarcodeData,
  BarcodeCustomization,
} from "@/types";
import { buildQRString, renderQRToCanvas, validateData } from "@/lib/qr-utils";
import { renderBarcodeToCanvas, validateBarcode } from "@/lib/barcode-utils";

interface PreviewCanvasProps {
  mode: Mode;
  qrData: QRData;
  qrCustom: QRCustomization;
  barcode: BarcodeData;
  barcodeCustom: BarcodeCustomization;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onReady?: (ready: boolean) => void;
}

export default function PreviewCanvas({
  mode,
  qrData,
  qrCustom,
  barcode,
  barcodeCustom,
  canvasRef,
  onReady,
}: PreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(true);
  const [scanKey, setScanKey] = useState(0);
  const [showScan, setShowScan] = useState(false);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

  // Render effect (debounced by the parent via state updates)
  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    async function render() {
      setError(null);

      if (mode === "qr") {
        const validation = validateData(qrData);
        const text = validation.valid ? buildQRString(qrData) : "";
        if (!text) {
          setEmpty(true);
          onReady?.(false);
          return;
        }
        setEmpty(false);
        setLoading(true);
        try {
          await renderQRToCanvas(canvas!, {
            text,
            customization: qrCustom,
            pixelSize: qrCustom.size,
          });
          if (cancelled) return;
          setDimensions({ w: qrCustom.size, h: qrCustom.size });
          setScanKey((k) => k + 1);
          onReady?.(true);
        } catch (e) {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Failed to render");
          onReady?.(false);
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else {
        const validation = validateBarcode(barcode.format, barcode.value);
        if (!validation.valid) {
          setEmpty(true);
          onReady?.(false);
          return;
        }
        setEmpty(false);
        setLoading(true);
        try {
          renderBarcodeToCanvas(canvas!, {
            format: barcode.format,
            value: barcode.value,
            customization: barcodeCustom,
          });
          if (cancelled) return;
          setDimensions({ w: canvas!.width, h: canvas!.height });
          setScanKey((k) => k + 1);
          onReady?.(true);
        } catch (e) {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Failed to render barcode");
          onReady?.(false);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, JSON.stringify(qrData), JSON.stringify(qrCustom), JSON.stringify(barcode), JSON.stringify(barcodeCustom)]);

  // Show scan line briefly, then remove from DOM entirely
  useEffect(() => {
    if (empty || loading || error) {
      setShowScan(false);
      return;
    }
    setShowScan(true);
    const t = window.setTimeout(() => setShowScan(false), 1600);
    return () => window.clearTimeout(t);
  }, [scanKey, empty, loading, error]);

  const handleTestScan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL("image/png");
      const w = window.open();
      if (w) {
        w.document.write(`
          <!doctype html>
          <html>
            <head>
              <title>Test Scan — QRForge</title>
              <style>
                body { margin:0; display:flex; align-items:center; justify-content:center; min-height:100vh; background:#0a0a0a; font-family:system-ui,sans-serif; color:#fff; }
                .wrap { text-align:center; }
                img { max-width:90vw; max-height:80vh; background:#fff; padding:16px; border-radius:12px; }
                p { margin-top:16px; color:#a1a1aa; font-size:13px; }
              </style>
            </head>
            <body>
              <div class="wrap">
                <img src="${url}" alt="Preview" />
                <p>Scan with your phone's camera to test.</p>
              </div>
            </body>
          </html>
        `);
        w.document.close();
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="qf-card flex flex-col items-center gap-4 p-6">
      <div
        ref={containerRef}
        className="relative flex w-full items-center justify-center rounded-xl bg-white p-6"
        style={{ minHeight: 320 }}
      >
        {/* Empty state — absolutely positioned so it centers no matter what */}
        {empty && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
              <QrCode className="h-7 w-7 text-[var(--text-muted)]" />
            </div>
            <p className="max-w-xs text-sm text-[var(--text-muted)]">
              Fill in the details to generate your code
            </p>
          </div>
        )}

        {/* Canvas (always in DOM so canvasRef stays attached) */}
        <canvas
          ref={canvasRef}
          className={`max-h-[400px] max-w-full transition-opacity duration-200 ${
            empty ? "invisible h-0 w-0" : "block"
          }`}
          style={
            empty
              ? { width: 0, height: 0, maxWidth: 0 }
              : { imageRendering: "pixelated", height: "auto", width: "auto", maxWidth: "100%" }
          }
          aria-label="Generated code preview"
        />

        {/* Scan line animation — only mounted briefly, unmounts completely after ~1.6s */}
        {showScan && (
          <div key={scanKey} className="scan-overlay">
            <div className="scan-line animate-scan-line" />
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-[var(--error)]/10 px-3 py-2 text-xs text-[var(--error)]">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      {/* Size + test scan */}
      <div className="flex w-full items-center justify-between text-xs text-[var(--text-muted)]">
        <span className="tabular-nums">
          {dimensions ? `${dimensions.w} × ${dimensions.h} px` : "—"}
        </span>
        <button
          type="button"
          onClick={handleTestScan}
          disabled={empty}
          className="qf-btn-ghost rounded-md px-2 py-1"
          title="Open in a new tab to test scan"
          aria-label="Open code in a new tab for scan testing"
        >
          <ScanLine className="h-3.5 w-3.5" />
          <span>Test Scan</span>
        </button>
      </div>
    </div>
  );
}
