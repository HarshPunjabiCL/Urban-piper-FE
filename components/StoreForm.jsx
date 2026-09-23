"use client";

import { useState } from "react";
import { inputCls, label } from "../lib/ui";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/**
 * The full outlet field set (§3, §4), grouped the way the requirements doc
 * groups it. Fields UrbanPiper cannot carry are in their own section, greyed,
 * so the operator sees the boundary rather than discovering it in a 400.
 */
const UNMAPPABLE = [
  ["brand_name", "Brand name", "§3 — brand is account-level in UrbanPiper"],
  ["outlet_code", "Outlet code", "§3 — only one identifier (ref_id) exists"],
  ["landmark", "Landmark", "§3 — no landmark field"],
  ["state", "State", "§3 — city and zip codes only"],
  ["gstin", "GSTIN", "§3 — no statutory tax id on the store"],
  ["fssai", "FSSAI number", "§3 — no food-business id on the store"],
  ["timezone", "Time zone", "§3 — assumed from the account"],
  ["offline_reason", "Offline reason", "§4 — the action API takes no reason"]
];

const Field = ({ id, children, hint, ...rest }) => (
  <div>
    <label htmlFor={id} className={label}>
      {children}
    </label>
    <input id={id} className={inputCls + " mt-1.5"} {...rest} />
    {hint && <p className="mt-1 text-2xs text-slate-400">{hint}</p>}
  </div>
);

