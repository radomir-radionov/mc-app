import {
  SUBJECTS,
  TRACKS,
  clusterTargetHref,
  getSubject,
  getTopic,
  hubFileForTrack,
  leafTopicForTrack,
  subjectHref,
  subjectClusterNavPlacement,
  topicHref,
  topicsForCluster,
  topicsForTrack,
  trackHref,
  type Topic,
  type TrackId,
} from "@/lib/catalog";
import { catalogBlurb } from "@/lib/i18n/catalog";
import {
  isBehaviorQuestionsTopic,
  localizeBehaviorOutline,
} from "@/lib/i18n/behaviorQuestions";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";
import { loadFileOutline, loadTopicOutline } from "@/lib/parse";
import {
  filterInterviewConcepts,
  isInterviewSectionTopic,
  isQuestionCluster,
  sameTitle,
  shouldHideSidebarConcepts,
} from "./navUtils";
import type {
  NavCluster,
  NavEntry,
  NavGroup,
  NavRootSection,
  NavRootSectionId,
  NavSubject,
  NavTopic,
} from "./types";
import { allNavGroups } from "./sections";

function localizeHref(locale: Locale, href: string): string {
  return withLocale(locale, href);
}

function hubNavTopic(
  trackId: (typeof TRACKS)[number]["id"],
  locale: Locale,
): NavTopic | undefined {
  const file = hubFileForTrack(trackId);
  if (!file) {
    return undefined;
  }
  const concepts = loadFileOutline(file, locale);
  if (concepts.length === 0) {
    return undefined;
  }
  return {
    slug: "hub",
    href: localizeHref(locale, trackHref(trackId)),
    title: "",
    blurb: "",
    concepts,
  };
}

function toNavTopic(topic: Topic, locale: Locale): NavTopic {
  const outline = filterInterviewConcepts(
    topic,
    loadTopicOutline(topic, locale),
  );
  return {
    slug: topic.slug,
    href: localizeHref(locale, topicHref(topic)),
    title: catalogBlurb(locale, topic.title),
    blurb: catalogBlurb(locale, topic.blurb),
    concepts: isBehaviorQuestionsTopic(topic)
      ? localizeBehaviorOutline(outline, locale)
      : outline,
    hideSidebarConcepts: shouldHideSidebarConcepts(topic),
  };
}

function navTopicsForCluster(
  subject: (typeof SUBJECTS)[number],
  clusterId: string,
  locale: Locale,
): NavTopic[] {
  const visible = topicsForCluster(subject, clusterId);
  const nestedByParent = new Map<string, NavTopic[]>();
  for (const topic of topicsForCluster(subject, clusterId, {
    includeHiddenNav: true,
  })) {
    if (!topic.navParentSlug) {
      continue;
    }
    const nested = toNavTopic(topic, locale);
    const list = nestedByParent.get(topic.navParentSlug) ?? [];
    list.push(nested);
    nestedByParent.set(topic.navParentSlug, list);
  }
  return visible.map((topic) => {
    const nav = toNavTopic(topic, locale);
    const nestedTopics = nestedByParent.get(topic.slug);
    return nestedTopics?.length ? { ...nav, nestedTopics } : nav;
  });
}

function entriesForTrack(
  trackId: (typeof TRACKS)[number]["id"],
  locale: Locale,
): readonly NavEntry[] {
  const seenSubjects = new Set<string>();
  const entries: NavEntry[] = [];

  for (const topic of topicsForTrack(trackId)) {
    if (topic.grouping) {
      if (seenSubjects.has(topic.grouping.subject)) {
        continue;
      }
      seenSubjects.add(topic.grouping.subject);
      const subject = SUBJECTS.find(
        (item) =>
          item.track === trackId && item.slug === topic.grouping?.subject,
      );
      if (!subject) {
        continue;
      }
      const clusters = subject.clusters
        .map((cluster) => ({
          id: cluster.id,
          title: cluster.title,
          href: localizeHref(locale, clusterTargetHref(subject, cluster)),
          topics: navTopicsForCluster(subject, cluster.id, locale),
        }))
        .filter((cluster) => cluster.topics.length > 0);
      if (clusters.length === 0) {
        continue;
      }
      const sections = subject.sections?.map((section) => ({
        id: section.id,
        title: section.title,
        defaultOpen: section.defaultOpen,
        collapsible: section.collapsible,
        flatNav: section.flatNav,
        clusters: clusters.filter((cluster) => {
          const definition = subject.clusters.find(
            (item) => item.id === cluster.id,
          );
          return definition
            ? subjectClusterNavPlacement(definition) === "section" &&
                definition.section === section.id
            : false;
        }),
      }));
      const rootClusters = clusters.filter((cluster) => {
        const definition = subject.clusters.find(
          (item) => item.id === cluster.id,
        );
        return definition
          ? subjectClusterNavPlacement(definition) === "root"
          : false;
      });
      const clustersAfterSections = clusters.filter((cluster) => {
        const definition = subject.clusters.find(
          (item) => item.id === cluster.id,
        );
        return definition
          ? subjectClusterNavPlacement(definition) === "after-sections"
          : false;
      });
      entries.push({
        kind: "subject",
        subject: {
          slug: subject.slug,
          href: localizeHref(locale, subjectHref(subject)),
          title: subject.title,
          blurb: catalogBlurb(locale, subject.blurb),
          sections: sections?.length ? sections : undefined,
          clusters: sections?.length ? rootClusters : clusters,
          clustersAfterSections: sections?.length
            ? clustersAfterSections
            : undefined,
        },
      });
      continue;
    }

    entries.push({ kind: "topic", topic: toNavTopic(topic, locale) });
  }

  return entries;
}

