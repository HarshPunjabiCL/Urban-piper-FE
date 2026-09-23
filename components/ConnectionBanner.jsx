"use client";

import { useEffect, useState } from "react";
import { getHealth } from "../lib/api";

/**
 * The one thing every screen needs to say up front: are we actually talking to
 * UrbanPiper, or looking at sample data? Without this, a working-looking screen
 * full of example orders is genuinely misleading.
 */
export default function ConnectionBanner() {
  const [health, setHealth] = useState(null);
  const [down, setDown] = useState(false);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setDown(true));
  }, []);

  if (down) {
    return (
      <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
        <h2 className="text-sm font-bold text-rose-900">The app can&rsquo;t reach its own server</h2>
        <p className="mt-1 text-sm text-rose-800">
          Start it with <span className="font-mono text-xs">cd backend</span> then{" "}
          <span className="font-mono text-xs">npm start</span>, and reload this page.
        </p>
      </div>
    );
  }

  if (!health) return null;

  if (health.credentialsPresent) {
    return (
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-900">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Connected to UrbanPiper
        </span>
        <span className="font-mono text-xs text-emerald-700">{health.upBaseUrl}</span>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        Not connected to UrbanPiper &mdash; you&rsquo;re looking at sample data
      </h2>
      <p className="mt-1.5 max-w-3xl text-sm text-amber-900">
        No API key has been added yet, so nothing on these screens has touched UrbanPiper. Orders
        marked <strong>Sample</strong> were generated on this machine to show how the screens work.
        Accept and Reject will fail with a clear message until a key is added.
      </p>
      <p className="mt-2 max-w-3xl text-xs text-amber-800">
        Add your key to <span className="font-mono">.env</span>, then restart the server. To find
        which key works, run <span className="font-mono">node tools/check-credentials.mjs</span>.
      </p>
    </div>
  );
}
