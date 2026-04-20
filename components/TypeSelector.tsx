"use client";

import {
  Link as LinkIcon,
  Wifi,
  Contact,
  Mail,
  MessageSquare,
  MapPin,
  Type,
  CreditCard,
  Barcode,
  QrCode,
} from "lucide-react";
import type { Mode, QRType, BarcodeFormat } from "@/types";
import { BARCODE_FORMATS } from "@/lib/barcode-utils";

interface TypeSelectorProps {
  mode: Mode;
  qrType: QRType;
  barcodeFormat: BarcodeFormat;
  onModeChange: (m: Mode) => void;
  onQRTypeChange: (t: QRType) => void;
  onBarcodeFormatChange: (f: BarcodeFormat) => void;
}

const QR_TYPES: { value: QRType; label: string; Icon: typeof LinkIcon }[] = [
  { value: "url", label: "URL", Icon: LinkIcon },
  { value: "wifi", label: "WiFi", Icon: Wifi },
  { value: "vcard", label: "Contact", Icon: Contact },
  { value: "email", label: "Email", Icon: Mail },
  { value: "sms", label: "SMS", Icon: MessageSquare },
  { value: "location", label: "Location", Icon: MapPin },
  { value: "text", label: "Text", Icon: Type },
  { value: "payment", label: "Payment", Icon: CreditCard },
];

export default function TypeSelector({
  mode,
  qrType,
  barcodeFormat,
  onModeChange,
  onQRTypeChange,
  onBarcodeFormatChange,
}: TypeSelectorProps) {
  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg bg-[var(--bg-secondary)] p-1">
        <button
          type="button"
          onClick={() => onModeChange("qr")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
            mode === "qr"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <QrCode className="h-3.5 w-3.5" />
          QR Code
        </button>
        <button
          type="button"
          onClick={() => onModeChange("barcode")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
            mode === "barcode"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Barcode className="h-3.5 w-3.5" />
          Barcode
        </button>
      </div>

      {/* Type grid */}
      {mode === "qr" ? (
        <div className="grid grid-cols-4 gap-1.5">
          {QR_TYPES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onQRTypeChange(value)}
              aria-pressed={qrType === value}
              aria-label={`Select ${label} QR type`}
              className={`group flex flex-col items-center justify-center gap-1 rounded-lg border p-2 transition-colors duration-150 ${
                qrType === value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-light)]"
                  : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-medium uppercase tracking-wide">
                {label}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1.5">
          {BARCODE_FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onBarcodeFormatChange(f.value)}
              aria-pressed={barcodeFormat === f.value}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors duration-150 ${
                barcodeFormat === f.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)]"
              }`}
            >
              <div>
                <p
                  className={`text-sm font-medium ${
                    barcodeFormat === f.value
                      ? "text-[var(--accent-light)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {f.label}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">{f.description}</p>
              </div>
              <Barcode
                className={`h-4 w-4 ${
                  barcodeFormat === f.value
                    ? "text-[var(--accent-light)]"
                    : "text-[var(--text-muted)]"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
