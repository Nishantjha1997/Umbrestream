"use client";

import { getRegionOverride, setRegionOverride } from "@/api/geo-browser";
import { useEffect, useState } from "react";

const OPTIONS = [
  ["US", "United States"],
  ["IN", "India"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["AU", "Australia"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["JP", "Japan"],
  ["KR", "South Korea"],
  ["BR", "Brazil"],
  ["MX", "Mexico"],
  ["SG", "Singapore"],
  ["AE", "United Arab Emirates"],
] as const;

export default function RegionPreference() {
  const [value, setValue] = useState("");
  useEffect(() => setValue(getRegionOverride() ?? ""), []);

  return (
    <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4">
      <label htmlFor="region-preference" className="text-sm font-semibold text-white">
        Home region
      </label>
      <p className="mt-1 text-sm leading-6 text-white/50">
        Automatic uses your connection region. Choose another region when travelling, then reset it anytime.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          id="region-preference"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            setRegionOverride(next || null);
          }}
          className="min-h-11 rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70"
        >
          <option value="">Automatic</option>
          {OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
        {value ? (
          <button
            type="button"
            onClick={() => { setValue(""); setRegionOverride(null); }}
            className="min-h-11 rounded-xl border border-white/12 px-4 text-sm font-semibold text-white/75 transition-colors hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
          >
            Reset to automatic
          </button>
        ) : null}
      </div>
    </div>
  );
}
