import { isHomePath } from "../utils/location/active";

export function storedHrefPath(href: string): string {
  const hashIndex = href.indexOf("#");
  return hashIndex === -1 ? href : href.slice(0, hashIndex);
}

export function shouldRestoreRememberedHref(
  pathname: string,
  storedHref: string,
): boolean {
  if (!isHomePath(pathname)) {
    return false;
  }
  const storedPath = storedHrefPath(storedHref);
  if (storedPath.length === 0 || isHomePath(storedPath)) {
    return false;
  }
  return true;
}

export function shouldPersistLocation(pathname: string): boolean {
  return !isHomePath(pathname);
}
