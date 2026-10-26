import assert from "node:assert/strict";
import test from "node:test";
import { sectionSearchGroups } from "./sectionSearchGroups";
import type { NavGroup } from "./types";
import type { TrackId } from "@/lib/catalog";

function group(id: TrackId, title?: string): NavGroup {
  return { id, title: title ?? id, href: `/en/${id}`, entries: [] };
}

test("sectionSearchGroups keeps sidebar groups in titles mode", () => {
  const section = [group("frontend")];
  const corpus = [group("frontend"), group("backend")];
  assert.equal(sectionSearchGroups(section, corpus, "titles"), section);
});

test("sectionSearchGroups intersects the notes corpus by track id", () => {
  const section = [group("frontend", "Sidebar frontend")];
  const frontend = group("frontend", "Corpus frontend");
  const corpus = [frontend, group("backend", "Corpus backend")];
  const notes = sectionSearchGroups(section, corpus, "notes");
  assert.deepEqual(
    notes.map((item) => item.title),
    ["Corpus frontend"],
  );
  assert.equal(notes[0], frontend);
  assert.equal(sectionSearchGroups(section, null, "notes"), section);
});
