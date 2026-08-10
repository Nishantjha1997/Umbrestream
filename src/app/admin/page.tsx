import { getAdminAccess } from "@/lib/admin";
import { createClient } from "@/utils/supabase/server";
import { env } from "@/utils/env";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type EventRow = {
  event_name: string;
  occurred_at: string;
  session_id: string;
  route: string;
  provider_id: string | null;
  properties: Record<string, unknown> | null;
};

type ProviderStat = { provider: string; starts: number; failures: number; switches: number };

interface AnalyticsSnapshot {
  configured: boolean;
  events: number;
  pageViews: number;
  sessions: number;
  playbackStarts: number;
  playbackFailures: number;
  fallbacks: number;
  signups: number;
  averageStartupMs: number | null;
  topRoutes: Array<{ route: string; count: number }>;
  providers: ProviderStat[];
  recent: EventRow[];
}

function countBy(values: string[]): Array<{ route: string; count: number }> {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

async function loadAnalytics(): Promise<AnalyticsSnapshot> {
  const empty: AnalyticsSnapshot = {
    configured: false,
    events: 0,
    pageViews: 0,
    sessions: 0,
    playbackStarts: 0,
    playbackFailures: 0,
    fallbacks: 0,
    signups: 0,
    averageStartupMs: null,
    topRoutes: [],
    providers: [],
    recent: [],
  };

  if (!env.SUPABASE_SERVICE_ROLE_KEY) return empty;

  try {
    const supabase = await createClient(true);
    const { data, error } = await supabase
      .from("umbra_events")
      .select("event_name, occurred_at, session_id, route, provider_id, properties")
      .gte("occurred_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString())
      .order("occurred_at", { ascending: false })
      .limit(5000);

    if (error) {
      console.error("[admin] Analytics query failed:", error);
      return empty;
    }

    const rows = (data ?? []) as EventRow[];
    const starts = rows.filter((row) => row.event_name === "player_playback_started");
    const startupValues = starts
      .map((row) => Number(row.properties?.startupMs))
      .filter((value) => Number.isFinite(value) && value >= 0);
    const providerMap = new Map<string, ProviderStat>();
    rows.forEach((row) => {
      const provider = row.provider_id ?? "unknown";
      const current = providerMap.get(provider) ?? {
        provider,
        starts: 0,
        failures: 0,
        switches: 0,
      };
      if (row.event_name === "player_playback_started") current.starts += 1;
      if (row.event_name === "player_source_failed") current.failures += 1;
      if (row.event_name === "player_auto_fallback" || row.event_name === "player_manual_switch") {
        current.switches += 1;
      }
      providerMap.set(provider, current);
    });

    return {
      configured: true,
      events: rows.length,
      pageViews: rows.filter((row) => row.event_name === "page_view").length,
      sessions: new Set(rows.map((row) => row.session_id)).size,
      playbackStarts: starts.length,
      playbackFailures: rows.filter((row) => row.event_name === "player_source_failed").length,
      fallbacks: rows.filter((row) => row.event_name === "player_auto_fallback").length,
      signups: rows.filter((row) => row.event_name === "signup_completed").length,
      averageStartupMs: startupValues.length
        ? Math.round(startupValues.reduce((sum, value) => sum + value, 0) / startupValues.length)
        : null,
      topRoutes: countBy(
        rows.filter((row) => row.event_name === "page_view").map((row) => row.route),
      ),
      providers: [...providerMap.values()].sort((a, b) => b.starts - a.starts),
      recent: rows.slice(0, 12),
    };
  } catch (error) {
    console.error("[admin] Analytics load failed:", error);
    return empty;
  }
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs tracking-wide text-white/50 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {detail && <p className="mt-1 text-xs text-white/45">{detail}</p>}
    </div>
  );
}

export default async function AdminPage() {
  const access = await getAdminAccess();
  if (access === "anonymous") redirect("/auth?form=login&next=%2Fadmin");
  if (access === "forbidden") redirect("/");

  const snapshot = await loadAnalytics();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-violet-300 uppercase">
            StreamFree admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Site activity</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Private operational metrics for playback reliability, traffic, and account activity over
            the last 30 days.
          </p>
        </div>
        <Link
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
          href="/"
        >
          Back to StreamFree
        </Link>
      </div>

      {!snapshot.configured && (
        <div className="mb-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
          Analytics storage is not configured yet. Add the Supabase service-role key to the server
          environment and apply the analytics migration.
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Page views" value={snapshot.pageViews} detail="Recorded first-party views" />
        <Metric label="Sessions" value={snapshot.sessions} detail="Anonymous browser sessions" />
        <Metric
          label="Playback starts"
          value={snapshot.playbackStarts}
          detail={`${snapshot.playbackFailures} source failures`}
        />
        <Metric
          label="Average startup"
          value={snapshot.averageStartupMs === null ? "—" : `${snapshot.averageStartupMs} ms`}
          detail={`${snapshot.fallbacks} automatic fallbacks`}
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold">Provider reliability</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-white/45 uppercase">
                <tr>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Starts</th>
                  <th className="pb-3">Failures</th>
                  <th className="pb-3">Switches</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.providers.map((provider) => (
                  <tr key={provider.provider} className="border-t border-white/8">
                    <td className="py-3 font-medium">{provider.provider}</td>
                    <td className="py-3">{provider.starts}</td>
                    <td className="py-3">{provider.failures}</td>
                    <td className="py-3">{provider.switches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!snapshot.providers.length && (
              <p className="text-sm text-white/45">No provider events recorded yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold">Top routes</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {snapshot.topRoutes.map((item) => (
              <li
                key={item.route}
                className="flex items-center justify-between border-b border-white/8 pb-3"
              >
                <span className="truncate text-white/75">{item.route}</span>
                <span className="rounded-full bg-white/8 px-2 py-1 text-xs text-white/60">
                  {item.count}
                </span>
              </li>
            ))}
          </ul>
          {!snapshot.topRoutes.length && (
            <p className="mt-4 text-sm text-white/45">No page views recorded yet.</p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Recent events</h2>
          <span className="text-xs text-white/45">{snapshot.events} events sampled</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs text-white/45 uppercase">
              <tr>
                <th className="pb-3">Time</th>
                <th className="pb-3">Event</th>
                <th className="pb-3">Route</th>
                <th className="pb-3">Provider</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.recent.map((row, index) => (
                <tr key={`${row.occurred_at}-${index}`} className="border-t border-white/8">
                  <td className="py-3 text-white/55">
                    {new Date(row.occurred_at).toLocaleString()}
                  </td>
                  <td className="py-3 font-medium">{row.event_name}</td>
                  <td className="max-w-[260px] truncate py-3 text-white/60">{row.route}</td>
                  <td className="py-3 text-white/60">{row.provider_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!snapshot.recent.length && (
            <p className="mt-4 text-sm text-white/45">No events recorded yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
