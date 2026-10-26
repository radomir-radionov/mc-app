import assert from "node:assert/strict";
import test from "node:test";
import { nextConceptHash } from "./conceptHash";

const concepts = [
  { id: "closures", title: "Closures" },
  { id: "promises", title: "Promises" },
];

test("nextConceptHash keeps an arrival hash until the query is edited", () => {
  assert.equal(
    nextConceptHash({
      concepts,
      query: "prom",
      mode: "titles",
      currentHash: "closures",
      arrivalHash: "closures",
      queryEdited: false,
    }),
    null,
  );
  assert.equal(
    nextConceptHash({
      concepts,
      query: "prom",
      mode: "titles",
      currentHash: "closures",
      arrivalHash: "closures",
      queryEdited: true,
    }),
    "promises",
  );
});

test("nextConceptHash jumps when the page was opened without a hash", () => {
  assert.equal(
    nextConceptHash({
      concepts,
      query: "prom",
      mode: "titles",
      currentHash: "",
      arrivalHash: "",
      queryEdited: false,
    }),
    "promises",
  );
});
