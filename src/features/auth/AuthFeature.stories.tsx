import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FixtureProvider, useFixtureController } from "../../../tests/fixtures/FixtureProvider";
import { AuthFeature } from "./AuthFeature";

type Scenario = "entry" | "pending" | "expired" | "denied" | "error" | "signed-in";

function ScenarioContent({ scenario }: { scenario: Scenario }) {
  const { controller, runtime } = useFixtureController();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (scenario === "pending") controller.deferNext("resolveSession");
      if (scenario === "denied" || scenario === "error") {
        controller.failNext("resolveSession", { kind: scenario === "denied" ? "forbidden" : "service-failure", message: scenario === "denied" ? "Synthetic identity has no application access." : "Synthetic session service is unavailable." });
      }
      if (scenario !== "signed-in") runtime.invalidate(scenario === "expired" ? "expired" : scenario === "entry" ? "unauthenticated" : "pending");
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [controller, runtime, scenario]);
  return ready ? <AuthFeature operations={controller.operations} runtime={runtime} /> : null;
}

function AuthStory({ scenario }: { scenario: Scenario }) {
  return <FixtureProvider options={{ persona: "viewer" }}><ScenarioContent scenario={scenario} /></FixtureProvider>;
}

const meta = {
  title: "Features/Auth", component: AuthStory,
  parameters: { layout: "fullscreen", docs: { description: { component: "V1/O5 fixture lifecycle. Synthetic session only; managed Cognito flow and backend invalidation remain unverified. C1/C10 replace prototype credentials and add recovery states." } } },
  args: { scenario: "entry" },
} satisfies Meta<typeof AuthStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ManagedLoginEntry: Story = {};
export const Pending: Story = { args: { scenario: "pending" } };
export const Expired: Story = { args: { scenario: "expired" } };
export const Denied: Story = { args: { scenario: "denied" } };
export const Error: Story = { args: { scenario: "error" } };
export const SignedIn: Story = { args: { scenario: "signed-in" } };
