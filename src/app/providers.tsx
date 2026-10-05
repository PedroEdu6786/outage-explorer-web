"use client";
import type { ReactNode } from "react";
import { ProductionProvider } from "../composition/ProductionProvider";
export function Providers({ children }: { readonly children: ReactNode }) { return <ProductionProvider>{children}</ProductionProvider>; }
