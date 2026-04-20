import { ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-primary)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-[var(--text-muted)] sm:flex-row sm:px-6">
        <p>© 2026 QRForge. All rights reserved.</p>
        <p className="flex items-center gap-1.5">
          <span>Crafted with precision by</span>
          <a
            href="https://shakilxvs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-light)]"
            aria-label="Visit shakilxvs.com"
          >
            @shakilxvs
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
    </footer>
  );
}
