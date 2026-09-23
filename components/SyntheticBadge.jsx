"use client";

/**
 * Marks an order generated locally by tools/replay-order.mjs rather than sent by
 * UrbanPiper. Its shape is our best guess at the real payload, so nothing about
 * a sample order proves the integration works — this badge exists so that can
 * never be forgotten in a demo.
 */
export default function SyntheticBadge() {
  return (
    <span
      title="Created on this machine to demonstrate the screen. Not a real UrbanPiper order — its data shape is assumed, not verified."
      className="inline-flex items-center gap-1 rounded border border-dashed border-amber-400 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700"
    >
      Sample
    </span>
  );
}
