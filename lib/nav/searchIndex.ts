import { navSubjectClusters } from "./subjectClusters";
import type {
  NavCluster,
  NavConcept,
  NavEntry,
  NavGroup,
  NavSubject,
  NavTopic,
  SearchMode,
} from "./types";

export const BODY_QUERY_MIN_LENGTH = 3;

type PreparedConcept = {
  readonly concept: NavConcept;
  readonly topicHref: string;
  readonly title: string;
  readonly titleSearch: string;
  readonly body: string;
  readonly bodyId: number;
};

type PreparedTopic = {
  readonly topic: NavTopic;
  readonly title: string;
  readonly blurb: string;
  readonly concepts: readonly PreparedConcept[];
};

export type HandbookSearchIndex = {
  readonly groups: readonly NavGroup[];
  readonly topics: readonly PreparedTopic[];
  readonly topicOf: WeakMap<NavTopic, PreparedTopic>;
  readonly groupTitle: WeakMap<NavGroup, string>;
  readonly subjectText: WeakMap<NavSubject, { title: string; blurb: string }>;
  readonly clusterTitle: WeakMap<NavCluster, string>;
  readonly grams: ReadonlyMap<string, readonly number[]>;
};

const indexCache = new WeakMap<readonly NavGroup[], HandbookSearchIndex>();

export function searchIndexFor(
  groups: readonly NavGroup[],
): HandbookSearchIndex {
  const cached = indexCache.get(groups);
  if (cached) {
    return cached;
  }
  const index = buildSearchIndex(groups);
  indexCache.set(groups, index);
  return index;
}

export function trigramBodyHits(
  index: HandbookSearchIndex,
  query: string,
): Set<number> {
  if (query.length < BODY_QUERY_MIN_LENGTH) {
    return new Set();
  }

  const postings: (readonly number[])[] = [];
  for (let i = 0; i <= query.length - 3; i += 1) {
    const posting = index.grams.get(query.slice(i, i + 3));
    if (!posting) {
      return new Set();
    }
    postings.push(posting);
  }

  postings.sort((left, right) => left.length - right.length);

  const firstPosting = postings[0];
  if (!firstPosting) {
    return new Set();
  }

  let hits = new Set(firstPosting);
  for (let i = 1; i < postings.length; i += 1) {
    hits = intersectPosting(hits, postings[i]);
    if (hits.size === 0) {
      return hits;
    }
  }

  return hits;
}

export function topicMatchesIndexed(
  topic: NavTopic,
  query: string,
  mode: SearchMode,
  index: HandbookSearchIndex,
  bodyHits: Set<number> | null,
): boolean {
  const prepared = index.topicOf.get(topic);
  if (!prepared) {
    return false;
  }
  return topicMatchesPrepared(prepared, query, mode, bodyHits);
}

export function topicSearchConcepts(
  index: HandbookSearchIndex,
  topic: NavTopic,
  query: string,
  mode: SearchMode,
  bodyHits: Set<number> | null,
): readonly IndexedConceptMatch[] {
  const prepared = index.topicOf.get(topic);
  if (!prepared) {
    return [];
  }
  const matches: IndexedConceptMatch[] = [];
  for (const concept of prepared.concepts) {
    if (!conceptMatchesIndexed(concept, query, mode, bodyHits)) {
      continue;
    }
    const titleMatch =
      concept.title.includes(query) || concept.titleSearch.includes(query);
    matches.push({ concept: concept.concept, bodyOnly: !titleMatch });
  }
  return matches;
}

export type IndexedConceptMatch = {
  readonly concept: NavConcept;
  readonly bodyOnly: boolean;
};

function conceptMatchesIndexed(
  concept: PreparedConcept,
  query: string,
  mode: SearchMode,
  bodyHits: Set<number> | null,
): boolean {
  if (concept.title.includes(query) || concept.titleSearch.includes(query)) {
    return true;
  }
  if (!includesNotes(mode) || query.length < BODY_QUERY_MIN_LENGTH) {
    return false;
  }
  if (bodyHits && !bodyHits.has(concept.bodyId)) {
    return false;
  }
  return concept.body.includes(query);
}

