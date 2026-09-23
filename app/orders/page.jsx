"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeading from "../../components/PageHeading";
import StatusBadge from "../../components/StatusBadge";
import SyntheticBadge from "../../components/SyntheticBadge";
import LifecycleTrack from "../../components/LifecycleTrack";
import ConnectionBanner from "../../components/ConnectionBanner";
import JsonViewer from "../../components/JsonViewer";
import { listOrders, acceptOrder, rejectOrder, advanceOrder, getReasonCodes } from "../../lib/api";
import { card, primaryBtn, smallBtn, dangerBtn, inputCls, label, secondaryBtn } from "../../lib/ui";

/** What the staff member can do next, in their words. */
const NEXT_ACTION = {
  Acknowledged: { status: "Food Ready", cta: "Food is ready" },
  "Food Ready": { status: "Dispatched", cta: "Rider has collected it" },
  Dispatched: { status: "Completed", cta: "Delivered" }
};

/** Plain-English wording for UrbanPiper's cancellation codes. */
const REASON_TEXT = {
  item_out_of_stock: "An item is out of stock",
  store_closed: "The outlet is closed",
  store_busy: "The kitchen is too busy",
  rider_not_available: "No rider available",
  out_of_delivery_radius: "Address is outside our delivery area",
  connectivity_issue: "Technical or connectivity problem",
  total_missmatch: "Order total doesn't match",
  invalid_item: "An item on the order isn't valid",
  option_out_of_stock: "A choice or add-on is out of stock",
  invalid_option: "A choice or add-on isn't valid",
  unspecified: "Another reason"
};

const money = (value) => "₹" + Number(value ?? 0).toLocaleString("en-IN");

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (!Number.isFinite(seconds)) return "";
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return mins + " min ago";
  const hours = Math.floor(mins / 60);
  return hours + "h ago";
}

/** Turns a backend failure into something a person can act on. */
function explainError(err) {
  if (!err) return null;
  const message = err.message || "";

  if (message.includes("No UrbanPiper credentials")) {
    return {
      title: "No API key yet, so this couldn't be sent",
      body: "The order stays as it is. Add your UrbanPiper key to .env and restart the server, then try again.",
      tone: "amber"
    };
  }
  if (err.allowed) {
    return {
      title: message,
      body: "Allowed from here: " + err.allowed.join(", "),
      tone: "rose"
    };
  }
  if (message.includes("429") || message.toLowerCase().includes("rate limited")) {
    return {
      title: "UrbanPiper is rate-limiting us",
      body: "Too many requests in a short window. Wait a minute and try again.",
      tone: "amber"
    };
  }
  return { title: "That didn't go through", body: message, tone: "rose" };
}

