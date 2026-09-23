"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeading from "../components/PageHeading";
import ConnectionBanner from "../components/ConnectionBanner";
import { getHealth, listOrders, getWebhookLog } from "../lib/api";
import { card, cardInteractive, sectionTitle } from "../lib/ui";

/**
 * The order below is UrbanPiper's, not ours: a menu can only be attached to an
 * outlet that exists, and an order can only reference items that were pushed.
 * Each row says what the step is FOR, with the technical detail underneath.
 */
const STEPS = [
  {
    n: 1,
    what: "Prove we can log in",
    why: "Check the API key from your UrbanPiper account actually works.",
    tech: "apikey username:key"
  },
  {
    n: 2,
    what: "Tell UrbanPiper the outlet exists",
    why: "It can't send orders to a restaurant it doesn't know about.",
    tech: "POST /external/api/v1/stores/"
  },
  {
    n: 3,
    what: "Send the menu",
    why: "Delivery apps show what we send here. Orders point at these items, so they must exist first.",
    tech: "POST /external/api/v1/inventory/locations/:ref/"
  },
  {
    n: 4,
    what: "Say where to send orders",
    why: "UrbanPiper posts each new order to a web address we give it.",
    tech: "POST /external/api/v1/webhooks/"
  },
  {
    n: 5,
    what: "Receive a real order",
    why: "The moment of truth — an order arrives and we reply with our own reference for it.",
    tech: "inbound order_placed"
  },
  {
    n: 6,
    what: "Accept or reject it",
    why: "Accepting tells the app how long the food will take. Rejecting needs a reason from their fixed list.",
    tech: "PUT /external/api/v1/orders/:id/status/"
  },
  {
    n: 7,
    what: "Keep them updated",
    why: "Food ready, rider collected, delivered — so the customer sees progress in their app.",
    tech: "same status endpoint"
  }
];

function Tile({ label, value, tone = "slate", hint, loading }) {
  const tones = {
    slate: { text: "text-slate-900", dot: "bg-slate-300" },
    good: { text: "text-slate-900", dot: "bg-emerald-500" },
    warn: { text: "text-slate-900", dot: "bg-amber-500" }
  };
  const t = tones[tone] ?? tones.slate;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-control transition-colors hover:border-slate-300">
      <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
        <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + t.dot} aria-hidden="true" />
        {label}
      </p>
      {loading ? (
        <div className="skeleton mt-2 h-5 w-20 rounded" />
      ) : (
        <p className={"tnum mt-1.5 text-lg font-semibold tracking-tight " + t.text}>{value}</p>
      )}
      {hint && <p className="mt-1 truncate text-2xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function OverviewPage() {
  const [health, setHealth] = useState(null);
  const [orderCount, setOrderCount] = useState(null);
  const [hookCount, setHookCount] = useState(null);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => {});
    listOrders().then((r) => setOrderCount((r?.data ?? []).length)).catch(() => {});
    getWebhookLog().then((r) => setHookCount((r?.data ?? []).length)).catch(() => {});
  }, []);

  const connected = health?.credentialsPresent;

  return (
    <div>
      <PageHeading
        title="UrbanPiper trial integration"
        subtitle="UrbanPiper is the middleman between delivery apps (Swiggy, Zomato) and a restaurant's till. This app proves we can send it a menu, receive its orders, and keep it updated."
      />

      <ConnectionBanner />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Our server"
          value={health ? "Running" : "Not reachable"}
          tone={health ? "good" : "warn"}
        />
        <Tile
          label="UrbanPiper key"
          value={connected ? "Added" : "Not added"}
          tone={connected ? "good" : "warn"}
          hint={connected ? health.upBaseUrl : "Steps 1 to 7 need this"}
        />
        <Tile
          label="Orders received"
          value={orderCount ?? "—"}
          loading={orderCount === null}
          hint="Including samples"
        />
        <Tile
          label="Messages logged"
          value={hookCount ?? "—"}
          loading={hookCount === null}
          hint="Everything UrbanPiper sent"
        />
      </div>

      {!connected && (
        <div className={card + " mb-8 !border-brand-200 !bg-brand-50"}>
          <h2 className="text-sm font-bold text-brand-700">What to do next</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="font-mono text-xs font-bold text-brand-600">1</span>
              <span>
                Find which API key works &mdash; run{" "}
                <span className="font-mono text-xs">node tools/check-credentials.mjs</span> from the{" "}
                <span className="font-mono text-xs">tools</span> folder.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs font-bold text-brand-600">2</span>
              <span>
                Put that key in <span className="font-mono text-xs">.env</span> and restart the
                server.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs font-bold text-brand-600">3</span>
              <span>
                Ask UrbanPiper whether we can use their test environment &mdash; without it there is
                no way to place a practice order. The email is drafted in{" "}
                <span className="font-mono text-xs">ask-urbanpiper.md</span>.
              </span>
            </li>
          </ol>
          <p className="mt-4 text-sm text-slate-700">
            In the meantime,{" "}
            <Link href="/orders" className="font-semibold text-brand-700 underline">
              the Orders screen
            </Link>{" "}
            works with sample orders so you can see the whole flow.
          </p>
        </div>
      )}

      <div className={card}>
        <h2 className={sectionTitle}>How the integration works</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          These seven steps have to happen in this order. UrbanPiper can&rsquo;t attach a menu to an
          outlet it doesn&rsquo;t know about, and an order can&rsquo;t reference items that were
          never sent.
        </p>

        <ol className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
          {STEPS.map((step) => (
            <li key={step.n} className="flex items-start gap-4 py-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 font-mono text-[11px] font-bold tabular-nums text-brand-700">
                {step.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{step.what}</p>
                <p className="mt-0.5 max-w-2xl text-sm text-slate-600">{step.why}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-400">{step.tech}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link href="/setup" className={cardInteractive + " group block"}>
          <h3 className="flex items-center gap-1 text-sm font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-brand-700">Connect &rarr;</h3>
          <p className="mt-1 text-sm text-slate-600">
            Register the outlet, send the menu, and tell UrbanPiper where to deliver orders.
          </p>
        </Link>
        <Link href="/orders" className={cardInteractive + " group block"}>
          <h3 className="flex items-center gap-1 text-sm font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-brand-700">Orders &rarr;</h3>
          <p className="mt-1 text-sm text-slate-600">
            Accept, reject, and update orders as the kitchen works through them.
          </p>
        </Link>
        <Link href="/inspector" className={cardInteractive + " group block"}>
          <h3 className="flex items-center gap-1 text-sm font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-brand-700">Activity &rarr;</h3>
          <p className="mt-1 text-sm text-slate-600">
            Every message UrbanPiper has sent us, exactly as it arrived.
          </p>
        </Link>
      </div>
    </div>
  );
}
