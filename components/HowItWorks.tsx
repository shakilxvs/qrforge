import { ListChecks, Paintbrush, Download } from "lucide-react";

const STEPS = [
  {
    Icon: ListChecks,
    title: "Choose Type",
    body: "Select the type of QR code or barcode you need from the sidebar.",
  },
  {
    Icon: Paintbrush,
    title: "Customize",
    body: "Add your content, pick your colors, upload your logo, and fine-tune every detail.",
  },
  {
    Icon: Download,
    title: "Download",
    body: "Download in PNG, SVG, or PDF format instantly. No signup, no watermark.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mb-10 text-center">
        <h2
          id="how-it-works-heading"
          className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
        >
          How it works
        </h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Three simple steps to a ready-to-use code.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map(({ Icon, title, body }, i) => (
          <div
            key={title}
            className="qf-card relative flex flex-col gap-3 p-6 transition-colors duration-150 hover:border-[var(--border-hover)]"
          >
            <div className="absolute right-5 top-5 text-xs font-semibold tabular-nums text-[var(--text-muted)]">
              0{i + 1}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent-light)]">
              <Icon className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
