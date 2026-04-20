"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type {
  QRType,
  QRData,
  QRDataUrl,
  QRDataWifi,
  QRDataVCard,
  QRDataEmail,
  QRDataSms,
  QRDataLocation,
  QRDataText,
  QRDataPayment,
  WifiEncryption,
  PaymentType,
} from "@/types";
import { validateData } from "@/lib/qr-utils";

interface QRGeneratorProps {
  type: QRType;
  data: QRData;
  onChange: (d: QRData) => void;
}

export default function QRGenerator({ type, data, onChange }: QRGeneratorProps) {
  const validation = useMemo(() => validateData(data), [data]);
  const hasContent = useMemo(() => hasAnyContent(data), [data]);

  return (
    <div className="space-y-3">
      {type === "url" && <UrlForm data={data as QRDataUrl} onChange={onChange} />}
      {type === "wifi" && <WifiForm data={data as QRDataWifi} onChange={onChange} />}
      {type === "vcard" && <VCardForm data={data as QRDataVCard} onChange={onChange} />}
      {type === "email" && <EmailForm data={data as QRDataEmail} onChange={onChange} />}
      {type === "sms" && <SmsForm data={data as QRDataSms} onChange={onChange} />}
      {type === "location" && <LocationForm data={data as QRDataLocation} onChange={onChange} />}
      {type === "text" && <TextForm data={data as QRDataText} onChange={onChange} />}
      {type === "payment" && <PaymentForm data={data as QRDataPayment} onChange={onChange} />}

      {hasContent && (
        <div
          className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
            validation.valid
              ? "bg-[var(--success)]/10 text-[var(--success)]"
              : "bg-[var(--error)]/10 text-[var(--error)]"
          }`}
        >
          {validation.valid ? (
            <>
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Ready to generate</span>
            </>
          ) : (
            <>
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{validation.message || "Invalid input"}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function hasAnyContent(data: QRData): boolean {
  switch (data.type) {
    case "url":
      return !!data.url.trim();
    case "wifi":
      return !!data.ssid.trim();
    case "vcard":
      return !!(data.firstName || data.lastName || data.phone || data.email);
    case "email":
      return !!data.to.trim();
    case "sms":
      return !!data.number.trim();
    case "location":
      return !!(data.latitude || data.longitude || data.address);
    case "text":
      return !!data.text.trim();
    case "payment": {
      switch (data.paymentType) {
        case "upi":
          return !!data.upiId.trim();
        case "paypal":
          return !!data.paypalLink.trim();
        case "bitcoin":
          return !!data.bitcoinAddress.trim();
        case "ethereum":
          return !!data.ethereumAddress.trim();
      }
      return false;
    }
  }
}

// ============================================================================
// URL
// ============================================================================
function UrlForm({ data, onChange }: { data: QRDataUrl; onChange: (d: QRData) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="qf-label" htmlFor="qf-url">
        Website URL
      </label>
      <input
        id="qf-url"
        type="url"
        className="qf-input"
        placeholder="https://example.com"
        value={data.url}
        onChange={(e) => onChange({ ...data, url: e.target.value })}
        autoComplete="off"
      />
    </div>
  );
}

// ============================================================================
// WiFi
// ============================================================================
function WifiForm({ data, onChange }: { data: QRDataWifi; onChange: (d: QRData) => void }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="space-y-3">
      <Field label="Network Name (SSID)">
        <input
          type="text"
          className="qf-input"
          placeholder="MyNetwork"
          value={data.ssid}
          onChange={(e) => onChange({ ...data, ssid: e.target.value })}
        />
      </Field>

      <Field label="Encryption">
        <select
          className="qf-select"
          value={data.encryption}
          onChange={(e) => onChange({ ...data, encryption: e.target.value as WifiEncryption })}
        >
          <option value="WPA">WPA / WPA2</option>
          <option value="WEP">WEP</option>
          <option value="nopass">None</option>
        </select>
      </Field>

      {data.encryption !== "nopass" && (
        <Field label="Password">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className="qf-input pr-10"
              placeholder="At least 8 characters"
              value={data.password}
              onChange={(e) => onChange({ ...data, password: e.target.value })}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--accent)]"
          checked={data.hidden}
          onChange={(e) => onChange({ ...data, hidden: e.target.checked })}
        />
        <span>Hidden network</span>
      </label>
    </div>
  );
}

// ============================================================================
// vCard
// ============================================================================
function VCardForm({ data, onChange }: { data: QRDataVCard; onChange: (d: QRData) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="First Name">
          <input
            type="text"
            className="qf-input"
            value={data.firstName}
            onChange={(e) => onChange({ ...data, firstName: e.target.value })}
          />
        </Field>
        <Field label="Last Name">
          <input
            type="text"
            className="qf-input"
            value={data.lastName}
            onChange={(e) => onChange({ ...data, lastName: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-[80px_1fr] gap-2">
        <Field label="Code">
          <input
            type="text"
            className="qf-input"
            placeholder="+1"
            value={data.phoneCountry}
            onChange={(e) => onChange({ ...data, phoneCountry: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            className="qf-input"
            placeholder="5551234567"
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Email">
        <input
          type="email"
          className="qf-input"
          placeholder="you@example.com"
          value={data.email}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
        />
      </Field>

      <Field label="Website">
        <input
          type="url"
          className="qf-input"
          placeholder="https://example.com"
          value={data.website}
          onChange={(e) => onChange({ ...data, website: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Organization">
          <input
            type="text"
            className="qf-input"
            value={data.organization}
            onChange={(e) => onChange({ ...data, organization: e.target.value })}
          />
        </Field>
        <Field label="Job Title">
          <input
            type="text"
            className="qf-input"
            value={data.jobTitle}
            onChange={(e) => onChange({ ...data, jobTitle: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Address">
        <textarea
          className="qf-textarea"
          rows={2}
          value={data.address}
          onChange={(e) => onChange({ ...data, address: e.target.value })}
        />
      </Field>
    </div>
  );
}

// ============================================================================
// Email
// ============================================================================
function EmailForm({ data, onChange }: { data: QRDataEmail; onChange: (d: QRData) => void }) {
  return (
    <div className="space-y-3">
      <Field label="To">
        <input
          type="email"
          className="qf-input"
          placeholder="you@example.com"
          value={data.to}
          onChange={(e) => onChange({ ...data, to: e.target.value })}
        />
      </Field>
      <Field label="Subject">
        <input
          type="text"
          className="qf-input"
          value={data.subject}
          onChange={(e) => onChange({ ...data, subject: e.target.value })}
        />
      </Field>
      <Field label="Message">
        <textarea
          className="qf-textarea"
          rows={3}
          value={data.body}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
        />
      </Field>
    </div>
  );
}

// ============================================================================
// SMS
// ============================================================================
function SmsForm({ data, onChange }: { data: QRDataSms; onChange: (d: QRData) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Phone Number">
        <input
          type="tel"
          className="qf-input"
          placeholder="+1 555 123 4567"
          value={data.number}
          onChange={(e) => onChange({ ...data, number: e.target.value })}
        />
      </Field>
      <Field label="Message">
        <textarea
          className="qf-textarea"
          rows={3}
          placeholder="Optional"
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.target.value })}
        />
      </Field>
    </div>
  );
}

// ============================================================================
// Location
// ============================================================================
function LocationForm({
  data,
  onChange,
}: {
  data: QRDataLocation;
  onChange: (d: QRData) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Latitude">
          <input
            type="text"
            inputMode="decimal"
            className="qf-input"
            placeholder="23.8103"
            value={data.latitude}
            onChange={(e) => onChange({ ...data, latitude: e.target.value })}
          />
        </Field>
        <Field label="Longitude">
          <input
            type="text"
            inputMode="decimal"
            className="qf-input"
            placeholder="90.4125"
            value={data.longitude}
            onChange={(e) => onChange({ ...data, longitude: e.target.value })}
          />
        </Field>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span>or use address (coordinates preferred)</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>
      <Field label="Address">
        <input
          type="text"
          className="qf-input"
          placeholder="123 Main Street, City"
          value={data.address}
          onChange={(e) => onChange({ ...data, address: e.target.value })}
        />
      </Field>
    </div>
  );
}

// ============================================================================
// Text
// ============================================================================
function TextForm({ data, onChange }: { data: QRDataText; onChange: (d: QRData) => void }) {
  const remaining = 500 - data.text.length;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="qf-label" htmlFor="qf-text">
          Plain Text
        </label>
        <span
          className={`text-[11px] ${
            remaining < 0 ? "text-[var(--error)]" : "text-[var(--text-muted)]"
          }`}
        >
          {data.text.length}/500
        </span>
      </div>
      <textarea
        id="qf-text"
        className="qf-textarea"
        rows={5}
        maxLength={500}
        value={data.text}
        placeholder="Enter any text up to 500 characters"
        onChange={(e) => onChange({ ...data, text: e.target.value })}
      />
    </div>
  );
}

// ============================================================================
// Payment
// ============================================================================
function PaymentForm({
  data,
  onChange,
}: {
  data: QRDataPayment;
  onChange: (d: QRData) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Payment Method">
        <select
          className="qf-select"
          value={data.paymentType}
          onChange={(e) =>
            onChange({ ...data, paymentType: e.target.value as PaymentType })
          }
        >
          <option value="upi">UPI</option>
          <option value="paypal">PayPal</option>
          <option value="bitcoin">Bitcoin</option>
          <option value="ethereum">Ethereum</option>
        </select>
      </Field>

      {data.paymentType === "upi" && (
        <>
          <Field label="UPI ID">
            <input
              type="text"
              className="qf-input"
              placeholder="name@bank"
              value={data.upiId}
              onChange={(e) => onChange({ ...data, upiId: e.target.value })}
            />
          </Field>
          <Field label="Name (optional)">
            <input
              type="text"
              className="qf-input"
              value={data.upiName}
              onChange={(e) => onChange({ ...data, upiName: e.target.value })}
            />
          </Field>
          <Field label="Amount ₹ (optional)">
            <input
              type="number"
              inputMode="decimal"
              className="qf-input"
              placeholder="100"
              value={data.upiAmount}
              onChange={(e) => onChange({ ...data, upiAmount: e.target.value })}
            />
          </Field>
        </>
      )}

      {data.paymentType === "paypal" && (
        <Field label="PayPal.me Link">
          <input
            type="text"
            className="qf-input"
            placeholder="paypal.me/username"
            value={data.paypalLink}
            onChange={(e) => onChange({ ...data, paypalLink: e.target.value })}
          />
        </Field>
      )}

      {data.paymentType === "bitcoin" && (
        <>
          <Field label="Bitcoin Address">
            <input
              type="text"
              className="qf-input"
              placeholder="bc1q..."
              value={data.bitcoinAddress}
              onChange={(e) => onChange({ ...data, bitcoinAddress: e.target.value })}
            />
          </Field>
          <Field label="Amount ₿ (optional)">
            <input
              type="number"
              inputMode="decimal"
              className="qf-input"
              placeholder="0.001"
              value={data.bitcoinAmount}
              onChange={(e) => onChange({ ...data, bitcoinAmount: e.target.value })}
            />
          </Field>
        </>
      )}

      {data.paymentType === "ethereum" && (
        <>
          <Field label="Ethereum Address">
            <input
              type="text"
              className="qf-input"
              placeholder="0x..."
              value={data.ethereumAddress}
              onChange={(e) => onChange({ ...data, ethereumAddress: e.target.value })}
            />
          </Field>
          <Field label="Amount Ξ (optional)">
            <input
              type="number"
              inputMode="decimal"
              className="qf-input"
              placeholder="0.01"
              value={data.ethereumAmount}
              onChange={(e) => onChange({ ...data, ethereumAmount: e.target.value })}
            />
          </Field>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Field helper
// ============================================================================
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="qf-label block">{label}</label>
      {children}
    </div>
  );
}
