"use client";

import { useEffect, useState } from "react";
import PageHeading from "../../components/PageHeading";
import ConnectionBanner from "../../components/ConnectionBanner";
import JsonViewer from "../../components/JsonViewer";
import StoreForm from "../../components/StoreForm";
import MenuBuilder from "../../components/MenuBuilder";
import DropReport from "../../components/DropReport";
import CategoryTimings from "../../components/CategoryTimings";
import {
  registerStore,
  pushMenu,
  listWebhooks,
  createWebhook,
  updateWebhook,
  getJobs,
  getSchema,
  listKnownStores,
  setCategoryTimings
} from "../../lib/api";
import { card, primaryBtn, secondaryBtn, inputCls, label } from "../../lib/ui";

/**
 * A deliberately tiny menu — enough to place one order against.
 *
 * UNVERIFIED: the field names follow UrbanPiper's documented menu architecture,
 * but the per-object schema is not fully published. Validation errors come back
 * on the menu callback — read them on the Activity page rather than guessing.
 */
const SAMPLE_MENU = {
  flush_categories: true,
  flush_items: true,
  categories: [{ ref_id: "CAT-1", name: "Main Course", sort_order: 1, active: true }],
  items: [
    {
      ref_id: "ITEM-101",
      title: "Paneer Butter Masala",
      price: 340,
      category_ref_ids: ["CAT-1"],
      available: true,
      food_type: 2
    },
    {
      ref_id: "ITEM-103",
      title: "Butter Naan",
      price: 70,
      category_ref_ids: ["CAT-1"],
      available: true,
      food_type: 2
    }
  ],
  option_groups: [],
  options: [],
  taxes: [],
  charges: []
};

const EVENT_TYPES = [
  { value: "order_placed", label: "New orders" },
  { value: "order_status_update", label: "Order status changes" },
  { value: "store_creation", label: "Outlet setup results" },
  { value: "hub_menu_publish", label: "Menu upload results" }
];

