"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { BarcodeData, BarcodeFormat } from "@/types";
import { validateBarcode } from "@/lib/barcode-utils";

interface BarcodeGeneratorProps {
  format: BarcodeFormat;
  value: string;
  onChange: (v: string) => void;
}

const PLACEHOLDERS: Record<BarcodeFormat, string> = {
  EAN13: "e.g. 5901234123457",
  EAN8: "e.g. 96385074",
  CODE128: "Any text or numbers",
  UPC: "e.g. 036000291452",
  CODE39: "CODE 39 VALUE",
};

const HINTS: Record<BarcodeFormat, string> = {
  EAN13: "12 or 13 digits · the check digit is auto-calculated",
  EAN8: "7 or 8 digits · compact retail",
  CODE128: "Full ASCII support · any length",
  UPC: "11 or 12 digits · US retail standard",
  CODE39: "Uppercase letters, digits, and -. $/+%* only",
};

export default function BarcodeGenerator({ format, value, onChange }: BarcodeGeneratorProps) {
  const validation = useMemo(() => validateBarcode(format, value), [format, value]);
  const hasContent = value.trim().length > 0;

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <label htmlFor="qf-barcode" className="qf-label block">
          Value
        </label>
        <input
          id="qf-barcode"
          type="text"
          className={`qf-input ${hasContent && !validation.valid ? "qf-input-invalid" : ""}`}
          placeholder={PLACEHOLDERS[format]}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      </div>

      <p className="text-[11px] text-[var(--text-muted)]">{HINTS[format]}</p>

      {hasContent && (
        <div
          className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
            validation.valid
              ? "bg-[var(--success)]/10 text-[var(--success)]"
              : "bg-[var(--error)]/10 text-[var(--error)]"
          }`}
        >
          {validation.valid ? (
            <>
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Ready to generate</span>
            </>
          ) : (
            <>
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{validation.message || "Invalid value"}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
