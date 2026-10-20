/** CSS Motion topic (`css-motion`) — handbook section groups. */
export const CSS_MOTION_TOPIC_SLUG = "css-motion";

export const CSS_MOTION_TOPIC_SECTIONS: readonly {
  readonly section: string;
  readonly concepts: readonly string[];
}[] = [
  {
    section: "Transforms, Transitions & Animations",
    concepts: [
      "transform",
      "transition",
      "@keyframes animation",
      "JS animation events",
    ],
  },
  {
    section: "Visual Effects",
    concepts: [
      "Filters",
      "clip-path & shape",
      "backdrop-filter",
      "SVG styling",
      "scroll-snap",
      "pointer-events & outline",
    ],
  },
];

const titleToSection = new Map<string, string>(
  CSS_MOTION_TOPIC_SECTIONS.flatMap(({ section, concepts }) =>
    concepts.map((title) => [title, section]),
  ),
);

export function isCssMotionTopicSlug(slug: string): boolean {
  return slug === CSS_MOTION_TOPIC_SLUG;
}

export function cssMotionConceptSection(title: string): string | undefined {
  return titleToSection.get(title);
}

export function withCssMotionConceptGroups<
  T extends { readonly title: string },
>(items: readonly T[]): (T & { group?: string })[] {
  return items.map((item) => {
    const group = cssMotionConceptSection(item.title);
    return group ? { ...item, group } : item;
  });
}
