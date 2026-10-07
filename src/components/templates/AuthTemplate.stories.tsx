import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../atoms/Button";
import { StatusMessage } from "../molecules/StatusMessage";
import { AuthTemplate } from "./AuthTemplate";

const meta = {
  title: "Templates/AuthTemplate",
  component: AuthTemplate,
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: "T1/V1 branded slot layout. C1 replaces prototype credentials with a managed-login entry action; C10 supplies pending/expired/error content. These isolated synthetic stories do not start authentication or resolve a session." } },
  },
  args: {
    title: "Sign in to your workspace",
    description: "Explore stored daily observations and run read-only analysis.",
    footer: "Access is determined by your application account.",
  },
} satisfies Meta<typeof AuthTemplate>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ManagedLoginEntry: Story = {
  args: {
    actions: <Button className="w-full" style={{ minHeight: "38px" }} onClick={() => { /* Synthetic slot preview; no login integration. */ }}>Continue to sign in</Button>,
  },
};

export const Pending: Story = {
  args: {
    children: <StatusMessage title="Preparing sign-in" description="Wait while the supplied sign-in state is pending." pending />,
    actions: <Button className="w-full" style={{ minHeight: "38px" }} loading loadingLabel="Preparing sign-in…">Continue to sign in</Button>,
  },
};

export const Expired: Story = {
  args: {
    title: "Sign in again",
    children: <StatusMessage title="Session expired" description="Sign in again to continue." tone="warning" />,
    actions: <Button className="w-full" style={{ minHeight: "38px" }} onClick={() => { /* Synthetic recovery slot. */ }}>Continue to sign in</Button>,
  },
};

export const Error: Story = {
  args: {
    children: <StatusMessage title="Sign-in unavailable" description="Try again when the service is available." tone="error" announcement="assertive" />,
    actions: <Button className="w-full" style={{ minHeight: "38px" }} onClick={() => { /* Synthetic recovery slot. */ }}>Try again</Button>,
  },
};

const states = [
  { title: "Sign in to your workspace", description: "Explore stored daily observations and run read-only analysis.", message: <StatusMessage title="Ready" description="Continue when ready." tone="success" /> },
  { title: "Checking session", description: "Checking your existing session. Your workspace will open automatically.", message: <StatusMessage title="Checking session" description="Protected content is withheld while your session is unresolved." pending /> },
  { title: "Sign in again", description: "Your session ended.", message: <StatusMessage title="Session expired" description="Sign in again to continue." tone="warning" /> },
] as const;

function SwitchDemo() {
  const [index, setIndex] = useState(0);
  const state = states[index] ?? states[0];
  return <AuthTemplate
    title={state.title}
    description={state.description}
    actions={<><Button className="w-full" style={{ minHeight: "38px" }} onClick={() => { setIndex((value) => (value + 1) % states.length); }}>Next state</Button></>}
  >{state.message}</AuthTemplate>;
}

/** Title/description fade when the supplied title changes; the card enters with a scale-in. Actions and children stay mounted (Motion global on to review). */
export const StateSwitch: Story = { render: () => <SwitchDemo /> };
