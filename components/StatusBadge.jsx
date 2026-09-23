"use client";

/**
 * Plain-English status labels. The technical value UrbanPiper actually uses is
 * kept in the tooltip, so the screen reads like a restaurant tool while the API
 * vocabulary stays one hover away.
 *
 * Deliberately NO 'Preparing' or 'Ready for pickup': those appear in the HMP
 * dashboard today and do not exist in UrbanPiper's API.
 */
const STATUSES = {
  PLACED: {
    label: "Needs a response",
    badge: "bg-amber-50 text-amber-800 ring-amber-600/25",
    dot: "bg-amber-500",
    hint: "Not yet sent to UrbanPiper"
  },
  Acknowledged: {
    label: "Accepted",
    badge: "bg-sky-50 text-sky-800 ring-sky-600/25",
    dot: "bg-sky-500",
    hint: 'Sent as "Acknowledged"'
  },
  "Food Ready": {
    label: "Food ready",
    badge: "bg-indigo-50 text-indigo-800 ring-indigo-600/25",
    dot: "bg-indigo-500",
    hint: 'Sent as "Food Ready"'
  },
  Dispatched: {
    label: "With the rider",
    badge: "bg-violet-50 text-violet-800 ring-violet-600/25",
    dot: "bg-violet-500",
    hint: 'Sent as "Dispatched"'
  },
  Completed: {
    label: "Delivered",
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
    dot: "bg-emerald-500",
    hint: 'Sent as "Completed"'
  },
  Cancelled: {
    label: "Rejected",
    badge: "bg-rose-50 text-rose-800 ring-rose-600/25",
    dot: "bg-rose-500",
    hint: 'Sent as "Cancelled"'
  }
};

const FALLBACK = {
  label: "Unknown",
  badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
  dot: "bg-slate-400",
  hint: ""
};

export function statusLabel(status) {
  return (STATUSES[status] ?? FALLBACK).label;
}

export default function StatusBadge({ status }) {
  const s = STATUSES[status] ?? FALLBACK;
  return (
    <span
      title={s.hint ? s.hint + " (" + status + ")" : status}
      className={
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset " +
        s.badge
      }
    >
      <span className={"h-1.5 w-1.5 rounded-full " + s.dot} />
      {s.label}
    </span>
  );
}
