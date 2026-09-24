"use client";

import { useState } from "react";
import { card, label, smallBtn, sectionTitle } from "../lib/ui";

/**
 * Outlet and menu pushes are asynchronous: UrbanPiper queues the request and
 * reports the real outcome on a callback. This panel matches callback to job.
 *
 * The honest bit: a job whose callback never arrives is NOT still running. If
 * no subscription is registered for that event type, the result was delivered
 * somewhere else and the row will sit unresolved forever. Showing those as
 * "in progress" tells the operator to keep waiting for something that is never
 * coming, so past a grace period they are labelled "no result" instead.
 */
const GRACE_MINUTES = { store_upsert: 5, default: 15 };

const KIND_LABEL = {
  store_upsert: "Outlet registration",
  menu_push: "Menu update",
  menu_full_sync: "Menu full sync"
};

function ageMinutes(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 60000) : 0;
}

function describeAge(mins) {
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusOf(job) {
  if (job.callback) return "confirmed";
  const grace = GRACE_MINUTES[job.kind] ?? GRACE_MINUTES.default;
  return ageMinutes(job.created_at) > grace ? "no-result" : "waiting";
}

const STATUS = {
  confirmed: { text: "Confirmed", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  waiting: { text: "Waiting", cls: "bg-amber-50 text-amber-800 ring-amber-600/20" },
  "no-result": { text: "No result", cls: "bg-slate-100 text-slate-500 ring-slate-500/20" }
};

const VISIBLE = 5;

export default function JobsPanel({ jobs = [], onClear, clearing }) {
  const [expanded, setExpanded] = useState(false);
  if (jobs.length === 0) return null;

  const counts = jobs.reduce((acc, j) => {
    const s = statusOf(j);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const stale = counts["no-result"] ?? 0;
  const shown = expanded ? jobs : jobs.slice(0, VISIBLE);

  return (
    <div className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={sectionTitle}>Publishing results</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Outlet and menu uploads are queued by UrbanPiper and confirmed afterwards. An outlet
            usually confirms within a minute, a menu within ten.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {["confirmed", "waiting", "no-result"].map((s) =>
            counts[s] ? (
              <span
                key={s}
                className={
                  "tnum rounded-full px-2 py-0.5 text-2xs font-semibold ring-1 ring-inset " + STATUS[s].cls
                }
              >
                {counts[s]} {STATUS[s].text.toLowerCase()}
              </span>
            ) : null
          )}
        </div>
      </div>

      {stale > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <p className="text-sm font-semibold text-slate-800">
            {stale} upload{stale === 1 ? "" : "s"} never reported a result
          </p>
          <p className="mt-1 text-2xs leading-relaxed text-slate-600">
            These are not still running. UrbanPiper sends publishing results to a registered
            address, and none is registered for them &mdash; so the results went elsewhere and
            these rows will never resolve. Register &ldquo;Outlet setup results&rdquo; and
            &ldquo;Menu upload results&rdquo; in step 3 to fix it for future uploads.
          </p>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={clearing}
              className={smallBtn + " mt-2.5"}
            >
              {clearing ? "Clearing…" : `Clear these ${stale}`}
            </button>
          )}
        </div>
      )}

      <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
        {shown.map((job) => {
          const s = statusOf(job);
          return (
            <li key={job.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span className="min-w-[8.5rem] text-xs font-semibold text-slate-900">
                {KIND_LABEL[job.kind] ?? job.kind}
              </span>
              <span className="tnum text-2xs text-slate-500">{describeAge(ageMinutes(job.created_at))}</span>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-2xs font-semibold ring-1 ring-inset " + STATUS[s].cls
                }
              >
                {STATUS[s].text}
              </span>
              <span
                title={job.reference}
                className="ml-auto truncate font-mono text-2xs text-slate-300"
              >
                {String(job.reference).slice(0, 8)}
              </span>
            </li>
          );
        })}
      </ul>

      {jobs.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-2xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-brand-700"
        >
          {expanded ? "Show fewer" : `Show all ${jobs.length}`}
        </button>
      )}
    </div>
  );
}
