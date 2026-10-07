import axe from "axe-core";
import { expect } from "vitest";

/** Run axe-core on a container and fail with readable violations. */
export async function expectNoA11yViolations(container: Element = document.body) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } }, // jsdom can't compute styles/layout
  });
  const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
  expect(summary).toEqual([]);
}
