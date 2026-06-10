"use client";

import { useEffect, useRef } from "react";

/**
 * Shared p5 host. Dynamically imports p5, mounts an instance-mode sketch into a
 * div, and wires resize + tab-visibility pausing. `build(p, host)` should set
 * p.setup / p.draw / p.windowResized just like a normal instance sketch.
 */
export function P5Canvas({
  build,
  className,
  seedKey,
}: {
  build: (p: any, host: HTMLDivElement) => void;
  className?: string;
  seedKey?: string | number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<any>(null);

  useEffect(() => {
    if (!hostRef.current || p5Ref.current) return;
    let cleanup: (() => void) | null = null;

    import("p5").then((mod) => {
      const P5 = mod.default;
      const host = hostRef.current;
      if (!host) return;

      const sketch = (p: any) => build(p, host);
      p5Ref.current = new P5(sketch, host);

      const ro = new ResizeObserver(() => {
        if (p5Ref.current?.windowResized) p5Ref.current.windowResized();
      });
      ro.observe(host);

      const onVis = () => {
        if (!p5Ref.current) return;
        if (document.hidden) p5Ref.current.noLoop();
        else p5Ref.current.loop();
      };
      document.addEventListener("visibilitychange", onVis);

      cleanup = () => {
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        if (p5Ref.current) {
          p5Ref.current.remove();
          p5Ref.current = null;
        }
      };
    });

    return () => {
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  return <div ref={hostRef} className={className} aria-hidden style={{ pointerEvents: "none" }} />;
}
