import QRCode from "qrcode";
import type {
  QRData,
  QRCustomization,
  QRType,
  ValidationResult,
  QRDataUrl,
  QRDataWifi,
  QRDataVCard,
  QRDataEmail,
  QRDataSms,
  QRDataLocation,
  QRDataText,
  QRDataPayment,
} from "@/types";

// ============================================================================
// QR string builders (convert typed data to the actual encoded string)
// ============================================================================

function escapeWifi(value: string): string {
  // Escape \, ;, ,, ", :
  return value.replace(/([\\;,":])/g, "\\$1");
}

function escapeVCard(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function buildUrl(data: QRDataUrl): string {
  let url = data.url.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

function buildWifi(data: QRDataWifi): string {
  if (!data.ssid) return "";
  const t = data.encryption === "nopass" ? "nopass" : data.encryption;
  const s = escapeWifi(data.ssid);
  const p = data.encryption === "nopass" ? "" : escapeWifi(data.password);
  const h = data.hidden ? "H:true;" : "";
  return `WIFI:T:${t};S:${s};P:${p};${h};`;
}

function buildVCard(data: QRDataVCard): string {
  const { firstName, lastName, phone, phoneCountry, email, website, organization, jobTitle, address } = data;
  if (!firstName && !lastName && !phone && !email) return "";
  const fullPhone = phone ? `${phoneCountry || ""}${phone}`.replace(/\s/g, "") : "";
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  const fn = `${firstName} ${lastName}`.trim();
  if (fn) lines.push(`FN:${escapeVCard(fn)}`);
  if (lastName || firstName) lines.push(`N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`);
  if (organization) lines.push(`ORG:${escapeVCard(organization)}`);
  if (jobTitle) lines.push(`TITLE:${escapeVCard(jobTitle)}`);
  if (fullPhone) lines.push(`TEL;TYPE=CELL:${fullPhone}`);
  if (email) lines.push(`EMAIL:${email}`);
  if (website) lines.push(`URL:${website}`);
  if (address) lines.push(`ADR:;;${escapeVCard(address)};;;;`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

function buildEmail(data: QRDataEmail): string {
  if (!data.to) return "";
  const params = new URLSearchParams();
  if (data.subject) params.set("subject", data.subject);
  if (data.body) params.set("body", data.body);
  const q = params.toString();
  return `mailto:${data.to}${q ? "?" + q : ""}`;
}

function buildSms(data: QRDataSms): string {
  if (!data.number) return "";
  const num = data.number.replace(/\s/g, "");
  if (data.message) {
    return `sms:${num}?body=${encodeURIComponent(data.message)}`;
  }
  return `sms:${num}`;
}

function buildLocation(data: QRDataLocation): string {
  const lat = data.latitude.trim();
  const lng = data.longitude.trim();
  if (lat && lng) return `geo:${lat},${lng}`;
  if (data.address.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`;
  }
  return "";
}

function buildText(data: QRDataText): string {
  return data.text;
}

function buildPayment(data: QRDataPayment): string {
  switch (data.paymentType) {
    case "upi": {
      if (!data.upiId) return "";
      const params = new URLSearchParams();
      params.set("pa", data.upiId);
      if (data.upiName) params.set("pn", data.upiName);
      if (data.upiAmount) params.set("am", data.upiAmount);
      params.set("cu", "INR");
      return `upi://pay?${params.toString()}`;
    }
    case "paypal": {
      if (!data.paypalLink) return "";
      let link = data.paypalLink.trim();
      if (!/^https?:\/\//i.test(link)) {
        if (link.startsWith("paypal.me/") || link.startsWith("@")) {
          link = "https://paypal.me/" + link.replace(/^@/, "").replace(/^paypal\.me\//, "");
        } else {
          link = "https://paypal.me/" + link;
        }
      }
      return link;
    }
    case "bitcoin": {
      if (!data.bitcoinAddress) return "";
      return data.bitcoinAmount
        ? `bitcoin:${data.bitcoinAddress}?amount=${data.bitcoinAmount}`
        : `bitcoin:${data.bitcoinAddress}`;
    }
    case "ethereum": {
      if (!data.ethereumAddress) return "";
      return data.ethereumAmount
        ? `ethereum:${data.ethereumAddress}?value=${data.ethereumAmount}`
        : `ethereum:${data.ethereumAddress}`;
    }
    default:
      return "";
  }
}

export function buildQRString(data: QRData): string {
  switch (data.type) {
    case "url":
      return buildUrl(data);
    case "wifi":
      return buildWifi(data);
    case "vcard":
      return buildVCard(data);
    case "email":
      return buildEmail(data);
    case "sms":
      return buildSms(data);
    case "location":
      return buildLocation(data);
    case "text":
      return buildText(data);
    case "payment":
      return buildPayment(data);
  }
}

// ============================================================================
// Validation
// ============================================================================

export function validateUrl(url: string): ValidationResult {
  if (!url.trim()) return { valid: false, message: "URL is required" };
  try {
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const u = new URL(withProto);
    if (!u.hostname.includes(".")) return { valid: false, message: "Enter a valid domain" };
    return { valid: true };
  } catch {
    return { valid: false, message: "Invalid URL format" };
  }
}

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return { valid: false, message: "Email is required" };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? { valid: true } : { valid: false, message: "Invalid email format" };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone.trim()) return { valid: false, message: "Phone is required" };
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (!/^\+?\d{6,15}$/.test(cleaned)) return { valid: false, message: "Invalid phone number" };
  return { valid: true };
}

export function validateWifiPassword(pw: string, enc: string): ValidationResult {
  if (enc === "nopass") return { valid: true };
  if (pw.length < 8) return { valid: false, message: "WPA password needs at least 8 characters" };
  return { valid: true };
}

export function validateLatitude(lat: string): ValidationResult {
  if (!lat.trim()) return { valid: false, message: "Latitude required" };
  const n = Number(lat);
  if (Number.isNaN(n) || n < -90 || n > 90) return { valid: false, message: "Latitude must be between -90 and 90" };
  return { valid: true };
}

export function validateLongitude(lng: string): ValidationResult {
  if (!lng.trim()) return { valid: false, message: "Longitude required" };
  const n = Number(lng);
  if (Number.isNaN(n) || n < -180 || n > 180) return { valid: false, message: "Longitude must be between -180 and 180" };
  return { valid: true };
}

export function validateData(data: QRData): ValidationResult {
  switch (data.type) {
    case "url":
      return validateUrl(data.url);
    case "wifi": {
      if (!data.ssid.trim()) return { valid: false, message: "Network name required" };
      return validateWifiPassword(data.password, data.encryption);
    }
    case "vcard": {
      const has = data.firstName || data.lastName || data.phone || data.email;
      if (!has) return { valid: false, message: "At least one contact field required" };
      if (data.email) {
        const v = validateEmail(data.email);
        if (!v.valid) return v;
      }
      if (data.phone) {
        const v = validatePhone(data.phone);
        if (!v.valid) return v;
      }
      return { valid: true };
    }
    case "email":
      return validateEmail(data.to);
    case "sms":
      return validatePhone(data.number);
    case "location": {
      if (data.latitude || data.longitude) {
        const lat = validateLatitude(data.latitude);
        if (!lat.valid) return lat;
        return validateLongitude(data.longitude);
      }
      if (data.address.trim()) return { valid: true };
      return { valid: false, message: "Enter coordinates or an address" };
    }
    case "text":
      if (!data.text.trim()) return { valid: false, message: "Text is required" };
      if (data.text.length > 500) return { valid: false, message: "Maximum 500 characters" };
      return { valid: true };
    case "payment": {
      switch (data.paymentType) {
        case "upi":
          if (!data.upiId.trim()) return { valid: false, message: "UPI ID required" };
          if (!/^[\w.\-]+@[\w]+$/.test(data.upiId.trim())) return { valid: false, message: "Invalid UPI ID format" };
          return { valid: true };
        case "paypal":
          if (!data.paypalLink.trim()) return { valid: false, message: "PayPal handle or link required" };
          return { valid: true };
        case "bitcoin":
          if (!data.bitcoinAddress.trim()) return { valid: false, message: "Bitcoin address required" };
          return { valid: true };
        case "ethereum":
          if (!data.ethereumAddress.trim()) return { valid: false, message: "Ethereum address required" };
          if (!/^0x[a-fA-F0-9]{40}$/.test(data.ethereumAddress.trim())) {
            return { valid: false, message: "Ethereum address must start with 0x and be 42 chars" };
          }
          return { valid: true };
      }
      return { valid: false, message: "Unsupported payment type" };
    }
  }
}

// ============================================================================
// Custom QR renderer — supports dot styles, corner styles, logo overlay
// ============================================================================

interface QRMatrix {
  modules: boolean[][];
  size: number;
}

async function getMatrix(text: string, ec: "L" | "M" | "Q" | "H"): Promise<QRMatrix> {
  const qr = QRCode.create(text, { errorCorrectionLevel: ec });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const modules: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      row.push(Boolean(data[y * size + x]));
    }
    modules.push(row);
  }
  return { modules, size };
}

function isFinderPattern(x: number, y: number, size: number): boolean {
  // Top-left, top-right, bottom-left 7x7 finder patterns
  if (x < 7 && y < 7) return true;
  if (x >= size - 7 && y < 7) return true;
  if (x < 7 && y >= size - 7) return true;
  return false;
}

interface RenderOptions {
  text: string;
  customization: QRCustomization;
  pixelSize: number; // output bitmap size in pixels
}

/**
 * Render a QR code onto a canvas with custom dot + corner styles and optional logo.
 */
export async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  opts: RenderOptions,
): Promise<void> {
  const { text, customization, pixelSize } = opts;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  canvas.width = pixelSize;
  canvas.height = pixelSize;

  if (!text) {
    ctx.clearRect(0, 0, pixelSize, pixelSize);
    return;
  }

  const { modules, size } = await getMatrix(text, customization.errorCorrection);
  const totalModules = size + customization.margin * 2;
  const moduleSize = pixelSize / totalModules;
  const offset = customization.margin * moduleSize;

  // Background
  if (customization.transparentBg) {
    ctx.clearRect(0, 0, pixelSize, pixelSize);
  } else {
    ctx.fillStyle = customization.bgColor;
    ctx.fillRect(0, 0, pixelSize, pixelSize);
  }

  ctx.fillStyle = customization.fgColor;

  // Draw modules (skip finder patterns — we draw them separately for corner styles)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!modules[y][x]) continue;
      if (isFinderPattern(x, y, size)) continue;
      drawModule(ctx, offset + x * moduleSize, offset + y * moduleSize, moduleSize, customization.dotStyle);
    }
  }

  // Draw finder patterns with corner style
  drawFinder(ctx, offset, offset, moduleSize, customization);
  drawFinder(ctx, offset + (size - 7) * moduleSize, offset, moduleSize, customization);
  drawFinder(ctx, offset, offset + (size - 7) * moduleSize, moduleSize, customization);

  // Logo overlay
  if (customization.logo) {
    await drawLogo(ctx, customization.logo, pixelSize, customization);
  }
}

function drawModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  style: "square" | "dots" | "rounded",
): void {
  if (style === "dots") {
    const r = size / 2;
    ctx.beginPath();
    ctx.arc(x + r, y + r, r * 0.92, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "rounded") {
    const r = size * 0.25;
    roundRect(ctx, x, y, size, size, r);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, size + 0.5, size + 0.5); // +0.5 avoids sub-pixel gaps
  }
}

function drawFinder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  m: number,
  custom: QRCustomization,
): void {
  const outerSize = 7 * m;
  const innerGapSize = 5 * m;
  const innerDotSize = 3 * m;

  const radiusMap: Record<string, number> = {
    square: 0,
    rounded: m * 1.2,
    "extra-rounded": m * 2,
  };
  const rOuter = radiusMap[custom.cornerStyle];
  const rInner = radiusMap[custom.cornerStyle] * 0.5;

  // Outer ring
  ctx.fillStyle = custom.fgColor;
  roundRect(ctx, x, y, outerSize, outerSize, rOuter);
  ctx.fill();

  // White gap
  ctx.fillStyle = custom.transparentBg ? "rgba(0,0,0,0)" : custom.bgColor;
  if (custom.transparentBg) {
    // Punch hole (destination-out)
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    roundRect(ctx, x + m, y + m, innerGapSize, innerGapSize, Math.max(0, rOuter - m));
    ctx.fill();
    ctx.restore();
  } else {
    roundRect(ctx, x + m, y + m, innerGapSize, innerGapSize, Math.max(0, rOuter - m));
    ctx.fill();
  }

  // Inner dot
  ctx.fillStyle = custom.fgColor;
  roundRect(ctx, x + 2 * m, y + 2 * m, innerDotSize, innerDotSize, rInner);
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function drawLogo(
  ctx: CanvasRenderingContext2D,
  logoSrc: string,
  canvasSize: number,
  custom: QRCustomization,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const logoPx = (canvasSize * custom.logoSize) / 100;
      const pad = logoPx * 0.1;
      const x = (canvasSize - logoPx) / 2;
      const y = (canvasSize - logoPx) / 2;

      if (custom.logoBackground === "white") {
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, x - pad, y - pad, logoPx + pad * 2, logoPx + pad * 2, 8);
        ctx.fill();
      }
      // Maintain aspect ratio inside the box
      const ratio = img.width / img.height;
      let dw = logoPx;
      let dh = logoPx;
      if (ratio > 1) dh = logoPx / ratio;
      else dw = logoPx * ratio;
      const dx = (canvasSize - dw) / 2;
      const dy = (canvasSize - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      resolve();
    };
    img.onerror = () => reject(new Error("Failed to load logo"));
    img.src = logoSrc;
  });
}

