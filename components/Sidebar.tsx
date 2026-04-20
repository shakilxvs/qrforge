"use client";

import type {
  Mode,
  QRType,
  QRData,
  QRCustomization,
  BarcodeData,
  BarcodeCustomization,
  BarcodeFormat,
} from "@/types";
import TypeSelector from "./TypeSelector";
import QRGenerator from "./QRGenerator";
import BarcodeGenerator from "./BarcodeGenerator";
import CustomizationPanel from "./CustomizationPanel";

interface SidebarProps {
  mode: Mode;
  qrType: QRType;
  qrData: QRData;
  qrCustom: QRCustomization;
  barcode: BarcodeData;
  barcodeCustom: BarcodeCustomization;
  onModeChange: (m: Mode) => void;
  onQRTypeChange: (t: QRType) => void;
  onQRDataChange: (d: QRData) => void;
  onQRCustomChange: (c: QRCustomization) => void;
  onBarcodeFormatChange: (f: BarcodeFormat) => void;
  onBarcodeValueChange: (v: string) => void;
  onBarcodeCustomChange: (c: BarcodeCustomization) => void;
}

export default function Sidebar(props: SidebarProps) {
  const {
    mode,
    qrType,
    qrData,
    qrCustom,
    barcode,
    barcodeCustom,
    onModeChange,
    onQRTypeChange,
    onQRDataChange,
    onQRCustomChange,
    onBarcodeFormatChange,
    onBarcodeValueChange,
    onBarcodeCustomChange,
  } = props;

  return (
    <aside className="flex flex-col gap-4 lg:w-[320px] lg:shrink-0">
      <div className="qf-card p-4">
        <TypeSelector
          mode={mode}
          qrType={qrType}
          barcodeFormat={barcode.format}
          onModeChange={onModeChange}
          onQRTypeChange={onQRTypeChange}
          onBarcodeFormatChange={onBarcodeFormatChange}
        />
      </div>

      <div className="qf-card p-4">
        {mode === "qr" ? (
          <QRGenerator type={qrType} data={qrData} onChange={onQRDataChange} />
        ) : (
          <BarcodeGenerator
            format={barcode.format}
            value={barcode.value}
            onChange={onBarcodeValueChange}
          />
        )}
      </div>

      <div className="qf-card p-4">
        <CustomizationPanel
          mode={mode}
          qr={qrCustom}
          barcode={barcodeCustom}
          onQRChange={onQRCustomChange}
          onBarcodeChange={onBarcodeCustomChange}
        />
      </div>
    </aside>
  );
}