function isGenericQuestionTitle(title: string): boolean {
  return title === "Interview" || title === "Tasks";
}

function hoistedTopicTitle(
  trackId: TrackId,
  subject: NavSubject,
  cluster: NavCluster,
  topic: NavTopic,
  locale: Locale,
): string {
  if (!isGenericQuestionTitle(topic.title)) {
    return topic.title;
  }
  const catalogSubject = getSubject(trackId, subject.slug);
  const definition = catalogSubject?.clusters.find(
    (item) => item.id === cluster.id,
  );
  const section = catalogSubject?.sections?.find(
    (item) => item.id === definition?.section,
  );
  if (section) {
    return catalogBlurb(locale, section.title);
  }
  return subject.title;
}

function takeQuestionClusters(
  trackId: TrackId,
  subject: NavSubject,
  locale: Locale,
): {
  readonly subject: NavSubject;
  readonly interview: readonly NavTopic[];
  readonly tasks: readonly NavTopic[];
} {
  const interview: NavTopic[] = [];
  const tasks: NavTopic[] = [];

  const split = (clusters: readonly NavCluster[]): NavCluster[] => {
    const kept: NavCluster[] = [];
    for (const cluster of clusters) {
      if (!isQuestionCluster(cluster.id)) {
        kept.push(cluster);
        continue;
      }
      const topics = cluster.topics.map((topic) => ({
        ...topic,
        title: hoistedTopicTitle(trackId, subject, cluster, topic, locale),
      }));
      if (cluster.id === "tasks" || cluster.id.endsWith("-tasks")) {
        tasks.push(...topics);
      } else {
        interview.push(...topics);
      }
    }
    return kept;
  };

  const root = split(subject.clusters);
  const sections = subject.sections
    ?.map((section) => ({ ...section, clusters: split(section.clusters) }))
    .filter((section) => section.clusters.length > 0);
  const after = subject.clustersAfterSections
    ? split(subject.clustersAfterSections)
    : undefined;

  return {
    subject: {
      ...subject,
      clusters: root,
      sections: sections?.length ? sections : undefined,
      clustersAfterSections: after?.length ? after : undefined,
    },
    interview,
    tasks,
  };
}

function questionClusterEntry(
  trackHref: string,
  id: string,
  title: string,
  topics: readonly NavTopic[],
): NavEntry | null {
  if (topics.length === 0) {
    return null;
  }
  return {
    kind: "cluster",
    subjectHref: trackHref,
    cluster: {
      id,
      title,
      href: topics.length === 1 ? topics[0].href : trackHref,
      topics,
    },
  };
}

function subjectHasNavContent(subject: NavSubject): boolean {
  if (subject.clusters.length > 0) {
    return true;
  }
  if ((subject.clustersAfterSections?.length ?? 0) > 0) {
    return true;
  }
  return (
    subject.sections?.some((section) => section.clusters.length > 0) ?? false
  );
}

function stripQuestionEntries(
  entries: readonly NavEntry[],
  trackId: TrackId,
  locale: Locale,
): readonly NavEntry[] {
  const next: NavEntry[] = [];
  for (const entry of entries) {
    if (entry.kind === "topic") {
      const catalog = getTopic(trackId, entry.topic.slug);
      if (catalog && isInterviewSectionTopic(catalog)) {
        continue;
      }
      next.push(entry);
      continue;
    }
    if (entry.kind !== "subject") {
      next.push(entry);
      continue;
    }
    const pulled = takeQuestionClusters(trackId, entry.subject, locale);
    if (subjectHasNavContent(pulled.subject)) {
      next.push({ kind: "subject", subject: pulled.subject });
    }
  }
  return next;
}

