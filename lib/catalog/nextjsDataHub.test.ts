import assert from "node:assert/strict";
import test from "node:test";
import {
  nextjsDataConceptSection,
  withNextjsDataConceptGroups,
} from "./nextjsDataHub";

test("nextjsDataConceptSection maps concepts to handbook sections", () => {
  assert.equal(
    nextjsDataConceptSection("Server Component fetching"),
    "Data fetching",
  );
  assert.equal(
    nextjsDataConceptSection("Choosing a data fetch path"),
    "Data fetching",
  );
  assert.equal(
    nextjsDataConceptSection("Fetching from a remote API"),
    "Data fetching",
  );
  assert.equal(
    nextjsDataConceptSection("Colocated backend in Next.js"),
    "Data fetching",
  );
  assert.equal(
    nextjsDataConceptSection("revalidateTag"),
    "Caching & revalidation",
  );
  assert.equal(
    nextjsDataConceptSection("Server Actions"),
    "Server Actions vs Route Handlers",
  );
  assert.equal(
    nextjsDataConceptSection("Handling CORS in Next.js"),
    "Server Actions vs Route Handlers",
  );
  assert.equal(
    nextjsDataConceptSection("Handling mutations in Next.js"),
    "Server Actions vs Route Handlers",
  );
});

test("withNextjsDataConceptGroups assigns groups in handbook order", () => {
  const items = withNextjsDataConceptGroups([
    { title: "draftMode" },
    { title: "updateTag" },
    { title: "Route Handlers" },
  ]);
  assert.deepEqual(
    items.map((item) => [item.title, item.group ?? null]),
    [
      ["draftMode", "Data fetching"],
      ["updateTag", "Caching & revalidation"],
      ["Route Handlers", "Server Actions vs Route Handlers"],
    ],
  );
});