// ============================================================================
// SVG renderer (for SVG export)
// ============================================================================

export async function renderQRToSvg(opts: {
  text: string;
  customization: QRCustomization;
}): Promise<string> {
  const { text, customization } = opts;
  if (!text) return "";
  const { modules, size } = await getMatrix(text, customization.errorCorrection);
  const totalModules = size + customization.margin * 2;
  const px = customization.size;
  const moduleSize = px / totalModules;
  const offset = customization.margin * moduleSize;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}" shape-rendering="geometricPrecision">`,
  );

  if (!customization.transparentBg) {
    parts.push(`<rect width="${px}" height="${px}" fill="${customization.bgColor}"/>`);
  }

  // Module paths (exclude finder patterns)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!modules[y][x]) continue;
      if (isFinderPattern(x, y, size)) continue;
      const cx = offset + x * moduleSize;
      const cy = offset + y * moduleSize;
      parts.push(svgModule(cx, cy, moduleSize, customization.dotStyle, customization.fgColor));
    }
  }

  // Finder patterns
  parts.push(svgFinder(offset, offset, moduleSize, customization));
  parts.push(svgFinder(offset + (size - 7) * moduleSize, offset, moduleSize, customization));
  parts.push(svgFinder(offset, offset + (size - 7) * moduleSize, moduleSize, customization));

  if (customization.logo) {
    const logoPx = (px * customization.logoSize) / 100;
    const lx = (px - logoPx) / 2;
    const ly = (px - logoPx) / 2;
    const pad = logoPx * 0.1;
    if (customization.logoBackground === "white") {
      parts.push(
        `<rect x="${lx - pad}" y="${ly - pad}" width="${logoPx + pad * 2}" height="${logoPx + pad * 2}" rx="8" fill="#ffffff"/>`,
      );
    }
    parts.push(
      `<image x="${lx}" y="${ly}" width="${logoPx}" height="${logoPx}" preserveAspectRatio="xMidYMid meet" href="${customization.logo}"/>`,
    );
  }

  parts.push("</svg>");
  return parts.join("");
}

