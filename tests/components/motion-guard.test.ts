import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "..");
const source = join(root, "src");
const styles = join(source, "styles");

function files(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const all = files(source).filter((path) => /\.(?:tsx?|css)$/.test(path));
const outsideStyles = all.filter((path) => !path.startsWith(`${styles}/`));
const read = (path: string) => readFileSync(path, "utf8");

function offenders(paths: readonly string[], pattern: RegExp) {
  return paths.filter((path) => pattern.test(read(path))).map((path) => relative(root, path));
}

describe("motion token and reduced-motion guard (AC1, AC2, AC6)", () => {
  const tokens = read(join(styles, "tokens.css"));
  const motion = read(join(styles, "motion.css"));

  it("defines duration, easing, movement and stagger tokens", () => {
    for (const token of ["--duration-fast", "--duration-base", "--duration-enter", "--duration-move", "--ease-out", "--motion-rise", "--motion-press-shift", "--motion-press-scale", "--motion-nudge", "--motion-drawer-shift", "--stagger-step"]) {
      expect(tokens, token).toContain(`${token}:`);
    }
  });

  it("defines the named animations and utilities that components consume", () => {
    for (const name of ["fade-in", "fade-rise", "scale-in", "settle", "nudge", "expand", "chart-wipe", "progress", "dot-pulse", "spinner", "shimmer"]) {
      expect(motion, name).toContain(`--animate-${name}:`);
      expect(motion, name).toContain(`@keyframes ${name}`);
    }
    for (const utility of ["motion-colors", "motion-control", "motion-field", "motion-stagger", "sliding-indicator", "sliding-underline", "motion-check"]) {
      expect(motion, utility).toContain(`@utility ${utility}`);
    }
  });

  it("has exactly one reduced-motion rule in all source, and it lives in tokens.css", () => {
    const occurrences = all.flatMap((path) => (read(path).match(/prefers-reduced-motion\s*:/g) ?? []).map(() => relative(root, path)));
    expect(occurrences).toEqual(["src/styles/tokens.css"]);
    const block = /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*$/.exec(tokens)?.[0] ?? "";
    for (const token of ["--motion-rise: 0px", "--motion-press-scale: 1", "--duration-move: 0s", "--animate-spinner: none", "--animate-chart-wipe: none", "--animate-progress: none", "--animate-dot-pulse: none"]) {
      expect(block, token).toContain(token);
    }
  });

  it("keeps ad-hoc durations, easings and keyframes inside src/styles", () => {
    expect(offenders(outsideStyles, /\bduration-(?:\[|\(|\d)/)).toEqual([]);
    expect(offenders(outsideStyles, /\bease-(?:\[|\(|in\b|out\b|in-out\b|linear\b)/)).toEqual([]);
    expect(offenders(outsideStyles, /\banimate-\[/)).toEqual([]);
    expect(offenders(outsideStyles, /transition-duration|transitionDuration|animation-duration|animationDuration/)).toEqual([]);
    expect(offenders(outsideStyles, /@keyframes/)).toEqual([]);
  });

  it("keeps E1 shimmer disabled at every call site", () => {
    const callSites = outsideStyles.filter((path) => !path.endsWith("/Skeleton.tsx") && !path.endsWith("/TableSkeleton.tsx"));
    expect(offenders(callSites, /\bshimmer(?:\s|=|\})|animate-shimmer|motion-shimmer/)).toEqual([]);
  });

  it("has no per-component motion-reduce variants", () => {
    expect(offenders(all, /motion-reduce:/)).toEqual([]);
  });

  it("does not depend on animation or transition completion events", () => {
    expect(offenders(all, /animationend|transitionend|getAnimations|onAnimationEnd|onTransitionEnd/)).toEqual([]);
  });
});
