"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { TrackId } from "@/lib/catalog";
import { enrichNavSections } from "@/lib/nav/enrichNav";
import { rememberTrackIndex } from "@/lib/nav/trackIndexCache";
import type { NavGroup, NavRootSection } from "@/lib/nav";
import { loadTrackSearchIndex, localeFromPath } from "../utils/searchCorpus";

function trackIdsIn(structure: readonly NavRootSection[]): TrackId[] {
  const ids: TrackId[] = [];
  const seen = new Set<string>();
  for (const section of structure) {
    for (const group of section.groups) {
      if (seen.has(group.id)) {
        continue;
      }
      seen.add(group.id);
      ids.push(group.id);
    }
  }
  return ids;
}

export function useEnrichedNavSections(
  structure: readonly NavRootSection[],
  preloadTracks: boolean,
): readonly NavRootSection[] {
  const pathname = usePathname() ?? "/";
  const locale = localeFromPath(pathname);
  const [loadedByTrack, setLoadedByTrack] = useState<
    ReadonlyMap<string, readonly NavGroup[]>
  >(() => new Map());

  useEffect(() => {
    if (!preloadTracks) {
      return;
    }
    let cancelled = false;
    const trackIds = trackIdsIn(structure);
    void Promise.all(
      trackIds.map((trackId) =>
        loadTrackSearchIndex(locale, trackId).then(
          (groups) => ({ trackId, groups }),
          () => null,
        ),
      ),
    ).then((results) => {
      if (cancelled) {
        return;
      }
      setLoadedByTrack((current) => {
        let next = current;
        for (const result of results) {
          if (!result) {
            continue;
          }
          next = rememberTrackIndex(
            next,
            locale,
            result.trackId,
            result.groups,
          );
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [preloadTracks, structure, locale]);

  return useMemo(
    () => enrichNavSections(structure, loadedByTrack, locale),
    [structure, loadedByTrack, locale],
  );
}
