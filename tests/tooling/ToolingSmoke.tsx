import { useState } from "react";

// Test-only composition proving the runners; not a production UI atom.
export function ToolingSmoke() {
  const [count, setCount] = useState(0);

  return (
    <section aria-label="Toolchain smoke check" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0" }}>
      {/* Restore native button styling removed by Tailwind's reset in this tooling-only demo. */}
      <button type="button" style={{ all: "revert", cursor: "pointer" }} onClick={() => { setCount((value) => value + 1); }}>
        Increment smoke count
      </button>
      <output aria-live="polite">Smoke count: {count}</output>
    </section>
  );
}
