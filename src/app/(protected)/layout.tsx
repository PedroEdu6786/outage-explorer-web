import type { ReactNode } from "react";
import { ProtectedLayout } from "../../composition/PageEntries";
export default function Layout({ children }: { readonly children: ReactNode }) { return <ProtectedLayout>{children}</ProtectedLayout>; }
