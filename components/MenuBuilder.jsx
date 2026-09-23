"use client";

import { useState } from "react";
import { inputCls, label, smallBtn } from "../lib/ui";

/**
 * Catalogue editor covering §6 to §11.
 *
 * The one thing worth understanding here: there is no Variant entity in
 * UrbanPiper. A variant is an option group plus options, exactly like a
 * modifier. The Variants block below is a POS-side convenience that the backend
 * translates (buildVariantAsOptions) — which is why variant tax, MRP, default
 * selection and ordering appear in the drop report rather than in the payload.
 */
const FOOD_TYPES = [
  { value: "1", label: "Veg" },
  { value: "2", label: "Non-veg" },
  { value: "3", label: "Egg" },
  { value: "5", label: "N/A" }
];

const Row = ({ children, onRemove }) => (
  <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
    <div className="min-w-0 flex-1">{children}</div>
    <button
      type="button"
      onClick={onRemove}
      aria-label="Remove"
      className="shrink-0 rounded px-1.5 py-0.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
    >
      &times;
    </button>
  </div>
);

const Small = ({ placeholder, value, onChange, type = "text", ...rest }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value ?? ""}
    onChange={onChange}
    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs shadow-control outline-none transition-colors hover:border-slate-400 focus:border-brand-500"
    {...rest}
  />
);

const AddBtn = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700"
  >
    {children}
  </button>
);

