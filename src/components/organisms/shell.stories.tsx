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

const ready: NavigationData = {
  status: "ready", revision: "synthetic-session-1",
  identity: { name: "Synthetic User", initials: "S", roleLabel: "Analyst" },
  destinations: [
    { id: "overview", label: "Overview", href: "#overview", icon: "overview" },
    { id: "datasets", label: "Dataset Explorer", href: "#datasets", icon: "datasets", active: true },
    { id: "sql", label: "SQL Workspace", href: "#sql", icon: "sql" },
  ],
  coverage: { availableThrough: "September 30, 2026", updated: "Synthetic update metadata" },
};

function ShellPreview({ pending = false, title = "Dataset Explorer" }: { pending?: boolean; title?: string }) {
  const [open, setOpen] = useState(false);
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
