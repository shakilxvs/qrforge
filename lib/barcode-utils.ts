import JsBarcode from "jsbarcode";
import type { BarcodeFormat, BarcodeCustomization, ValidationResult } from "@/types";

export const BARCODE_FORMATS: { value: BarcodeFormat; label: string; description: string }[] = [
  { value: "EAN13", label: "EAN-13", description: "13 digits · retail products" },
  { value: "EAN8", label: "EAN-8", description: "8 digits · compact retail" },
  { value: "CODE128", label: "Code 128", description: "Alphanumeric · flexible" },
  { value: "UPC", label: "UPC-A", description: "12 digits · US retail" },
  { value: "CODE39", label: "Code 39", description: "Industrial / medical" },
];

export function validateBarcode(format: BarcodeFormat, value: string): ValidationResult {
  if (!value.trim()) return { valid: false, message: "Value is required" };
  switch (format) {
    case "EAN13": {
      if (!/^\d{12,13}$/.test(value)) {
        return { valid: false, message: "EAN-13 needs 12 or 13 digits" };
      }
      return { valid: true };
    }
    case "EAN8": {
      if (!/^\d{7,8}$/.test(value)) {
        return { valid: false, message: "EAN-8 needs 7 or 8 digits" };
      }
      return { valid: true };
    }
    case "UPC": {
      if (!/^\d{11,12}$/.test(value)) {
        return { valid: false, message: "UPC-A needs 11 or 12 digits" };
      }
      return { valid: true };
    }
    case "CODE39": {
      if (!/^[0-9A-Z\-. $/+%*]+$/.test(value)) {
        return { valid: false, message: "Code 39 allows A–Z, 0–9, and -. $/+%*" };
      }
      return { valid: true };
    }
    case "CODE128":
      return { valid: true };
  }
}

export interface BarcodeRenderOptions {
  format: BarcodeFormat;
  value: string;
  customization: BarcodeCustomization;
}

/**
 * Render a barcode to a canvas element. Returns the canvas's data URL for preview.
 */
export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  opts: BarcodeRenderOptions,
): void {
  const { format, value, customization } = opts;
  try {
    JsBarcode(canvas, value, {
      format,
      lineColor: customization.fgColor,
      background: customization.bgColor,
      width: customization.barWidth,
      height: customization.barHeight,
      displayValue: customization.showText,
      fontSize: customization.fontSize,
      margin: 10,
      font: "monospace",
      textAlign: "center",
      textPosition: "bottom",
      textMargin: 2,
    });
  } catch (err) {
    // Clear canvas on error
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    throw err;
  }
}

/**
 * Render a barcode to an SVG element (string).
 */
export function renderBarcodeToSvg(opts: BarcodeRenderOptions): string {
  const { format, value, customization } = opts;
  // Create an SVG element off-DOM
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  try {
    JsBarcode(svg, value, {
      format,
      lineColor: customization.fgColor,
      background: customization.bgColor,
      width: customization.barWidth,
      height: customization.barHeight,
      displayValue: customization.showText,
      fontSize: customization.fontSize,
      margin: 10,
      font: "monospace",
      textAlign: "center",
      textPosition: "bottom",
      textMargin: 2,
      xmlDocument: document,
    });
    return new XMLSerializer().serializeToString(svg);
  } catch {
    return "";
  }
}

export const DEFAULT_BARCODE_CUSTOMIZATION: BarcodeCustomization = {
  fgColor: "#000000",
  bgColor: "#ffffff",
  showText: true,
  fontSize: 20,
  barHeight: 100,
  barWidth: 2,
};
