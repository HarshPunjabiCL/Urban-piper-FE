"use client";

import { useState } from "react";

/**
 * A numeric field you type into, not nudge.
 *
 * Browser number inputs come with spinner arrows and a habit of snapping an
 * emptied field back to 0 before you can type the real value. This is a plain
 * text input that only accepts digits (plus one dot, and a leading minus when
 * `min` allows negatives), keeps what you are typing on screen while you type
 * it, and hands the caller the same `{ target: { value } }` shape a real input
 * would, so existing `Number(e.target.value)` handlers keep working.
 *
 * `inputMode="decimal"` brings up the numeric keypad on phones.
 */
export default function NumberInput({ value, onChange, min, max, step, ...rest }) {
  // null = not being edited; show the committed value from props.
  const [draft, setDraft] = useState(null);

  const committed = value === undefined || value === null ? "" : String(value);
  const shown = draft ?? committed;

  const allowNegative = min === undefined || Number(min) < 0;
  const pattern = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;

  const emit = (v) => onChange?.({ target: { value: v } });

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={shown}
      onFocus={() => setDraft(committed)}
      onChange={(e) => {
        const v = e.target.value;
        if (!pattern.test(v)) return; // ignore letters and stray symbols
        setDraft(v);
        // "1." and "-" are half-typed; wait for the next keystroke before
        // telling the parent, otherwise Number() would turn them into 1 / NaN.
        const halfTyped = v === "-" || v.endsWith(".");
        if (!halfTyped) emit(v);
      }}
      onBlur={() => {
        if (draft !== null) {
          const v = draft === "-" ? "" : draft.replace(/\.$/, "");
          if (v !== shown) emit(v);
        }
        setDraft(null);
      }}
      {...rest}
    />
  );
}
