"use client";

import { useState } from "react";
import { label } from "../lib/ui";
import NumberInput from "./NumberInput";

/**
 * The item fields UrbanPiper accepts that the main row has no space for.
 *
 * All of these appear in UrbanPiper's fuller catalogue sample. Collapsed by
 * default because most menus need none of them — but a menu that needs images
 * or per-channel pricing needs them badly, and there was previously nowhere to
 * put either.
 */
const FULFILMENT = ["delivery", "pickup"];

const FIELD_CLS =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs shadow-control outline-none transition-colors hover:border-slate-400 focus:border-brand-500";

const Field = ({ caption, hint, type, ...rest }) => (
  <label className="block">
    <span className={label + " mb-1"}>{caption}</span>
    {type === "number" ? (
      <NumberInput className={FIELD_CLS} {...rest} />
    ) : (
      <input type={type} className={FIELD_CLS} {...rest} />
    )}
    {hint && <span className="mt-0.5 block text-2xs text-slate-400">{hint}</span>}
  </label>
);

export default function ItemExtras({ item, onChange, platforms = [] }) {
  const [open, setOpen] = useState(false);
  const set = (patch) => onChange(patch);

  const num = (key) => (e) =>
    set({ [key]: e.target.value === "" ? undefined : Number(e.target.value) });
  const text = (key) => (e) => set({ [key]: e.target.value || undefined });

  const images = item.images ?? [];
  const pricing = item.platform_pricing ?? [];

  const filled =
    ["ref_title", "img_url", "weight", "serves", "markup_price", "current_stock"].filter(
      (k) => item[k] !== undefined && item[k] !== ""
    ).length +
    images.length +
    pricing.length +
    (item.fulfillment_modes?.length ? 1 : 0);

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <span className={label}>More fields</span>
          {filled > 0 && (
            <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-2xs font-semibold text-brand-700">
              {filled} set
            </span>
          )}
        </span>
        <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
          {open ? "hide" : "show"}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-200 px-2.5 py-3">
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <Field
              caption="Internal name"
              placeholder="ref_title"
              hint="Staff-facing, not shown to customers"
              value={item.ref_title ?? ""}
              onChange={text("ref_title")}
            />
            <Field caption="Weight (g)" type="number" step="any" min="0" value={item.weight ?? ""} onChange={num("weight")} />
            <Field caption="Serves" type="number" min="0" value={item.serves ?? ""} onChange={num("serves")} />
            <Field
              caption="Strike-through price"
              type="number"
              step="any"
              min="0"
              hint="markup_price — shown crossed out"
              value={item.markup_price ?? ""}
              onChange={num("markup_price")}
            />
            <Field
              caption="Stock count"
              type="number"
              hint="-1 = unlimited"
              value={item.current_stock ?? ""}
              onChange={num("current_stock")}
            />
            <Field
              caption="Display order"
              type="number"
              hint="sort_order — lower shows first"
              value={item.sort_order ?? ""}
              onChange={num("sort_order")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={item.sold_at_store !== false}
                onChange={(e) => set({ sold_at_store: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
              />
              Sold at store
            </label>
            <span className="flex items-center gap-2">
              <span className={label}>Fulfilment</span>
              {FULFILMENT.map((m) => (
                <label key={m} className="flex items-center gap-1 text-xs capitalize text-slate-600">
                  <input
                    type="checkbox"
                    checked={(item.fulfillment_modes ?? []).includes(m)}
                    onChange={(e) => {
                      const cur = item.fulfillment_modes ?? [];
                      const next = e.target.checked ? [...cur, m] : cur.filter((x) => x !== m);
                      set({ fulfillment_modes: next.length ? next : undefined });
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                  />
                  {m}
                </label>
              ))}
            </span>
          </div>

          {/* Images — one default plus per-channel overrides. */}
          <div>
            <p className={label}>Images</p>
            <p className="mt-0.5 text-2xs text-slate-400">
              Tag <code className="font-mono">default</code> is the main picture; a channel name
              overrides it on that channel only.
            </p>
            <div className="mt-1.5 space-y-1.5">
              <Field
                caption="Main image URL (img_url)"
                placeholder="https://…"
                value={item.img_url ?? ""}
                onChange={text("img_url")}
              />
              {images.map((img, n) => (
                <div key={n} className="grid gap-2 sm:grid-cols-[140px_1fr_auto]">
                  <input
                    placeholder="tag e.g. default"
                    value={img.tag ?? ""}
                    onChange={(e) => {
                      const next = [...images];
                      next[n] = { ...img, tag: e.target.value };
                      set({ images: next });
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs shadow-control"
                  />
                  <input
                    placeholder="https://…"
                    value={img.url ?? ""}
                    onChange={(e) => {
                      const next = [...images];
                      next[n] = { ...img, url: e.target.value };
                      set({ images: next });
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs shadow-control"
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => set({ images: images.filter((_, j) => j !== n) || undefined })}
                    className="rounded border border-slate-300 px-2 text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set({ images: [...images, { tag: "default", url: "" }] })}
                className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700"
              >
                + Add image
              </button>
            </div>
          </div>

          {/* Per-channel pricing. */}
          <div>
            <p className={label}>Per-channel price</p>
            <p className="mt-0.5 text-2xs text-slate-400">
              Overrides the base price on that channel only. Channels not listed use the base
              price.
            </p>
            <div className="mt-1.5 space-y-1.5">
              {pricing.map((row, n) => (
                <div key={n} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                  <input
                    placeholder={platforms[0] ?? "platform e.g. zomato"}
                    value={row.platform ?? ""}
                    onChange={(e) => {
                      const next = [...pricing];
                      next[n] = { ...row, platform: e.target.value.toLowerCase() };
                      set({ platform_pricing: next });
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs shadow-control"
                  />
                  <NumberInput
                    min="0"
                    placeholder="price"
                    value={row.price}
                    onChange={(e) => {
                      const next = [...pricing];
                      next[n] = { ...row, price: Number(e.target.value) };
                      set({ platform_pricing: next });
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs shadow-control"
                  />
                  <button
                    type="button"
                    aria-label="Remove channel price"
                    onClick={() =>
                      set({ platform_pricing: pricing.filter((_, j) => j !== n) || undefined })
                    }
                    className="rounded border border-slate-300 px-2 text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set({ platform_pricing: [...pricing, { platform: "", price: 0 }] })}
                className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700"
              >
                + Add channel price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