export default function StoreForm({ value, onChange }) {
  const [showUnmappable, setShowUnmappable] = useState(false);
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const setNum = (k) => (e) =>
    onChange({ ...value, [k]: e.target.value === "" ? undefined : Number(e.target.value) });
  const setList = (k) => (e) =>
    onChange({
      ...value,
      [k]: e.target.value ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean) : undefined
    });
  const setBool = (k) => (e) => onChange({ ...value, [k]: e.target.checked });

  const timings = value.timings ?? [];
  const dayOpen = (day) => timings.find((t) => t.day === day);

  function toggleDay(day) {
    const existing = dayOpen(day);
    onChange({
      ...value,
      timings: existing
        ? timings.filter((t) => t.day !== day)
        : [...timings, { day, slots: [{ start_time: "10:00", end_time: "22:30" }] }]
    });
  }

  function setSlot(day, key, v) {
    onChange({
      ...value,
      timings: timings.map((t) =>
        t.day === day ? { ...t, slots: [{ ...t.slots[0], [key]: v }] } : t
      )
    });
  }

  return (
    <div className="space-y-6">
      <section>
        <p className={label}>Identity</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Field id="ref_id" value={value.ref_id ?? ""} onChange={set("ref_id")} hint="Your POS id — becomes location_ref_id everywhere after this">
            Outlet ID *
          </Field>
          <Field id="name" value={value.name ?? ""} onChange={set("name")}>
            Outlet name *
          </Field>
        </div>
      </section>

      <section>
        <p className={label}>Location</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Field id="address" value={value.address ?? ""} onChange={set("address")}>
            Address
          </Field>
          <Field id="city" value={value.city ?? ""} onChange={set("city")}>
            City
          </Field>
          <Field id="geo_latitude" type="number" step="any" value={value.geo_latitude ?? ""} onChange={setNum("geo_latitude")}>
            Latitude
          </Field>
          <Field id="geo_longitude" type="number" step="any" value={value.geo_longitude ?? ""} onChange={setNum("geo_longitude")}>
            Longitude
          </Field>
          <Field
            id="zip_codes"
            value={(value.zip_codes ?? []).join(", ")}
            onChange={setList("zip_codes")}
            hint="Serviceable pincodes, comma separated"
          >
            Zip codes
          </Field>
        </div>
      </section>

      <section>
        <p className={label}>Contact &amp; notifications</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Field id="contact_phone" value={value.contact_phone ?? ""} onChange={set("contact_phone")}>
            Contact phone
          </Field>
          <Field
            id="notification_phones"
            value={(value.notification_phones ?? []).join(", ")}
            onChange={setList("notification_phones")}
            hint="Comma separated"
          >
            Notification phones
          </Field>
          <Field
            id="notification_emails"
            value={(value.notification_emails ?? []).join(", ")}
            onChange={setList("notification_emails")}
            hint="Alerting only — not the outlet's public email"
          >
            Notification emails
          </Field>
        </div>
      </section>

      <section>
        <p className={label}>Ordering</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field id="min_order_value" type="number" value={value.min_order_value ?? ""} onChange={setNum("min_order_value")}>
            Min order value
          </Field>
          <Field
            id="min_delivery_time"
            type="number"
            value={value.min_delivery_time ?? ""}
            onChange={setNum("min_delivery_time")}
            hint="SECONDS — 1800 = 30 min"
          >
            Min delivery time
          </Field>
          <Field
            id="min_pickup_time"
            type="number"
            value={value.min_pickup_time ?? ""}
            onChange={setNum("min_pickup_time")}
            hint="SECONDS — 900 = 15 min"
          >
            Min pickup time
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-5">
          {[
            ["ordering_enabled", "Online ordering enabled"],
            ["active", "Outlet active"],
            ["hide_from_ui", "Hide from UI"]
          ].map(([k, text]) => (
            <label key={k} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={value[k] ?? (k !== "hide_from_ui")}
                onChange={setBool(k)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              {text}
            </label>
          ))}
        </div>
      </section>

      <section>
        <p className={label}>Operating hours (§4)</p>
        <p className="mt-1 text-2xs text-slate-400">
          One schedule per outlet. UrbanPiper has no separate delivery and pickup hours.
        </p>
        <div className="mt-2 space-y-1.5">
          {DAYS.map((day) => {
            const entry = dayOpen(day);
            return (
              <div key={day} className="flex flex-wrap items-center gap-3">
                <label className="flex w-36 items-center gap-2 text-sm capitalize text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(entry)}
                    onChange={() => toggleDay(day)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  {day}
                </label>
                {entry && (
                  <>
                    <input
                      type="time"
                      value={entry.slots[0]?.start_time ?? ""}
                      onChange={(e) => setSlot(day, "start_time", e.target.value)}
                      className="tnum rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs shadow-control"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="time"
                      value={entry.slots[0]?.end_time ?? ""}
                      onChange={(e) => setSlot(day, "end_time", e.target.value)}
                      className="tnum rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs shadow-control"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <p className={label}>Channel mapping (§15)</p>
        <p className="mt-1 text-2xs text-slate-400">
          The only level where channel IDs are supported. Items, categories and modifiers have no
          equivalent.
        </p>
        <div className="mt-2 space-y-2">
          {(value.platform_data ?? []).map((p, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-3">
              <input
                placeholder="zomato"
                value={p.name ?? ""}
                onChange={(e) => {
                  const next = [...value.platform_data];
                  next[i] = { ...p, name: e.target.value.toLowerCase() };
                  onChange({ ...value, platform_data: next });
                }}
                className={inputCls}
              />
              <input
                placeholder="platform_store_id"
                value={p.platform_store_id ?? ""}
                onChange={(e) => {
                  const next = [...value.platform_data];
                  next[i] = { ...p, platform_store_id: e.target.value };
                  onChange({ ...value, platform_data: next });
                }}
                className={inputCls}
              />
              <div className="flex gap-2">
                <input
                  placeholder="url"
                  value={p.url ?? ""}
                  onChange={(e) => {
                    const next = [...value.platform_data];
                    next[i] = { ...p, url: e.target.value };
                    onChange({ ...value, platform_data: next });
                  }}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...value, platform_data: value.platform_data.filter((_, j) => j !== i) })
                  }
                  className="shrink-0 rounded-lg border border-slate-300 px-2 text-xs text-slate-500 hover:bg-slate-50"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({ ...value, platform_data: [...(value.platform_data ?? []), { name: "" }] })
            }
            className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700"
          >
            + Add channel
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
        <button
          type="button"
          onClick={() => setShowUnmappable((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-slate-700">
            POS-only fields &mdash; kept locally, never sent
          </span>
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
            {showUnmappable ? "hide" : "show"}
          </span>
        </button>
        {showUnmappable && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {UNMAPPABLE.map(([key, text, why]) => (
              <Field key={key} id={key} value={value[key] ?? ""} onChange={set(key)} hint={why}>
                {text}
              </Field>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
