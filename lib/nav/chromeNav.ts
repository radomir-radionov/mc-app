import type {
  NavCluster,
  NavConcept,
  NavEntry,
  NavGroup,
  NavRootSection,
  NavSubject,
  NavTopic,
} from "./types";

export function withoutSearchTextSections(
  sections: readonly NavRootSection[],
): NavRootSection[] {
  return sections.map((section) => ({
    ...section,
    groups: withoutSearchText(section.groups),
  }));
}

export function withoutConceptsSections(
  sections: readonly NavRootSection[],
): NavRootSection[] {
  return sections.map((section) => ({
    ...section,
    groups: withoutConcepts(section.groups),
  }));
}

/** Sidebar outline (id + title) without search corpus — merged with search index on the client. */
export function withSidebarConceptOutlinesSections(
  sections: readonly NavRootSection[],
): NavRootSection[] {
  return sections.map((section) => ({
    ...section,
    groups: withSidebarConceptOutlines(section.groups),
  }));
}

export function withoutConcepts(groups: readonly NavGroup[]): NavGroup[] {
  return groups.map((group) => ({
    ...group,
    leafTopic: group.leafTopic ? chromeTopicShell(group.leafTopic) : undefined,
    hubTopic: group.hubTopic ? chromeTopicShell(group.hubTopic) : undefined,
    entries: group.entries.map(chromeEntryShell),
  }));
}

export function withSidebarConceptOutlines(
  groups: readonly NavGroup[],
): NavGroup[] {
  return groups.map((group) => ({
    ...group,
    leafTopic: group.leafTopic
      ? chromeTopicSidebarOutline(group.leafTopic)
      : undefined,
    hubTopic: group.hubTopic
      ? chromeTopicSidebarOutline(group.hubTopic)
      : undefined,
    entries: group.entries.map(chromeEntrySidebarOutline),
  }));
}

export function withoutSearchText(groups: readonly NavGroup[]): NavGroup[] {
  return groups.map((group) => ({
    ...group,
    leafTopic: group.leafTopic ? chromeTopic(group.leafTopic) : undefined,
    hubTopic: group.hubTopic ? chromeTopic(group.hubTopic) : undefined,
    entries: group.entries.map(chromeEntry),
  }));
}

function chromeEntry(entry: NavEntry): NavEntry {
  switch (entry.kind) {
    case "topic":
      return { kind: "topic", topic: chromeTopic(entry.topic) };
    case "subject":
      return { kind: "subject", subject: chromeSubject(entry.subject) };
    case "cluster":
      return {
        kind: "cluster",
        subjectHref: entry.subjectHref,
        cluster: chromeCluster(entry.cluster),
      };
    default: {
      const _never: never = entry;
      return _never;
    }
  }
}

