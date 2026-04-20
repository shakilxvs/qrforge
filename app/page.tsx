"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Mode,
  QRType,
  QRData,
  QRCustomization,
  BarcodeData,
  BarcodeCustomization,
  BarcodeFormat,
  AppState,
  HistoryItem,
} from "@/types";
import {
  defaultQRDataFor,
  DEFAULT_QR_CUSTOMIZATION,
  buildQRString,
  validateData,
} from "@/lib/qr-utils";
import { DEFAULT_BARCODE_CUSTOMIZATION, validateBarcode } from "@/lib/barcode-utils";
import { decodeStateFromUrl } from "@/lib/export-utils";
import {
  addHistoryItem,
  buildContentPreview,
  clearHistory as clearHistoryStore,
  loadHistory,
  makeHistoryId,
  removeHistoryItem,
} from "@/lib/storage-utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import PreviewCanvas from "@/components/PreviewCanvas";
import DownloadPanel from "@/components/DownloadPanel";
import HistoryPanel from "@/components/HistoryPanel";
import HowItWorks from "@/components/HowItWorks";

// Build the full initial qrData map so switching types never loses user input
function initialQRData(): Record<QRType, QRData> {
  return {
    url: defaultQRDataFor("url"),
    wifi: defaultQRDataFor("wifi"),
    vcard: defaultQRDataFor("vcard"),
    email: defaultQRDataFor("email"),
    sms: defaultQRDataFor("sms"),
    location: defaultQRDataFor("location"),
    text: defaultQRDataFor("text"),
    payment: defaultQRDataFor("payment"),
  };
}

const INITIAL_STATE: AppState = {
  mode: "qr",
  qrType: "url",
  qrData: initialQRData(),
  barcode: { format: "EAN13", value: "" },
  qrCustom: DEFAULT_QR_CUSTOMIZATION,
  barcodeCustom: DEFAULT_BARCODE_CUSTOMIZATION,
};

