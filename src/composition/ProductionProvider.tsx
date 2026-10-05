"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSessionRuntime } from "../session/session-runtime";
import { ApplicationProvider } from "./ApplicationProvider";
import { createProductionOperations, productionQuerySettings } from "./production-operations";
import { routeTitles, type ApplicationPath } from "./navigation";

export function ProductionProvider({ children, authEnabled = false }: { readonly children: ReactNode; readonly authEnabled?: boolean }) {
  const [runtime] = useState(createSessionRuntime);
  const [operations] = useState(() => createProductionOperations({ runtime, authEnabled }));
  const router = useRouter();
  const pathname = usePathname();
  const path: ApplicationPath = pathname in routeTitles ? pathname as ApplicationPath : "/overview";
  useEffect(() => () => { runtime.invalidate(); }, [runtime]);
  return <ApplicationProvider operations={operations} runtime={runtime} path={path} go={(next) => { router.push(next); }} querySettings={productionQuerySettings}>
    <div onClick={(event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest("a");
      const href = anchor?.getAttribute("href");
      if (href && href in routeTitles && anchor?.target !== "_blank") { event.preventDefault(); router.push(href); }
    }}>{children}</div>
  </ApplicationProvider>;
}
