"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { SEARCH_NAV_DELAY_MS } from "@/constants";
import {
  firstSearchHref,
  splitHref,
  type NavGroup,
  type SearchMode,
} from "@/lib/nav";
import { applySameDocumentHref, followHandbookHref } from "../utils/hash";
import { useSearchCorpus } from "../utils/searchCorpus";
import { readSearchUi, writeUi } from "../utils/uiStorage";

export function useHandbookSearch(
  groups: readonly NavGroup[],
  onSearchActive?: () => void,
) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const onSearchActiveRef = useRef(onSearchActive);
  const pathnameRef = useRef(pathname);
  const restoreHrefRef = useRef<string | null>(null);
  const searchTimerRef = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("titles");
  const hydratedRef = useRef(false);
  const modeRef = useRef<SearchMode>("titles");

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }
    hydratedRef.current = true;
    const stored = readSearchUi();
    setQuery(stored.query);
    setMode(stored.mode);
    modeRef.current = stored.mode;
  }, []);
  const notesCorpus = useSearchCorpus(mode === "notes");
  const searchGroups = useMemo(() => {
    if (!notesCorpus) {
      return groups;
    }
    const inSection = new Set(groups);
    return notesCorpus.filter((group) => inSection.has(group));
  }, [groups, notesCorpus]);
  const groupsRef = useRef(searchGroups);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    onSearchActiveRef.current = onSearchActive;
    pathnameRef.current = pathname;
    groupsRef.current = searchGroups;
    modeRef.current = mode;
  }, [onSearchActive, pathname, searchGroups, mode]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  function currentHref() {
    return `${pathnameRef.current}${window.location.hash}`;
  }

  const goTo = useCallback(
    (target: string) => {
      followHandbookHref(target, pathnameRef.current, (path) => {
        startTransition(() => {
          router.replace(path, { scroll: false });
        });
      });
    },
    [router],
  );

  const applySearch = useCallback(
    (nextQuery: string) => {
      const trimmed = nextQuery.trim();
      if (trimmed.length === 0) {
        const restore = restoreHrefRef.current;
        restoreHrefRef.current = null;
        if (restore && restore !== currentHref()) {
          goTo(restore);
        }
        return;
      }

      if (restoreHrefRef.current === null) {
        restoreHrefRef.current = currentHref();
      }

      const target = firstSearchHref(
        groupsRef.current,
        nextQuery,
        pathnameRef.current,
        modeRef.current,
      );
      if (target) {
        const { pathname, hash } = splitHref(target);
        applySameDocumentHref(pathname, hash, pathnameRef.current);
      }
    },
    [goTo],
  );

  function scheduleSearch(nextQuery: string) {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    if (nextQuery.trim().length === 0) {
      applySearch(nextQuery);
      return;
    }

    searchTimerRef.current = window.setTimeout(() => {
      searchTimerRef.current = null;
      applySearch(nextQuery);
    }, SEARCH_NAV_DELAY_MS);
  }

  function changeQuery(value: string) {
    const wasEmpty = query.trim().length === 0;
    setQuery(value);
    writeUi({ query: value }, { notify: false });
    if (value.trim().length > 0 && wasEmpty) {
      onSearchActiveRef.current?.();
    }
    scheduleSearch(value);
  }

  function clearQuery() {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    restoreHrefRef.current = null;
    setQuery("");
    writeUi({ query: "" }, { notify: false });
  }

  /** Keep the current page when the search box is later cleared (e.g. after picking a hit). */
  function commitSearchLocation() {
    restoreHrefRef.current = null;
  }

  function changeMode(nextMode: SearchMode) {
    setMode(nextMode);
    writeUi({ mode: nextMode }, { notify: false });
    modeRef.current = nextMode;
    if (query.trim().length > 0) {
      onSearchActiveRef.current?.();
      scheduleSearch(query);
    }
  }

  const notesCorpusReady = useRef(false);
  useEffect(() => {
    if (!notesCorpus) {
      return;
    }
    const firstLoad = !notesCorpusReady.current;
    notesCorpusReady.current = true;
    if (!firstLoad || mode !== "notes" || query.trim().length === 0) {
      return;
    }
    applySearch(query);
  }, [applySearch, notesCorpus, mode, query]);

  const notesCorpusLoading = mode === "notes" && notesCorpus === null;
  const searchPending = query.trim().length > 0 && query !== deferredQuery;

  return {
    query,
    deferredQuery,
    mode,
    searchGroups,
    notesCorpusLoading,
    searchPending,
    changeQuery,
    clearQuery,
    commitSearchLocation,
    changeMode,
  };
}
