import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "../atoms/Badge";
import { AppNavigation, type NavigationData } from "./AppNavigation";
import { AppHeader } from "./AppHeader";

const meta = {
  title: "Organisms/Shell",
  component: AppNavigation,
  args: { data: { status: "pending" }, open: false, onOpenChange: () => undefined, onSignOut: () => undefined },
  parameters: { docs: { description: { component: "S1/O1: supplied navigation, identity and coverage only; no persona selector. D2 extension uses a native modal dialog for Escape, focus containment and background exclusion at/below 1000px. Light cyan focus on navy and wrapping user names are documented accessibility extensions.", } } },
} satisfies Meta<typeof AppNavigation>;
export default meta;
type Story = StoryObj<typeof meta>;

const ready: Extract<NavigationData, { status: "ready" }> = {
  status: "ready", revision: "synthetic-session-1",
  identity: { name: "Synthetic User", initials: "S", roleLabel: "Analyst" },
  destinations: [
    { id: "overview", label: "Overview", href: "#overview", icon: "overview" },
    { id: "datasets", label: "Dataset Explorer", href: "#datasets", icon: "datasets", active: true },
    { id: "sql", label: "SQL Workspace", href: "#sql", icon: "sql" },
  ],
  coverage: { availableThrough: "September 30, 2026", updated: "Synthetic update metadata" },
};

function ShellPreview({ pending = false, title = "Dataset Explorer", initiallyOpen = false }: { pending?: boolean; title?: string; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [backgroundCount, setBackgroundCount] = useState(0);
  const [signOutCount, setSignOutCount] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <AppNavigation data={pending ? { status: "pending" } : ready} open={open} onOpenChange={setOpen} onSignOut={() => { setSignOutCount((count) => count + 1); }} returnFocusRef={trigger} />
    <div className="min-[1001px]:ml-(--sidebar-width)">
      <AppHeader title={title} onOpenNavigation={() => { setOpen(true); }} navigationOpen={open} navigationButtonRef={trigger} pending={pending} accessory={<Badge>Sample data</Badge>} />
      <main className="p-6"><h1>Synthetic shell preview</h1><p>No protected feature content is assembled.</p><button type="button" onClick={() => { setBackgroundCount((count) => count + 1); }}>Background interaction specimen</button><p>Background count: {backgroundCount}</p><p>Sign-out count: {signOutCount}</p></main>
    </div>
  </>;
}

export const Ready: Story = { render: () => <ShellPreview /> };
export const Pending: Story = { render: () => <ShellPreview pending /> };
export const LongTitle: Story = { render: () => <ShellPreview title="SyntheticUnbrokenHeaderTitleWithAllContentPreservedForAssistiveTechnology" /> };

function IndicatorPreview() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("datasets");
  const trigger = useRef<HTMLButtonElement>(null);
  const data: NavigationData = { ...ready, destinations: ready.destinations.map((destination) => ({ ...destination, active: destination.id === activeId })) };
  return <>
    <AppNavigation data={data} open={open} onOpenChange={setOpen} onSignOut={() => undefined} returnFocusRef={trigger} />
    <div className="min-[1001px]:ml-(--sidebar-width)">
      <AppHeader title="Indicator review" onOpenNavigation={() => { setOpen(true); }} navigationOpen={open} navigationButtonRef={trigger} />
      <main className="flex gap-2 p-6">
        {ready.destinations.map((destination) => (
          <button key={destination.id} type="button" onClick={() => { setActiveId(destination.id); }}>Show {destination.label}</button>
        ))}
      </main>
    </div>
  </>;
}

/** Desktop shell whose active destination changes, to review the sliding indicator (Motion global on). */
export const DesktopIndicator: Story = { render: () => <IndicatorPreview /> };

/**
 * Drawer review (Motion global on): at or below 1000px wide the navigation opens as a
 * native modal dialog that slides in with a backdrop fade; this story starts open.
 * The coverage status dot pulses once per open. Reduced motion jumps instead.
 */
export const DrawerOpen: Story = { render: () => <ShellPreview initiallyOpen /> };

/** Desktop sidebar: the coverage status dot pulses once on mount; the header icon swaps with `navigationOpen`. */
export const CoverageDot: Story = { render: () => <ShellPreview /> };
