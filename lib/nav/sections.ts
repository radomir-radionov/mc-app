import { getTopic, isTrackId, type TrackId } from "@/lib/catalog";
import { homeHref, stripLocalePrefix } from "@/lib/i18n/paths";
import { isInterviewSectionTopic } from "./navUtils";
import { navTopics } from "./search";
import type {
  NavCluster,
  NavGroup,
  NavRootSection,
  NavRootSectionId,
  NavTopic,
} from "./types";

export type NavTrackScope = `${NavRootSectionId}:${TrackId}`;

export function navTrackScope(
  sectionId: NavRootSectionId,
  trackId: TrackId,
): NavTrackScope {
  return `${sectionId}:${trackId}`;
}

export function inferNavRootSection(pathname: string): NavRootSectionId {
  const { path } = stripLocalePrefix(pathname);
  if (path === "/" || path === "/instructions") {
    return "conspect";
  }
  const segments = path.slice(1).split("/").filter(Boolean);
  const trackSlug = segments[0];
  const topicSlug = segments[1];
  if (!trackSlug || !isTrackId(trackSlug)) {
    return "conspect";
  }
  if (topicSlug) {
    const topic = getTopic(trackSlug, topicSlug);
    if (topic && isInterviewSectionTopic(topic)) {
      return "interviews";
    }
  }
  return "conspect";
}

export function navGroupsForRootSection(
  sections: readonly NavRootSection[],
  sectionId: NavRootSectionId,
): readonly NavGroup[] {
  return sections.find((section) => section.id === sectionId)?.groups ?? [];
}

export function navGroupsForPath(
  sections: readonly NavRootSection[],
  pathname: string,
): readonly NavGroup[] {
  return navGroupsForRootSection(sections, inferNavRootSection(pathname));
}

export function allNavGroups(
  sections: readonly NavRootSection[],
): readonly NavGroup[] {
  return sections.flatMap((section) => section.groups);
}

export function groupLandingHref(group: NavGroup): string {
  if (group.leafTopic) {
    return group.leafTopic.href;
  }
  if (group.hubTopic) {
    return group.hubTopic.href;
  }
  return group.href;
}

export function groupNavigateHref(
  group: NavGroup,
  sectionId: NavRootSectionId,
): string {
  if (sectionId === "interviews") {
    const first = firstTopicInGroup(group);
    if (first) {
      return first.href;
    }
  }
  return groupLandingHref(group);
}

export function clusterNavigateHref(
  cluster: NavCluster,
  sectionId: NavRootSectionId,
  subjectHref: string,
): string {
  if (
    sectionId === "interviews" &&
    cluster.topics[0] &&
    cluster.href === subjectHref
  ) {
    return cluster.topics[0].href;
  }
  return cluster.href;
}

function firstTopicInGroup(group: NavGroup): NavTopic | null {
  return navTopics([group])[0] ?? null;
}

function subjectTopicsInGroup(
  group: NavGroup,
  subjectSlug: string,
): readonly NavTopic[] {
  for (const entry of group.entries) {
    if (entry.kind === "subject" && entry.subject.slug === subjectSlug) {
      return navTopics([
        {
          ...group,
          entries: [entry],
          hubTopic: undefined,
          leafTopic: undefined,
        },
      ]);
    }
  }
  return [];
}

function pairingKeywords(topicSlug: string): string[] {
  return topicSlug
    .replace(/-interview-tasks$/, "")
    .replace(/-interview$/, "")
    .replace(/-questions$/, "")
    .split("-")
    .filter((part) => part.length > 1);
}

function bestKeywordMatch(
  keywords: readonly string[],
  topics: readonly NavTopic[],
): NavTopic | null {
  for (const keyword of [...keywords].reverse()) {
    const hit = topics.find((topic) => topic.slug.includes(keyword));
    if (hit) {
      return hit;
    }
  }
  return null;
}

