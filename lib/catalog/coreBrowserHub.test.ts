import assert from "node:assert/strict";
import test from "node:test";
import {
  coreBrowserConceptSection,
  withCoreBrowserConceptGroups,
} from "./coreBrowserHub";

test("coreBrowserConceptSection maps concepts to Browser work vs platform", () => {
  assert.equal(
    coreBrowserConceptSection("Navigation and fetching"),
    "Browser work principles",
  );
  assert.equal(
    coreBrowserConceptSection("Browser platform architecture"),
    "Browser platform",
  );
  assert.equal(
    coreBrowserConceptSection("Security model overview"),
    "Browser platform",
  );
});

test("withCoreBrowserConceptGroups assigns groups in handbook order", () => {
  const items = withCoreBrowserConceptGroups([
    { title: "Browser work principles" },
    { title: "Event loop and task queues" },
    { title: "Web platform stack (HTML, CSS, JavaScript)" },
  ]);
  assert.deepEqual(
    items.map((item) => [item.title, item.group ?? null]),
    [
      ["Browser work principles", "Browser work principles"],
      ["Event loop and task queues", "Browser work principles"],
      ["Web platform stack (HTML, CSS, JavaScript)", "Browser platform"],
    ],
  );
});
