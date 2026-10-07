import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../src/components/atoms/Button";
import { AuthTemplate } from "../../src/components/templates/AuthTemplate";
import { AppShell } from "../../src/components/templates/AppShell";
import { ExplorerTemplate } from "../../src/components/templates/ExplorerTemplate";
import { OverviewTemplate } from "../../src/components/templates/OverviewTemplate";
import { WorkspaceTemplate } from "../../src/components/templates/WorkspaceTemplate";

describe("slot-only analytical templates", () => {
  it("does not mount protected children, navigation or accessory while session is pending", () => {
    const mounted = vi.fn();
    function ProtectedChild() { mounted(); return <p>Protected content</p>; }
    render(<AppShell navigation={{ status: "pending" }} title="Protected title" accessory="Protected metadata" onSignOut={() => undefined}><ProtectedChild /></AppShell>);
    expect(mounted).not.toHaveBeenCalled();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(screen.queryByText("Protected title")).not.toBeInTheDocument();
    expect(screen.queryByText("Protected metadata")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Resolving session…");
  });

  it("preserves each supplied composition in DOM reading order", () => {
    const { rerender } = render(<ExplorerTemplate heading="Heading" catalog="Catalog" detail="Detail" />);
    expect(screen.getByText("Heading").compareDocumentPosition(screen.getByText("Catalog")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("Catalog").compareDocumentPosition(screen.getByText("Detail")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    rerender(<WorkspaceTemplate heading="Heading" browser="Browser" workspace="Workspace" />);
    expect(screen.getByText("Browser").compareDocumentPosition(screen.getByText("Workspace")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    rerender(<OverviewTemplate heading="Heading" metrics="Metrics" trend="Trend" observations={<p>Observations</p>} />);
    expect(screen.getByText("Metrics").compareDocumentPosition(screen.getByText("Trend")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("Trend").compareDocumentPosition(screen.getByText("Observations")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it("keeps templates slot-only: every supplied slot is present at once and nothing else is added", () => {
    const { container } = render(<OverviewTemplate heading="Heading" notice="Notice" metrics="Metrics" trend="Trend" observations={<p>Observations</p>} />);
    for (const text of ["Heading", "Notice", "Metrics", "Trend", "Observations"]) expect(screen.getByText(text)).toBeVisible();
    // Entrance wrappers carry a capped index (<= 3) and no feature knowledge or content of their own.
    const indexes = Array.from(container.querySelectorAll(".motion-stagger")).map((slot) => Number(/--stagger-index:(\d+)/.exec(slot.className)?.[1]));
    expect(indexes).toEqual([0, 1, 2, 3]);
    expect(container.textContent).toBe("HeadingNoticeMetricsTrendObservations");
  });

  it("caps explorer and workspace slot stagger and keeps their slots intact", () => {
    for (const view of [<ExplorerTemplate key="e" heading="Heading" catalog="Catalog" detail="Detail" />, <WorkspaceTemplate key="w" heading="Heading" browser="Browser" workspace="Workspace" />]) {
      const { container, unmount } = render(view);
      const indexes = Array.from(container.querySelectorAll(".motion-stagger")).map((slot) => Number(/--stagger-index:(\d+)/.exec(slot.className)?.[1]));
      expect(indexes).toEqual([0, 1, 2]);
      expect(container.textContent).toMatch(/^Heading(?:Catalog|Browser)(?:Detail|Workspace)$/);
      unmount();
    }
  });

  it("switches the AuthTemplate title block without remounting children, actions or footer", () => {
    function Auth({ title }: { title: string }) {
      return <AuthTemplate title={title} description={`${title} description`} actions={<Button>Action</Button>} footer="Footer">
        <p role="status">Child status</p>
      </AuthTemplate>;
    }
    const { rerender } = render(<Auth title="Sign in" />);
    const action = screen.getByRole("button", { name: "Action" });
    const status = screen.getByRole("status");
    const footer = screen.getByText("Footer");
    const heading = screen.getByRole("heading", { level: 1, name: "Sign in" });
    action.focus();
    rerender(<Auth title="Session expired" />);
    expect(screen.getByRole("heading", { level: 1, name: "Session expired" })).toBeVisible();
    expect(screen.getByText("Session expired description")).toBeVisible();
    // Only the keyed title/description block is replaced.
    expect(heading).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBe(action);
    expect(screen.getByRole("status")).toBe(status);
    expect(screen.getByText("Footer")).toBe(footer);
    expect(action).toHaveFocus();
    // The keyed block contains no focusable control (focus could not be lost to the remount).
    expect(screen.getByRole("heading", { level: 1 }).parentElement?.querySelectorAll("a, button, input, select, textarea, [tabindex]")).toHaveLength(0);
    // Same title: no remount.
    const current = screen.getByRole("heading", { level: 1 });
    rerender(<Auth title="Session expired" />);
    expect(screen.getByRole("heading", { level: 1 })).toBe(current);
  });
});
