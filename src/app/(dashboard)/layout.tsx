import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getApplicationName } from "@/server/deployment";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell applicationName={getApplicationName()}>
      {children}
    </DashboardShell>
  );
}
