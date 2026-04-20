import type { HistoryItem, AppState } from "@/types";

const HISTORY_KEY = "qrforge_history";
const MAX_HISTORY = 10;

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryItem[];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    // Quota exceeded or disabled — fail silently
  }
}

export function addHistoryItem(item: HistoryItem): HistoryItem[] {
  const items = loadHistory();
  // Dedupe by contentPreview+mode to avoid spamming identical entries
  const filtered = items.filter(
    (i) => !(i.contentPreview === item.contentPreview && i.mode === item.mode),
  );
  const next = [item, ...filtered].slice(0, MAX_HISTORY);
  saveHistory(next);
  return next;
}

export function removeHistoryItem(id: string): HistoryItem[] {
  const items = loadHistory().filter((i) => i.id !== id);
  saveHistory(items);
  return items;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}

export function makeHistoryId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildContentPreview(state: AppState): string {
  if (state.mode === "barcode") {
    return `${state.barcode.format}: ${state.barcode.value}`;
  }
  const data = state.qrData[state.qrType];
  switch (data.type) {
    case "url":
      return data.url;
    case "wifi":
      return `WiFi · ${data.ssid}`;
    case "vcard":
      return `${data.firstName} ${data.lastName}`.trim() || data.email || data.phone;
    case "email":
      return `Email · ${data.to}`;
    case "sms":
      return `SMS · ${data.number}`;
    case "location":
      return data.address || `${data.latitude}, ${data.longitude}`;
    case "text":
      return data.text;
    case "payment":
      return `Payment · ${data.paymentType}`;
    default:
      return "";
  }
}
