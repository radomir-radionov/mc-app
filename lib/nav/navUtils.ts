import {
  isInterviewTasksTopic,
  isInterviewTopic,
  type Topic,
} from "@/lib/catalog";
import type { Concept } from "@/lib/parse";
import type { InterviewSection, NavConcept, NavTopic } from "./types";

export function sameTitle(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

/** Lone sidebar/search row that only repeats the topic title (not "Topic — section"). */
export function isRedundantTopicConceptTitle(
  topicTitle: string,
  conceptTitle: string,
): boolean {
  return sameTitle(topicTitle, conceptTitle);
}

export function hashIdFrom(hash: string): string {
  return decodeURIComponent(hash.replace(/^#/, ""));
}

type InterviewConcept = {
  readonly interviewSection?: InterviewSection;
};

export function isQuestionCluster(clusterId: string): boolean {
  return (
    clusterId === "interview" ||
    clusterId.endsWith("-interview") ||
    clusterId === "tasks" ||
    clusterId.endsWith("-tasks")
  );
}

export function isInterviewSectionTopic(
  topic: Pick<Topic, "slug" | "title" | "grouping">,
): boolean {
  if (isInterviewTasksTopic(topic) || isInterviewTopic(topic)) {
    return true;
  }
  return isQuestionCluster(topic.grouping?.cluster ?? "");
}

export function shouldHideSidebarConcepts(
  topic: Pick<Topic, "slug" | "hideSidebarConcepts" | "grouping"> & {
    readonly title?: string;
  },
): boolean {
  return (
    topic.hideSidebarConcepts === true ||
    isInterviewTopic({ slug: topic.slug, title: topic.title ?? "" }) ||
    isInterviewTasksTopic(topic) ||
    isQuestionCluster(topic.grouping?.cluster ?? "")
  );
}

export function filterInterviewConcepts<T extends InterviewConcept>(
  topic: Pick<Topic, "slug"> & { readonly title?: string },
  concepts: readonly T[],
): readonly T[] {
  if (isInterviewTasksTopic(topic)) {
    return concepts.filter((concept) => concept.interviewSection === "tasks");
  }
  if (isInterviewTopic({ slug: topic.slug, title: topic.title ?? "" })) {
    return concepts.filter((concept) => concept.interviewSection !== "tasks");
  }
  return concepts;
}

/** Map parsed topic concepts (with `group`) onto sidebar nav shape. */
export function navConceptsFromParseConcepts(
  concepts: readonly Concept[],
): readonly NavConcept[] {
  return concepts.map((concept) => ({
    id: concept.id,
    title: concept.title,
    ...(concept.searchText ? { searchText: concept.searchText } : {}),
    ...(concept.titleSearchText
      ? { titleSearchText: concept.titleSearchText }
      : {}),
    ...(concept.interviewSection
      ? { interviewSection: concept.interviewSection }
      : {}),
    ...(concept.group ? { group: concept.group } : {}),
  }));
}

/** Prefer live parsed concepts on the active topic page (section groups stay in sync). */
export function navTopicWithLiveConcepts(
  topic: NavTopic,
  pathname: string,
  liveConcepts: readonly Concept[] | null,
): NavTopic {
  if (!liveConcepts || pathname !== topic.href) {
    return topic;
  }
  return {
    ...topic,
    concepts: navConceptsFromParseConcepts(liveConcepts),
  };
}
