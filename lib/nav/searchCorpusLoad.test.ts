import assert from "node:assert/strict";
import test from "node:test";
import type { TrackId } from "@/lib/catalog";
import { loadSearchCorpusTracks } from "./searchCorpusLoad";
import type { NavGroup } from "./types";

test("loadSearchCorpusTracks keeps tracks when one index fails", async () => {
  const groups = await loadSearchCorpusTracks("en", async (_locale, trackId) => {
    if (trackId === "backend") {
      throw new Error("missing");
    }
    const group: NavGroup = {
      id: trackId,
      title: trackId,
      href: `/en/${trackId}`,
      entries: [],
    };
    return [group];
  });

  const ids = groups.map((group) => group.id);
  assert.ok(ids.includes("frontend"));
  assert.equal(ids.includes("backend" as TrackId), false);
  assert.ok(ids.includes("behavior"));
});
