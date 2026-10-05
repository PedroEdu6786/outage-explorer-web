import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <>
        <p role="note" className="relative z-40 ml-auto w-fit max-w-full border border-border bg-surface px-2 py-1 text-[11px] text-text-muted">Synthetic fixture preview — not live EIA data.</p>
        <Story />
      </>
    ),
  ],
};

export default preview;
