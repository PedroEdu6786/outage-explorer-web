import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";
import { motionOffCss } from "../tests/support/motion-off";

const preview: Preview = {
  parameters: { nextjs: { appDirectory: true } },
  globalTypes: {
    motion: {
      description: "Animation and transitions. Off by default so captures and behavior tests are deterministic.",
      toolbar: {
        title: "Motion",
        icon: "play",
        dynamicTitle: true,
        items: [
          { value: "off", title: "Motion off (default)" },
          { value: "on", title: "Motion on" },
        ],
      },
    },
  },
  initialGlobals: { motion: "off" },
  decorators: [
    (Story, context) => (
      <>
        {context.globals.motion !== "on" && <style data-motion-off="true">{motionOffCss}</style>}
        <p role="note" className="relative z-40 ml-auto w-fit max-w-full border border-border bg-surface px-2 py-1 text-[11px] text-text-muted">Synthetic fixture preview — not live EIA data.</p>
        <Story />
      </>
    ),
  ],
};

export default preview;
