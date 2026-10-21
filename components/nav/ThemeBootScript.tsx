import { themeBootScript } from "@/components/nav/utils/uiStorage";

/** Applies stored theme on the initial HTML parse (before React hydration). */
export function ThemeBootScript() {
  return (
    <script
      id="theme-boot"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeBootScript() }}
    />
  );
}
