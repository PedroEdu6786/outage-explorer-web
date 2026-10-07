import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge, type BadgeTone } from "./Badge";
import { Skeleton } from "./Skeleton";
import { Spinner } from "./Spinner";
import { Surface } from "./Surface";

const meta = {
  title: "Atoms/Status and surfaces",
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          "A3 synthetic specimens map the published .badge, .panel and .spinner selectors. Badge tones have no permission authority. D5 extension: loading has accessible text and the ring stops rotating under prefers-reduced-motion. Compact 9px badges retain the observed baseline pending T2.6 readability review.",
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Sample data</Badge>
      <Badge tone="info">National</Badge>
      <Badge tone="success">Read only</Badge>
      <Badge tone="warning">Truncated</Badge>
      <Badge tone="error">Unavailable</Badge>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Spinner label="Loading preview" />
        <span>Loading preview</span>
      </div>
      <div className="flex items-center gap-2 rounded-control bg-accent p-3 text-white">
        <Spinner decorative tone="inverse" />
        <span>Loading</span>
      </div>
    </div>
  ),
};

export const Panel: Story = {
  render: () => (
    <Surface as="section" aria-labelledby="surface-title" className="max-w-lg">
      <div className="border-b border-border px-[17px] py-[15px]">
        <h2 id="surface-title">Preview panel</h2>
        <p className="mt-1 text-[11px] text-text-muted">Synthetic panel content</p>
      </div>
      <div className="flex items-center gap-2 p-[17px]">
        <Spinner label="Loading panel content" />
        <span>Loading panel content</span>
      </div>
    </Surface>
  ),
};

const tones: readonly BadgeTone[] = ["neutral", "info", "success", "warning", "error"];

function ToneSwitch() {
  const [index, setIndex] = useState(0);
  const tone = tones[index] ?? "neutral";
  return (
    <div className="flex items-center gap-3">
      <Badge tone={tone}>Tone: {tone}</Badge>
      <button type="button" className="rounded-control border border-border-strong px-2 py-1 text-[11px]" onClick={() => { setIndex((value) => (value + 1) % tones.length); }}>Next tone</button>
    </div>
  );
}

/** One badge changing tone, to review the color crossfade (toolbar Motion global on). */
export const ToneSwitchReview: Story = { render: () => <ToneSwitch /> };

/** Static placeholder blocks (A2, E1): decorative, no text, no animation. */
export const SkeletonBlocks: Story = {
  render: () => (
    <div className="grid max-w-sm gap-3" data-testid="skeleton-blocks">
      <Skeleton className="block h-4 w-2/3" />
      <Skeleton className="block h-8 w-full" />
      <div className="flex items-center gap-3"><Skeleton className="size-8 rounded-full" /><Skeleton className="h-3 w-24" /></div>
    </div>
  ),
};

function SpinnerFadeIn() {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <button type="button" className="rounded-control border border-border-strong px-2 py-1 text-[11px]" onClick={() => { setShown((value) => !value); }}>{shown ? "Stop loading" : "Start loading"}</button>
      {shown && <Spinner label="Loading preview" />}
    </div>
  );
}

/** Spinner mounting (150ms fade-in), to review short loads (toolbar Motion global on). */
export const SpinnerFadeInReview: Story = { render: () => <SpinnerFadeIn /> };
