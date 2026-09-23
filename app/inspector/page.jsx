"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeading from "../../components/PageHeading";
import ConnectionBanner from "../../components/ConnectionBanner";
import JsonViewer from "../../components/JsonViewer";
import { getWebhookLog } from "../../lib/api";
import { card, secondaryBtn } from "../../lib/ui";

/**
 * Every inbound message, verbatim — accepted or refused, understood or not.
 *
 * This is the most valuable screen here. UrbanPiper documents what an order
 * contains but never publishes the exact data shape, so the first real order is
 * what tells us the actual field names. Reading them here is how we avoid
 * guessing — which is what went wrong in the shipped integration.
 */
const EVENT_LABELS = {
  order_placed: "New order",
  order_status_update: "Order status changed",
  store_creation: "Outlet setup result",
  hub_menu_publish: "Menu upload result",
  store_action: "Outlet opened or closed",
  rider_status_update: "Rider update",
  unknown: "Unrecognised message"
};

const labelFor = (type) => EVENT_LABELS[type] ?? type;

export default function ActivityPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const refresh = useCallback(async () => {
    try {
      const res = await getWebhookLog();
      setEntries(res?.data ?? []);
    } catch {
      // Leave whatever is on screen; the banner already reports a dead server.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, [refresh]);

  const types = ["all", ...Array.from(new Set(entries.map((e) => e.event_type || "unknown")))];
  const visible =
    filter === "all" ? entries : entries.filter((e) => (e.event_type || "unknown") === filter);

  return (
    <div>
      <PageHeading
        title="Activity"
        subtitle="Every message UrbanPiper has sent us, exactly as it arrived — including any we turned away. This is where you find out what really went wrong."
      >
        <button type="button" onClick={refresh} className={secondaryBtn}>
          Refresh
        </button>
      </PageHeading>

      <ConnectionBanner />

      {types.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {types.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition " +
                (filter === type
                  ? "bg-brand-500 text-white"
                  : "border border-slate-300 bg-white text-slate-600 hover:text-slate-900")
              }
            >
              {type === "all" ? "Everything" : labelFor(type)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className={card}>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className={card}>
          <h2 className="text-sm font-bold text-slate-900">Nothing has arrived yet</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Once UrbanPiper starts sending us messages, every one lands here &mdash; including ones
            we refuse for a bad password, which is how a wrong setup gets spotted.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((entry) => (
            <div key={entry.id} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {labelFor(entry.event_type || "unknown")}
                  </span>
                  <span
                    title={
                      entry.authorised
                        ? "The password matched, so we trusted this message"
                        : "The password did not match — we turned this message away"
                    }
                    className={
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider " +
                      (entry.authorised
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700")
                    }
                  >
                    {entry.authorised ? "accepted" : "turned away"}
                  </span>
                  {entry.body?._synthetic && (
                    <span
                      title="Created on this machine, not sent by UrbanPiper."
                      className="rounded border border-dashed border-amber-400 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700"
                    >
                      Sample
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-slate-400">{entry.received_at}</span>
              </div>

              <div className="mt-3 space-y-2">
                <JsonViewer value={entry.body} label="What they sent" collapsed={false} />
                <JsonViewer value={entry.headers} label="Technical details" collapsed />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