function Step({ n, title, purpose, note, children }) {
  return (
    <div className={card}>
      <div className="flex items-start gap-4">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 font-mono text-xs font-bold text-brand-700">
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{purpose}</p>
          {note && <p className="mt-1.5 max-w-2xl text-xs text-slate-500">{note}</p>}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  const [store, setStore] = useState({
    ref_id: "OUTLET-1",
    name: "POC Test Outlet",
    city: "Pune",
    ordering_enabled: true,
    active: true
  });
  const [menu, setMenu] = useState(SAMPLE_MENU);
  // §19: a full sync is a complete snapshot and deletes anything absent.
  const [fullSync, setFullSync] = useState(false);
  // Nutrition has no UrbanPiper field — this writes it into item descriptions.
  const [appendNutrition, setAppendNutrition] = useState(false);
  const [timingGroups, setTimingGroups] = useState([]);
  const [schema, setSchema] = useState(null);
  const [knownStores, setKnownStores] = useState([]);
  const refId = store.ref_id;
  const [webhookUrl, setWebhookUrl] = useState("");
  const [eventType, setEventType] = useState("order_placed");

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [webhooks, setWebhooks] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    getJobs().then((r) => setJobs(r?.data ?? [])).catch(() => {});
  }, [result]);

  useEffect(() => {
    getSchema().then((r) => setSchema(r?.data ?? null)).catch(() => {});
  }, []);

  // Refresh after every push, so a newly registered outlet appears at once.
  useEffect(() => {
    listKnownStores().then((r) => setKnownStores(r?.data ?? [])).catch(() => {});
  }, [result]);

  async function run(name, fn) {
    setBusy(name);
    setError(null);
    setResult(null);
    try {
      setResult({ name, data: await fn() });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeading
        title="Connect"
        subtitle="Three things have to happen before an order can reach us: UrbanPiper needs to know the outlet exists, what's on the menu, and where to send orders."
      />

      <ConnectionBanner />

      <div className="mb-6 rounded-xl border border-rose-300 bg-rose-50 px-5 py-4">
        <h2 className="text-sm font-bold text-rose-900">Read before using step 2</h2>
        <p className="mt-1 max-w-3xl text-sm text-rose-800">
          Sending a menu is <strong>not</strong> a test action. It replaces the live menu on every
          delivery app this account is connected to. If this restaurant is already listed on Swiggy
          or Zomato, uploading the sample menu below would overwrite the real one. Confirm nothing
          is live before pressing it.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-bold text-rose-900">
            {error.message?.includes("No UrbanPiper credentials")
              ? "No API key yet, so nothing was sent"
              : "That didn't go through"}
          </p>
          <p className="mt-1 text-sm text-rose-800">
            {error.message?.includes("No UrbanPiper credentials")
              ? "Add your UrbanPiper key to .env and restart the server, then try again."
              : error.message}
          </p>
          {error.validation && (
            <ul className="mt-2 space-y-1">
              {error.validation.map((v, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-2xs font-semibold text-rose-800">
                    {v.field}
                  </code>
                  <span className="text-rose-800">{v.message}</span>
                </li>
              ))}
            </ul>
          )}
          {error.upstream && (
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-white/60 p-2 text-[11px] text-rose-900">
              {JSON.stringify(error.upstream, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="space-y-4">
        <Step
          n={1}
          title="Register the outlet"
          purpose="Tells UrbanPiper this restaurant exists. Everything after this points back at the ID you choose here."
          note="Pick the ID yourself — it's how our system and theirs refer to the same outlet. UrbanPiper processes this in the background and confirms on the Activity page."
        >
          {knownStores.length > 0 && (
            <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
              <p className={label}>Already registered &mdash; load one to edit it</p>
              <p className="mt-1 text-2xs text-slate-500">
                Keeping the same Outlet ID updates that outlet. This shows what we last sent, from
                our own log &mdash; UrbanPiper has no endpoint to read an outlet back, so check
                Atlas &rarr; Locations if you suspect it was edited there.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {knownStores.map((s) => {
                  const active = store.ref_id === s.ref_id;
                  return (
                    <button
                      key={s.ref_id}
                      type="button"
                      onClick={() => setStore(s.payload)}
                      className={
                        "rounded-lg border px-3 py-2 text-left transition-colors " +
                        (active
                          ? "border-brand-500 bg-white shadow-control"
                          : "border-slate-200 bg-white hover:border-brand-400")
                      }
                    >
                      <span className="block font-mono text-2xs font-semibold text-slate-900">
                        {s.ref_id}
                      </span>
                      <span className="block text-2xs text-slate-500">
                        {s.name || "(no name)"} &middot; {s.fieldCount} fields
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <StoreForm value={store} onChange={setStore} />
          <button
            type="button"
            disabled={busy === "store" || !store.ref_id || !store.name}
            onClick={() => run("store", () => registerStore({ store }))}
            className={primaryBtn + " mt-5"}
          >
            {busy === "store" ? "Sending..." : "Register outlet"}
          </button>
          {result?.name === "store" && (
            <DropReport dropped={result.data?.dropped} unrecognised={result.data?.unrecognised} />
          )}
        </Step>

        <Step
          n={2}
          title="Send the menu"
          purpose="Delivery apps show whatever we send here. Orders refer to these items by ID, so they have to exist before any order can arrive."
          note="Two items, one category — the smallest menu that can produce an order. Real menus can hold up to 2,000 items."
        >
          <MenuBuilder value={menu} onChange={setMenu} platforms={schema?.platforms ?? []} />

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className={label}>Sync mode (§19)</p>
            <div className="mt-2 flex flex-wrap gap-5">
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  checked={!fullSync}
                  onChange={() => setFullSync(false)}
                  className="mt-0.5 h-4 w-4 border-slate-300 text-brand-600"
                />
                <span>
                  <span className="font-semibold">Incremental</span>
                  <span className="block text-2xs text-slate-500">
                    Adds and updates only. Nothing is deleted.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  checked={fullSync}
                  onChange={() => setFullSync(true)}
                  className="mt-0.5 h-4 w-4 border-slate-300 text-rose-600"
                />
                <span>
                  <span className="font-semibold text-rose-700">Full sync</span>
                  <span className="block text-2xs text-rose-600">
                    Complete snapshot — anything not listed above is DELETED.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <label className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={appendNutrition}
              onChange={(e) => setAppendNutrition(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            <span>
              <span className="font-semibold">Add nutrition to descriptions</span>
              <span className="block text-2xs text-slate-500">
                UrbanPiper has no nutrition field, so the figures are written into each
                item&rsquo;s description as{" "}
                <code className="font-mono">Per serving: 450 kcal &middot; Protein 12g</code>.
                Customer-facing text, and re-pushing will not duplicate the line.
              </span>
            </span>
          </label>

          <JsonViewer value={menu} label="See exactly what will be sent" collapsed />

          <button
            type="button"
            disabled={busy === "menu"}
            onClick={() => run("menu", () => pushMenu(refId, { catalogue: menu, flush: fullSync, appendNutrition }))}
            className={primaryBtn + " mt-4 !bg-rose-600 hover:!bg-rose-700"}
          >
            {busy === "menu" ? "Sending..." : (fullSync ? "Full sync to " : "Update menu on ") + refId}
          </button>
          <p className="mt-2 text-xs text-rose-700">Replaces the live menu. See the warning above.</p>
          {result?.name === "menu" && (
            <DropReport dropped={result.data?.dropped} unrecognised={result.data?.unrecognised} />
          )}

          <div className="mt-6 border-t border-slate-100 pt-5">
            <CategoryTimings value={timingGroups} onChange={setTimingGroups} />
            {timingGroups.length > 0 && (
              <button
                type="button"
                disabled={busy === "timings"}
                onClick={() => run("timings", () => setCategoryTimings(timingGroups))}
                className={secondaryBtn + " mt-4"}
              >
                {busy === "timings" ? "Sending..." : "Save category timings"}
              </button>
            )}
            <p className="mt-2 text-2xs text-slate-400">
              Sent separately from the menu &mdash; it is its own endpoint, and it uses HH:MM while
              the outlet&rsquo;s own hours use HH:MM:SS.
            </p>
          </div>
        </Step>

        <Step
          n={3}
          title="Say where to send orders"
          purpose="UrbanPiper posts every new order to a web address. Give it one that reaches this app from the internet."
          note="Use a dev tunnel pointed at port 5100, ending in /api/webhooks/urbanpiper. A password is attached automatically so we can tell genuine messages from anything else."
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <div>
              <span className={label}>Public address for this app</span>
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://xxxx-5100.devtunnels.ms/api/webhooks/urbanpiper"
                className={inputCls + " mt-1"}
              />
            </div>
            <div>
              <span className={label}>What to send here</span>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className={inputCls + " mt-1"}
              >
                {EVENT_TYPES.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy === "hook" || !webhookUrl}
              onClick={() => run("hook", () => createWebhook(eventType, webhookUrl))}
              className={primaryBtn}
            >
              {busy === "hook" ? "Saving..." : "Save address"}
            </button>
            <button
              type="button"
              disabled={busy === "hooks"}
              onClick={() =>
                run("hooks", async () => {
                  const res = await listWebhooks();
                  // UrbanPiper answers with an envelope, not a bare list:
                  // { meta: {...}, webhooks: [...] }. The backend forwards it
                  // untouched under `data`, so unwrap it here.
                  const list = res?.data?.webhooks ?? res?.data;
                  setWebhooks(Array.isArray(list) ? list : []);
                  return res;
                })
              }
              className={secondaryBtn}
            >
              Show what&rsquo;s already set
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Already registered a webhook at the wrong address? Posting again creates a{" "}
            <strong>second</strong> registration rather than replacing the first &mdash; use
            &ldquo;Repoint&rdquo; on the entry below instead.
          </p>

          {webhooks && (
            <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-sm">
              {webhooks.length === 0 && (
                <li className="py-2 text-slate-500">Nothing set up yet.</li>
              )}
              {webhooks.map((w) => (
                <li key={w.webhook_id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="text-xs font-semibold text-slate-900">
                    {EVENT_TYPES.find((e) => e.value === w.event_type)?.label ?? w.event_type}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{w.url}</span>
                  <button
                    type="button"
                    disabled={busy === "repoint" || !webhookUrl}
                    title={
                      webhookUrl
                        ? "Replace this registration's URL and token with the address above"
                        : "Enter a public address above first"
                    }
                    onClick={() =>
                      run("repoint", async () => {
                        const res = await updateWebhook(w.webhook_id, w.event_type, webhookUrl);
                        const listed = await listWebhooks();
                        const next = listed?.data?.webhooks ?? listed?.data;
                        setWebhooks(Array.isArray(next) ? next : []);
                        return res;
                      })
                    }
                    className="rounded border border-brand-300 bg-brand-50 px-2 py-0.5 text-2xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy === "repoint" ? "Saving..." : "Repoint"}
                  </button>
                  <span
                    className={
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase " +
                      (w.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")
                    }
                  >
                    {w.active ? "on" : "off"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Step>
      </div>

      {result && (
        <div className="mt-6">
          <JsonViewer value={result.data} label={"UrbanPiper's reply"} collapsed={false} />
        </div>
      )}

      {jobs.length > 0 && (
        <div className={card + " mt-6"}>
          <h2 className="text-sm font-bold text-slate-900">Waiting on UrbanPiper</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Outlet and menu uploads are processed in the background. UrbanPiper sends the result
            back once it&rsquo;s done &mdash; usually within a minute for an outlet, up to ten for a
            menu.
          </p>
          <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-sm">
            {jobs.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center gap-3 py-2">
                <span className="text-xs font-semibold text-slate-900">
                  {job.kind === "menu_push" ? "Menu upload" : "Outlet registration"}
                </span>
                <span className="font-mono text-[11px] text-slate-400">{job.reference}</span>
                <span
                  className={
                    "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase " +
                    (job.callback ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")
                  }
                >
                  {job.callback ? "done" : "in progress"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
