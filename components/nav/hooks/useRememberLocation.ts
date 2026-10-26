import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { NavGroup } from "@/lib/nav";
import { hrefInHandbook } from "../utils/location";
import { readUi, writeUi } from "../utils/uiStorage";
import {
  shouldPersistLocation,
  shouldRestoreRememberedHref,
} from "./rememberLocation";

export function useRememberLocation(groups: readonly NavGroup[]) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const didCheckLandingRef = useRef(false);

  useEffect(() => {
    if (!didCheckLandingRef.current) {
      didCheckLandingRef.current = true;
      const href = readUi().href;
      if (
        shouldRestoreRememberedHref(pathname, href) &&
        hrefInHandbook(groups, href)
      ) {
        router.replace(href, { scroll: false });
        return;
      }
    }

    function save() {
      if (!shouldPersistLocation(pathname)) {
        return;
      }
      writeUi({ href: `${pathname}${window.location.hash}` });
    }

    save();
    window.addEventListener("hashchange", save);
    return () => window.removeEventListener("hashchange", save);
  }, [pathname, router, groups]);
}
