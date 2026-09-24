"use client";

import { inputCls, label, smallBtn } from "../lib/ui";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/**
 * Category timing groups — §13.
 *
 * This is the ONLY schedule below the outlet. There is no menu schedule (no
 * Menu entity exists), and no item, variant or modifier timing. A "breakfast
 * menu" in UrbanPiper is a category with a morning timing group.
 *
 * Format trap: this endpoint wants HH:MM. The STORE endpoint wants HH:MM:SS and
 * rejects HH:MM outright. The two genuinely disagree, so times here are sent
 * exactly as the picker produces them — do not reuse the store normaliser.
 */
export default function CategoryTimings({ value = [], onChange }) {
  const set = (i, patch) => onChange(value.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  const remove = (i) => onChange(value.filter((_, j) => j !== i));

  const add = () =>
    onChange([
      ...value,
      {
        title: "",
        category_ref_ids: [],
        day_slots: [{ day: "monday", slots: [{ start_time: "08:00", end_time: "11:00" }] }]
      }
    ]);

  /**
   * eZee Optimus offers three availability modes and they are genuinely
   * clearer than ticking seven boxes. UrbanPiper has no mode concept — all
   * three produce the same day_slots array — so this is purely how the group
   * is authored, not what gets sent.
   */
  const ALL_DAY = { start_time: "00:00", end_time: "23:59" };

  const sameEveryDay = (group) => {
    const ds = group.day_slots ?? [];
    if (ds.length !== DAYS.length) return false;
    const first = ds[0]?.slots?.[0];
    return ds.every(
      (d) => d.slots?.[0]?.start_time === first?.start_time && d.slots?.[0]?.end_time === first?.end_time
    );
  };

  const modeOf = (group) => {
    const ds = group.day_slots ?? [];
    if (!sameEveryDay(group)) return "custom";
    const first = ds[0]?.slots?.[0];
    return first?.start_time === ALL_DAY.start_time && first?.end_time === ALL_DAY.end_time
      ? "all"
      : "same";
  };

  function setMode(i, mode) {
    const group = value[i];
    const current = group.day_slots?.[0]?.slots?.[0] ?? { start_time: "08:00", end_time: "11:00" };
    if (mode === "all") {
      set(i, { day_slots: DAYS.map((day) => ({ day, slots: [{ ...ALL_DAY }] })) });
    } else if (mode === "same") {
      const slot = modeOf(group) === "all" ? { start_time: "08:00", end_time: "11:00" } : current;
      set(i, { day_slots: DAYS.map((day) => ({ day, slots: [{ ...slot }] })) });
    } else {
      set(i, { day_slots: [{ day: "monday", slots: [{ ...current }] }] });
    }
  }

  /** Same-every-day mode edits one slot and mirrors it across all seven days. */
  function setSharedSlot(i, key, v) {
    set(i, {
      day_slots: DAYS.map((day) => {
        const existing = value[i].day_slots?.find((d) => d.day === day)?.slots?.[0] ?? {};
        return { day, slots: [{ ...existing, [key]: v }] };
      })
    });
  }

  function toggleDay(i, day) {
    const group = value[i];
    const has = group.day_slots?.some((d) => d.day === day);
    set(i, {
      day_slots: has
        ? group.day_slots.filter((d) => d.day !== day)
        : [...(group.day_slots ?? []), { day, slots: [{ start_time: "08:00", end_time: "11:00" }] }]
    });
  }

  function setSlot(i, day, key, v) {
    set(i, {
      day_slots: value[i].day_slots.map((d) =>
        d.day === day ? { ...d, slots: [{ ...d.slots[0], [key]: v }] } : d
      )
    });
  }

  return (
    <div>
      <p className={label}>Category timings (§13)</p>
      <p className="mt-1 max-w-2xl text-2xs text-slate-500">
        Breakfast, lunch and dinner windows. Attached to categories &mdash; UrbanPiper has no menu
        schedule and no item-level timing, so this is the only level available below the outlet&rsquo;s
        own opening hours.
      </p>

      <div className="mt-3 space-y-3">
        {value.map((group, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="flex items-start gap-2">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <input
                  placeholder="Group name e.g. Breakfast"
                  value={group.title ?? ""}
                  onChange={(e) => set(i, { title: e.target.value })}
                  className={inputCls}
                />
                <input
                  placeholder="category_ref_ids e.g. CAT-1, CAT-2"
                  value={(group.category_ref_ids ?? []).join(", ")}
                  onChange={(e) =>
                    set(i, {
                      category_ref_ids: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    })
                  }
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove group"
                className="shrink-0 rounded px-1.5 py-0.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                &times;
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-4">
              {[
                ["all", "Available all day, every day"],
                ["same", "Same time every day"],
                ["custom", "Different times per day"]
              ].map(([m, text]) => (
                <label key={m} className="flex items-center gap-1.5 text-xs text-slate-700">
                  <input
                    type="radio"
                    name={`mode-${i}`}
                    checked={modeOf(group) === m}
                    onChange={() => setMode(i, m)}
                    className="h-3.5 w-3.5 border-slate-300 text-brand-600"
                  />
                  {text}
                </label>
              ))}
            </div>

            {modeOf(group) === "same" && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">All seven days</span>
                <input
                  type="time"
                  value={group.day_slots?.[0]?.slots?.[0]?.start_time ?? ""}
                  onChange={(e) => setSharedSlot(i, "start_time", e.target.value)}
                  className="tnum rounded-lg border border-slate-300 px-2 py-1 text-xs shadow-control"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="time"
                  value={group.day_slots?.[0]?.slots?.[0]?.end_time ?? ""}
                  onChange={(e) => setSharedSlot(i, "end_time", e.target.value)}
                  className="tnum rounded-lg border border-slate-300 px-2 py-1 text-xs shadow-control"
                />
              </div>
            )}

            <div className={"mt-3 space-y-1.5 " + (modeOf(group) === "custom" ? "" : "hidden")}>
              {DAYS.map((day) => {
                const entry = group.day_slots?.find((d) => d.day === day);
                return (
                  <div key={day} className="flex flex-wrap items-center gap-3">
                    <label className="flex w-32 items-center gap-2 text-xs capitalize text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(entry)}
                        onChange={() => toggleDay(i, day)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                      />
                      {day}
                    </label>
                    {entry && (
                      <>
                        <input
                          type="time"
                          value={entry.slots[0]?.start_time ?? ""}
                          onChange={(e) => setSlot(i, day, "start_time", e.target.value)}
                          className="tnum rounded-lg border border-slate-300 px-2 py-1 text-xs shadow-control"
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <input
                          type="time"
                          value={entry.slots[0]?.end_time ?? ""}
                          onChange={(e) => setSlot(i, day, "end_time", e.target.value)}
                          className="tnum rounded-lg border border-slate-300 px-2 py-1 text-xs shadow-control"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700"
        >
          + Add timing group
        </button>
      </div>
    </div>
  );
}
