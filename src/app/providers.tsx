"use client";
import type { ReactNode } from "react";
import { ProductionProvider } from "../composition/ProductionProvider";
export function Providers({ children, authEnabled = false, logoutUrl }: { readonly children: ReactNode; readonly authEnabled?: boolean; readonly logoutUrl?: string | undefined }) { return <ProductionProvider authEnabled={authEnabled} logoutUrl={logoutUrl}>{children}</ProductionProvider>; }
