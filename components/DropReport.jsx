"use client";

import { useState } from "react";

/**
 * What the mapping layer removed on the way to UrbanPiper.
 *
 * §22 of the requirements asks for a POS model that is deliberately NOT
 * UrbanPiper-shaped, which means fields will always be dropped at the boundary.
 * Showing them is the difference between "we mapped the catalogue" and being
 * able to answer "so did the nutrition data ever reach Swiggy?".
 */
export default function DropReport({ dropped = [], unrecognised = [] }) {
  const [open, setOpen] = useState(false);
  if (dropped.length === 0 && unrecognised.length === 0) return null;

  const byEntity = dropped.reduce((acc, d) => {
    (acc[d.entity] ??= []).push(d);
    return acc;
  }, {});

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-100/70"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            {dropped.length} field{dropped.length === 1 ? "" : "s"} could not be sent
          </span>
          {unrecognised.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-semibold text-amber-800">
              {unrecognised.length} unrecognised
            </span>
          )}
        </span>
        <span className="shrink-0 text-2xs font-semibold uppercase tracking-wider text-slate-500">
          {open ? "hide" : "show"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <p className="mb-3 text-xs leading-relaxed text-slate-600">
            These were kept in the POS and removed before the call. UrbanPiper has no field for
            them &mdash; checked against their published Postman collection. This list is the
            evidence to send back to UrbanPiper.
          </p>

          {Object.entries(byEntity).map(([entity, fields]) => (
            <div key={entity} className="mb-3 last:mb-0">
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
                {entity}
              </p>
              <ul className="mt-1 space-y-1">
                {fields.map((f, i) => (
                  <li key={entity + f.field + i} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                    <code className="rounded bg-rose-50 px-1.5 py-0.5 font-mono text-2xs font-semibold text-rose-700">
                      {f.field}
                      {f.index !== undefined && <span className="opacity-60">[{f.index}]</span>}
                    </code>
                    <span className="text-slate-600">{f.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {unrecognised.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-2xs font-semibold uppercase tracking-wider text-amber-800">
                Not recognised at all
              </p>
              <p className="mt-1 text-xs text-amber-900">
                Neither an UrbanPiper field nor a known POS field &mdash; more likely a typo:{" "}
                {unrecognised.map((u) => u.field).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
