import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FixtureProvider, useFixtureController } from "../../../tests/fixtures/FixtureProvider";
import type { FixtureDataState } from "../../../tests/fixtures/scenarios";
import { AppShell } from "../../components/templates/AppShell";
import { Badge } from "../../components/atoms/Badge";
import { OverviewFeature } from "./OverviewFeature";

function Demo() { const { controller, runtime } = useFixtureController(); return <AppShell title="Overview" navigation={{ status: "ready", revision: "synthetic-overview", identity: { name: "Synthetic Viewer", initials: "S", roleLabel: "Viewer" }, destinations: [{ id: "overview", label: "Overview", href: "#overview", icon: "overview", active: true }] }} accessory={<Badge>Sample data</Badge>} onSignOut={() => { runtime.invalidate(); }}><OverviewFeature operations={controller.operations} runtime={runtime} onNavigate={() => { /* Actual composition lives in Phase 5. */ }} /></AppShell>; }
function Story({ state = "ready", denied = false, loading = false }: { state?: FixtureDataState; denied?: boolean; loading?: boolean }) {
  return <FixtureProvider options={{ persona: "viewer", dataState: state }}><Configured denied={denied} loading={loading} /></FixtureProvider>;
}
function Configured({ denied, loading }: { denied: boolean; loading: boolean }) {
  const { controller } = useFixtureController();
  // Story-only injected failure, set before the feature mount.
  const [configured] = useState(() => { if (loading) controller.deferNext("readNationalSeries"); if (denied) controller.failNext("readNationalSeries", { kind: "forbidden", message: "Synthetic denied national data." }); return true; });
  return configured ? <Demo /> : null;
}
import { useState } from "react";
const meta = { title: "Features/Overview", component: Story, parameters: { layout: "fullscreen" } } satisfies Meta<typeof Story>;
export default meta;
type OverviewStory = StoryObj<typeof meta>;
export const Ready: OverviewStory = {};
export const Loading: OverviewStory = { args: { loading: true } };
export const Empty: OverviewStory = { args: { state: "empty" } };
export const Unavailable: OverviewStory = { args: { state: "unavailable" } };
export const Denied: OverviewStory = { args: { denied: true } };