function Notice({ error, onDismiss }) {
  const info = explainError(error);
  if (!info) return null;

  const tones = {
    amber: {
      wrap: "border-amber-200 bg-amber-50/80",
      icon: "bg-amber-100 text-amber-700",
      title: "text-amber-900",
      body: "text-amber-800"
    },
    rose: {
      wrap: "border-rose-200 bg-rose-50/80",
      icon: "bg-rose-100 text-rose-700",
      title: "text-rose-900",
      body: "text-rose-800"
    }
  };
  const t = tones[info.tone];

  return (
    <div
      role="alert"
      className={"mb-5 flex animate-fade-in gap-3.5 rounded-xl border p-4 shadow-control " + t.wrap}
    >
      <span
        className={"mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full " + t.icon}
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
          <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.25 4.5a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4ZM8 12a.9.9 0 1 1 0-1.8A.9.9 0 0 1 8 12Z" />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <p className={"text-sm font-semibold " + t.title}>{info.title}</p>
        <p className={"mt-0.5 text-sm leading-relaxed " + t.body}>{info.body}</p>
        {error.upstream && (
          <pre className="mt-2.5 max-h-40 overflow-auto rounded-lg border border-black/5 bg-white/70 p-2.5 font-mono text-2xs leading-relaxed text-slate-700">
            {JSON.stringify(error.upstream, null, 2)}
          </pre>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={"shrink-0 rounded p-1 opacity-50 transition-opacity hover:opacity-100 " + t.body}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M4.3 3.2 8 6.9l3.7-3.7 1.1 1.1L9.1 8l3.7 3.7-1.1 1.1L8 9.1l-3.7 3.7-1.1-1.1L6.9 8 3.2 4.3l1.1-1.1Z" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** Placeholder rows while the first fetch is in flight. */
function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className={card}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-40 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
            <div className="skeleton h-6 w-20 rounded" />
          </div>
          <div className="mt-5 space-y-2.5">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-4/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [reasonCodes, setReasonCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [prepTimes, setPrepTimes] = useState({});

  const refresh = useCallback(async () => {
    try {
      const res = await listOrders();
      setOrders(res?.data ?? []);
    } catch {
      // A failed refresh shouldn't wipe the action error the user is reading.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    getReasonCodes()
      .then((r) => setReasonCodes(r?.data ?? []))
      .catch(() => {});
    // Delivery apps expect a fast response, so keep the list fresh.
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function run(id, fn) {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err);
    } finally {
      setBusyId(null);
    }
  }

  const newOrders = orders.filter((o) => o.status === "PLACED");
  const active = orders.filter((o) => ["Acknowledged", "Food Ready", "Dispatched"].includes(o.status));
  const done = orders.filter((o) => ["Completed", "Cancelled"].includes(o.status));

  function renderOrder(order) {
    const payload = order.payload ?? {};
    // Field paths confirmed against UrbanPiper's Postman collection:
    // totals and instructions sit under order.details, lines under order.items.
    const detail = payload.order?.details ?? {};
    const items = payload.order?.items ?? [];
    const busy = busyId === order.up_order_id;
    const next = NEXT_ACTION[order.status];
    const isNew = order.status === "PLACED";

    return (
      <div
        key={order.up_order_id}
        className={
          card +
          " animate-fade-in transition-shadow hover:shadow-card-hover " +
          (isNew ? "border-l-[3px] border-l-amber-400" : "")
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[0.9375rem] font-semibold capitalize tracking-tight text-slate-900">
                {order.platform || "Delivery app"} order
              </h3>
              <StatusBadge status={order.status} />
              {payload._synthetic && <SyntheticBadge />}
            </div>
            <p className="tnum mt-1.5 text-xs text-slate-500">
              #{order.up_order_id} &middot; {timeAgo(order.received_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="tnum text-xl font-semibold tracking-tight text-slate-900">{money(detail.order_total)}</p>
            <p className="text-xs text-slate-500">
              {items.length} item{items.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {!isNew && (
          <div className="mt-4">
            <LifecycleTrack status={order.status} />
          </div>
        )}

        {items.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
            {items.map((item, i) => (
              <li key={item.merchant_id ?? i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">
                  <span className="font-semibold tabular-nums text-slate-500">
                    {item.quantity ?? 1}&times;
                  </span>{" "}
                  {item.title ?? "Unnamed item"}
                </span>
                <span className="tabular-nums text-slate-600">{money(item.total)}</span>
              </li>
            ))}
          </ul>
        )}

        {detail.instructions && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span className="font-semibold">Note from the customer: </span>
            {detail.instructions}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isNew && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Ready in</span>
                <input
                  type="number"
                  min="1"
                  max="240"
                  placeholder="25"
                  value={prepTimes[order.up_order_id] ?? ""}
                  onChange={(e) => setPrepTimes((p) => ({ ...p, [order.up_order_id]: e.target.value }))}
                  className="tnum w-20 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs shadow-control outline-none transition-colors hover:border-slate-400 focus:border-brand-500"
                />
                <span className="text-xs text-slate-500">minutes</span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(order.up_order_id, () => {
                    const mins = Number(prepTimes[order.up_order_id]);
                    return acceptOrder(
                      order.up_order_id,
                      Number.isFinite(mins) && mins > 0 ? mins : undefined
                    );
                  })
                }
                className={primaryBtn + " !px-4 !py-1.5 !text-xs"}
              >
                {busy ? "Sending..." : "Accept order"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setRejecting({
                    id: order.up_order_id,
                    reasonCode: reasonCodes[0] ?? "",
                    message: ""
                  })
                }
                className={dangerBtn}
              >
                Can&rsquo;t make it
              </button>
            </>
          )}

          {next && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(order.up_order_id, () => advanceOrder(order.up_order_id, next.status))}
              className={smallBtn}
            >
              {busy ? "Sending..." : next.cta}
            </button>
          )}
        </div>

        <div className="mt-4">
          <JsonViewer value={payload} label="See exactly what UrbanPiper sent" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        title="Orders"
        subtitle="Orders coming in from delivery apps like Swiggy and Zomato. Accept one to start the kitchen, or tell them you can't make it."
      >
        <button type="button" onClick={refresh} className={secondaryBtn}>
          Refresh
        </button>
      </PageHeading>

      <ConnectionBanner />
      <Notice error={error} onDismiss={() => setError(null)} />

      {loading ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <div className={card}>
          <h2 className="text-sm font-bold text-slate-900">No orders yet</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Nothing has come in. Either no order has been placed, or UrbanPiper doesn&rsquo;t yet
            know where to send them &mdash; that&rsquo;s the last step on the Connect page.
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-700">Want to see how this screen works?</p>
          <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
            cd backend &amp;&amp; npm run replay
          </p>
          <p className="mt-2 max-w-xl text-xs text-slate-500">
            That creates a sample order on this machine. It shows the screen working; it does not
            prove the UrbanPiper connection works.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              Needs a response
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                {newOrders.length}
              </span>
            </h2>
            {newOrders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-5 py-6 text-center text-sm text-slate-500">
                Nothing waiting. All caught up.
              </p>
            ) : (
              <div className="space-y-4">{newOrders.map(renderOrder)}</div>
            )}
          </section>

          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-slate-900">In progress</h2>
              <div className="space-y-4">{active.map(renderOrder)}</div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-slate-900">Finished</h2>
              <div className="space-y-4">{done.map(renderOrder)}</div>
            </section>
          )}
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-900">Tell them you can&rsquo;t make it</h2>
            <p className="mt-1 text-sm text-slate-600">
              The delivery app shows the customer a reason, so it has to be one of these. Free text
              isn&rsquo;t accepted.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <span className={label}>Reason</span>
                <select
                  value={rejecting.reasonCode}
                  onChange={(e) => setRejecting((r) => ({ ...r, reasonCode: e.target.value }))}
                  className={inputCls + " mt-1"}
                >
                  {reasonCodes.map((code) => (
                    <option key={code} value={code}>
                      {REASON_TEXT[code] ?? code}
                    </option>
                  ))}
                </select>
                {rejecting.reasonCode && (
                  <p className="mt-1 font-mono text-[11px] text-slate-400">
                    sent as {rejecting.reasonCode}
                  </p>
                )}
              </div>
              <div>
                <span className={label}>Anything to add? (optional)</span>
                <input
                  type="text"
                  value={rejecting.message}
                  onChange={(e) => setRejecting((r) => ({ ...r, message: e.target.value }))}
                  placeholder="Sent alongside the reason"
                  className={inputCls + " mt-1"}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setRejecting(null)} className={secondaryBtn}>
                Back
              </button>
              <button
                type="button"
                disabled={!rejecting.reasonCode || busyId === rejecting.id}
                onClick={() =>
                  run(rejecting.id, async () => {
                    await rejectOrder(rejecting.id, rejecting.reasonCode, rejecting.message || undefined);
                    setRejecting(null);
                  })
                }
                className={primaryBtn}
              >
                Reject order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
