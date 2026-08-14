import type { PropsWithChildren } from "react";

/** Page motion lives in the immersive shell so primary tab transitions share one choreography. */
export default function RouteTemplate({ children }: PropsWithChildren) {
  return children;
}
