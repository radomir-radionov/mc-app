import { useSyncExternalStore } from "react";

const MD_UP_QUERY = "(min-width: 768px)";
/** Sticky ancestor path stack needs a wide sidebar; tablet/mobile scroll normally. */
const STACK_PATH_PINS_QUERY = "(min-width: 1024px)";

function subscribeMediaQuery(
  query: string,
  onStoreChange: () => void,
): () => void {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function mediaQuery(query: string) {
  return window.matchMedia(query);
}

export function isMdUp() {
  return mediaQuery(MD_UP_QUERY).matches;
}

export function isStackPathPinsViewport() {
  return mediaQuery(STACK_PATH_PINS_QUERY).matches;
}

export function useMdUp() {
  return useSyncExternalStore(
    (onStoreChange) => subscribeMediaQuery(MD_UP_QUERY, onStoreChange),
    () => mediaQuery(MD_UP_QUERY).matches,
    () => false,
  );
}

export function useStackPathPins() {
  return useSyncExternalStore(
    (onStoreChange) =>
      subscribeMediaQuery(STACK_PATH_PINS_QUERY, onStoreChange),
    () => mediaQuery(STACK_PATH_PINS_QUERY).matches,
    () => false,
  );
}
