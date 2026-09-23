"use client";

import { useState } from "react";

export default function JsonViewer({ value, collapsed = true, label = "payload" }) {
  const [open, setOpen] = useState(!collapsed);
  if (value == null) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-slate-600 transition hover:text-slate-900"
      >
        <span>{label}</span>
        <span className="text-slate-400">{open ? "hide" : "show"}</span>
      </button>
      {open && (
        <pre className="max-h-96 overflow-auto border-t border-slate-200 px-3 py-2 text-[11px] leading-relaxed text-slate-700">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}
