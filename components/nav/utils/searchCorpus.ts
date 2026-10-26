"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SEARCH_INDEX_STATIC_BASE } from "@/constants";
import type { TrackId } from "@/lib/catalog";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";
import { loadSearchCorpusTracks } from "@/lib/nav/searchCorpusLoad";
import { trackIndexCacheKey } from "@/lib/nav/trackIndexCache";
import type { NavGroup } from "@/lib/nav";

const trackCache = new Map<string, readonly NavGroup[]>();
const trackInflight = new Map<string, Promise<readonly NavGroup[]>>();
const corpusCache = new Map<string, readonly NavGroup[]>();
const corpusInflight = new Map<string, Promise<readonly NavGroup[]>>();

function cacheKey(locale: string, trackId: TrackId): string {
  return trackIndexCacheKey(locale, trackId);
}

export function localeFromPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  return isLocale(segment) ? segment : DEFAULT_LOCALE;
}

export function trackSearchIndexHref(locale: string, trackId: TrackId): string {
  return `${SEARCH_INDEX_STATIC_BASE}/${locale}/${trackId}.json`;
}

export function loadTrackSearchIndex(
  locale: string,
  trackId: TrackId,
): Promise<readonly NavGroup[]> {
  const key = cacheKey(locale, trackId);
  const hit = trackCache.get(key);
  if (hit) {
    return Promise.resolve(hit);
  }
  const pending = trackInflight.get(key);
  if (pending) {
    return pending;
  }
  const request = fetch(trackSearchIndexHref(locale, trackId))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Search index ${trackId} ${response.status}`);
      }
      return response.json() as Promise<NavGroup[]>;
    })
    .then((groups) => {
      trackCache.set(key, groups);
      trackInflight.delete(key);
      return groups;
    })
    .catch((error: unknown) => {
      trackInflight.delete(key);
      throw error;
    });
  trackInflight.set(key, request);
  return request;
}

export function loadSearchCorpus(locale: string): Promise<readonly NavGroup[]> {
  const hit = corpusCache.get(locale);
  if (hit) {
    return Promise.resolve(hit);
  }
  const pending = corpusInflight.get(locale);
  if (pending) {
    return pending;
  }
  const request = loadSearchCorpusTracks(locale, loadTrackSearchIndex)
    .then((groups) => {
      corpusCache.set(locale, groups);
      corpusInflight.delete(locale);
      return groups;
    })
    .catch((error: unknown) => {
      corpusInflight.delete(locale);
      throw error;
    });
  corpusInflight.set(locale, request);
  return request;
}

export function useSearchCorpus(enabled: boolean): readonly NavGroup[] | null {
  const pathname = usePathname() ?? "/";
  const locale = localeFromPath(pathname);
  const [groups, setGroups] = useState<readonly NavGroup[] | null>(
    () => corpusCache.get(locale) ?? null,
  );
  const [loadedLocale, setLoadedLocale] = useState(locale);

  if (loadedLocale !== locale) {
    setLoadedLocale(locale);
    setGroups(corpusCache.get(locale) ?? null);
  }

  useEffect(() => {
    if (!enabled || groups) {
      return;
    }
    let cancelled = false;
    void loadSearchCorpus(locale)
      .then((next) => {
        if (!cancelled) {
          setGroups(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGroups([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, groups, locale]);

  return groups;
}
