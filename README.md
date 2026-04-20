# QRForge

**Professional QR Code & Barcode Studio.** Free. No watermark. No signup.

Generate custom QR codes and barcodes for URLs, WiFi, contacts, email, SMS, location, plain text, and payments (UPI, PayPal, Bitcoin, Ethereum). Fully customize colors, corner/dot styles, error correction, and logos. Export as PNG, SVG, or PDF. Bulk-generate up to 100 codes from a CSV and download as a ZIP. Everything runs entirely in the browser — zero backend, zero tracking, zero friction.

## Stack

- **Next.js 14** (App Router) · TypeScript · Tailwind CSS
- **qrcode** + custom canvas/SVG renderer (dot styles, corner styles, logo overlay)
- **jsbarcode** for 5 barcode formats (EAN-13, EAN-8, Code 128, UPC-A, Code 39)
- **react-colorful**, **jspdf**, **jszip**, **papaparse**, **lucide-react**

## Features

- 8 QR code types · 5 barcode formats
- Live preview with <150ms debounce
- PNG, SVG, PDF export
- Clipboard copy + shareable URL params (state encoded, logo stripped to keep it sane)
- Local history (last 10) via `localStorage`
- Bulk CSV → ZIP generator (up to 100 rows)
- Full keyboard navigation, WCAG-AA color contrast, proper aria labels
- Responsive: desktop two-column, mobile single-column

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm run start       # start production server
npm run lint        # lint
npm run type-check  # strict TS check
```

## Deploy

Push to GitHub, then import into Vercel. No env variables required.

## CSV template (bulk)

```csv
name,type,content,fg_color,bg_color,size,error_correction
my-website,url,https://example.com,#000000,#ffffff,512,M
wifi-home,wifi,WIFI:T:WPA;S:MyNetwork;P:password123;;,#000000,#ffffff,512,M
```

Supported bulk types: `url`, `wifi`, `text`, `email`, `sms`, `location`. For `wifi`, pass the raw `WIFI:...` string as content.

## Project structure

```
qrforge/
├── app/
│   ├── bulk/page.tsx        # /bulk
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # /
├── components/              # Header, Footer, Sidebar, QRGenerator, BarcodeGenerator,
│                            #   CustomizationPanel, PreviewCanvas, DownloadPanel,
│                            #   HistoryPanel, HowItWorks, TypeSelector, BulkGenerator
├── lib/
│   ├── qr-utils.ts          # QR string builders, validators, canvas + SVG renderers
│   ├── barcode-utils.ts     # jsbarcode wrappers + format validation
│   ├── export-utils.ts      # PNG, SVG, PDF, clipboard, share link
│   └── storage-utils.ts     # localStorage history helpers
└── types/index.ts           # strict discriminated unions for all data shapes
```

## License

MIT — do what you like.

---

Crafted with precision by [@shakilxvs](https://shakilxvs.com).
