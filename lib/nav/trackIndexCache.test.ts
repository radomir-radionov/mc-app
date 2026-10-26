import assert from "node:assert/strict";
import test from "node:test";
import {
  rememberTrackIndex,
  trackIndexCacheKey,
  trackIndexesForLocale,
} from "./trackIndexCache";
import type { NavGroup } from "./types";

const enFrontend: readonly NavGroup[] = [
  { id: "frontend", title: "EN", href: "/en/frontend", entries: [] },
];
const ruFrontend: readonly NavGroup[] = [
  { id: "frontend", title: "RU", href: "/ru/frontend", entries: [] },
];

test("track index cache keys include the locale", () => {
  assert.notEqual(
    trackIndexCacheKey("en", "frontend"),
    trackIndexCacheKey("ru", "frontend"),
  );
  const loaded = rememberTrackIndex(new Map(), "en", "frontend", enFrontend);
  const both = rememberTrackIndex(loaded, "ru", "frontend", ruFrontend);
  assert.equal(both.size, 2);
  assert.equal(both.get(trackIndexCacheKey("en", "frontend")), enFrontend);
  assert.equal(both.get(trackIndexCacheKey("ru", "frontend")), ruFrontend);
  assert.equal(rememberTrackIndex(both, "en", "frontend", ruFrontend), both);
});

test("track index locale filter drops the other locale", () => {
  const loaded = rememberTrackIndex(
    rememberTrackIndex(new Map(), "en", "frontend", enFrontend),
    "ru",
    "frontend",
    ruFrontend,
  );
  const english = trackIndexesForLocale(loaded, "en");
  assert.equal(english.size, 1);
  assert.equal(english.get(trackIndexCacheKey("en", "frontend")), enFrontend);
  assert.equal(trackIndexesForLocale(english, "en"), english);
});