export default function HomePage() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [debounced, setDebounced] = useState<AppState>(INITIAL_STATE);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [ready, setReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hydratedRef = useRef(false);
  const historyTimer = useRef<number | null>(null);

  // Hydrate from URL params or localStorage on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    try {
      const fromUrl = decodeStateFromUrl(window.location.search);
      if (fromUrl) {
        // Make sure qrData map is complete — merge with defaults
        const merged: AppState = {
          ...INITIAL_STATE,
          ...fromUrl,
          qrData: { ...initialQRData(), ...(fromUrl.qrData || {}) },
          qrCustom: { ...DEFAULT_QR_CUSTOMIZATION, ...(fromUrl.qrCustom || {}) },
          barcodeCustom: { ...DEFAULT_BARCODE_CUSTOMIZATION, ...(fromUrl.barcodeCustom || {}) },
        };
        setState(merged);
        setDebounced(merged);
        // Clear the param from the URL so refreshes don't re-hydrate
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, "", cleanUrl);
      }
    } catch {
      // silent — fall through to defaults
    }

    setHistory(loadHistory());
  }, []);

  // Debounce state → debounced (150ms) so preview only re-renders after input settles
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(state), 150);
    return () => window.clearTimeout(t);
  }, [state]);

  // Save to history 1s after the last change, only for valid content
  useEffect(() => {
    if (historyTimer.current) window.clearTimeout(historyTimer.current);
    historyTimer.current = window.setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas || !ready) return;

      // Validate there's actual content before saving
      const hasContent =
        debounced.mode === "qr"
          ? validateData(debounced.qrData[debounced.qrType]).valid &&
            !!buildQRString(debounced.qrData[debounced.qrType])
          : validateBarcode(debounced.barcode.format, debounced.barcode.value).valid;
      if (!hasContent) return;

      try {
        const thumb = makeThumbnail(canvas);
        const item: HistoryItem = {
          id: makeHistoryId(),
          timestamp: Date.now(),
          mode: debounced.mode,
          qrType: debounced.mode === "qr" ? debounced.qrType : undefined,
          barcodeFormat: debounced.mode === "barcode" ? debounced.barcode.format : undefined,
          contentPreview: buildContentPreview(debounced).slice(0, 120),
          thumbnail: thumb,
          state: debounced,
        };
        const next = addHistoryItem(item);
        setHistory(next);
      } catch {
        // silent
      }
    }, 1000);

    return () => {
      if (historyTimer.current) window.clearTimeout(historyTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debounced), ready]);

  // Handlers
  const onModeChange = useCallback((mode: Mode) => {
    setState((s) => ({ ...s, mode }));
  }, []);

  const onQRTypeChange = useCallback((qrType: QRType) => {
    setState((s) => ({ ...s, qrType }));
  }, []);

  const onQRDataChange = useCallback((d: QRData) => {
    setState((s) => ({ ...s, qrData: { ...s.qrData, [d.type]: d } }));
  }, []);

  const onQRCustomChange = useCallback((c: QRCustomization) => {
    setState((s) => ({ ...s, qrCustom: c }));
  }, []);

  const onBarcodeFormatChange = useCallback((format: BarcodeFormat) => {
    setState((s) => ({ ...s, barcode: { ...s.barcode, format } }));
  }, []);

  const onBarcodeValueChange = useCallback((value: string) => {
    setState((s) => ({ ...s, barcode: { ...s.barcode, value } }));
  }, []);

  const onBarcodeCustomChange = useCallback((c: BarcodeCustomization) => {
    setState((s) => ({ ...s, barcodeCustom: c }));
  }, []);

  const handleHistorySelect = useCallback((item: HistoryItem) => {
    const merged: AppState = {
      ...INITIAL_STATE,
      ...item.state,
      qrData: { ...initialQRData(), ...(item.state.qrData || {}) },
      qrCustom: { ...DEFAULT_QR_CUSTOMIZATION, ...(item.state.qrCustom || {}) },
      barcodeCustom: { ...DEFAULT_BARCODE_CUSTOMIZATION, ...(item.state.barcodeCustom || {}) },
    };
    setState(merged);
    setDebounced(merged);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleHistoryRemove = useCallback((id: string) => {
    setHistory(removeHistoryItem(id));
  }, []);

  const handleHistoryClear = useCallback(() => {
    clearHistoryStore();
    setHistory([]);
  }, []);

  const currentQRData = useMemo(
    () => debounced.qrData[debounced.qrType],
    [debounced.qrData, debounced.qrType],
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-8 max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              QR Code & Barcode Studio
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Generate polished, production-ready codes for every use case. Free, no watermark, no signup.
            </p>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            <Sidebar
              mode={state.mode}
              qrType={state.qrType}
              qrData={state.qrData[state.qrType]}
              qrCustom={state.qrCustom}
              barcode={state.barcode}
              barcodeCustom={state.barcodeCustom}
              onModeChange={onModeChange}
              onQRTypeChange={onQRTypeChange}
              onQRDataChange={onQRDataChange}
              onQRCustomChange={onQRCustomChange}
              onBarcodeFormatChange={onBarcodeFormatChange}
              onBarcodeValueChange={onBarcodeValueChange}
              onBarcodeCustomChange={onBarcodeCustomChange}
            />

            <div className="flex-1 space-y-4">
              <PreviewCanvas
                mode={debounced.mode}
                qrData={currentQRData}
                qrCustom={debounced.qrCustom}
                barcode={debounced.barcode}
                barcodeCustom={debounced.barcodeCustom}
                canvasRef={canvasRef}
                onReady={setReady}
              />

              <DownloadPanel state={debounced} canvasRef={canvasRef} ready={ready} />

              <HistoryPanel
                items={history}
                onSelect={handleHistorySelect}
                onRemove={handleHistoryRemove}
                onClear={handleHistoryClear}
              />
            </div>
          </div>
        </div>

        <HowItWorks />
      </main>

      <Footer />
    </div>
  );
}

// Downscale the canvas to a small data URL for history thumbnails
function makeThumbnail(source: HTMLCanvasElement, targetSize = 96): string {
  try {
    const tmp = document.createElement("canvas");
    tmp.width = targetSize;
    tmp.height = targetSize;
    const ctx = tmp.getContext("2d");
    if (!ctx) return "";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetSize, targetSize);
    const aspect = source.width / source.height;
    let dw = targetSize;
    let dh = targetSize;
    if (aspect > 1) dh = targetSize / aspect;
    else dw = targetSize * aspect;
    const dx = (targetSize - dw) / 2;
    const dy = (targetSize - dh) / 2;
    ctx.drawImage(source, dx, dy, dw, dh);
    return tmp.toDataURL("image/png");
  } catch {
    return "";
  }
}
