"use client";

import { useState } from "react";
import { History, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { HistoryItem } from "@/types";

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function HistoryPanel({
  items,
  onSelect,
  onRemove,
  onClear,
}: HistoryPanelProps) {
  const [open, setOpen] = useState(true);

  if (items.length === 0) {
    return (
      <div className="qf-card p-5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--accent-light)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent</h3>
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Your last 10 generated codes will appear here, stored locally in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="qf-card p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--accent-light)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent</h3>
          <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
            {items.length}
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li
                key={item.id}
                className="group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2 transition-colors hover:border-[var(--border-hover)]"
              >
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex flex-1 items-center gap-3 text-left"
                  aria-label={`Restore ${item.contentPreview}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                      {item.contentPreview || "—"}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {label(item)} · {formatTimestamp(item.timestamp)}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label="Delete history entry"
                  className="rounded-md p-1.5 text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--bg-hover)] hover:text-[var(--error)] group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onClear}
            className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-[11px] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--error)]"
          >
            <Trash2 className="h-3 w-3" />
            Clear all history
          </button>
        </div>
      )}
    </div>
  );
}

function label(item: HistoryItem): string {
  if (item.mode === "barcode") return item.barcodeFormat || "Barcode";
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
  return map[item.qrType || ""] || "QR";
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  const d = new Date(ts);
  return d.toLocaleDateString();
}
