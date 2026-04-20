import jsPDF from "jspdf";
import type { AppState } from "@/types";

export function timestampSlug(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function triggerDownload(blob: Blob | string, filename: string): void {
  const url = typeof blob === "string" ? blob : URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof blob !== "string") {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create PNG blob"));
      },
      "image/png",
      1,
    );
  });
}

export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  if (!navigator.clipboard || !("write" in navigator.clipboard)) {
    throw new Error("Clipboard API not available");
  }
  const blob = await canvasToPngBlob(canvas);
  const item = new ClipboardItem({ "image/png": blob });
  await navigator.clipboard.write([item]);
}

export function downloadSvg(svgMarkup: string, filename: string): void {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
  triggerDownload(blob, filename);
}

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
}

export function downloadPdfFromCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  opts: PdfExportOptions,
): void {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth(); // 210
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297

  const imgData = canvas.toDataURL("image/png", 1);
  const maxDim = Math.min(pageWidth - 40, pageHeight - 80);
  const aspect = canvas.width / canvas.height;
  let imgW = maxDim;
  let imgH = maxDim / aspect;
  if (imgH > maxDim) {
    imgH = maxDim;
    imgW = maxDim * aspect;
  }
  const imgX = (pageWidth - imgW) / 2;
  const imgY = (pageHeight - imgH) / 2 - 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(20, 20, 20);
  pdf.text(opts.title, pageWidth / 2, 24, { align: "center" });

  if (opts.subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(110, 110, 120);
    pdf.text(opts.subtitle, pageWidth / 2, 32, { align: "center" });
  }

  pdf.addImage(imgData, "PNG", imgX, imgY, imgW, imgH);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(140, 140, 150);
  pdf.text("Generated with QRForge", pageWidth / 2, pageHeight - 12, { align: "center" });

  pdf.save(filename);
}

// ============================================================================
// Share link — encode app state into URL params
// ============================================================================

export function encodeStateToUrl(state: AppState): string {
  try {
    const json = JSON.stringify(state);
    const compressed = btoa(encodeURIComponent(json));
    const base = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
    return `${base}?s=${compressed}`;
  } catch {
    return "";
  }
}

export function decodeStateFromUrl(search: string): AppState | null {
  try {
    const params = new URLSearchParams(search);
    const s = params.get("s");
    if (!s) return null;
    const json = decodeURIComponent(atob(s));
    const parsed = JSON.parse(json);
    // Strip a logo if present in the share payload — it'd blow up the URL
    if (parsed?.qrCustom?.logo) parsed.qrCustom.logo = null;
    return parsed as AppState;
  } catch {
    return null;
  }
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}
