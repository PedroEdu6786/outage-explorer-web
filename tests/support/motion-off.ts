/**
 * Test-only stylesheet: removes all animation and transition time so captures
 * and behavior assertions see end states immediately. Injected by the Storybook
 * preview only while the `motion` global is `off` (the default). It never enters
 * `src/` or emitted application output.
 */
export const motionOffCss = `
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  scroll-behavior: auto !important;
}
`;
