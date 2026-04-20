import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QRForge — Professional QR Code & Barcode Studio",
  description:
    "Generate custom QR codes and barcodes for URLs, WiFi, contacts, payments, and more. Free, no watermark, no signup. PNG, SVG, and PDF export.",
  keywords:
    "QR code generator, barcode generator, custom QR code, QR code with logo, free QR code",
  openGraph: {
    title: "QRForge — Professional QR Code & Barcode Studio",
    description:
      "Free professional QR code and barcode generator with full customization.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