function includesNotes(mode: SearchMode): boolean {
  switch (mode) {
    case "notes":
      return true;
    case "titles":
      return false;
    default: {
      const _never: never = mode;
      return _never;
    }
  }
}

function topicMatchesPrepared(
  prepared: PreparedTopic,
  query: string,
  mode: SearchMode,
  bodyHits: Set<number> | null,
): boolean {
  return (
    prepared.title.includes(query) ||
    prepared.blurb.includes(query) ||
    prepared.concepts.some((concept) =>
      conceptMatchesIndexed(concept, query, mode, bodyHits),
    )
  );
}

function buildSearchIndex(groups: readonly NavGroup[]): HandbookSearchIndex {
  const topicOf = new WeakMap<NavTopic, PreparedTopic>();
  const groupTitle = new WeakMap<NavGroup, string>();
  const subjectText = new WeakMap<
    NavSubject,
    { title: string; blurb: string }
  >();
  const clusterTitle = new WeakMap<NavCluster, string>();
  const gramLists = new Map<string, number[]>();
  let nextBodyId = 0;

  function addGrams(bodyId: number, body: string) {
    if (body.length < 3) {
      return;
    }
    for (let i = 0; i <= body.length - 3; i += 1) {
      const gram = body.slice(i, i + 3);
      const posting = gramLists.get(gram);
      if (!posting) {
        gramLists.set(gram, [bodyId]);
        continue;
      }
      if (posting[posting.length - 1] !== bodyId) {
        posting.push(bodyId);
      }
    }
  }

  function prepareTopic(topic: NavTopic): PreparedTopic {
    const existing = topicOf.get(topic);
    if (existing) {
      return existing;
    }
    const concepts = topic.concepts.map((concept) => {
      const body = (concept.searchText ?? "").toLowerCase();
      const prepared: PreparedConcept = {
        concept,
        topicHref: topic.href,
        title: concept.title.toLowerCase(),
        titleSearch: (concept.titleSearchText ?? "").toLowerCase(),
        body,
        bodyId: nextBodyId,
      };
      nextBodyId += 1;
      addGrams(prepared.bodyId, body);
      return prepared;
    });
    const prepared: PreparedTopic = {
      topic,
      title: topic.title.toLowerCase(),
      blurb: topic.blurb.toLowerCase(),
      concepts,
    };
    topicOf.set(topic, prepared);
    for (const nested of topic.nestedTopics ?? []) {
      prepareTopic(nested);
    }
    return prepared;
  }

  const topics: PreparedTopic[] = [];
  for (const group of groups) {
    groupTitle.set(group, group.title.toLowerCase());
    if (group.leafTopic) {
      topics.push(prepareTopic(group.leafTopic));
    }
    if (group.hubTopic) {
      topics.push(prepareTopic(group.hubTopic));
    }
    for (const entry of group.entries) {
      topics.push(
        ...indexEntry(entry, prepareTopic, subjectText, clusterTitle),
      );
    }
  }

  return {
    groups,
    topics,
    topicOf,
    groupTitle,
    subjectText,
    clusterTitle,
    grams: gramLists,
  };
}

function indexEntry(
  entry: NavEntry,
  prepareTopic: (topic: NavTopic) => PreparedTopic,
  subjectText: WeakMap<NavSubject, { title: string; blurb: string }>,
  clusterTitle: WeakMap<NavCluster, string>,
): readonly PreparedTopic[] {
  switch (entry.kind) {
    case "topic":
      return [prepareTopic(entry.topic)];
    case "subject":
      subjectText.set(entry.subject, {
        title: entry.subject.title.toLowerCase(),
        blurb: entry.subject.blurb.toLowerCase(),
      });
      return navSubjectClusters(entry.subject).flatMap((cluster) => {
        clusterTitle.set(cluster, cluster.title.toLowerCase());
        return cluster.topics.map(prepareTopic);
      });
    case "cluster":
      clusterTitle.set(entry.cluster, entry.cluster.title.toLowerCase());
      return entry.cluster.topics.map(prepareTopic);
    default: {
      const _never: never = entry;
      return _never;
    }
  }
}

