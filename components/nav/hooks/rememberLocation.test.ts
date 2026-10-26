import assert from "node:assert/strict";
import test from "node:test";
import {
  shouldPersistLocation,
  shouldRestoreRememberedHref,
} from "./rememberLocation";

test("home restores a stored topic and does not persist itself", () => {
  assert.equal(
    shouldRestoreRememberedHref("/en", "/en/frontend/html#closures"),
    true,
  );
  assert.equal(shouldRestoreRememberedHref("/ru", "/ru/frontend/html"), true);
  assert.equal(shouldRestoreRememberedHref("/en", "/en"), false);
  assert.equal(shouldRestoreRememberedHref("/en", "/ru"), false);
  assert.equal(
    shouldRestoreRememberedHref("/en/frontend", "/en/frontend/html"),
    false,
  );
  assert.equal(shouldPersistLocation("/en"), false);
  assert.equal(shouldPersistLocation("/ru"), false);
  assert.equal(shouldPersistLocation("/en/frontend/html"), true);
});
