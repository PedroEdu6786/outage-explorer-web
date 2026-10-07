import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { Surface } from "../atoms/Surface";
import { Tabs } from "./Tabs";
import { NavigationItem } from "./NavigationItem";
import { UserSummary } from "./UserSummary";

const meta = {
  title: "Molecules/Navigation",
  component: Tabs,
  args: { label: "Synthetic details", items: [], selectedId: "", onSelectionChange: () => undefined },
  parameters: { docs: { description: { component: "M3/V3/S1: controlled tabs, native destination links and supplied identity. D5 automatic Arrow/Home/End tab selection, associated focusable panels; long user names wrap as a readable-content extension. No permission fetching or prototype persona control.", } } },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

function DatasetTabs() {
  const [selectedId, setSelectedId] = useState("synthetic-preview");
  return <Surface><Tabs label="Dataset details" selectedId={selectedId} onSelectionChange={setSelectedId} items={[
    { id: "synthetic-preview", label: "Preview", content: <p className="p-[18px]">Synthetic preview content.</p> },
    { id: "synthetic-schema", label: "Schema", content: <p className="p-[18px]">Synthetic schema content.</p> },
  ]} /></Surface>;
}

export const DatasetDetails: Story = { render: () => <DatasetTabs /> };
export const SuppliedNavigation: Story = {
  render: () => (
    <div className="w-[232px] bg-sidebar py-4">
      <nav aria-label="Supplied destinations" className="grid gap-[3px] px-[10px]">
        <NavigationItem href="#overview" label="Overview" icon={<Icon name="overview" />} />
        <NavigationItem href="#datasets" label="Dataset Explorer" active icon={<Icon name="datasets" />} />
        <NavigationItem href="#sql" label="SQL Workspace" icon={<Icon name="sql" />} />
      </nav>
      <UserSummary name="Synthetic User" initials="S" roleLabel="Analyst" action={<IconButton label="Sign out"><Icon name="logout" /></IconButton>} />
    </div>
  ),
};

function ManyTabs() {
  const [selectedId, setSelectedId] = useState("synthetic-first");
  return <Surface><Tabs label="Synthetic sections" selectedId={selectedId} onSelectionChange={setSelectedId} items={[
    { id: "synthetic-first", label: "Preview", content: <p className="p-[18px]">Synthetic first panel.</p> },
    { id: "synthetic-second", label: "Schema", content: <p className="p-[18px]">Synthetic second panel.</p> },
    { id: "synthetic-third", label: "Longer tab label", content: <p className="p-[18px]">Synthetic third panel.</p> },
    { id: "synthetic-fourth", label: "Notes", content: <p className="p-[18px]">Synthetic fourth panel.</p> },
  ]} /></Surface>;
}

/** Four tabs, to review the sliding underline and panel re-show (toolbar Motion global on). */
export const MultipleTabs: Story = { render: () => <ManyTabs /> };

/** Hover the inactive items to review the 2px nudge; the active item keeps aria-current. */
export const NavigationItemStates: Story = {
  render: () => (
    <div className="w-[232px] bg-sidebar py-4">
      <nav aria-label="Navigation item states" className="grid gap-[3px] px-[10px]">
        <NavigationItem href="#overview" label="Inactive item" icon={<Icon name="overview" />} />
        <NavigationItem href="#datasets" label="Active item" active icon={<Icon name="datasets" />} />
        <NavigationItem href="#sql" label="Another inactive item" icon={<Icon name="sql" />} />
      </nav>
    </div>
  ),
};
