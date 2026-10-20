import assert from "node:assert/strict";
import test from "node:test";
import {
  cssLayoutConceptSection,
  withCssLayoutConceptGroups,
} from "./cssLayoutHub";

test("cssLayoutConceptSection maps layout concepts to handbook sections", () => {
  assert.equal(
    cssLayoutConceptSection("Positioning"),
    "Positioning & stacking",
  );
  assert.equal(cssLayoutConceptSection("Flex container properties"), "Flexbox");
  assert.equal(cssLayoutConceptSection("CSS Grid"), "CSS Grid");
  assert.equal(cssLayoutConceptSection("Grid tracks and minmax"), "CSS Grid");
  assert.equal(
    cssLayoutConceptSection("Media queries"),
    "Responsive Design & Container Queries",
  );
  assert.equal(
    cssLayoutConceptSection("Safe areas & viewport units"),
    "Scroll, Touch & Mobile Viewport",
  );
});

test("withCssLayoutConceptGroups assigns groups in handbook order", () => {
  const items = withCssLayoutConceptGroups([
    { title: "Positioning" },
    { title: "Flexbox" },
    { title: "CSS Grid" },
    { title: "Media queries" },
  ]);
  assert.deepEqual(
    items.map((item) => [item.title, item.group ?? null]),
    [
      ["Positioning", "Positioning & stacking"],
      ["Flexbox", "Flexbox"],
      ["CSS Grid", "CSS Grid"],
      ["Media queries", "Responsive Design & Container Queries"],
    ],
  );
});
