"use client";

import { themeBootScript } from "@/components/nav/utils/uiStorage";

/**
 * Applies stored theme on the initial HTML parse (SSR). On the client, React 19
 * warns if a `<script>` is rendered as executable JS during hydration; use
 * `text/plain` there so the SSR-injected script is left as-is.
 *
 * @see https://nextjs.org/docs/app/guides/preventing-flash-before-hydration
 */
export function ThemeBootScript() {
  return (
    <script
      id="theme-boot"
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeBootScript() }}
    />
  );
}
