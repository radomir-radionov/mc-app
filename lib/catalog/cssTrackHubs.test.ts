import assert from "node:assert/strict";
import test from "node:test";
import { cssCoreConceptSection } from "./cssCoreHub";
import { cssArchitectureConceptSection } from "./cssArchitectureHub";
import { cssLayoutConceptSection } from "./cssLayoutHub";

test("css core maps to Core vs Selectors vs Box Model sections", () => {
  assert.equal(cssCoreConceptSection("Ways to add CSS"), "Core");
  assert.equal(
    cssCoreConceptSection("Specificity calculation"),
    "Selectors & Cascade",
  );
  assert.equal(cssCoreConceptSection("CSS box model"), "Box Model & Display");
});

test("css architecture maps tooling and performance", () => {
  assert.equal(
    cssArchitectureConceptSection("Tailwind CSS (utility-first)"),
    "Architecture & Tooling",
  );
  assert.equal(cssArchitectureConceptSection("Critical CSS"), "Performance");
});

test("css layout flex/grid sections unchanged", () => {
  assert.equal(cssLayoutConceptSection("Flexbox"), "Flexbox");
  assert.equal(cssLayoutConceptSection("Grid tracks and minmax"), "CSS Grid");
});
