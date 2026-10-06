"use client";

import { useState } from "react";
import { inputCls, label, smallBtn } from "../lib/ui";
import TagPicker from "./TagPicker";
import ItemExtras from "./ItemExtras";

/**
 * Catalogue editor covering §6 to §11.
 *
 * The one thing worth understanding here: there is no Variant entity in
 * UrbanPiper. A variant is an option group plus options, exactly like a
 * modifier. On screen: "Modifier group" = option group (the question),
 * "Variant / modifier" = option (the answer, with the price). Matches the POS
 * spec, where a Variant is Small/Large with a price (section 8) and a Modifier
 * Group holds Modifiers (section 9). The block below is a POS-side convenience that the backend
 * translates (buildVariantAsOptions) — which is why variant tax, MRP, default
 * selection and ordering appear in the drop report rather than in the payload.
 */
// Charge codes are a closed enum and the suffix IS the charge type.
// Verified against staging: PC_F/PC_P/DC_F/DC_P accepted, SC_* rejected.
const CHARGE_CODES = [
  { value: "PC_F", label: "Packaging — fixed ₹", unit: "₹" },
  { value: "PC_P", label: "Packaging — percentage %", unit: "%" },
  { value: "DC_F", label: "Delivery — fixed ₹", unit: "₹" },
  { value: "DC_P", label: "Delivery — percentage %", unit: "%" }
];

// UrbanPiper has no allergen field; these ride in the description alongside
// the nutrition line when "Add nutrition to descriptions" is on.
const ALLERGENS = [
  "gluten", "crustacean", "egg", "fish", "peanut", "soybeans", "milk",
  "nuts", "celery", "mustard", "sesame", "sulphites", "lupin", "molluscs"
];

// The kind of question a variant asks. UrbanPiper has no "type" field — it
// keeps min/max on the group — so the type is derived from, and writes, those
// two numbers. Picking one sets min/max; editing min/max by hand shows Custom.
const GROUP_TYPES = [
  { value: "variant", label: "Pick exactly one (sizes, crusts)", min: 1, max: 1 },
  { value: "addon", label: "Pick any, optional (toppings, extras)", min: 0, max: -1 },
  { value: "required_multi", label: "Pick at least one (sauces)", min: 1, max: -1 },
  { value: "custom", label: "Custom min / max", min: null, max: null }
];
const groupTypeOf = (g) =>
  GROUP_TYPES.find((t) => t.min === Number(g.min_selectable) && t.max === Number(g.max_selectable))?.value ?? "custom";

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

// `caption` renders a visible label above the input. Placeholders vanish once a
// value is entered, so a pre-filled "0" price would otherwise be unlabelled.
// `hint` is the one-line field documentation shown under the input: what to
// type, and an example. Kept in the component rather than a tooltip so a new
// person sees it without hunting.
const Small = ({ caption, hint, ...props }) =>
  caption || hint ? (
    <label className="block">
      {caption && <span className={label + " mb-1"}>{caption}</span>}
      <SmallInput {...props} />
      {hint && <span className="mt-0.5 block text-2xs leading-snug text-slate-400">{hint}</span>}
    </label>
  ) : (
    <SmallInput {...props} />
  );

// A labelled <select> with the same caption + hint treatment as Small.
const SmallSelect = ({ caption, hint, children, ...props }) => (
  <label className="block">
    {caption && <span className={label + " mb-1"}>{caption}</span>}
    <select
      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs shadow-control"
      {...props}
    >
      {children}
    </select>
    {hint && <span className="mt-0.5 block text-2xs leading-snug text-slate-400">{hint}</span>}
  </label>
);

// Per-tab "how to fill this in" panel with a worked example. Open by default:
// the audience is whoever opens this screen for the first time.
const Guide = ({ title, children }) => (
  <details open className="rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2">
    <summary className="cursor-pointer select-none text-2xs font-semibold uppercase tracking-wider text-brand-800">
      {title}
    </summary>
    <div className="mt-2 space-y-1.5 text-2xs leading-relaxed text-slate-600">{children}</div>
  </details>
);

const Example = ({ children }) => (
  <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-slate-700 ring-1 ring-slate-200">
    {children}
  </code>
);