function conceptHref(topicHrefValue: string, conceptId: string): string {
  return `${topicHrefValue}#${conceptId}`;
}

function postingHas(posting: readonly number[], id: number): boolean {
  let low = 0;
  let high = posting.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const value = posting[mid];
    if (value === id) {
      return true;
    }
    if (value < id) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return false;
}

function intersectPosting(
  hits: Set<number>,
  posting: readonly number[],
): Set<number> {
  const next = new Set<number>();
  if (posting.length < hits.size) {
    for (const id of posting) {
      if (hits.has(id)) {
        next.add(id);
      }
    }
    return next;
  }
  for (const id of hits) {
    if (postingHas(posting, id)) {
      next.add(id);
    }
  }
  return next;
}

export function firstHrefWithIndex(
  index: HandbookSearchIndex,
  query: string,
  mode: SearchMode,
  preferredPathname: string | undefined,
  bodyHits: Set<number> | null,
): string | null {
  const titleHit = index.topics.find((topic) => topic.title.includes(query));
  if (titleHit) {
    return titleHit.topic.href;
  }

  for (const group of index.groups) {
    for (const entry of group.entries) {
      switch (entry.kind) {
        case "subject":
          if (index.subjectText.get(entry.subject)?.title.includes(query)) {
            return entry.subject.href;
          }
          break;
        case "cluster":
          if (index.clusterTitle.get(entry.cluster)?.includes(query)) {
            return entry.cluster.href;
          }
          break;
        case "topic":
          break;
        default: {
          const _never: never = entry;
          return _never;
        }
      }
    }
  }

  for (const group of index.groups) {
    for (const entry of group.entries) {
      switch (entry.kind) {
        case "subject": {
          const clusterHit = navSubjectClusters(entry.subject).find((cluster) =>
            Boolean(index.clusterTitle.get(cluster)?.includes(query)),
          );
          if (clusterHit) {
            return clusterHit.href;
          }
          break;
        }
        case "cluster":
        case "topic":
          break;
        default: {
          const _never: never = entry;
          return _never;
        }
      }
    }
  }

  const titleConceptHref = firstConceptHref(
    index.topics,
    preferredPathname,
    (concept) =>
      concept.title.includes(query) || concept.titleSearch.includes(query),
  );
  if (titleConceptHref) {
    return titleConceptHref;
  }

  const blurbHit = index.topics.find((topic) => topic.blurb.includes(query));
  if (blurbHit) {
    return blurbHit.topic.href;
  }

  for (const group of index.groups) {
    for (const entry of group.entries) {
      switch (entry.kind) {
        case "subject":
          if (index.subjectText.get(entry.subject)?.blurb.includes(query)) {
            return entry.subject.href;
          }
          break;
        case "cluster":
        case "topic":
          break;
        default: {
          const _never: never = entry;
          return _never;
        }
      }
    }
  }

  if (!includesNotes(mode)) {
    return null;
  }

  return firstConceptHref(index.topics, preferredPathname, (concept) => {
    if (query.length < BODY_QUERY_MIN_LENGTH) {
      return false;
    }
    if (bodyHits && !bodyHits.has(concept.bodyId)) {
      return false;
    }
    return concept.body.includes(query);
  });
}

function firstConceptHref(
  topics: readonly PreparedTopic[],
  preferredPathname: string | undefined,
  matches: (concept: PreparedConcept) => boolean,
): string | null {
  if (preferredPathname) {
    const current = topics.find(
      (topic) => topic.topic.href === preferredPathname,
    );
    const conceptHit = current?.concepts.find(matches);
    if (current && conceptHit) {
      return conceptHref(current.topic.href, conceptHit.concept.id);
    }
  }

  for (const topic of topics) {
    const conceptHit = topic.concepts.find(matches);
    if (conceptHit) {
      return conceptHref(topic.topic.href, conceptHit.concept.id);
    }
  }

  return null;
}

