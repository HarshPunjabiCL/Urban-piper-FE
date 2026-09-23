"use client";

/**
 * Shows where an order sits in its life, so "what happens next" is visible
 * without knowing UrbanPiper's status names.
 */
const STEPS = [
  { key: "PLACED", label: "Ordered" },
  { key: "Acknowledged", label: "Accepted" },
  { key: "Food Ready", label: "Food ready" },
  { key: "Dispatched", label: "With rider" },
  { key: "Completed", label: "Delivered" }
];

export default function LifecycleTrack({ status }) {
  if (status === "Cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Rejected — this order has ended
      </div>
    );
  }

  const current = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {STEPS.map((step, i) => {
        const done = i < current;
        const here = i === current;

        return (
          <li key={step.key} className="flex items-center gap-1">
            <span
              className={
                "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold " +
                (here
                  ? "bg-brand-500 text-white"
                  : done
                    ? "bg-brand-50 text-brand-700"
                    : "bg-slate-100 text-slate-400")
              }
            >
              {done && (
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
                  <path
                    d="M2 6.5l2.5 2.5L10 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <span className={"h-px w-3 " + (done ? "bg-brand-300" : "bg-slate-200")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
