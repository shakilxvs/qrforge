"use client";

import Link from "next/link";
import { QrCode, Instagram, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Generator" },
    { href: "/bulk", label: "Bulk" },
    { href: "/#how-it-works", label: "How it works" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(10,10,10,0.75)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 qf-focus-ring rounded-md"
          aria-label="QRForge home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent-light)]">
            <QrCode className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <span className="text-base font-bold tracking-tight text-white">QRForge</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="qf-btn-ghost qf-focus-ring rounded-md px-3 py-1.5 text-sm"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://instagram.com/shakilxvs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow @shakilxvs on Instagram"
            className="qf-btn-secondary hidden md:inline-flex"
          >
            <Instagram className="h-4 w-4" />
            <span>Follow @shakilxvs</span>
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            className="qf-btn-ghost md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-primary)] md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://instagram.com/shakilxvs"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <Instagram className="h-4 w-4" />
              Follow @shakilxvs
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
