"use client";

import { useState } from "react";
import { runStoreAction, runItemAction } from "../lib/api";
import { label, smallBtn, inputCls } from "../lib/ui";
import JsonViewer from "./JsonViewer";

/**
 * §12: switch an outlet, items or variants on and off without touching the
 * menu. Two UrbanPiper calls, both fire-and-forget (they return a reference and
 * report the result on the store_action / item_state_toggle webhooks):
 *
 *   POST /hub/api/v1/location/  { location_ref_id, platforms?, action, turn_on_at? }
 *   POST /hub/api/v1/items/     { location_ref_id, item_ref_ids?, option_ref_ids?, action, turn_on_at? }
 *
 * `action` is "enable" or "disable". `turn_on_at` only makes sense with
 * "disable": it schedules the automatic switch-back.
 */
const PLATFORM_CHOICES = ["swiggy", "zomato"];

function Result({ state }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
        {state.error}
      </p>
    );
  }
  return (
    <div className="mt-2">
      <p className="text-xs text-emerald-700">
        Queued. UrbanPiper confirms on the Activity page once the toggle is applied on each
        channel.
      </p>
      <JsonViewer value={state.data} label="UrbanPiper's reply" collapsed />
    </div>
  );
}

const Radio = ({ name, value, current, onChange, children, tone }) => (
  <label className="flex items-center gap-1.5 text-xs text-slate-700">
    <input
      type="radio"
      name={name}
      checked={current === value}
      onChange={() => onChange(value)}
      className={"h-3.5 w-3.5 border-slate-300 " + (tone === "danger" ? "text-rose-600" : "text-brand-600")}
    />
    {children}
  </label>
);

