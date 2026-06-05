import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth";
import { PortalShell } from "@/components/portal-shell";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return <PortalShell session={session}>{children}</PortalShell>;
}
