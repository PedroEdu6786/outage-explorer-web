import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "../../src/components/atoms/Skeleton";
import { TableSkeleton } from "../../src/components/molecules/TableSkeleton";

describe("loading placeholders (FR4)", () => {
  it("renders Skeleton as an empty, aria-hidden block with shimmer off by default", () => {
    const { container } = render(<Skeleton className="h-4 w-10" />);
    const block = container.firstElementChild;
    expect(block).toHaveAttribute("aria-hidden", "true");
    expect(block).toHaveTextContent("");
    expect(block?.className).not.toContain("shimmer");
    expect(block?.className).toContain("h-4 w-10");
    expect(block).not.toHaveAttribute("role");
  });

  it("only adds the shimmer utility when explicitly requested", () => {
    const { container } = render(<Skeleton shimmer />);
    expect(container.firstElementChild?.className).toContain("motion-shimmer");
  });

  it("does not let callers override the decorative semantics", () => {
    const { container } = render(<Skeleton {...({ role: "status", "aria-hidden": false } as object)} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders TableSkeleton as hidden presentational rows with no table semantics or text", () => {
    const { container } = render(<TableSkeleton rows={3} columns={5} />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveTextContent("");
    expect(container.querySelector("table, caption, th, td, tr, [role]")).toBeNull();
    // One header row plus the requested body rows, each with the requested cells.
    expect(root?.children).toHaveLength(4);
    for (const row of Array.from(root?.children ?? [])) expect(row.children).toHaveLength(5);
    expect(container.querySelector("[class*=shimmer]")).toBeNull();
  });

  it("falls back to a bounded default geometry", () => {
    const { container } = render(<TableSkeleton />);
    expect(container.firstElementChild?.children).toHaveLength(7);
  });
});
