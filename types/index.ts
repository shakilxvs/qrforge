// ============================================================================
// Core modes
// ============================================================================
export type Mode = "qr" | "barcode";

// ============================================================================
// QR Types
// ============================================================================
export type QRType =
  | "url"
  | "wifi"
  | "vcard"
  | "email"
  | "sms"
  | "location"
  | "text"
  | "payment";

export type WifiEncryption = "WPA" | "WEP" | "nopass";

export type PaymentType = "upi" | "paypal" | "bitcoin" | "ethereum";

export interface QRDataUrl {
  type: "url";
  url: string;
}

export interface QRDataWifi {
  type: "wifi";
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
}

export interface QRDataVCard {
  type: "vcard";
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountry: string;
  email: string;
  website: string;
  organization: string;
  jobTitle: string;
  address: string;
}

export interface QRDataEmail {
  type: "email";
  to: string;
  subject: string;
  body: string;
}

export interface QRDataSms {
  type: "sms";
  number: string;
  message: string;
}

export interface QRDataLocation {
  type: "location";
  latitude: string;
  longitude: string;
  address: string;
}

export interface QRDataText {
  type: "text";
  text: string;
}

export interface QRDataPayment {
  type: "payment";
  paymentType: PaymentType;
  upiId: string;
  upiName: string;
  upiAmount: string;
  paypalLink: string;
  bitcoinAddress: string;
  bitcoinAmount: string;
  ethereumAddress: string;
  ethereumAmount: string;
}

export type QRData =
  | QRDataUrl
  | QRDataWifi
  | QRDataVCard
  | QRDataEmail
  | QRDataSms
  | QRDataLocation
  | QRDataText
  | QRDataPayment;

// ============================================================================
// Barcode Types
// ============================================================================
export type BarcodeFormat = "EAN13" | "EAN8" | "CODE128" | "UPC" | "CODE39";

export interface BarcodeData {
  format: BarcodeFormat;
  value: string;
}

// ============================================================================
// Customization
// ============================================================================
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type CornerStyle = "square" | "rounded" | "extra-rounded";
export type DotStyle = "square" | "dots" | "rounded";

export interface QRCustomization {
  fgColor: string;
  bgColor: string;
  transparentBg: boolean;
  errorCorrection: ErrorCorrectionLevel;
  size: number;
  margin: number;
  cornerStyle: CornerStyle;
  dotStyle: DotStyle;
  logo: string | null; // data URL
  logoSize: number; // 15–35 (percent)
  logoBackground: "transparent" | "white";
}

export interface BarcodeCustomization {
  fgColor: string;
  bgColor: string;
  showText: boolean;
  fontSize: number;
  barHeight: number;
  barWidth: number;
}

// ============================================================================
// App state
// ============================================================================
export interface AppState {
  mode: Mode;
  qrType: QRType;
  qrData: Record<QRType, QRData>;
  barcode: BarcodeData;
  qrCustom: QRCustomization;
  barcodeCustom: BarcodeCustomization;
}

// ============================================================================
// History
// ============================================================================
export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: Mode;
  qrType?: QRType;
  barcodeFormat?: BarcodeFormat;
  contentPreview: string;
  thumbnail: string; // data URL
  state: AppState;
}

// ============================================================================
// Validation
// ============================================================================
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// ============================================================================
// Bulk
// ============================================================================
export interface BulkRow {
  rowNumber: number;
  name: string;
  type: string;
  content: string;
  fgColor: string;
  bgColor: string;
  size: number;
  errorCorrection: ErrorCorrectionLevel;
  valid: boolean;
  error?: string;
}
