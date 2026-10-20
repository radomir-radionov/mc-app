import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handbookNavSections } from "./handbook";
import { enrichNavSections, mergeTopicConcepts } from "./enrichNav";
import { sectionSwitchHref } from "./sections";

describe("enrichNavSections", () => {
  it("keeps conspect and interview section trees separate", () => {
    const structure = handbookNavSections("en");
    const loaded = new Map([
      [
        "frontend",
        structure.flatMap((section) =>
          section.groups.filter((group) => group.id === "frontend"),
        ),
      ],
    ]);

    const enriched = enrichNavSections(structure, loaded);
    const conspectFrontend = enriched
      .find((section) => section.id === "conspect")
      ?.groups.find((group) => group.id === "frontend");
    const interviewsFrontend = enriched
      .find((section) => section.id === "interviews")
      ?.groups.find((group) => group.id === "frontend");

    assert.ok(conspectFrontend);
    assert.ok(interviewsFrontend);
    assert.notDeepEqual(conspectFrontend.entries, interviewsFrontend.entries);

    assert.equal(
      sectionSwitchHref(enriched, "/en/frontend/html-interview", "conspect"),
      "/en/frontend/html-core",
    );
    assert.equal(
      sectionSwitchHref(enriched, "/en/frontend/css", "interviews"),
      "/en/frontend/css-interview",
    );
  });

  it("appends shell outline concepts missing from a stale search index", () => {
    const structure = handbookNavSections("en");
    const basicsHref = "/en/frontend/ts-basics";
    const shell = structure.flatMap((section) => section.groups);
    const basicsTopic = shell
      .flatMap((group) => group.entries)
      .find(
        (entry) =>
          entry.kind === "subject" &&
          entry.subject.clusters.some((cluster) =>
            cluster.topics.some((topic) => topic.href === basicsHref),
          ),
      );
    assert.ok(basicsTopic?.kind === "subject");

    const topicInShell = basicsTopic.subject.clusters
      .flatMap((cluster) => cluster.topics)
      .find((topic) => topic.href === basicsHref);
    assert.ok(topicInShell);
    const modern = topicInShell.concepts.find(
      (concept) => concept.id === "modern-typescript",
    );
    assert.ok(modern);

    const staleRich = {
      ...topicInShell,
      concepts: topicInShell.concepts.filter(
        (concept) => concept.id !== "modern-typescript",
      ),
    };
    const loaded = new Map([
      [
        "frontend",
        [
          {
            id: "frontend" as const,
            title: "Frontend",
            href: "/en/frontend",
            entries: [{ kind: "topic" as const, topic: staleRich }],
          },
        ],
      ],
    ]);

    const enriched = enrichNavSections(structure, loaded);
    const enrichedBasics = enriched
      .flatMap((section) => section.groups)
      .flatMap((group) => group.entries)
      .flatMap((entry) =>
        entry.kind === "subject"
          ? entry.subject.clusters.flatMap((cluster) => cluster.topics)
          : entry.kind === "topic"
            ? [entry.topic]
            : [],
      )
      .find((topic) => topic.href === basicsHref);

    assert.ok(
      enrichedBasics?.concepts.some((c) => c.id === "modern-typescript"),
    );
  });

  it("keeps concept group from the rich index when the shell outline lacks it", () => {
    const merged = mergeTopicConcepts(
      [{ id: "flexbox", title: "Flexbox" }],
      [{ id: "flexbox", title: "Flexbox", group: "Flexbox" }],
    );
    assert.equal(merged[0]?.group, "Flexbox");
  });
});

describe("mergeTopicConcepts", () => {
  it("preserves group when search text is unchanged", () => {
    const merged = mergeTopicConcepts(
      [{ id: "a", title: "A", searchText: "alpha" }],
      [{ id: "a", title: "A", searchText: "alpha", group: "Section A" }],
    );
    assert.equal(merged[0]?.group, "Section A");
  });
});
