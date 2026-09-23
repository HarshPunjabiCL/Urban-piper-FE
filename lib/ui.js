// Shared Tailwind class strings, so every page renders the same controls.
// Import these instead of re-declaring styles per page.
//
// Focus rings are handled globally by :focus-visible in globals.css, so the
// controls below carry hover/active/disabled states only.

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-control outline-none transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const btnBase =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";

export const primaryBtn =
  btnBase +
  " rounded-lg bg-brand-600 px-5 py-2.5 text-sm text-white shadow-control hover:bg-brand-500 hover:shadow-card active:bg-brand-700 active:shadow-control disabled:hover:bg-brand-600";

export const secondaryBtn =
  btnBase +
  " rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-control hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100";

export const smallBtn =
  btnBase +
  " rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-control hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-700 active:bg-brand-50";

export const dangerBtn =
  btnBase +
  " rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs text-rose-700 shadow-control hover:border-rose-400 hover:bg-rose-50 active:bg-rose-100";

export const card =
  "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card";

/** Cards that are links or otherwise respond to the pointer. */
export const cardInteractive =
  card + " transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover";

export const label =
  "block text-2xs font-semibold uppercase tracking-wider text-slate-500";

/** Inline code / identifiers — ref ids, endpoints, tokens. */
export const mono =
  "rounded bg-slate-100 px-1.5 py-0.5 font-mono text-2xs text-slate-700";

/** Section heading inside a card. */
export const sectionTitle =
  "text-sm font-semibold tracking-tight text-slate-900";