function svgModule(x: number, y: number, s: number, style: string, color: string): string {
  if (style === "dots") {
    const r = s / 2;
    return `<circle cx="${x + r}" cy="${y + r}" r="${r * 0.92}" fill="${color}"/>`;
  }
  if (style === "rounded") {
    const r = s * 0.25;
    return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" fill="${color}"/>`;
  }
  return `<rect x="${x}" y="${y}" width="${s + 0.3}" height="${s + 0.3}" fill="${color}"/>`;
}

function svgFinder(x: number, y: number, m: number, custom: QRCustomization): string {
  const radii: Record<string, number> = { square: 0, rounded: m * 1.2, "extra-rounded": m * 2 };
  const rOuter = radii[custom.cornerStyle];
  const rInner = rOuter * 0.5;
  const bg = custom.transparentBg ? "none" : custom.bgColor;
  // Outer ring using path (outer rounded square minus inner rounded square = frame)
  const parts: string[] = [];
  parts.push(
    `<rect x="${x}" y="${y}" width="${7 * m}" height="${7 * m}" rx="${rOuter}" fill="${custom.fgColor}"/>`,
  );
  parts.push(
    `<rect x="${x + m}" y="${y + m}" width="${5 * m}" height="${5 * m}" rx="${Math.max(0, rOuter - m)}" fill="${bg}"/>`,
  );
  parts.push(
    `<rect x="${x + 2 * m}" y="${y + 2 * m}" width="${3 * m}" height="${3 * m}" rx="${rInner}" fill="${custom.fgColor}"/>`,
  );
  return parts.join("");
}

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULT_QR_CUSTOMIZATION: QRCustomization = {
  fgColor: "#000000",
  bgColor: "#ffffff",
  transparentBg: false,
  errorCorrection: "M",
  size: 256,
  margin: 4,
  cornerStyle: "square",
  dotStyle: "square",
  logo: null,
  logoSize: 22,
  logoBackground: "white",
};

export function defaultQRDataFor(type: QRType): QRData {
  switch (type) {
    case "url":
      return { type: "url", url: "" };
    case "wifi":
      return { type: "wifi", ssid: "", password: "", encryption: "WPA", hidden: false };
    case "vcard":
      return {
        type: "vcard",
        firstName: "",
        lastName: "",
        phone: "",
        phoneCountry: "+1",
        email: "",
        website: "",
        organization: "",
        jobTitle: "",
        address: "",
      };
    case "email":
      return { type: "email", to: "", subject: "", body: "" };
    case "sms":
      return { type: "sms", number: "", message: "" };
    case "location":
      return { type: "location", latitude: "", longitude: "", address: "" };
    case "text":
      return { type: "text", text: "" };
    case "payment":
      return {
        type: "payment",
        paymentType: "upi",
        upiId: "",
        upiName: "",
        upiAmount: "",
        paypalLink: "",
        bitcoinAddress: "",
        bitcoinAmount: "",
        ethereumAddress: "",
        ethereumAmount: "",
      };
  }
}
