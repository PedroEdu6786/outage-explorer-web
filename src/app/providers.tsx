"use client";
import type { ReactNode } from "react";
import { ProductionProvider } from "../composition/ProductionProvider";
export function Providers({ children, authEnabled = false }: { readonly children: ReactNode; readonly authEnabled?: boolean }) { return <ProductionProvider authEnabled={authEnabled}>{children}</ProductionProvider>; }
