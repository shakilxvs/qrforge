"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import JSZip from "jszip";
import {
  FileDown,
  Upload,
  PackageOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react";
import type { BulkRow, ErrorCorrectionLevel, QRCustomization } from "@/types";
import {
  DEFAULT_QR_CUSTOMIZATION,
  renderQRToCanvas,
} from "@/lib/qr-utils";
import { canvasToPngBlob, timestampSlug, triggerDownload } from "@/lib/export-utils";

const MAX_ROWS = 100;
const SUPPORTED_TYPES = ["url", "wifi", "text", "email", "sms", "location"] as const;

const TEMPLATE_CSV = `name,type,content,fg_color,bg_color,size,error_correction
my-website,url,https://example.com,#000000,#ffffff,512,M
wifi-home,wifi,WIFI:T:WPA;S:MyNetwork;P:password123;;,#000000,#ffffff,512,M
contact-email,email,mailto:hello@example.com?subject=Hello,#000000,#ffffff,512,M
plain-note,text,This is a plain text QR,#6366f1,#ffffff,512,Q
`;

type Step = "start" | "preview" | "generating" | "done";

export default function BulkGenerator() {
  const [step, setStep] = useState<Step>("start");
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [zipName, setZipName] = useState<string>("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;

  const handleTemplateDownload = useCallback(() => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    triggerDownload(blob, "qrforge-bulk-template.csv");
  }, []);

  const parseFile = useCallback((file: File) => {
    setFileError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Please upload a .csv file");
      return;
    }
    if (file.size > 1024 * 1024) {
      setFileError("File is over 1MB — keep under 100 rows");
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          setFileError(result.errors[0].message);
          return;
        }
        const parsed: BulkRow[] = [];
        const data = result.data.slice(0, MAX_ROWS);
        data.forEach((raw, i) => {
          const row = parseRow(raw, i + 2);
          parsed.push(row);
        });
        if (parsed.length === 0) {
          setFileError("CSV is empty");
          return;
        }
        setRows(parsed);
        setStep("preview");
      },
      error: (err) => {
        setFileError(err.message || "Failed to parse CSV");
      },
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    setStep("generating");
    setGenError(null);
    setProgress(0);
    try {
      const valid = rows.filter((r) => r.valid);
      if (valid.length === 0) {
        throw new Error("No valid rows to generate");
      }

      const zip = new JSZip();
      const canvas = document.createElement("canvas");

      for (let i = 0; i < valid.length; i++) {
        const r = valid[i];
        const customization: QRCustomization = {
          ...DEFAULT_QR_CUSTOMIZATION,
          fgColor: r.fgColor,
          bgColor: r.bgColor,
          size: r.size,
          errorCorrection: r.errorCorrection,
        };
        await renderQRToCanvas(canvas, {
          text: r.content,
          customization,
          pixelSize: r.size,
        });
        const blob = await canvasToPngBlob(canvas);
        const safe = safeFilename(r.name || `qr-${r.rowNumber}`);
        zip.file(`${safe}.png`, blob);
        setProgress(Math.round(((i + 1) / valid.length) * 100));
        // Yield to UI thread
        await new Promise((res) => setTimeout(res, 0));
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      setZipBlob(zipBlob);
      setZipName(`qrforge-bulk-${timestampSlug()}.zip`);
      setStep("done");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed");
      setStep("preview");
    }
  }, [rows]);

  const handleDownloadZip = useCallback(() => {
    if (!zipBlob) return;
    triggerDownload(zipBlob, zipName);
  }, [zipBlob, zipName]);

  const reset = useCallback(() => {
    setStep("start");
    setRows([]);
    setProgress(0);
    setZipBlob(null);
    setZipName("");
    setFileError(null);
    setGenError(null);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Bulk Generator
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Upload a CSV and generate up to {MAX_ROWS} QR codes at once. Download them all as a ZIP archive.
        </p>
      </div>

      <StepIndicator step={step} />

      {step === "start" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="qf-card space-y-3 p-6">
            <div className="flex items-center gap-2">
              <FileDown className="h-4 w-4 text-[var(--accent-light)]" />
              <h3 className="text-sm font-semibold">1 · Download Template</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Use this CSV as a starting point. Required columns: name, type, content. Supported types:{" "}
              {SUPPORTED_TYPES.join(", ")}.
            </p>
            <button type="button" onClick={handleTemplateDownload} className="qf-btn-primary w-full">
              <FileDown className="h-4 w-4" />
              Download CSV Template
            </button>
          </div>

          <div className="qf-card space-y-3 p-6">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-[var(--accent-light)]" />
              <h3 className="text-sm font-semibold">2 · Upload CSV</h3>
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) parseFile(file);
              }}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center transition-colors ${
                dragOver
                  ? "border-[var(--accent)] bg-[var(--accent)]/5"
                  : "border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              <Upload className="h-5 w-5 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-secondary)]">Drop CSV or click to upload</p>
              <p className="text-[11px] text-[var(--text-muted)]">Max {MAX_ROWS} rows · under 1MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) parseFile(file);
                e.target.value = "";
              }}
            />
            {fileError && (
              <p className="flex items-center gap-2 rounded-md bg-[var(--error)]/10 px-3 py-2 text-xs text-[var(--error)]">
                <AlertCircle className="h-3.5 w-3.5" />
                {fileError}
              </p>
            )}
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="mt-6 space-y-4">
          <div className="qf-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold">Preview · {rows.length} rows</h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  <span className="text-[var(--success)]">{validCount} valid</span>
                  {invalidCount > 0 && (
                    <>
                      {" · "}
                      <span className="text-[var(--error)]">{invalidCount} invalid</span>
                    </>
                  )}
                </p>
              </div>
              <button type="button" onClick={reset} className="qf-btn-ghost">
                <X className="h-4 w-4" />
                Start over
              </button>
            </div>

            <div className="max-h-[400px] overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[var(--bg-card)]">
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Content</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.rowNumber} className="border-b border-[var(--border)]">
                      <td className="px-4 py-2 tabular-nums text-[var(--text-muted)]">
                        {r.rowNumber}
                      </td>
                      <td className="px-4 py-2 font-medium text-[var(--text-primary)]">
                        {r.name || "—"}
                      </td>
                      <td className="px-4 py-2 text-[var(--text-secondary)]">{r.type}</td>
                      <td className="max-w-[280px] truncate px-4 py-2 text-[var(--text-secondary)]">
                        {r.content}
                      </td>
                      <td className="px-4 py-2">
                        {r.valid ? (
                          <span className="inline-flex items-center gap-1 text-[var(--success)]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ready
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[var(--error)]"
                            title={r.error}
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            {r.error || "invalid"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {genError && (
            <p className="flex items-center gap-2 rounded-md bg-[var(--error)]/10 px-3 py-2 text-xs text-[var(--error)]">
              <AlertCircle className="h-3.5 w-3.5" />
              {genError}
            </p>
          )}

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={validCount === 0}
              className="qf-btn-primary"
            >
              <Sparkles className="h-4 w-4" />
              Generate {validCount} code{validCount === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}

      {step === "generating" && (
        <div className="qf-card mt-6 flex flex-col items-center gap-4 p-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          <div>
            <p className="text-sm font-medium">Generating codes</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{progress}% complete</p>
          </div>
          <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-[var(--bg-secondary)]">
            <div
              className="h-full bg-[var(--accent)] transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="qf-card mt-6 flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success)]/15 text-[var(--success)]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold">All done</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {validCount} QR codes packaged into {zipName}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={handleDownloadZip} className="qf-btn-primary">
              <PackageOpen className="h-4 w-4" />
              Download ZIP
            </button>
            <button type="button" onClick={reset} className="qf-btn-secondary">
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function parseRow(raw: Record<string, string>, rowNumber: number): BulkRow {
  const name = (raw.name || "").trim();
  const type = (raw.type || "").trim().toLowerCase();
  const content = (raw.content || "").trim();
  const fgColor = normalizeHex(raw.fg_color || "#000000");
  const bgColor = normalizeHex(raw.bg_color || "#ffffff");
  const size = clampNumber(Number(raw.size) || 512, 128, 1024);
  const ec = normalizeEc(raw.error_correction || "M");

  let valid = true;
  let error: string | undefined;

  if (!content) {
    valid = false;
    error = "Content is empty";
  } else if (!type) {
    valid = false;
    error = "Type is empty";
  } else if (!SUPPORTED_TYPES.includes(type as (typeof SUPPORTED_TYPES)[number])) {
    valid = false;
    error = `Unsupported type "${type}"`;
  }

  return {
    rowNumber,
    name,
    type,
    content,
    fgColor,
    bgColor,
    size,
    errorCorrection: ec,
    valid,
    error,
  };
}

function normalizeHex(v: string): string {
  const s = v.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
  return "#000000";
}

function normalizeEc(v: string): ErrorCorrectionLevel {
  const s = v.trim().toUpperCase();
  return (["L", "M", "Q", "H"] as const).includes(s as ErrorCorrectionLevel)
    ? (s as ErrorCorrectionLevel)
    : "M";
}

function clampNumber(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, "-").replace(/-+/g, "-").slice(0, 60) || "qr";
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { key: "start", label: "Download Template" },
    { key: "start", label: "Upload CSV" },
    { key: "preview", label: "Generate" },
    { key: "done", label: "Download ZIP" },
  ];
  const currentIndex =
    step === "start" ? 0 : step === "preview" ? 2 : step === "generating" ? 2 : 3;

  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={i} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] tabular-nums ${
                done
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : active
                  ? "border-[var(--accent)] text-[var(--accent-light)]"
                  : "border-[var(--border)] text-[var(--text-muted)]"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={
                active
                  ? "font-medium text-[var(--text-primary)]"
                  : done
                  ? "text-[var(--text-secondary)]"
                  : "text-[var(--text-muted)]"
              }
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-1 text-[var(--text-muted)]">→</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
