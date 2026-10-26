import type { NavGroup } from "./types";

export function trackIndexCacheKey(locale: string, trackId: string): string {
  return `${locale}\0${trackId}`;
}

/** Indexes stored for the other locale stay in the map, but search walks one locale. */
export function trackIndexesForLocale(
  loadedByTrack: ReadonlyMap<string, readonly NavGroup[]>,
  locale: string,
): ReadonlyMap<string, readonly NavGroup[]> {
  const prefix = `${locale}\0`;
  let dropped = false;
  const next = new Map<string, readonly NavGroup[]>();
  for (const [key, groups] of loadedByTrack) {
    if (!key.startsWith(prefix)) {
      dropped = true;
      continue;
    }
    next.set(key, groups);
  }
  return dropped ? next : loadedByTrack;
}

export function rememberTrackIndex(
  loadedByTrack: ReadonlyMap<string, readonly NavGroup[]>,
  locale: string,
  trackId: string,
  groups: readonly NavGroup[],
): ReadonlyMap<string, readonly NavGroup[]> {
  const key = trackIndexCacheKey(locale, trackId);
  if (loadedByTrack.has(key)) {
    return loadedByTrack;
  }
  const next = new Map(loadedByTrack);
  next.set(key, groups);
  return next;
}
