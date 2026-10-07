import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../atoms/Button";
import { Badge } from "../atoms/Badge";
import { Surface } from "../atoms/Surface";
import type { NavigationData } from "../organisms/AppNavigation";
import { AppShell } from "./AppShell";
import { OverviewTemplate } from "./OverviewTemplate";
import { ExplorerTemplate } from "./ExplorerTemplate";
import { WorkspaceTemplate } from "./WorkspaceTemplate";

const ready: NavigationData = {
  status: "ready", revision: "synthetic-layout-1",
  identity: { name: "Synthetic User", initials: "S", roleLabel: "Analyst" },
  destinations: [
    { id: "overview", label: "Overview", href: "#overview", icon: "overview" },
    { id: "datasets", label: "Dataset Explorer", href: "#datasets", icon: "datasets", active: true },
    { id: "sql", label: "SQL Workspace", href: "#sql", icon: "sql" },
  ],
  coverage: { availableThrough: "September 30, 2026" },
};

const meta = {
  title: "Templates/Analytical",
  component: AppShell,
  args: { navigation: ready, title: "Synthetic layout", children: null, onSignOut: () => undefined },
  parameters: { docs: { description: { component: "T1/V2–V4: supplied slots only. Measured shell232/topbar50/page padding and 275/250→220→stacked master-detail columns; no feature imports/routes or live data. Pending unmounts protected slots and accessory. Any substantive content is a synthetic layout specimen.", } } },
} satisfies Meta<typeof AppShell>;
export default meta;
type Story = StoryObj<typeof meta>;

function Heading({ title }: { title: string }) {
  return <><h1>{title}</h1><p className="mt-[6px] text-[13px] text-text-muted">Synthetic slot layout; no live observations.</p></>;
}
function Panel({ children }: { children: string }) {
  return <Surface className="p-[18px]">{children}</Surface>;
}

export const Explorer: Story = {
  render: () => <AppShell navigation={ready} title="Dataset Explorer" accessory={<Badge>Sample data</Badge>} onSignOut={() => undefined}>
    <ExplorerTemplate heading={<Heading title="Dataset Explorer" />} catalog={<Panel>Synthetic catalog slot</Panel>} detail={<Panel>Synthetic dataset detail slot</Panel>} />
  </AppShell>,
};
export const Workspace: Story = {
  render: () => <AppShell navigation={ready} title="SQL Workspace" accessory={<Badge>Sample data</Badge>} onSignOut={() => undefined}>
    <WorkspaceTemplate heading={<Heading title="SQL Workspace" />} browser={<Panel>Synthetic schema browser slot</Panel>} workspace={<Panel>Synthetic editor/status/results slots</Panel>} />
  </AppShell>,
};
export const Overview: Story = {
  render: () => <AppShell navigation={ready} title="Overview" accessory={<Badge>Sample data</Badge>} onSignOut={() => undefined}>
    <OverviewTemplate heading={<Heading title="Overview" />} notice="Synthetic observation notice" metrics={<Panel>Synthetic metric slots</Panel>} trend={<Panel>Synthetic trend slot</Panel>} observations={<Panel>Synthetic observations slot</Panel>} />
  </AppShell>,
};
export const Pending: Story = {
  render: () => <AppShell navigation={{ status: "pending" }} title="Protected title" accessory={<Badge>Protected accessory</Badge>} onSignOut={() => undefined}><p>Protected child specimen must remain unmounted.</p></AppShell>,
};

function EntranceReplay({ children }: { children: (key: number) => ReactNode }) {
  const [replay, setReplay] = useState(0);
  return <>
    <div className="m-3"><Button variant="secondary" onClick={() => { setReplay((value) => value + 1); }}>Replay entrance</Button></div>
    {children(replay)}
  </>;
}

/** Slot entrances (fade-rise, 50ms stagger, index capped): remount to replay with the Motion global on. */
export const OverviewEntrance: Story = {
  render: () => <EntranceReplay>{(key) => <OverviewTemplate key={key} heading={<Heading title="Overview" />} metrics={<Panel>Synthetic metric slots</Panel>} trend={<Panel>Synthetic trend slot</Panel>} observations={<Panel>Synthetic observations slot</Panel>} />}</EntranceReplay>,
};
export const ExplorerEntrance: Story = {
  render: () => <EntranceReplay>{(key) => <ExplorerTemplate key={key} heading={<Heading title="Dataset Explorer" />} catalog={<Panel>Synthetic catalog slot</Panel>} detail={<Panel>Synthetic dataset detail slot</Panel>} />}</EntranceReplay>,
};
export const WorkspaceEntrance: Story = {
  render: () => <EntranceReplay>{(key) => <WorkspaceTemplate key={key} heading={<Heading title="SQL Workspace" />} browser={<Panel>Synthetic schema browser slot</Panel>} workspace={<Panel>Synthetic editor/status/results slots</Panel>} />}</EntranceReplay>,
};
