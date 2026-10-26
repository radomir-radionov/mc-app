import { conceptMatchesQuery } from "./search";
import type { NavConcept, SearchMode } from "./types";

type SearchableConcept = Pick<
  NavConcept,
  "id" | "title" | "titleSearchText" | "searchText"
>;

/**
 * Hash to open for the current query.
 * Returns null when the current hash should stay.
 * A hash already in the URL is kept until the query is edited this visit.
 */
export function nextConceptHash(input: {
  readonly concepts: readonly SearchableConcept[];
  readonly query: string;
  readonly mode: SearchMode;
  readonly currentHash: string;
  readonly arrivalHash: string;
  readonly queryEdited: boolean;
}): string | null {
  const needle = input.query.trim().toLowerCase();
  if (needle.length === 0) {
    return null;
  }
  if (input.arrivalHash.length > 0 && !input.queryEdited) {
    return null;
  }
  const hashConcept = input.concepts.find(
    (concept) => concept.id === input.currentHash,
  );
  if (hashConcept && conceptMatchesQuery(hashConcept, needle, input.mode)) {
    return null;
  }
  const match = input.concepts.find((concept) =>
    conceptMatchesQuery(concept, needle, input.mode),
  );
  return match?.id ?? null;
}
