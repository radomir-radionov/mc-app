import type { NavGroup, SearchMode } from "./types";

/** Notes search uses the JSON corpus. Titles search keeps the sidebar groups. */
export function sectionSearchGroups(
  sectionGroups: readonly NavGroup[],
  corpus: readonly NavGroup[] | null,
  mode: SearchMode,
): readonly NavGroup[] {
  if (mode !== "notes" || corpus === null) {
    return sectionGroups;
  }
  const sectionIds = new Set(sectionGroups.map((group) => group.id));
  return corpus.filter((group) => sectionIds.has(group.id));
}
