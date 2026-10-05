import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
});
