import { navTopics } from "./search";
import type {
  NavCluster,
  NavEntry,
  NavGroup,
  NavRootSection,
  NavSubject,
  NavTopic,
} from "./types";

export function mergeTopicConcepts(
  baseConcepts: NavTopic["concepts"],
  richConcepts: NavTopic["concepts"],
): NavTopic["concepts"] {
  if (richConcepts.length === 0) {
    return baseConcepts;
  }
  if (baseConcepts.length === 0) {
    return richConcepts;
  }
  const richById = new Map(
    richConcepts.map((concept) => [concept.id, concept]),
  );
  return baseConcepts.map((concept) => {
    const rich = richById.get(concept.id);
    if (!rich) {
      return concept;
    }
    if (
      rich.searchText === concept.searchText &&
      rich.titleSearchText === concept.titleSearchText
    ) {
      if (!concept.group && rich.group) {
        return { ...concept, group: rich.group };
      }
      return concept;
    }
    return {
      ...concept,
      ...(rich.searchText ? { searchText: rich.searchText } : {}),
      ...(rich.titleSearchText
        ? { titleSearchText: rich.titleSearchText }
        : {}),
      ...(concept.group
        ? { group: concept.group }
        : rich.group
          ? { group: rich.group }
          : {}),
    };
  });
}

function enrichTopic(
  base: NavTopic,
  richByTopicHref: ReadonlyMap<string, NavTopic>,
): NavTopic {
  const rich = richByTopicHref.get(base.href);
  if (!rich || rich.concepts.length === 0) {
    return base;
  }
  const concepts = mergeTopicConcepts(base.concepts, rich.concepts);
  if (concepts === base.concepts) {
    return base;
  }
  return { ...base, concepts };
}

function enrichCluster(
  cluster: NavCluster,
  richByTopicHref: ReadonlyMap<string, NavTopic>,
): NavCluster {
  return {
    ...cluster,
    topics: cluster.topics.map((topic) => enrichTopic(topic, richByTopicHref)),
  };
}

function enrichSubject(
  subject: NavSubject,
  richByTopicHref: ReadonlyMap<string, NavTopic>,
): NavSubject {
  const mapClusters = (clusters: readonly NavCluster[]) =>
    clusters.map((cluster) => enrichCluster(cluster, richByTopicHref));
  return {
    ...subject,
    sections: subject.sections?.map((section) => ({
      ...section,
      clusters: mapClusters(section.clusters),
    })),
    clusters: mapClusters(subject.clusters),
    clustersAfterSections: subject.clustersAfterSections
      ? mapClusters(subject.clustersAfterSections)
      : undefined,
  };
}

function enrichEntry(
  entry: NavEntry,
  richByTopicHref: ReadonlyMap<string, NavTopic>,
): NavEntry {
  switch (entry.kind) {
    case "topic":
      return {
        kind: "topic",
        topic: enrichTopic(entry.topic, richByTopicHref),
      };
    case "subject":
      return {
        kind: "subject",
        subject: enrichSubject(entry.subject, richByTopicHref),
      };
    case "cluster":
      return {
        kind: "cluster",
        subjectHref: entry.subjectHref,
        cluster: enrichCluster(entry.cluster, richByTopicHref),
      };
    default: {
      const _never: never = entry;
      return _never;
    }
  }
}

function enrichGroup(
  group: NavGroup,
  richByTopicHref: ReadonlyMap<string, NavTopic>,
): NavGroup {
  return {
    ...group,
    leafTopic: group.leafTopic
      ? enrichTopic(group.leafTopic, richByTopicHref)
      : undefined,
    hubTopic: group.hubTopic
      ? enrichTopic(group.hubTopic, richByTopicHref)
      : undefined,
    entries: group.entries.map((entry) => enrichEntry(entry, richByTopicHref)),
  };
}

function richTopicsByHref(
  loadedByTrack: ReadonlyMap<string, readonly NavGroup[]>,
): Map<string, NavTopic> {
  const richByTopicHref = new Map<string, NavTopic>();
  for (const groups of loadedByTrack.values()) {
    for (const group of groups) {
      for (const topic of navTopics([group])) {
        if (!richByTopicHref.has(topic.href)) {
          richByTopicHref.set(topic.href, topic);
        }
      }
    }
  }
  return richByTopicHref;
}

export function enrichNavSections(
  structure: readonly NavRootSection[],
  loadedByTrack: ReadonlyMap<string, readonly NavGroup[]>,
): NavRootSection[] {
  if (loadedByTrack.size === 0) {
    return [...structure];
  }

  const richByTopicHref = richTopicsByHref(loadedByTrack);

  return structure.map((section) => ({
    ...section,
    groups: section.groups.map((group) => enrichGroup(group, richByTopicHref)),
  }));
}