function interviewOnlyEntries(
  entries: readonly NavEntry[],
  trackId: TrackId,
  locale: Locale,
  localizedTrackHref: string,
): readonly NavEntry[] {
  const interview: NavTopic[] = [];
  const tasks: NavTopic[] = [];
  for (const entry of entries) {
    if (entry.kind === "topic") {
      const catalog = getTopic(trackId, entry.topic.slug);
      if (catalog && isInterviewSectionTopic(catalog)) {
        interview.push(entry.topic);
      }
      continue;
    }
    if (entry.kind !== "subject") {
      continue;
    }
    const pulled = takeQuestionClusters(trackId, entry.subject, locale);
    interview.push(...pulled.interview);
    tasks.push(...pulled.tasks);
  }
  const next: NavEntry[] = interview.map((topic) => ({
    kind: "topic" as const,
    topic,
  }));
  const tasksEntry = questionClusterEntry(
    localizedTrackHref,
    "tasks",
    catalogBlurb(locale, "Tasks"),
    tasks,
  );
  if (tasksEntry) {
    next.push(tasksEntry);
  }
  return next;
}

function interviewsNavGroup(
  track: (typeof TRACKS)[number],
  entries: readonly NavEntry[],
  locale: Locale,
  href: string,
): NavGroup | null {
  if (entries.length === 0) {
    return null;
  }
  const interviewTopics = entries.flatMap((entry) =>
    entry.kind === "topic" ? [entry.topic] : [],
  );
  const hasTasks = entries.some(
    (entry) => entry.kind === "cluster" && entry.cluster.id === "tasks",
  );
  if (interviewTopics.length === 1 && !hasTasks) {
    return {
      id: track.id,
      title: catalogBlurb(locale, track.title),
      href,
      entries: [],
      leafTopic: interviewTopics[0],
    };
  }
  return {
    id: track.id,
    title: catalogBlurb(locale, track.title),
    href,
    entries,
  };
}

function buildTrackNavGroup(
  track: (typeof TRACKS)[number],
  locale: Locale,
  section: NavRootSectionId,
): NavGroup | null {
  const href = localizeHref(locale, trackHref(track.id));
  const leaf = leafTopicForTrack(track.id);
  const isLeafTrack = Boolean(leaf && sameTitle(leaf.title, track.title));

  if (section === "conspect" && isLeafTrack) {
    return null;
  }

  if (section === "interviews" && isLeafTrack) {
    return {
      id: track.id,
      title: catalogBlurb(locale, track.title),
      href,
      entries: [],
      leafTopic: toNavTopic(leaf!, locale),
    };
  }

  const rawEntries = entriesForTrack(track.id, locale);
  const only = rawEntries.length === 1 ? rawEntries[0] : undefined;
  const isSingleSubjectTrack =
    only?.kind === "subject" && sameTitle(only.subject.title, track.title);

  if (section === "conspect" && isSingleSubjectTrack) {
    const pulled = takeQuestionClusters(track.id, only.subject, locale);
    const clusters = pulled.subject.clusters;
    if (clusters.length === 0 && !hubNavTopic(track.id, locale)) {
      return null;
    }
    return {
      id: track.id,
      title: catalogBlurb(locale, track.title),
      href,
      hubTopic: hubNavTopic(track.id, locale),
      entries: clusters.map((cluster) => ({
        kind: "cluster" as const,
        subjectHref: pulled.subject.href,
        cluster,
      })),
    };
  }

  if (section === "interviews" && isSingleSubjectTrack) {
    return interviewsNavGroup(
      track,
      interviewOnlyEntries(rawEntries, track.id, locale, href),
      locale,
      href,
    );
  }

  const entries =
    section === "conspect"
      ? stripQuestionEntries(rawEntries, track.id, locale)
      : interviewOnlyEntries(rawEntries, track.id, locale, href);

  if (section === "interviews") {
    return interviewsNavGroup(track, entries, locale, href);
  }

  if (entries.length === 0) {
    return null;
  }

  return {
    id: track.id,
    title: catalogBlurb(locale, track.title),
    href,
    entries,
  };
}

function buildNavSection(
  id: NavRootSectionId,
  title: string,
  locale: Locale,
): NavRootSection {
  const groups = TRACKS.map((track) =>
    buildTrackNavGroup(track, locale, id),
  ).filter((group): group is NavGroup => group !== null);
  return { id, title, groups };
}

export function handbookNavSections(
  locale: Locale = DEFAULT_LOCALE,
): readonly NavRootSection[] {
  return [
    buildNavSection("conspect", catalogBlurb(locale, "Conspect"), locale),
    buildNavSection("interviews", catalogBlurb(locale, "Interviews"), locale),
  ];
}

export function handbookNav(
  locale: Locale = DEFAULT_LOCALE,
): readonly NavGroup[] {
  return allNavGroups(handbookNavSections(locale));
}

export function handbookNavForTrack(
  locale: Locale,
  trackId: TrackId,
): readonly NavGroup[] {
  return allNavGroups(handbookNavSections(locale)).filter(
    (group) => group.id === trackId,
  );
}
