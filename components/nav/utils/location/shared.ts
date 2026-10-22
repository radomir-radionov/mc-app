import type { Crumb, NavCluster, NavSubject, NavTopic } from "@/lib/nav";
import { sameTitle } from "@/lib/nav/navUtils";

export function clusterTrailCrumbs(
  cluster: NavCluster,
  subject?: Pick<NavSubject, "flatNav">,
): readonly Crumb[] {
  if (isTopicAliasCluster(cluster)) {
    return [];
  }
  if (subject?.flatNav) {
    return [];
  }
  if (!cluster.title.trim()) {
    return [];
  }
  return [{ label: cluster.title, href: cluster.href }];
}

export function isTopicAliasCluster(cluster: NavCluster): boolean {
  return Boolean(aliasTopicForCluster(cluster));
}

export function aliasTopicForCluster(
  cluster: NavCluster,
): NavTopic | undefined {
  const only = cluster.topics.length === 1 ? cluster.topics[0] : undefined;
  if (!only || !sameTitle(cluster.title, only.title)) {
    return undefined;
  }
  return only;
}
