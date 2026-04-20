"use client";

import { useState } from "react";
import {
  Download,
  Image as ImageIcon,
  FileCode,
  FileText,
  Copy,
  Share2,
  Check,
  Loader2,
} from "lucide-react";
import type { AppState } from "@/types";
import {
  canvasToPngBlob,
  copyCanvasToClipboard,
  copyTextToClipboard,
  downloadPdfFromCanvas,
  downloadSvg,
  encodeStateToUrl,
  timestampSlug,
  triggerDownload,
} from "@/lib/export-utils";
import { buildQRString, renderQRToSvg } from "@/lib/qr-utils";
import { renderBarcodeToSvg } from "@/lib/barcode-utils";

interface DownloadPanelProps {
  state: AppState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  ready: boolean;
}

type Flash = "copy" | "share" | null;

export default function DownloadPanel({ state, canvasRef, ready }: DownloadPanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const [error, setError] = useState<string | null>(null);

  const filenameBase = `qrforge-${
    state.mode === "qr" ? state.qrType : state.barcode.format.toLowerCase()
  }-${timestampSlug()}`;

  const handlePng = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy("png");
    setError(null);
    try {
      const blob = await canvasToPngBlob(canvas);
      triggerDownload(blob, `${filenameBase}.png`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PNG export failed");
    } finally {
      setBusy(null);
    }
  };

  const handleSvg = async () => {
    setBusy("svg");
    setError(null);
    try {
      let markup = "";
      if (state.mode === "qr") {
        const text = buildQRString(state.qrData[state.qrType]);
        markup = await renderQRToSvg({ text, customization: state.qrCustom });
      } else {
        markup = renderBarcodeToSvg({
          format: state.barcode.format,
          value: state.barcode.value,
          customization: state.barcodeCustom,
        });
      }
      if (!markup) throw new Error("Nothing to export");
      downloadSvg(markup, `${filenameBase}.svg`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "SVG export failed");
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy("pdf");
    setError(null);
    try {
      const title =
        state.mode === "qr" ? `QR Code — ${titleForType(state.qrType)}` : `Barcode — ${state.barcode.format}`;
      downloadPdfFromCanvas(canvas, `${filenameBase}.pdf`, { title });
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setBusy(null);
    }
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy("copy");
    setError(null);
    try {
      await copyCanvasToClipboard(canvas);
      setFlash("copy");
      setTimeout(() => setFlash(null), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clipboard copy failed");
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setBusy("share");
    setError(null);
    try {
      const url = encodeStateToUrl(state);
      if (!url) throw new Error("Could not create share link");
      await copyTextToClipboard(url);
      setFlash("share");
      setTimeout(() => setFlash(null), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Share failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="qf-card space-y-3 p-5">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-[var(--accent-light)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Download</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <FormatButton
          label="PNG"
          Icon={ImageIcon}
          busy={busy === "png"}
          onClick={handlePng}
          disabled={!ready}
          ariaLabel="Download as PNG"
        />
        <FormatButton
          label="SVG"
          Icon={FileCode}
          busy={busy === "svg"}
          onClick={handleSvg}
          disabled={!ready}
          ariaLabel="Download as SVG"
        />
        <FormatButton
          label="PDF"
          Icon={FileText}
          busy={busy === "pdf"}
          onClick={handlePdf}
          disabled={!ready}
          ariaLabel="Download as PDF"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!ready || busy === "copy"}
          aria-label="Copy code image to clipboard"
          className="qf-btn-secondary"
        >
          {flash === "copy" ? (
            <>
              <Check className="h-4 w-4 text-[var(--success)]" />
              <span>Copied</span>
            </>
          ) : busy === "copy" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Copying…</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy Image</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleShare}
          disabled={!ready || busy === "share"}
          aria-label="Copy shareable link to clipboard"
          className="qf-btn-secondary"
        >
          {flash === "share" ? (
            <>
              <Check className="h-4 w-4 text-[var(--success)]" />
              <span>Link copied</span>
            </>
          ) : busy === "share" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating…</span>
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              <span>Share Link</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-[var(--error)]/10 px-3 py-2 text-xs text-[var(--error)]">
          {error}
        </p>
      )}

      {!ready && (
        <p className="text-[11px] text-[var(--text-muted)]">
          Enter valid content to enable downloads.
        </p>
      )}
    </div>
  );
}

function FormatButton({
  label,
  Icon,
  onClick,
  busy,
  disabled,
  ariaLabel,
}: {
  label: string;
  Icon: typeof Download;
  onClick: () => void;
  busy: boolean;
  disabled: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={ariaLabel}
      className="flex flex-col items-center justify-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] py-3 text-xs font-medium text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 hover:text-[var(--accent-light)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--border)] disabled:hover:bg-[var(--bg-secondary)] disabled:hover:text-[var(--text-primary)]"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      <span>{label}</span>
    </button>
  );
}

function titleForType(t: string): string {
  const map: Record<string, string> = {
    url: "URL",
    wifi: "WiFi",
    vcard: "Contact",
    email: "Email",
    sms: "SMS",
    location: "Location",
    text: "Text",
    payment: "Payment",
  };
  return map[t] || t;
}
