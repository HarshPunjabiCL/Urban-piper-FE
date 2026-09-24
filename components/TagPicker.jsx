"use client";

import { useState } from "react";
import { label } from "../lib/ui";

/**
 * Structured item tags, modelled on eZee Optimus's Item Tags tab.
 *
 * The grouping below is OURS — UrbanPiper stores tags as a flat array of
 * strings per channel:
 *
 *   "tags": { "swiggy": ["spicy", "vegan"], "zomato": ["breakfast"] }
 *
 * So the headings are a way to find a tag, not something the API understands.
 * A tag ticked for Swiggy means nothing to Zomato unless ticked there too —
 * hence the channel selector rather than one global list.
 *
 * UNVERIFIED: the slug format. UrbanPiper's own sample uses bare lowercase
 * words ("breakfast", "pop"), so we follow that with underscores for
 * multi-word tags. Whether Swiggy and Zomato recognise these exact strings is
 * not documented — confirm against a real listing before relying on them.
 */
const TAG_GROUPS = [
  {
    name: "Spice level",
    tags: ["mild", "medium_spicy", "very_spicy"]
  },
  {
    name: "Dietary restrictions",
    tags: ["vegan", "dairy", "wheat_free", "gluten_free", "fodmap_friendly"]
  },
  {
    name: "Miscellaneous",
    tags: ["combo_item", "exclusive_offer", "meal", "restaurant_recommended", "spicy"]
  },
  {
    name: "Proteins — popular",
    tags: [
      "chicken", "fish", "mutton", "goat", "lamb", "pork", "egg", "turkey",
      "beef", "bull", "crab", "prawn", "shrimp", "shellfish", "squid", "lobster"
    ]
  },
  {
    name: "Proteins — unique",
    tags: [
      "duck", "camel", "deer", "frog", "goose", "octopus",
      "pigeon", "quail", "rabbit", "shark", "veal", "venison"
    ]
  },
  {
    name: "Beverages",
    tags: [
      "coke", "diet_pepsi", "fanta", "kinley_soda", "limca", "lipton",
      "maaza", "minute_maid", "pepsi", "sprite", "thums_up"
    ]
  }
];

const pretty = (slug) => slug.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export default function TagPicker({ value = {}, onChange, channels = [] }) {
  // Default to whatever channel already has tags, else the first configured one.
  const known = channels.length ? channels : ["swiggy", "zomato"];
  const [channel, setChannel] = useState(Object.keys(value)[0] ?? known[0]);
  const [open, setOpen] = useState(false);

  const selected = value[channel] ?? [];

  function toggle(tag) {
    const next = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag];
    const tags = { ...value, [channel]: next };
    if (next.length === 0) delete tags[channel];
    onChange(Object.keys(tags).length ? tags : undefined);
  }

  const totalSelected = Object.values(value).reduce((n, list) => n + (list?.length ?? 0), 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className={label}>Item tags</span>
          {totalSelected > 0 && (
            <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-2xs font-semibold text-brand-700">
              {totalSelected} across {Object.keys(value).length} channel
              {Object.keys(value).length === 1 ? "" : "s"}
            </span>
          )}
        </span>
        <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
          {open ? "hide" : "choose"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-200 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
              Tagging for
            </span>
            {known.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={
                  "rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors " +
                  (channel === c
                    ? "bg-brand-600 text-white"
                    : "border border-slate-300 bg-white text-slate-600 hover:border-brand-400")
                }
              >
                {c}
                {value[c]?.length ? ` (${value[c].length})` : ""}
              </button>
            ))}
          </div>

          <p className="mt-2 text-2xs text-slate-400">
            Tags are per channel &mdash; ticking &ldquo;spicy&rdquo; for Swiggy does not tag it on
            Zomato. Switch channel above and tick again.
          </p>

          <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
            {TAG_GROUPS.map((group) => (
              <div key={group.name}>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
                  {group.name}
                </p>
                <div className="mt-1 grid gap-x-3 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
                  {group.tags.map((tag) => (
                    <label key={tag} className="flex items-center gap-1.5 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={selected.includes(tag)}
                        onChange={() => toggle(tag)}
                        className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-brand-600"
                      />
                      <span className="truncate">{pretty(tag)}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selected.length > 0 && (
            <p className="mt-3 rounded bg-slate-50 px-2 py-1.5 font-mono text-2xs text-slate-600">
              {channel}: [{selected.map((t) => `"${t}"`).join(", ")}]
            </p>
          )}
        </div>
      )}
    </div>
  );
}
