"use client";

import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import {
  SlidersHorizontal,
  Upload,
  Trash2,
  Square,
  Circle,
  Squircle,
  X,
} from "lucide-react";
import type {
  Mode,
  QRCustomization,
  BarcodeCustomization,
  ErrorCorrectionLevel,
  CornerStyle,
  DotStyle,
} from "@/types";

interface CustomizationPanelProps {
  mode: Mode;
  qr: QRCustomization;
  barcode: BarcodeCustomization;
  onQRChange: (c: QRCustomization) => void;
  onBarcodeChange: (c: BarcodeCustomization) => void;
}

export default function CustomizationPanel({
  mode,
  qr,
  barcode,
  onQRChange,
  onBarcodeChange,
}: CustomizationPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-[var(--accent-light)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Customize</h3>
      </div>

      {mode === "qr" ? (
        <QRCustomizationControls qr={qr} onChange={onQRChange} />
      ) : (
        <BarcodeCustomizationControls barcode={barcode} onChange={onBarcodeChange} />
      )}
    </div>
  );
}

// ============================================================================
// QR controls
// ============================================================================
function QRCustomizationControls({
  qr,
  onChange,
}: {
  qr: QRCustomization;
  onChange: (c: QRCustomization) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Colors */}
      <Section title="Colors">
        <div className="grid grid-cols-2 gap-2">
          <ColorField
            label="Foreground"
            value={qr.fgColor}
            onChange={(c) => onChange({ ...qr, fgColor: c })}
          />
          <ColorField
            label="Background"
            value={qr.bgColor}
            onChange={(c) => onChange({ ...qr, bgColor: c })}
            disabled={qr.transparentBg}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--accent)]"
            checked={qr.transparentBg}
            onChange={(e) => onChange({ ...qr, transparentBg: e.target.checked })}
          />
          <span>Transparent background</span>
        </label>
      </Section>

      {/* Error correction */}
      <Section
        title="Error Correction"
        hint="Higher levels survive damage better but create denser codes."
      >
        <div className="flex gap-1">
          {(["L", "M", "Q", "H"] as ErrorCorrectionLevel[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange({ ...qr, errorCorrection: lvl })}
              title={EC_TOOLTIPS[lvl]}
              aria-label={`Error correction level ${lvl}`}
              aria-pressed={qr.errorCorrection === lvl}
              className={`qf-pill flex-1 ${
                qr.errorCorrection === lvl ? "qf-pill-active" : "qf-pill-idle"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </Section>

      {/* Size */}
      <Section title="Size" valueLabel={`${qr.size}px`}>
        <input
          type="range"
          min={128}
          max={1024}
          step={16}
          value={qr.size}
          onChange={(e) => onChange({ ...qr, size: Number(e.target.value) })}
          className="qf-slider"
        />
      </Section>

      {/* Margin */}
      <Section title="Margin" valueLabel={`${qr.margin} modules`}>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={qr.margin}
          onChange={(e) => onChange({ ...qr, margin: Number(e.target.value) })}
          className="qf-slider"
        />
      </Section>

      {/* Corner style */}
      <Section title="Corner Style">
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { value: "square", label: "Square", Icon: Square },
            { value: "rounded", label: "Rounded", Icon: Squircle },
            { value: "extra-rounded", label: "Extra", Icon: Circle },
          ] as { value: CornerStyle; label: string; Icon: typeof Square }[]).map(
            ({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...qr, cornerStyle: value })}
                aria-pressed={qr.cornerStyle === value}
                aria-label={`Corner style ${label}`}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-[10px] font-medium uppercase tracking-wide transition-colors ${
                  qr.cornerStyle === value
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-light)]"
                    : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
              </button>
            ),
          )}
        </div>
      </Section>

      {/* Dot style */}
      <Section title="Dot Style">
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { value: "square", label: "Square", Icon: Square },
            { value: "dots", label: "Dots", Icon: Circle },
            { value: "rounded", label: "Rounded", Icon: Squircle },
          ] as { value: DotStyle; label: string; Icon: typeof Square }[]).map(
            ({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...qr, dotStyle: value })}
                aria-pressed={qr.dotStyle === value}
                aria-label={`Dot style ${label}`}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-[10px] font-medium uppercase tracking-wide transition-colors ${
                  qr.dotStyle === value
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-light)]"
                    : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
              </button>
            ),
          )}
        </div>
      </Section>

      {/* Logo */}
      <Section title="Logo">
        <LogoUpload qr={qr} onChange={onChange} />
      </Section>
    </div>
  );
}

const EC_TOOLTIPS: Record<ErrorCorrectionLevel, string> = {
  L: "L — 7% correction, smallest size",
  M: "M — 15% correction, balanced (default)",
  Q: "Q — 25% correction, better for logos",
  H: "H — 30% correction, best for logos and damaged codes",
};

// ============================================================================
// Barcode controls
// ============================================================================
function BarcodeCustomizationControls({
  barcode,
  onChange,
}: {
  barcode: BarcodeCustomization;
  onChange: (c: BarcodeCustomization) => void;
}) {
  return (
    <div className="space-y-5">
      <Section title="Colors">
        <div className="grid grid-cols-2 gap-2">
          <ColorField
            label="Foreground"
            value={barcode.fgColor}
            onChange={(c) => onChange({ ...barcode, fgColor: c })}
          />
          <ColorField
            label="Background"
            value={barcode.bgColor}
            onChange={(c) => onChange({ ...barcode, bgColor: c })}
          />
        </div>
      </Section>

      <Section title="Bar Height" valueLabel={`${barcode.barHeight}px`}>
        <input
          type="range"
          min={40}
          max={150}
          step={5}
          value={barcode.barHeight}
          onChange={(e) => onChange({ ...barcode, barHeight: Number(e.target.value) })}
          className="qf-slider"
        />
      </Section>

      <Section title="Bar Width" valueLabel={`${barcode.barWidth.toFixed(1)}`}>
        <input
          type="range"
          min={1}
          max={5}
          step={0.5}
          value={barcode.barWidth}
          onChange={(e) => onChange({ ...barcode, barWidth: Number(e.target.value) })}
          className="qf-slider"
        />
      </Section>

      <Section title="Text">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--accent)]"
            checked={barcode.showText}
            onChange={(e) => onChange({ ...barcode, showText: e.target.checked })}
          />
          <span>Show value below bars</span>
        </label>
      </Section>

      {barcode.showText && (
        <Section title="Font Size" valueLabel={`${barcode.fontSize}px`}>
          <input
            type="range"
            min={10}
            max={32}
            step={1}
            value={barcode.fontSize}
            onChange={(e) => onChange({ ...barcode, fontSize: Number(e.target.value) })}
            className="qf-slider"
          />
        </Section>
      )}
    </div>
  );
}

// ============================================================================
// Section wrapper
// ============================================================================
function Section({
  title,
  hint,
  valueLabel,
  children,
}: {
  title: string;
  hint?: string;
  valueLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="qf-label">{title}</h4>
        {valueLabel && (
          <span className="text-[11px] tabular-nums text-[var(--text-muted)]">{valueLabel}</span>
        )}
      </div>
      {children}
      {hint && <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

// ============================================================================
// Color picker popover
// ============================================================================
function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (c: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 ${
          disabled ? "opacity-40" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          aria-label={`Pick ${label.toLowerCase()} color`}
          className="h-5 w-5 shrink-0 rounded border border-[var(--border)]"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          disabled={disabled}
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === "") onChange(v);
          }}
          className="w-full bg-transparent text-xs uppercase text-[var(--text-primary)] outline-none"
          spellCheck={false}
        />
      </div>

      {open && !disabled && (
        <div className="absolute left-0 top-full z-30 mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-2xl">
          <HexColorPicker color={value} onChange={onChange} />
          <div className="mt-3 grid grid-cols-7 gap-1">
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                aria-label={`Set color to ${c}`}
                className="h-5 w-5 rounded border border-[var(--border)] transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const PRESETS = [
  "#000000",
  "#ffffff",
  "#6366f1",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#0ea5e9",
];

// ============================================================================
// Logo upload
// ============================================================================
function LogoUpload({
  qr,
  onChange,
}: {
  qr: QRCustomization;
  onChange: (c: QRCustomization) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!/^image\/(png|jpe?g|svg\+xml)$/.test(file.type)) {
      setError("Use PNG, JPG, or SVG");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Adding a logo → auto-bump error correction to H
      onChange({
        ...qr,
        logo: result,
        errorCorrection: "H",
      });
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {qr.logo ? (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.logo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex-1 text-xs text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Logo uploaded</p>
            <p className="text-[11px] text-[var(--text-muted)]">Error correction set to H</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...qr, logo: null })}
            aria-label="Remove logo"
            className="qf-btn-ghost rounded-md p-1.5"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
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
            if (file) handleFile(file);
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
          className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed py-5 text-center transition-colors ${
            dragOver
              ? "border-[var(--accent)] bg-[var(--accent)]/5"
              : "border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]"
          }`}
        >
          <Upload className="h-4 w-4 text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-secondary)]">Drop image or click to upload</p>
          <p className="text-[10px] text-[var(--text-muted)]">PNG · JPG · SVG · max 2MB</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-[var(--error)]/10 px-2 py-1.5 text-[11px] text-[var(--error)]">
          <X className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      {qr.logo && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="qf-label">Logo Size</span>
              <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                {qr.logoSize}%
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={35}
              step={1}
              value={qr.logoSize}
              onChange={(e) => onChange({ ...qr, logoSize: Number(e.target.value) })}
              className="qf-slider"
            />
          </div>

          <div className="space-y-2">
            <span className="qf-label">Background</span>
            <div className="flex gap-1">
              {(["transparent", "white"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange({ ...qr, logoBackground: v })}
                  className={`qf-pill flex-1 ${
                    qr.logoBackground === v ? "qf-pill-active" : "qf-pill-idle"
                  }`}
                >
                  {v === "transparent" ? "Transparent" : "White square"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
