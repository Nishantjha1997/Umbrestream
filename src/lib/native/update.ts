export type NativeUpdateStatus = "idle" | "checking" | "available" | "current" | "error";

export interface NativeUpdateState<T = unknown> {
  status: NativeUpdateStatus;
  manifest: T | null;
  error: string;
}

export interface NativeUpdatePayload {
  status?: string;
  versionCode?: number | string;
  [key: string]: unknown;
}

export function beginUpdateCheck<T>(current: NativeUpdateState<T>): NativeUpdateState<T> {
  return { ...current, status: "checking", error: "" };
}

export function resolveUpdateState(
  payload: NativeUpdatePayload,
  currentVersionCode: number,
): NativeUpdateState<NativeUpdatePayload> {
  const available =
    payload.status === "available" || Number(payload.versionCode || 0) > currentVersionCode;
  return {
    status: available ? "available" : "current",
    manifest: payload,
    error: "",
  };
}

export function updateError<T>(
  current: NativeUpdateState<T>,
  error: unknown,
): NativeUpdateState<T> {
  return {
    ...current,
    status: "error",
    error: error instanceof Error && error.message ? error.message : "Update check failed",
  };
}
