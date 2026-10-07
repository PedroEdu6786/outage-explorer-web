"use client";
import { createCatalogCache, catalogCachePolicy } from "../resources/catalog-cache";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSessionRuntime } from "../session/session-runtime";
import { ApplicationProvider } from "./ApplicationProvider";
import { createProductionOperations, productionQuerySettings, productionPreviewSettings } from "./production-operations";
import { routeTitles, type ApplicationPath } from "./navigation";

export function ProductionProvider({ children, authEnabled = false, logoutUrl }: { readonly children: ReactNode; readonly authEnabled?: boolean; readonly logoutUrl?: string | undefined }) {
  const [runtime] = useState(createSessionRuntime);
  const [catalogCache] = useState(() => createCatalogCache({ runtime, policy: catalogCachePolicy, attachOnCreate: false }));
  const [operations] = useState(() => createProductionOperations({ runtime, authEnabled, logoutUrl, catalogCache }));
  const router = useRouter();
  const pathname = usePathname();
  const path: ApplicationPath = pathname in routeTitles ? pathname as ApplicationPath : "/overview";
  // Strict Mode replays cleanup/setup during development. Clear protected state
  // while keeping the runtime unresolved so the next setup checks the cookie.
  useEffect(() => () => { runtime.invalidate("pending"); }, [runtime]);
  return <ApplicationProvider operations={operations} runtime={runtime} catalogCache={catalogCache} path={path} go={(next) => { router.push(next); }} querySettings={productionQuerySettings} previewPageSize={productionPreviewSettings.initialPageSize}>
    <div onClick={(event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest("a");
      const href = anchor?.getAttribute("href");
      if (href && href in routeTitles && anchor?.target !== "_blank") { event.preventDefault(); router.push(href); }
    }}>{children}</div>
  </ApplicationProvider>;
}
