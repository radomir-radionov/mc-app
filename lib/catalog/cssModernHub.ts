/** CSS Modern topic (`css-modern`) — handbook section groups. */
export const CSS_MODERN_TOPIC_SLUG = "css-modern";

export const CSS_MODERN_TOPIC_SECTIONS: readonly {
  readonly section: string;
  readonly concepts: readonly string[];
}[] = [
  {
    section: "Modern CSS (2024+)",
    concepts: [
      "@starting-style",
      "CSS anchor positioning",
      "Scroll-driven animations",
      "@scope",
    ],
  },
  {
    section: "CSS Phase 2 (advanced)",
    concepts: [
      "Multi-column layout",
      "View Transitions API",
      "@property registered custom properties",
      "Relative color syntax",
      "Table and list styling",
      "Writing-mode and RTL",
    ],
  },
];

const titleToSection = new Map<string, string>(
  CSS_MODERN_TOPIC_SECTIONS.flatMap(({ section, concepts }) =>
    concepts.map((title) => [title, section]),
  ),
);

export function isCssModernTopicSlug(slug: string): boolean {
  return slug === CSS_MODERN_TOPIC_SLUG;
}

export function cssModernConceptSection(title: string): string | undefined {
  return titleToSection.get(title);
}

export function withCssModernConceptGroups<
  T extends { readonly title: string },
>(items: readonly T[]): (T & { group?: string })[] {
  return items.map((item) => {
    const group = cssModernConceptSection(item.title);
    return group ? { ...item, group } : item;
  });
}