export default function MenuBuilder({ value, onChange, platforms = [] }) {
  const [tab, setTab] = useState("items");

  const list = (k) => value[k] ?? [];
  const setList = (k, next) => onChange({ ...value, [k]: next });
  const update = (k, i, patch) =>
    setList(k, list(k).map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const remove = (k, i) => setList(k, list(k).filter((_, j) => j !== i));
  const add = (k, row) => setList(k, [...list(k), row]);

  const TABS = [
    ["items", `Items (${list("items").length})`],
    ["categories", `Categories (${list("categories").length})`],
    ["modifiers", `Modifiers (${list("option_groups").length})`],
    ["taxes", `Taxes & charges (${list("taxes").length + list("charges").length})`]
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
        {TABS.map(([key, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
              (tab === key
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
            }
          >
            {text}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {tab === "categories" && (
          <>
            {list("categories").map((c, i) => (
              <Row key={i} onRemove={() => remove("categories", i)}>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Small placeholder="ref_id *" value={c.ref_id} onChange={(e) => update("categories", i, { ref_id: e.target.value })} />
                  <Small placeholder="name *" value={c.name} onChange={(e) => update("categories", i, { name: e.target.value })} />
                  <Small placeholder="sort_order" type="number" value={c.sort_order} onChange={(e) => update("categories", i, { sort_order: Number(e.target.value) })} />
                  <Small placeholder="parent_ref_id (sub-category)" value={c.parent_ref_id} onChange={(e) => update("categories", i, { parent_ref_id: e.target.value || undefined })} />
                </div>
                <Small placeholder="description" value={c.description} onChange={(e) => update("categories", i, { description: e.target.value })} />
              </Row>
            ))}
            <AddBtn onClick={() => add("categories", { ref_id: "", name: "", active: true })}>
              + Add category
            </AddBtn>
            <p className="text-2xs text-slate-400">
              Sub-categories use <code className="font-mono">parent_ref_id</code>. Category-level
              out-of-stock and category tags are not supported (§6).
            </p>
          </>
        )}

        {tab === "items" && (
          <>
            {list("items").map((it, i) => (
              <Row key={i} onRemove={() => remove("items", i)}>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Small placeholder="ref_id / SKU *" value={it.ref_id} onChange={(e) => update("items", i, { ref_id: e.target.value })} />
                  <Small placeholder="title *" value={it.title} onChange={(e) => update("items", i, { title: e.target.value })} />
                  <Small placeholder="price" type="number" value={it.price} onChange={(e) => update("items", i, { price: Number(e.target.value) })} />
                  <Small placeholder="category_ref_ids (comma sep)" value={(it.category_ref_ids ?? []).join(",")} onChange={(e) => update("items", i, { category_ref_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                  <select
                    value={it.food_type ?? "1"}
                    onChange={(e) => update("items", i, { food_type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs shadow-control"
                  >
                    {FOOD_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <Small placeholder="external_price" type="number" value={it.external_price} onChange={(e) => update("items", i, { external_price: Number(e.target.value) })} />
                </div>
                <Small placeholder="description" value={it.description} onChange={(e) => update("items", i, { description: e.target.value })} />
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" checked={it.available !== false} onChange={(e) => update("items", i, { available: e.target.checked })} className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600" />
                    Available
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" checked={Boolean(it.recommended)} onChange={(e) => update("items", i, { recommended: e.target.checked })} className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600" />
                    Recommended
                  </label>
                  {platforms.length > 0 && (
                    <Small placeholder={"included_platforms: " + platforms.join(",")} value={(it.included_platforms ?? []).join(",")} onChange={(e) => update("items", i, { included_platforms: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                  )}
                </div>
              </Row>
            ))}
            <AddBtn onClick={() => add("items", { ref_id: "", title: "", price: 0, available: true, food_type: "1", category_ref_ids: [] })}>
              + Add item
            </AddBtn>
            <p className="text-2xs text-slate-400">
              No display order, item timing, MRP, effective dates or nutrition &mdash; UrbanPiper has
              no field for any of them (§7). Enter them in the POS; they appear in the drop report.
            </p>
          </>
        )}

        {tab === "modifiers" && (
          <>
            {list("option_groups").map((g, i) => (
              <Row key={i} onRemove={() => remove("option_groups", i)}>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Small placeholder="ref_id *" value={g.ref_id} onChange={(e) => update("option_groups", i, { ref_id: e.target.value })} />
                  <Small placeholder="title *" value={g.title} onChange={(e) => update("option_groups", i, { title: e.target.value })} />
                  <Small placeholder="min_selectable" type="number" value={g.min_selectable} onChange={(e) => update("option_groups", i, { min_selectable: Number(e.target.value) })} />
                  <Small placeholder="max_selectable (-1 = any)" type="number" value={g.max_selectable} onChange={(e) => update("option_groups", i, { max_selectable: Number(e.target.value) })} />
                </div>
                <Small placeholder="item_ref_ids (comma sep)" value={(g.item_ref_ids ?? []).join(",")} onChange={(e) => update("option_groups", i, { item_ref_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </Row>
            ))}
            <AddBtn onClick={() => add("option_groups", { ref_id: "", title: "", min_selectable: 0, max_selectable: 1, active: true, item_ref_ids: [] })}>
              + Add modifier group
            </AddBtn>

            <p className="pt-2 text-2xs font-semibold uppercase tracking-wider text-slate-500">
              Options — variants and modifiers both live here
            </p>
            {list("options").map((o, i) => (
              <Row key={i} onRemove={() => remove("options", i)}>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Small placeholder="ref_id *" value={o.ref_id} onChange={(e) => update("options", i, { ref_id: e.target.value })} />
                  <Small placeholder="title *" value={o.title} onChange={(e) => update("options", i, { title: e.target.value })} />
                  <Small placeholder="price" type="number" value={o.price} onChange={(e) => update("options", i, { price: Number(e.target.value) })} />
                  <Small placeholder="opt_grp_ref_ids (comma sep)" value={(o.opt_grp_ref_ids ?? []).join(",")} onChange={(e) => update("options", i, { opt_grp_ref_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                </div>
              </Row>
            ))}
            <AddBtn onClick={() => add("options", { ref_id: "", title: "", price: 0, available: true, opt_grp_ref_ids: [] })}>
              + Add option
            </AddBtn>
            <p className="text-2xs text-slate-400">
              A size variant (§8) is a group with min=1, max=1. Variant tax, MRP and default
              selection have no equivalent &mdash; they stay POS-side.
            </p>
          </>
        )}

        {tab === "taxes" && (
          <>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Taxes</p>
            {list("taxes").map((t, i) => (
              <Row key={i} onRemove={() => remove("taxes", i)}>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Small placeholder="code *" value={t.code} onChange={(e) => update("taxes", i, { code: e.target.value })} />
                  <Small placeholder="title * (CGST)" value={t.title} onChange={(e) => update("taxes", i, { title: e.target.value })} />
                  <Small placeholder="rate %" type="number" step="any" value={t.structure?.value} onChange={(e) => update("taxes", i, { structure: { value: Number(e.target.value) } })} />
                  <Small placeholder="item_ref_ids (or 'all')" value={(t.item_ref_ids ?? []).join(",")} onChange={(e) => update("taxes", i, { item_ref_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                </div>
              </Row>
            ))}
            <AddBtn onClick={() => add("taxes", { code: "", title: "", active: true, structure: { value: 0 }, item_ref_ids: ["all"] })}>
              + Add tax
            </AddBtn>

            <p className="pt-2 text-2xs font-semibold uppercase tracking-wider text-slate-500">Charges</p>
            {list("charges").map((c, i) => (
              <Row key={i} onRemove={() => remove("charges", i)}>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Small placeholder="code *" value={c.code} onChange={(e) => update("charges", i, { code: e.target.value })} />
                  <Small placeholder="title *" value={c.title} onChange={(e) => update("charges", i, { title: e.target.value })} />
                  <Small placeholder="value" type="number" step="any" value={c.structure?.value} onChange={(e) => update("charges", i, { structure: { ...c.structure, value: Number(e.target.value) } })} />
                  <Small placeholder="applicable_on (item.quantity)" value={c.structure?.applicable_on} onChange={(e) => update("charges", i, { structure: { ...c.structure, applicable_on: e.target.value || undefined } })} />
                </div>
              </Row>
            ))}
            <AddBtn onClick={() => add("charges", { code: "", title: "", active: true, structure: { value: 0 }, item_ref_ids: ["all"] })}>
              + Add charge
            </AddBtn>
            <p className="text-2xs text-slate-400">
              CGST and SGST are separate tax objects &mdash; there is no tax-type field. No
              inclusive/exclusive flag, no effective dates, and charge conditions are unsupported
              (§10, §11).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