export default function AvailabilityPanel({ refId, menu }) {
  /* ── Outlet ───────────────────────────────────────────────────────────── */
  const [storeAction, setStoreAction] = useState("disable");
  const [storePlatforms, setStorePlatforms] = useState([]);
  const [storeTurnOnAt, setStoreTurnOnAt] = useState("");
  const [storeBusy, setStoreBusy] = useState(false);
  const [storeResult, setStoreResult] = useState(null);

  /* ── Items / variants ─────────────────────────────────────────────────── */
  const [itemAction, setItemAction] = useState("disable");
  const [itemIds, setItemIds] = useState([]);
  const [optionIds, setOptionIds] = useState([]);
  const [itemTurnOnAt, setItemTurnOnAt] = useState("");
  const [itemBusy, setItemBusy] = useState(false);
  const [itemResult, setItemResult] = useState(null);

  const items = menu?.items ?? [];
  const options = menu?.options ?? [];

  const toggleIn = (list, set) => (id) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  // UrbanPiper wants ISO-8601 with an offset; the datetime-local input gives
  // local wall time with no zone, so stamp the browser's offset on.
  const toIso = (local) => (local ? new Date(local).toISOString() : undefined);

  async function submitStore() {
    setStoreBusy(true);
    setStoreResult(null);
    try {
      const data = await runStoreAction({
        locationRefId: refId,
        action: storeAction,
        ...(storePlatforms.length ? { platforms: storePlatforms } : {}),
        ...(storeAction === "disable" && storeTurnOnAt ? { turnOnAt: toIso(storeTurnOnAt) } : {})
      });
      setStoreResult({ data: data?.data ?? data });
    } catch (err) {
      setStoreResult({ error: err.message });
    } finally {
      setStoreBusy(false);
    }
  }

  async function submitItems() {
    if (!itemIds.length && !optionIds.length) {
      setItemResult({ error: "Tick at least one item or variant." });
      return;
    }
    setItemBusy(true);
    setItemResult(null);
    try {
      const data = await runItemAction({
        locationRefId: refId,
        action: itemAction,
        ...(itemIds.length ? { itemRefIds: itemIds } : {}),
        ...(optionIds.length ? { optionRefIds: optionIds } : {}),
        ...(itemAction === "disable" && itemTurnOnAt ? { turnOnAt: toIso(itemTurnOnAt) } : {})
      });
      setItemResult({ data: data?.data ?? data });
    } catch (err) {
      setItemResult({ error: err.message });
    } finally {
      setItemBusy(false);
    }
  }

  const actionLabel = (a) => (a === "enable" ? "Switch ON" : "Switch OFF");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ── Outlet ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className={label}>Outlet</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800">{refId}</p>
        <p className="mt-1 text-2xs text-slate-500">
          Takes the whole outlet off the delivery apps, or puts it back. Leave every channel
          unticked to apply to all of them.
        </p>

        <div className="mt-3 flex flex-wrap gap-4">
          <Radio name="store-action" value="disable" current={storeAction} onChange={setStoreAction} tone="danger">
            Switch OFF (stop taking orders)
          </Radio>
          <Radio name="store-action" value="enable" current={storeAction} onChange={setStoreAction}>
            Switch ON
          </Radio>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <span className={label}>Channels</span>
          {PLATFORM_CHOICES.map((p) => (
            <label key={p} className="flex items-center gap-1.5 text-xs capitalize text-slate-700">
              <input
                type="checkbox"
                checked={storePlatforms.includes(p)}
                onChange={() => toggleIn(storePlatforms, setStorePlatforms)(p)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
              />
              {p}
            </label>
          ))}
          <span className="text-2xs text-slate-400">(none ticked = all)</span>
        </div>

        {storeAction === "disable" && (
          <label className="mt-3 block">
            <span className={label + " mb-1"}>Switch back on automatically at</span>
            <input
              type="datetime-local"
              value={storeTurnOnAt}
              onChange={(e) => setStoreTurnOnAt(e.target.value)}
              className={inputCls + " max-w-xs"}
            />
            <span className="mt-0.5 block text-2xs text-slate-400">
              Optional. Leave blank to keep it off until you switch it on yourself.
            </span>
          </label>
        )}

        <button
          type="button"
          disabled={storeBusy || !refId}
          onClick={submitStore}
          className={smallBtn + " mt-4" + (storeAction === "disable" ? " !border-rose-300 !text-rose-700 hover:!bg-rose-50" : "")}
        >
          {storeBusy ? "Sending..." : `${actionLabel(storeAction)} outlet ${refId}`}
        </button>
        <Result state={storeResult} />
      </div>

      {/* ── Items / variants ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className={label}>Items and variants</p>
        <p className="mt-1 text-2xs text-slate-500">
          Marks the ticked ones out of stock on {refId} without changing the menu. Lists come
          from the menu builder above.
        </p>

        <div className="mt-3 flex flex-wrap gap-4">
          <Radio name="item-action" value="disable" current={itemAction} onChange={setItemAction} tone="danger">
            Switch OFF (out of stock)
          </Radio>
          <Radio name="item-action" value="enable" current={itemAction} onChange={setItemAction}>
            Switch ON (back in stock)
          </Radio>
        </div>

        <div className="mt-3">
          <span className={label}>Items</span>
          {items.length === 0 ? (
            <p className="mt-1 text-2xs text-slate-400">No items in the builder yet.</p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
              {items.map((it) => (
                <label key={it.ref_id} className="flex items-center gap-1.5 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={itemIds.includes(it.ref_id)}
                    onChange={() => toggleIn(itemIds, setItemIds)(it.ref_id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                  />
                  {it.title || it.ref_id}
                  <span className="font-mono text-2xs text-slate-400">{it.ref_id}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {options.length > 0 && (
          <div className="mt-3">
            <span className={label}>Variants / modifiers</span>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
              {options.map((o) => (
                <label key={o.ref_id} className="flex items-center gap-1.5 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={optionIds.includes(o.ref_id)}
                    onChange={() => toggleIn(optionIds, setOptionIds)(o.ref_id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                  />
                  {o.title || o.ref_id}
                  <span className="font-mono text-2xs text-slate-400">{o.ref_id}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {itemAction === "disable" && (
          <label className="mt-3 block">
            <span className={label + " mb-1"}>Back in stock automatically at</span>
            <input
              type="datetime-local"
              value={itemTurnOnAt}
              onChange={(e) => setItemTurnOnAt(e.target.value)}
              className={inputCls + " max-w-xs"}
            />
            <span className="mt-0.5 block text-2xs text-slate-400">
              Optional. Blank keeps them off until switched on here.
            </span>
          </label>
        )}

        <button
          type="button"
          disabled={itemBusy || !refId}
          onClick={submitItems}
          className={smallBtn + " mt-4" + (itemAction === "disable" ? " !border-rose-300 !text-rose-700 hover:!bg-rose-50" : "")}
        >
          {itemBusy
            ? "Sending..."
            : `${actionLabel(itemAction)} ${itemIds.length + optionIds.length || ""} selected`}
        </button>
        <Result state={itemResult} />
      </div>
    </div>
  );
}
