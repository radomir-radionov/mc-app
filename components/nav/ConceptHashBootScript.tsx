import { conceptHashBootScript } from "@/components/nav/utils/conceptHashBoot";

/** Marks deep-linked concept URLs before paint so the topic index nav stays hidden. */
export function ConceptHashBootScript() {
  return (
    <script
      id="concept-hash-boot"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: conceptHashBootScript() }}
    />
  );
}