function chromeSubject(subject: NavSubject): NavSubject {
  const mapClusters = (clusters: readonly NavCluster[]) =>
    clusters.map(chromeCluster);
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

function chromeCluster(cluster: NavCluster): NavCluster {
  return {
    ...cluster,
    topics: cluster.topics.map(chromeTopic),
  };
}

function chromeTopic(topic: NavTopic): NavTopic {
  return {
    ...topic,
    concepts: topic.concepts.map(chromeConcept),
    ...(topic.nestedTopics
      ? { nestedTopics: topic.nestedTopics.map(chromeTopic) }
      : {}),
  };
}

function chromeTopicShell(topic: NavTopic): NavTopic {
  return {
    slug: topic.slug,
    href: topic.href,
    title: topic.title,
    blurb: topic.blurb,
    concepts: [],
    ...(topic.hideSidebarConcepts ? { hideSidebarConcepts: true } : {}),
    ...(topic.nestedTopics
      ? { nestedTopics: topic.nestedTopics.map(chromeTopicShell) }
      : {}),
  };
}

function chromeConceptOutline(concept: NavConcept): NavConcept {
  return {
    id: concept.id,
    title: concept.title,
    interviewSection: concept.interviewSection,
    ...(concept.group ? { group: concept.group } : {}),
  };
}

function chromeTopicSidebarOutline(topic: NavTopic): NavTopic {
  return {
    slug: topic.slug,
    href: topic.href,
    title: topic.title,
    blurb: topic.blurb,
    concepts: topic.concepts.map(chromeConceptOutline),
    ...(topic.hideSidebarConcepts ? { hideSidebarConcepts: true } : {}),
    ...(topic.nestedTopics
      ? { nestedTopics: topic.nestedTopics.map(chromeTopicSidebarOutline) }
      : {}),
  };
}

function chromeEntryShell(entry: NavEntry): NavEntry {
  switch (entry.kind) {
    case "topic":
      return { kind: "topic", topic: chromeTopicShell(entry.topic) };
    case "subject":
      return { kind: "subject", subject: chromeSubjectShell(entry.subject) };
    case "cluster":
      return {
        kind: "cluster",
        subjectHref: entry.subjectHref,
        cluster: chromeClusterShell(entry.cluster),
      };
    default: {
      const _never: never = entry;
      return _never;
    }
  }
}

function chromeEntrySidebarOutline(entry: NavEntry): NavEntry {
  switch (entry.kind) {
    case "topic":
      return { kind: "topic", topic: chromeTopicSidebarOutline(entry.topic) };
    case "subject":
      return {
        kind: "subject",
        subject: chromeSubjectSidebarOutline(entry.subject),
      };
    case "cluster":
      return {
        kind: "cluster",
        subjectHref: entry.subjectHref,
        cluster: chromeClusterSidebarOutline(entry.cluster),
      };
    default: {
      const _never: never = entry;
      return _never;
    }
  }
}

function chromeSubjectShell(subject: NavSubject): NavSubject {
  const mapClusters = (clusters: readonly NavCluster[]) =>
    clusters.map(chromeClusterShell);
  return {
    slug: subject.slug,
    href: subject.href,
    title: subject.title,
    blurb: subject.blurb,
    flatNav: subject.flatNav,
    sections: subject.sections?.map((section) => ({
      id: section.id,
      title: section.title,
      defaultOpen: section.defaultOpen,
      collapsible: section.collapsible,
      flatNav: section.flatNav,
      clusters: mapClusters(section.clusters),
    })),
    clusters: mapClusters(subject.clusters),
    clustersAfterSections: subject.clustersAfterSections
      ? mapClusters(subject.clustersAfterSections)
      : undefined,
  };
}

function chromeClusterShell(cluster: NavCluster): NavCluster {
  return {
    id: cluster.id,
    title: cluster.title,
    href: cluster.href,
    topics: cluster.topics.map(chromeTopicShell),
  };
}

function chromeSubjectSidebarOutline(subject: NavSubject): NavSubject {
  const mapClusters = (clusters: readonly NavCluster[]) =>
    clusters.map(chromeClusterSidebarOutline);
  return {
    slug: subject.slug,
    href: subject.href,
    title: subject.title,
    blurb: subject.blurb,
    flatNav: subject.flatNav,
    sections: subject.sections?.map((section) => ({
      id: section.id,
      title: section.title,
      defaultOpen: section.defaultOpen,
      collapsible: section.collapsible,
      flatNav: section.flatNav,
      clusters: mapClusters(section.clusters),
    })),
    clusters: mapClusters(subject.clusters),
    clustersAfterSections: subject.clustersAfterSections
      ? mapClusters(subject.clustersAfterSections)
      : undefined,
  };
}

function chromeClusterSidebarOutline(cluster: NavCluster): NavCluster {
  return {
    id: cluster.id,
    title: cluster.title,
    href: cluster.href,
    topics: cluster.topics.map(chromeTopicSidebarOutline),
  };
}

function chromeConcept(concept: NavConcept): NavConcept {
  return {
    id: concept.id,
    title: concept.title,
    titleSearchText: concept.titleSearchText,
    interviewSection: concept.interviewSection,
    ...(concept.group ? { group: concept.group } : {}),
  };
}