function pairedBySubject(
  group: NavGroup,
  trackSlug: TrackId,
  topicSlug: string,
  targetSectionId: NavRootSectionId,
): NavTopic | null {
  const source = getTopic(trackSlug, topicSlug);
  if (!source?.grouping) {
    return null;
  }
  const subjectSlug = source.grouping.subject;
  const keywords = pairingKeywords(topicSlug);

  if (targetSectionId === "interviews") {
    const interviews = navTopics([group]).filter((topic) => {
      const catalog = getTopic(trackSlug, topic.slug);
      return (
        catalog?.grouping?.subject === subjectSlug &&
        isInterviewSectionTopic(catalog)
      );
    });
    const keywordMatch = bestKeywordMatch(keywords, interviews);
    if (keywordMatch?.slug.endsWith("-questions")) {
      return keywordMatch;
    }
    const preferred = interviews.find(
      (topic) => topic.slug === `${subjectSlug}-interview`,
    );
    if (preferred) {
      return preferred;
    }
    return keywordMatch ?? interviews[0] ?? null;
  }

  const conspect = subjectTopicsInGroup(group, subjectSlug);
  return bestKeywordMatch(keywords, conspect) ?? conspect[0] ?? null;
}

function pairedTopicInGroup(
  group: NavGroup,
  pathname: string,
  targetSectionId: NavRootSectionId,
): NavTopic | null {
  const { path } = stripLocalePrefix(pathname);
  const segments = path.slice(1).split("/").filter(Boolean);
  const trackSlug = segments[0];
  const topicSlug = segments[1];
  if (!trackSlug || !isTrackId(trackSlug) || !topicSlug) {
    return null;
  }

  const topics = navTopics([group]);
  const exact = topics.find((topic) => topic.href === pathname);
  if (exact) {
    return exact;
  }

  const bySubject = pairedBySubject(
    group,
    trackSlug,
    topicSlug,
    targetSectionId,
  );
  if (bySubject) {
    return bySubject;
  }

  if (targetSectionId === "interviews") {
    const candidates = [
      `${topicSlug}-interview`,
      `${topicSlug}-questions`,
      `${topicSlug.replace(/-fundamentals$/, "")}-interview`,
    ];
    for (const slug of candidates) {
      const hit = topics.find((topic) => topic.slug === slug);
      if (hit) {
        return hit;
      }
    }
    return (
      topics.find(
        (topic) =>
          topic.slug.startsWith(`${topicSlug}-`) ||
          topic.slug.startsWith(topicSlug),
      ) ?? null
    );
  }

  const base = topicSlug
    .replace(/-interview-tasks$/, "")
    .replace(/-interview$/, "")
    .replace(/-questions$/, "");
  const direct = topics.find((topic) => topic.slug === base);
  if (direct) {
    return direct;
  }
  return topics.find((topic) => topic.slug.startsWith(`${base}-`)) ?? null;
}

export function sectionGroupLandingHref(
  group: NavGroup,
  pathname: string,
  targetSectionId: NavRootSectionId,
): string {
  const paired = pairedTopicInGroup(group, pathname, targetSectionId);
  if (paired) {
    return paired.href;
  }

  if (targetSectionId === "interviews") {
    const first = firstTopicInGroup(group);
    if (first) {
      return first.href;
    }
  }

  return groupLandingHref(group);
}

export function sectionSwitchHref(
  sections: readonly NavRootSection[],
  pathname: string,
  targetSectionId: NavRootSectionId,
): string {
  const targetGroups = navGroupsForRootSection(sections, targetSectionId);
  if (targetGroups.length === 0) {
    const { locale } = stripLocalePrefix(pathname);
    return homeHref(locale);
  }

  const { path } = stripLocalePrefix(pathname);
  const segments = path.slice(1).split("/").filter(Boolean);
  const trackSlug = segments[0];
  if (trackSlug && isTrackId(trackSlug)) {
    const matching = targetGroups.find((group) => group.id === trackSlug);
    if (matching) {
      return sectionGroupLandingHref(matching, pathname, targetSectionId);
    }
  }

  return sectionGroupLandingHref(targetGroups[0], pathname, targetSectionId);
}