const SmallInput = ({ placeholder, value, onChange, type = "text", ...rest }) => (
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
            <Guide title="How categories work">
              <p>
                A category is a heading on the Swiggy / Zomato menu. The <strong>Category ID</strong>{" "}
                here and the <strong>Category ID(s)</strong> box on each item must be the same text.
                That match is what puts the item under the heading. The name is only what customers
                read.
              </p>
              <p>
                Example: Category ID <Example>ITALLIAN</Example>, name <Example>Italian</Example>.
                Then item <Example>PIZZA-123</Example> with Category ID <Example>ITALLIAN</Example>{" "}
                appears under the &ldquo;Italian&rdquo; heading.
              </p>
            </Guide>
            {list("categories").map((c, i) => (
              <Row key={i} onRemove={() => remove("categories", i)}>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Small
                    caption="Category ID *"
                    hint="The code items point at. Each item's Category ID(s) box must contain exactly this, same spelling and case. Not shown to customers. Example: ITALLIAN"
                    placeholder="e.g. ITALLIAN"
                    value={c.ref_id}
                    onChange={(e) => update("categories", i, { ref_id: e.target.value })}
                  />
                  <Small
                    caption="Category name *"
                    hint="Heading customers see on the app. Example: Italian"
                    placeholder="e.g. Italian"
                    value={c.name}
                    onChange={(e) => update("categories", i, { name: e.target.value })}
                  />
                  <Small
                    caption="Display order"
                    hint="Position on the menu. Lower shows first. Example: 1"
                    placeholder="1"
                    type="number"
                    value={c.sort_order}
                    onChange={(e) => update("categories", i, { sort_order: Number(e.target.value) })}
                  />
                  <Small
                    caption="Parent category ID"
                    hint="Only for a sub-category: the Category ID it sits under. Leave blank for a top-level heading."
                    placeholder="blank = top level"
                    value={c.parent_ref_id}
                    onChange={(e) => update("categories", i, { parent_ref_id: e.target.value || undefined })}
                  />
                </div>
                <div className="mt-2">
                  <Small
                    caption="Description"
                    hint="Optional line shown under the heading."
                    placeholder="optional"
                    value={c.description}
                    onChange={(e) => update("categories", i, { description: e.target.value })}
                  />
                </div>
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
            <Guide title="How items work">
              <p>
                One row is one dish. The <strong>Item ID</strong> is the key everything else hangs
                off: the Categories tab places it under a heading, the Modifiers tab attaches
                questions (size, toppings) to it, and orders from Swiggy / Zomato arrive carrying
                this ID, so it must be the same code your POS uses.
              </p>
              <p>
                Example: Item ID <Example>PIZZA-123</Example>, name <Example>Onion Pizza</Example>,
                price <Example>340</Example>, Category ID <Example>ITALLIAN</Example>.
              </p>
            </Guide>
            {list("items").map((it, i) => (
              <Row key={i} onRemove={() => remove("items", i)}>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Small
                    caption="Item ID / SKU *"
                    hint="The POS code for this dish. Orders arrive carrying it, and variants point at it in Applies to items. Example: PIZZA-123"
                    placeholder="e.g. PIZZA-123"
                    value={it.ref_id}
                    onChange={(e) => update("items", i, { ref_id: e.target.value })}
                  />
                  <Small
                    caption="Item name *"
                    hint="Name customers see. Example: Onion Pizza"
                    placeholder="e.g. Onion Pizza"
                    value={it.title}
                    onChange={(e) => update("items", i, { title: e.target.value })}
                  />
                  <Small
                    caption="Price (Rs) *"
                    hint="Base price before any variant or modifier (size, topping) is added. Example: 340"
                    placeholder="e.g. 340"
                    type="number"
                    value={it.price}
                    onChange={(e) => update("items", i, { price: Number(e.target.value) })}
                  />
                  <Small
                    caption="Category ID(s) *"
                    hint="Must exactly match a Category ID on the Categories tab. Comma-separate to list under several headings. Example: ITALLIAN"
                    placeholder="e.g. ITALLIAN"
                    value={(it.category_ref_ids ?? []).join(",")}
                    onChange={(e) => update("items", i, { category_ref_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  />
                  <SmallSelect
                    caption="Veg / non-veg *"
                    hint="Dietary mark shown next to the item on the app."
                    value={it.food_type ?? "1"}
                    onChange={(e) => update("items", i, { food_type: e.target.value })}
                  >
                    {FOOD_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </SmallSelect>
                  <Small
                    caption="Aggregator price (Rs)"
                    hint="Price on Swiggy / Zomato when it differs from the base price. Leave blank to use Price."
                    placeholder="blank = same as price"
                    type="number"
                    value={it.external_price}
                    onChange={(e) => update("items", i, { external_price: Number(e.target.value) })}
                  />
                </div>
                <div className="mt-2">
                  <Small
                    caption="Description"
                    hint="Customer-facing text shown under the item name."
                    placeholder="optional"
                    value={it.description}
                    onChange={(e) => update("items", i, { description: e.target.value })}
                  />
                </div>
                <div className="mt-3">
                  <TagPicker
                    value={it.tags}
                    onChange={(tags) => update("items", i, { tags })}
                    channels={platforms}
                  />
                </div>

                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2.5">
                  <p className={label}>Nutritional info</p>
                  <p className="mt-0.5 text-2xs text-slate-400">
                    Sent as <code className="font-mono">key_value_groups</code> on the item and
                    shown on the Atlas &ldquo;Nutritional Info&rdquo; tab. Key names for calories,
                    fat, saturated fat, trans fat, cholesterol, carbohydrates, protein, fibre,
                    sodium and caffeine were confirmed by UrbanPiper on 5 Oct 2026. Sugar, added
                    sugar and salt are still unconfirmed. Units are sent exactly as typed.
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    {[
                      ["calories", "Calories", "kcal"],
                      ["calories_max", "Calories max", "kcal"],
                      ["fat", "Total fat", "g"],
                      ["saturated_fat", "Saturated fat", "g"],
                      ["trans_fat", "Trans fat", "g"],
                      ["cholesterol", "Cholesterol", "g"],
                      ["carbohydrates", "Carbohydrates", "g"],
                      ["sugar", "Carbs sugar", "g"],
                      ["added_sugar", "Added sugar", "g"],
                      ["protein", "Protein", "g"],
                      ["fibre", "Fibre", "g"],
                      ["salt", "Salt", "g"],
                      ["sodium", "Sodium", "g"],
                      ["caffeine", "Caffeine", "g"]
                    ].map(([key, cap, unit]) => (
                      <Small
                        key={key}
                        caption={`${cap} (${unit})`}
                        placeholder="—"
                        type="number"
                        step="any"
                        min="0"
                        value={it[key]}
                        onChange={(e) =>
                          update("items", i, {
                            [key]: e.target.value === "" ? undefined : Number(e.target.value)
                          })
                        }
                      />
                    ))}
                  </div>
                </div>

                <ItemExtras
                  item={it}
                  platforms={platforms}
                  onChange={(patch) => update("items", i, patch)}
                />

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
              Nutrition goes to the Atlas Nutritional Info tab. Tick &ldquo;Add nutrition to
              descriptions&rdquo; below to also write it into each item&rsquo;s customer-facing
              description.
            </p>
            <p className="text-2xs text-slate-400">
              No item timing, MRP or effective dates &mdash; UrbanPiper has no field for them (§7).
              Enter them in the POS; they appear in the drop report.
            </p>
          </>
        )}

        {tab === "modifiers" && (
          <>
            <Guide title="How modifiers work">
              <p>
                A <strong>modifier group</strong> is a question the customer is asked (&ldquo;Choose
                your size&rdquo;, &ldquo;Add toppings&rdquo;). It carries no price. A{" "}
                <strong>variant / modifier</strong> is one answer (&ldquo;Large&rdquo;, &ldquo;Extra
                cheese&rdquo;) and carries its own price, added to the item price. A size is a
                variant; a topping is a modifier; UrbanPiper stores both the same way. A free add-on
                is priced 0.
              </p>
              <p>Three IDs link everything together:</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-white p-2 ring-1 ring-slate-200">
                  <p className="font-semibold text-slate-800">1. Item (Items tab)</p>
                  <p>Item ID <Example>PIZZA-123</Example></p>
                </div>
                <div className="rounded-md bg-white p-2 ring-1 ring-slate-200">
                  <p className="font-semibold text-slate-800">2. Modifier group</p>
                  <p>Group ID <Example>PIZZA-SIZE</Example></p>
                  <p>Applies to items <Example>PIZZA-123</Example></p>
                </div>
                <div className="rounded-md bg-white p-2 ring-1 ring-slate-200">
                  <p className="font-semibold text-slate-800">3. Variants / modifiers</p>
                  <p><Example>PIZZA-REG</Example> Regular, +0, belongs to <Example>PIZZA-SIZE</Example></p>
                  <p><Example>PIZZA-LARGE</Example> Large, +150, belongs to <Example>PIZZA-SIZE</Example></p>
                </div>
              </div>
              <p>
                Result on the app: Onion Pizza at 340, customer must pick a size, Large makes it 490.
              </p>
            </Guide>

            <p className="pt-1 text-2xs font-semibold uppercase tracking-wider text-slate-500">
              Modifier groups — the question (e.g. Choose your size, Add toppings), no price
            </p>
            {list("option_groups").map((g, i) => (
              <Row key={i} onRemove={() => remove("option_groups", i)}>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr]">
                  <Small
                    caption="Group ID *"
                    hint="The code variants point at. Each variant's Belongs to group(s) box must contain exactly this. Not shown to customers. Example: PIZZA-SIZE"
                    placeholder="e.g. PIZZA-SIZE"
                    value={g.ref_id}
                    onChange={(e) => update("option_groups", i, { ref_id: e.target.value })}
                  />
                  <Small
                    caption="Group name *"
                    hint="The question customers see. Example: Choose your size"
                    placeholder="e.g. Choose your size"
                    value={g.title}
                    onChange={(e) => update("option_groups", i, { title: e.target.value })}
                  />
                  <label className="block">
                    <span className={label + " mb-1"}>Type *</span>
                    <select
                      value={groupTypeOf(g)}
                      onChange={(e) => {
                        const t = GROUP_TYPES.find((x) => x.value === e.target.value);
                        if (t && t.min !== null) update("option_groups", i, { min_selectable: t.min, max_selectable: t.max });
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs shadow-control"
                    >
                      {GROUP_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <span className="mt-0.5 block text-2xs leading-snug text-slate-400">
                      How many answers the customer may pick. Fills Min / Max for you.
                    </span>
                  </label>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[100px_100px_1fr]">
                  <Small
                    caption="Min picks"
                    hint="Fewest answers a customer must pick. 0 = optional."
                    placeholder="0"
                    type="number"
                    min="0"
                    value={g.min_selectable}
                    onChange={(e) => update("option_groups", i, { min_selectable: Number(e.target.value) })}
                  />
                  <Small
                    caption="Max picks"
                    hint="Most answers a customer may pick. -1 = no limit."
                    placeholder="-1 = any"
                    type="number"
                    min="-1"
                    value={g.max_selectable}
                    onChange={(e) => update("option_groups", i, { max_selectable: Number(e.target.value) })}
                  />
                  <Small
                    caption="Applies to items *"
                    hint="Must exactly match Item ID(s) on the Items tab. Those items will ask this question. Comma-separate for several. Example: PIZZA-123"
                    placeholder="e.g. PIZZA-123"
                    value={(g.item_ref_ids ?? []).join(",")}
                    onChange={(e) => update("option_groups", i, { item_ref_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  />
                </div>
                <div className="mt-2 grid items-end gap-2 sm:grid-cols-[140px_1fr]">
                  <Small
                    caption="Display order"
                    hint="Order of questions on the item. Lower first. Example: 1"
                    placeholder="e.g. 1"
                    type="number"
                    min="0"
                    value={g.sort_order}
                    onChange={(e) => update("option_groups", i, { sort_order: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                  <div className="flex flex-wrap items-center gap-4 pb-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={g.active !== false}
                        onChange={(e) => update("option_groups", i, { active: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                      />
                      Active
                      <span className="text-2xs text-slate-400">(untick to hide the whole question)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(g.multi_options_enabled)}
                        onChange={(e) => update("option_groups", i, { multi_options_enabled: e.target.checked || undefined })}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                      />
                      Same variant can be picked more than once
                      <span className="text-2xs text-slate-400">(e.g. 2 x extra cheese)</span>
                    </label>
                  </div>
                </div>
              </Row>
            ))}
            <AddBtn onClick={() => add("option_groups", { ref_id: "", title: "", min_selectable: 0, max_selectable: 1, active: true, item_ref_ids: [] })}>
              + Add modifier group
            </AddBtn>

            <p className="pt-3 text-2xs font-semibold uppercase tracking-wider text-slate-500">
              Variants / modifiers — the answers (e.g. Small, Large, Extra cheese), each with its own price
            </p>
            {list("options").map((o, i) => (
              <Row key={i} onRemove={() => remove("options", i)}>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Small
                    caption="Variant ID *"
                    hint="Any unique code for this answer. Nothing else refers to it. Not shown to customers. Example: PIZZA-LARGE"
                    placeholder="e.g. PIZZA-LARGE"
                    value={o.ref_id}
                    onChange={(e) => update("options", i, { ref_id: e.target.value })}
                  />
                  <Small
                    caption="Variant name *"
                    hint="The answer customers see. Example: Large"
                    placeholder="e.g. Large"
                    value={o.title}
                    onChange={(e) => update("options", i, { title: e.target.value })}
                  />
                  <Small
                    caption="Price (Rs, added to item)"
                    hint="Extra amount on top of the item price. 0 = free. Example: 150"
                    placeholder="0 = free"
                    type="number"
                    step="any"
                    min="0"
                    value={o.price}
                    onChange={(e) => update("options", i, { price: Number(e.target.value) })}
                  />
                  <Small
                    caption="Belongs to group(s) *"
                    hint="Must exactly match a Group ID above. Comma-separate to offer the same answer under several questions. Example: PIZZA-SIZE"
                    placeholder="e.g. PIZZA-SIZE"
                    value={(o.opt_grp_ref_ids ?? []).join(",")}
                    onChange={(e) => update("options", i, { opt_grp_ref_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  />
                </div>
                <div className="mt-2 grid items-end gap-2 sm:grid-cols-[1fr_120px_auto_auto_auto]">
                  <Small
                    caption="Description"
                    hint="Optional text under the variant."
                    placeholder="optional"
                    value={o.description}
                    onChange={(e) => update("options", i, { description: e.target.value })}
                  />
                  <Small
                    caption="Display order"
                    hint="Order within the question. Lower first."
                    placeholder="e.g. 1"
                    type="number"
                    min="0"
                    value={o.sort_order}
                    onChange={(e) => update("options", i, { sort_order: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                  <label className="block">
                    <span className={label + " mb-1"}>Type (veg / non-veg)</span>
                    <select
                      value={o.food_type ?? "1"}
                      onChange={(e) => update("options", i, { food_type: e.target.value })}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs shadow-control"
                    >
                      {FOOD_TYPES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex h-[30px] items-center gap-1.5 whitespace-nowrap text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={o.available !== false}
                      onChange={(e) => update("options", i, { available: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                    />
                    Available
                  </label>
                  <label className="flex h-[30px] items-center gap-1.5 whitespace-nowrap text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(o.recommended)}
                      onChange={(e) => update("options", i, { recommended: e.target.checked || undefined })}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                    />
                    Recommended
                  </label>
                </div>
              </Row>
            ))}
            <AddBtn onClick={() => add("options", { ref_id: "", title: "", price: 0, available: true, opt_grp_ref_ids: [] })}>
              + Add variant / modifier
            </AddBtn>
            <p className="text-2xs text-slate-400">
              Price is set per option, not per group &mdash; UrbanPiper has no group-level
              price. Each option&apos;s price is sent as <code className="font-mono">options[].price</code>.
              A size variant (§8) is a group with min=1, max=1. From the POS spec, these have no
              UrbanPiper field and stay POS-side: variant / modifier <strong>tax</strong>,{" "}
              <strong>MRP</strong>, <strong>default selection</strong>, and{" "}
              <strong>timing</strong> below category level.
            </p>
          </>
        )}

        {tab === "taxes" && (
          <>
            <Guide title="How taxes and charges work">
              <p>
                A <strong>tax</strong> is a percentage on the item price. CGST and SGST are two
                separate rows. The code and the name are both checked by UrbanPiper: code must be
                one of <Example>CGST_P</Example> <Example>SGST_P</Example> <Example>IGST_P</Example>{" "}
                <Example>VAT_P</Example>, and the name must contain the word GST, CGST, SGST, VAT,
                Municipality or Kerala.
              </p>
              <p>
                A <strong>charge</strong> is a packaging or delivery fee, either a fixed rupee
                amount or a percentage. Service charges do not exist in UrbanPiper.
              </p>
              <p>
                Example: tax <Example>CGST_P</Example> named <Example>CGST</Example> at{" "}
                <Example>2.5</Example> on <Example>all</Example>, plus the same for SGST. Charge{" "}
                <Example>Packaging, fixed</Example> named <Example>Packaging</Example> at{" "}
                <Example>20</Example>.
              </p>
            </Guide>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Taxes</p>
            {list("taxes").map((t, i) => (
              <Row key={i} onRemove={() => remove("taxes", i)}>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Small
                    caption="Tax code *"
                    hint="One of CGST_P, SGST_P, IGST_P, VAT_P. Anything else is rejected. Example: CGST_P"
                    placeholder="e.g. CGST_P"
                    value={t.code}
                    onChange={(e) => update("taxes", i, { code: e.target.value })}
                  />
                  <Small
                    caption="Tax name *"
                    hint="Must contain GST, CGST, SGST, VAT, Municipality or Kerala as a word. Example: CGST"
                    placeholder="e.g. CGST"
                    value={t.title}
                    onChange={(e) => update("taxes", i, { title: e.target.value })}
                  />
                  <Small
                    caption="Rate %"
                    hint="Percentage of the item price. Example: 2.5"
                    placeholder="e.g. 2.5"
                    type="number"
                    step="any"
                    value={t.structure?.value}
                    onChange={(e) => update("taxes", i, { structure: { value: Number(e.target.value) } })}
                  />
                  <Small
                    caption="Applies to items *"
                    hint="Type all for every item, or Item IDs that exactly match the Items tab, comma-separated. Example: all"
                    placeholder="all"
                    value={(t.item_ref_ids ?? []).join(",")}
                    onChange={(e) => update("taxes", i, { item_ref_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  />
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
                  <label className="block">
                    <span className={label + " mb-1"}>Charge type *</span>
                    <select
                      value={c.code ?? ""}
                      onChange={(e) => update("charges", i, { code: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs shadow-control"
                    >
                      <option value="">Select…</option>
                      {CHARGE_CODES.map((cc) => (
                        <option key={cc.value} value={cc.value}>{cc.label}</option>
                      ))}
                    </select>
                    <span className="mt-0.5 block text-2xs leading-snug text-slate-400">
                      Packaging or delivery, as a fixed amount or a % of the order.
                    </span>
                  </label>
                  <Small
                    caption="Charge name *"
                    hint="Name shown on the bill. Example: Packaging"
                    placeholder="e.g. Packaging"
                    value={c.title}
                    onChange={(e) => update("charges", i, { title: e.target.value })}
                  />
                  <Small
                    caption={
                      CHARGE_CODES.find((cc) => cc.value === c.code)?.unit === "%"
                        ? "Percentage %"
                        : "Amount ₹"
                    }
                    hint="Rupees for a fixed charge, percent for a percentage charge. Example: 20"
                    placeholder="e.g. 20"
                    type="number"
                    step="any"
                    min="0"
                    value={c.structure?.value}
                    onChange={(e) => update("charges", i, { structure: { ...c.structure, value: Number(e.target.value) } })}
                  />
                  <Small
                    caption="Applicable on"
                    hint="Leave blank to charge once per order. Type item.quantity to charge per unit ordered."
                    placeholder="blank = once per order"
                    value={c.structure?.applicable_on}
                    onChange={(e) => update("charges", i, { structure: { ...c.structure, applicable_on: e.target.value || undefined } })}
                  />
                </div>
              </Row>
            ))}
            <AddBtn onClick={() => add("charges", { code: "DC_F", title: "", active: true, structure: { value: 0 }, item_ref_ids: ["all"] })}>
              + Add charge
            </AddBtn>
            <p className="text-2xs text-slate-400">
              Charge codes are a closed enum &mdash; only packaging and delivery exist, each as
              fixed (<code className="font-mono">_F</code>) or percentage
              (<code className="font-mono">_P</code>). Service charges are rejected by
              UrbanPiper. The same <code className="font-mono">value</code> field means rupees
              under _F and percent under _P.
            </p>
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
