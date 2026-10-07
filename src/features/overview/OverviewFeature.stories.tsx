import { fireEvent, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FixtureProvider, useFixtureController } from "../../../tests/fixtures/FixtureProvider";
import { syntheticZoomSeries } from "../../../tests/fixtures/overview-zoom";
import type { FixtureDataState } from "../../../tests/fixtures/scenarios";
import { AppShell } from "../../components/templates/AppShell";
import { Badge } from "../../components/atoms/Badge";
import { Button } from "../../components/atoms/Button";
import { OverviewFeature } from "./OverviewFeature";

function Demo() { const { controller, runtime } = useFixtureController(); return <AppShell title="Overview" navigation={{ status: "ready", revision: "synthetic-overview", identity: { name: "Synthetic Viewer", initials: "S", roleLabel: "Viewer" }, destinations: [{ id: "overview", label: "Overview", href: "#overview", icon: "overview", active: true }] }} accessory={<Badge>Sample data</Badge>} onSignOut={() => { runtime.invalidate(); }}><OverviewFeature operations={controller.operations} runtime={runtime} onNavigate={() => { /* Actual composition lives in Phase 5. */ }} /></AppShell>; }
function Story({ state = "ready", denied = false, loading = false, rangeReview = false, zoomYears }: { state?: FixtureDataState; denied?: boolean; loading?: boolean; rangeReview?: boolean; zoomYears?: 1 | 2 }) {
  return <FixtureProvider options={{ persona: "viewer", dataState: state, ...(zoomYears ? { nationalSeries: syntheticZoomSeries(zoomYears) } : {}) }}>{rangeReview ? <RangeReview /> : <Configured denied={denied} loading={loading} />}</FixtureProvider>;
}
/** Holds the next series response so the dimmed retained range stays visible for review. */
function RangeReview() {
  const { controller } = useFixtureController();
  const [held, setHeld] = useState<{ release: () => void } | null>(null);
  return <>
    <div className="m-3 flex gap-2 min-[1001px]:ml-[calc(var(--sidebar-width)+12px)]">
      <Button variant="secondary" disabled={held !== null} onClick={() => { setHeld(controller.deferNext("readNationalSeries")); }}>Hold next series response</Button>
      <Button variant="secondary" disabled={held === null} onClick={() => { held?.release(); setHeld(null); }}>Release response</Button>
    </div>
    <Demo />
  </>;
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
/** First load held open: skeleton metric cards (placeholders only, no zero or "Unavailable") under the announced loading banner. */
export const Loading: OverviewStory = { args: { loading: true } };
export const Empty: OverviewStory = { args: { state: "empty" } };
export const Unavailable: OverviewStory = { args: { state: "unavailable" } };
export const Denied: OverviewStory = { args: { denied: true } };
/** Hold the next response, then change the end date: the previous range stays dimmed (inert, hidden from assistive technology) until you release it. */
export const RangeChangeRefetch: OverviewStory = { args: { rangeReview: true } };
export const LongRangeZoom: OverviewStory = { args: { zoomYears: 1 } };
export const TwoYearZoom: OverviewStory = { args: { zoomYears: 2 } };
export const LongRangeRefetch: OverviewStory = { args: { zoomYears: 1, rangeReview: true } };

export const Compare: OverviewStory = { play: async ({ canvasElement }) => { const canvas = within(canvasElement); await fireEvent.click(await canvas.findByRole("checkbox", { name: "Compare EIA reported %" })); } };
export const InspectedObservation: OverviewStory = { play: async ({ canvasElement }) => { const canvas = within(canvasElement); const select = await canvas.findByRole("combobox", { name: "Inspect observation" }); await fireEvent.change(select, { target: { value: "2026-09-01" } }); } };
