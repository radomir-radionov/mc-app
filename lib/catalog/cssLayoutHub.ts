/** CSS Layout topic (`css-layout`) — handbook section groups. */
export const CSS_LAYOUT_TOPIC_SLUG = "css-layout";

/** Section title → concept `<summary>` titles in handbook order. */
export const CSS_LAYOUT_TOPIC_SECTIONS: readonly {
  readonly section: string;
  readonly concepts: readonly string[];
}[] = [
  {
    section: "Positioning & stacking",
    concepts: [
      "Positioning",
      "Stacking context & z-index",
      "Float (legacy)",
      "Centering cookbook",
    ],
  },
  {
    section: "Flexbox",
    concepts: [
      "Flexbox",
      "Flex container properties",
      "Flex item sizing and overflow",
    ],
  },
  {
    section: "CSS Grid",
    concepts: [
      "CSS Grid",
      "Grid tracks and minmax",
      "Grid placement and template areas",
      "Flex vs Grid — when to use which",
    ],
  },
  {
    section: "Responsive Design & Container Queries",
    concepts: [
      "Responsive vs adaptive",
      "Cross-browser responsive layout",
      "Media queries",
      "Container queries",
      "Units",
      "CSS Custom Properties",
      "Native CSS nesting",
    ],
  },
  {
    section: "Scroll, Touch & Mobile Viewport",
    concepts: [
      "Scroll behavior",
      "Touch & pointer",
      "Safe areas & viewport units",
    ],
  },
];

const titleToSection = new Map<string, string>(
  CSS_LAYOUT_TOPIC_SECTIONS.flatMap(({ section, concepts }) =>
    concepts.map((title) => [title, section]),
  ),
);

export function isCssLayoutTopicSlug(slug: string): boolean {
  return slug === CSS_LAYOUT_TOPIC_SLUG;
}

export function cssLayoutConceptSection(title: string): string | undefined {
  return titleToSection.get(title);
}

export function withCssLayoutConceptGroups<
  T extends { readonly title: string },
>(items: readonly T[]): (T & { group?: string })[] {
  return items.map((item) => {
    const group = cssLayoutConceptSection(item.title);
    return group ? { ...item, group } : item;
  });
}
