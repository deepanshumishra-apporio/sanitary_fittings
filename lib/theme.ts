export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Sanitary Fitted";
export const SITE_TAGLINE = process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Science-Backed. Clinically Clean.";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const ANNOUNCEMENT_MESSAGES = [
  `Premium sanitary fittings — Built to last`,
  `New arrivals — Shop the latest collection`,
  `Trusted quality. Precision fit. Every time.`,
];

// Shared Tailwind class strings reused across components
export const cls = {
  input:
    "w-full border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors",
  btnPrimary:
    "inline-flex items-center justify-center bg-zinc-900 px-6 py-3 text-sm font-medium tracking-wide text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
  btnOrange:
    "inline-flex items-center justify-center bg-orange-500 px-6 py-3 text-sm font-bold tracking-widest text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
  btnSecondary:
    "inline-flex items-center justify-center border border-zinc-900 px-6 py-3 text-sm font-medium tracking-wide text-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
  btnGhost:
    "inline-flex items-center justify-center px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors",
  label: "block text-xs font-medium uppercase tracking-widest text-zinc-500 mb-2",
  errorBox: "border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",
  sectionHeading: "text-2xl font-extrabold tracking-tight text-zinc-900",
  sectionEyebrow: "text-xs font-semibold uppercase tracking-[0.3em] text-orange-500",
};
