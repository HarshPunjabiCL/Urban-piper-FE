"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/setup", label: "Connect" },
  { href: "/orders", label: "Orders" },
  { href: "/inspector", label: "Activity" }
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-3.5">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="UrbanPiper POC — overview"
        >
          {/* Mark: a stylised relay, which is what the integration is. */}
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-control ring-1 ring-inset ring-white/20">
            <svg viewBox="0 0 16 16" className="h-4 w-4 text-white" aria-hidden="true">
              <path
                d="M3 5.5h6.5a2.5 2.5 0 0 1 0 5H5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <path
                d="M6.5 3 4 5.5 6.5 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold tracking-tightest text-slate-900">
              UrbanPiper
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
              POC
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-0.5" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                  (active
                    ? "text-brand-700"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900")
                }
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[15px] h-0.5 rounded-full bg-brand-600" />
                )}
              </Link>
            );
          })}
        </nav>

        <span className="ml-auto hidden items-center gap-1.5 text-2xs font-medium text-slate-400 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          Staging
        </span>
      </div>
    </header>
  );
}
