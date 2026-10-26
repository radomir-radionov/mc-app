import { watch } from "node:fs";
import { DEV_RESOURCES_REFRESH_MESSAGE } from "@/lib/dev/shared";
import { resourcesRoot } from "@/lib/resourcesRoot";
import { clearTopicParseCache } from "@/lib/parse/load";

const DEBOUNCE_MS = 80;

export type ResourcesRefreshListener = (message: string) => void;

type WatchState = {
  listeners: Set<ResourcesRefreshListener>;
  watcher: ReturnType<typeof watch> | null;
  timer: ReturnType<typeof setTimeout> | undefined;
};

const globalForWatch = globalThis as typeof globalThis & {
  __resourcesRefreshWatch?: WatchState;
};

function getState(): WatchState {
  if (!globalForWatch.__resourcesRefreshWatch) {
    globalForWatch.__resourcesRefreshWatch = {
      listeners: new Set(),
      watcher: null,
      timer: undefined,
    };
  }
  return globalForWatch.__resourcesRefreshWatch;
}

export function ensureResourcesRefreshWatcher(): WatchState {
  const state = getState();
  if (state.watcher) {
    return state;
  }

  const dir = resourcesRoot();
  state.watcher = watch(dir, { recursive: true }, () => {
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      clearTopicParseCache();
      for (const listener of state.listeners) {
        listener(DEV_RESOURCES_REFRESH_MESSAGE);
      }
    }, DEBOUNCE_MS);
  });

  return state;
}

export function subscribeResourcesRefresh(
  state: WatchState,
  listener: ResourcesRefreshListener,
): () => void {
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}
