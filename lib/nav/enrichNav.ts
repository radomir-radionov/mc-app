import { navTopics } from "./search";
import { trackIndexesForLocale } from "./trackIndexCache";
import type {
  NavCluster,
  NavEntry,
  NavGroup,
  NavRootSection,
  NavSection,
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
  let changed = false;
  const merged = baseConcepts.map((concept) => {
    const rich = richById.get(concept.id);
    if (!rich) {
      return concept;
    }
    if (
      rich.searchText === concept.searchText &&
      rich.titleSearchText === concept.titleSearchText
    ) {
      if (!concept.group && rich.group) {
        changed = true;
        return { ...concept, group: rich.group };
      }
      return concept;
    }
    changed = true;
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
  return changed ? merged : baseConcepts;
}

function sameItems<T>(left: readonly T[], right: readonly T[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function enrichTopic(
  base: NavTopic,
  richByTopicHref: ReadonlyMap<string, NavTopic>,
): NavTopic {
  const rich = richByTopicHref.get(base.href);
  const concepts =
    rich && rich.concepts.length > 0
      ? mergeTopicConcepts(base.concepts, rich.concepts)
      : base.concepts;
  const nestedTopics = base.nestedTopics?.map((nested) =>
    enrichTopic(nested, richByTopicHref),
  );
  const nestedUnchanged =
    nestedTopics === undefined ||
    (base.nestedTopics !== undefined &&
      sameItems(base.nestedTopics, nestedTopics));
  if (concepts === base.concepts && nestedUnchanged) {
    return base;
  }
  if (nestedUnchanged) {
    return { ...base, concepts };
  }
  return { ...base, concepts, nestedTopics };
}

function enrichCluster(
  cluster: NavCluster,
  richByTopicHref: ReadonlyMap<string, NavTopic>,
): NavCluster {
  const topics = cluster.topics.map((topic) =>
    enrichTopic(topic, richByTopicHref),
  );
  if (sameItems(cluster.topics, topics)) {
    return cluster;
  }
  return { ...cluster, topics };
}

function enrichSubjectSection(
  section: NavSection,
  richByTopicHref: ReadonlyMap<string, NavTopic>,
): NavSection {
  const clusters = section.clusters.map((cluster) =>
    enrichCluster(cluster, richByTopicHref),
  );
  if (sameItems(section.clusters, clusters)) {
    return section;
  }
  return { ...section, clusters };
}

function enrichSubject(
  subject: NavSubject,
  richByTopicHref: ReadonlyMap<string, NavTopic>,
): NavSubject {
  const sections = subject.sections?.map((section) =>
    enrichSubjectSection(section, richByTopicHref),
  );
  const clusters = subject.clusters.map((cluster) =>
    enrichCluster(cluster, richByTopicHref),
  );
  const clustersAfterSections = subject.clustersAfterSections?.map((cluster) =>
    enrichCluster(cluster, richByTopicHref),
  );
  const sectionsUnchanged =
    sections === undefined ||
    (subject.sections !== undefined && sameItems(subject.sections, sections));
  const afterUnchanged =
    clustersAfterSections === undefined ||
    (subject.clustersAfterSections !== undefined &&
      sameItems(subject.clustersAfterSections, clustersAfterSections));
  if (
    sectionsUnchanged &&
    sameItems(subject.clusters, clusters) &&
    afterUnchanged
  ) {
    return subject;
  }
  return {
    ...subject,
    sections,
    clusters,
    clustersAfterSections,
  };
}

function enrichEntry(
  entry: NavEntry,
  richByTopicHref: ReadonlyMap<string, NavTopic>,
): NavEntry {
  switch (entry.kind) {
    case "topic": {
      const topic = enrichTopic(entry.topic, richByTopicHref);
      if (topic === entry.topic) {
        return entry;
      }
      return { kind: "topic", topic };
    }
    case "subject": {
      const subject = enrichSubject(entry.subject, richByTopicHref);
      if (subject === entry.subject) {
        return entry;
      }
      return { kind: "subject", subject };
    }
    case "cluster": {
      const cluster = enrichCluster(entry.cluster, richByTopicHref);
      if (cluster === entry.cluster) {
        return entry;
      }
      return {
        kind: "cluster",
        subjectHref: entry.subjectHref,
        cluster,
      };
    }
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
  const leafTopic = group.leafTopic
    ? enrichTopic(group.leafTopic, richByTopicHref)
    : undefined;
  const hubTopic = group.hubTopic
    ? enrichTopic(group.hubTopic, richByTopicHref)
    : undefined;
  const entries = group.entries.map((entry) =>
    enrichEntry(entry, richByTopicHref),
  );
  if (
    leafTopic === group.leafTopic &&
    hubTopic === group.hubTopic &&
    sameItems(group.entries, entries)
  ) {
    return group;
  }
  return { ...group, leafTopic, hubTopic, entries };
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

function enrichSection(
  section: NavRootSection,
  richByTopicHref: ReadonlyMap<string, NavTopic>,
): NavRootSection {
  const groups = section.groups.map((group) =>
    enrichGroup(group, richByTopicHref),
  );
  if (sameItems(section.groups, groups)) {
    return section;
  }
  return { ...section, groups };
}

export function enrichNavSections(
  structure: readonly NavRootSection[],
  loadedByTrack: ReadonlyMap<string, readonly NavGroup[]>,
  locale?: string,
): readonly NavRootSection[] {
  const indexes = locale
    ? trackIndexesForLocale(loadedByTrack, locale)
    : loadedByTrack;
  if (indexes.size === 0) {
    return structure;
  }

  const richByTopicHref = richTopicsByHref(indexes);
  const sections = structure.map((section) =>
    enrichSection(section, richByTopicHref),
  );
  if (sameItems(structure, sections)) {
    return structure;
  }
  return sections;
}