export function filterGroupsWithIndex(
  index: HandbookSearchIndex,
  query: string,
  mode: SearchMode,
  bodyHits: Set<number> | null,
): readonly NavGroup[] {
  return index.groups
    .map((group) => {
      const keepHub =
        Boolean(group.hubTopic) &&
        (Boolean(index.groupTitle.get(group)?.includes(query)) ||
          (group.hubTopic
            ? topicMatchesIndexed(group.hubTopic, query, mode, index, bodyHits)
            : false));
      const keepLeaf =
        Boolean(group.leafTopic) &&
        (Boolean(index.groupTitle.get(group)?.includes(query)) ||
          (group.leafTopic
            ? topicMatchesIndexed(group.leafTopic, query, mode, index, bodyHits)
            : false));
      const entries = group.entries
        .map((entry) => filterEntry(entry, query, mode, index, bodyHits))
        .filter((entry): entry is NavEntry => entry !== null);
      return {
        ...group,
        leafTopic: keepLeaf ? group.leafTopic : undefined,
        hubTopic: keepHub ? group.hubTopic : undefined,
        entries,
      };
    })
    .filter(
      (group) =>
        group.entries.length > 0 ||
        Boolean(group.leafTopic) ||
        Boolean(group.hubTopic),
    );
}

function filterEntry(
  entry: NavEntry,
  query: string,
  mode: SearchMode,
  index: HandbookSearchIndex,
  bodyHits: Set<number> | null,
): NavEntry | null {
  switch (entry.kind) {
    case "topic":
      return topicMatchesIndexed(entry.topic, query, mode, index, bodyHits)
        ? entry
        : null;
    case "subject": {
      const subject = filterSubject(
        entry.subject,
        query,
        mode,
        index,
        bodyHits,
      );
      return subject ? { kind: "subject", subject } : null;
    }
    case "cluster": {
      const cluster = filterCluster(
        entry.cluster,
        query,
        mode,
        index,
        bodyHits,
      );
      return cluster
        ? { kind: "cluster", subjectHref: entry.subjectHref, cluster }
        : null;
    }
    default: {
      const _never: never = entry;
      return _never;
    }
  }
}

function filterCluster(
  cluster: NavCluster,
  query: string,
  mode: SearchMode,
  index: HandbookSearchIndex,
  bodyHits: Set<number> | null,
): NavCluster | null {
  if (index.clusterTitle.get(cluster)?.includes(query)) {
    return cluster;
  }
  const topics = cluster.topics.filter((topic) =>
    topicMatchesIndexed(topic, query, mode, index, bodyHits),
  );
  if (topics.length === 0) {
    return null;
  }
  return { ...cluster, topics };
}

function filterSubject(
  subject: NavSubject,
  query: string,
  mode: SearchMode,
  index: HandbookSearchIndex,
  bodyHits: Set<number> | null,
): NavSubject | null {
  const text = index.subjectText.get(subject);
  if (text?.title.includes(query) || text?.blurb.includes(query)) {
    return subject;
  }
  if (subject.sections?.length) {
    const rootClusters = subject.clusters
      .map((cluster) => filterCluster(cluster, query, mode, index, bodyHits))
      .filter((cluster): cluster is NavCluster => cluster !== null);
    const sections = subject.sections
      .map((section) => ({
        ...section,
        clusters: section.clusters
          .map((cluster) =>
            filterCluster(cluster, query, mode, index, bodyHits),
          )
          .filter((cluster): cluster is NavCluster => cluster !== null),
      }))
      .filter((section) => section.clusters.length > 0);
    const clustersAfterSections = (subject.clustersAfterSections ?? [])
      .map((cluster) => filterCluster(cluster, query, mode, index, bodyHits))
      .filter((cluster): cluster is NavCluster => cluster !== null);
    if (
      rootClusters.length === 0 &&
      sections.length === 0 &&
      clustersAfterSections.length === 0
    ) {
      return null;
    }
    return {
      ...subject,
      sections,
      clusters: rootClusters,
      clustersAfterSections,
    };
  }
  const clusters = subject.clusters
    .map((cluster) => filterCluster(cluster, query, mode, index, bodyHits))
    .filter((cluster): cluster is NavCluster => cluster !== null);
  if (clusters.length === 0) {
    return null;
  }
  return { ...subject, clusters };
}
