import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FixtureProvider, useFixtureController } from "../../../tests/fixtures/FixtureProvider";
import type { FixtureOptions } from "../../../tests/fixtures/operations";
import { Button } from "../../components/atoms/Button";
import { ExplorerFeature } from "./ExplorerFeature";

function Demo({ mode = "ready" }: { readonly mode?: "ready" | "viewer" | "empty" | "unavailable" | "denied" | "loading" | "expired" }) {
  const { controller, runtime } = useFixtureController();
  const [prepared] = useState(() => {
    if (mode === "denied") controller.failNext("startPreview", { kind: "forbidden", message: "Synthetic dataset permission denied." });
    if (mode === "expired") controller.failNext("startPreview", { kind: "preview-expired", message: "Synthetic preview expired; restart explicitly." });
    if (mode === "loading") controller.deferNext("startPreview");
    return true;
  });
  return <div className="p-[18px]" data-prepared={prepared}>
    <div className="mb-3 flex gap-2"><Button variant="secondary" onClick={() => { controller.publishSnapshot(); }}>Publish synthetic snapshot</Button><Button variant="secondary" onClick={() => { runtime.invalidate(); }}>Invalidate synthetic session</Button></div>
    <ExplorerFeature operations={controller.operations} runtime={runtime} initialPageSize={1} onNavigate={(intent) => { globalThis.alert(`Synthetic in-memory handoff: ${intent.datasetId}. No SQL executed.`); }} />
  </div>;
}
const meta = { title: "Features/Explorer", component: Demo, parameters: { docs: { description: { component: "V3/O3 authorized catalog, Preview/Schema, metadata filters and snapshot-bound cursor browsing. Synthetic fixture adapter only; live backend authorization remains unverified. Page size 1 is a test choice for cursor demonstration; normal default is 100." } } } } satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
const wrap = (options: FixtureOptions, mode: Parameters<typeof Demo>[0]["mode"] = "ready") => <FixtureProvider options={options}><Demo mode={mode} /></FixtureProvider>;
export const Analyst: Story = { render: () => wrap({ persona: "analyst" }) };
export const Viewer: Story = { render: () => wrap({ persona: "viewer" }, "viewer") };
export const Empty: Story = { render: () => wrap({ dataState: "empty" }, "empty") };
export const Unavailable: Story = { render: () => wrap({ dataState: "unavailable" }, "unavailable") };
export const Denied: Story = { render: () => wrap({}, "denied") };
export const Loading: Story = { render: () => wrap({}, "loading") };
export const Expired: Story = { render: () => wrap({}, "expired") };
