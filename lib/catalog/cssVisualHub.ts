/** CSS Visual topic (`css-visual`) — handbook section groups. */
export const CSS_VISUAL_TOPIC_SLUG = "css-visual";

export const CSS_VISUAL_TOPIC_SECTIONS: readonly {
  readonly section: string;
  readonly concepts: readonly string[];
}[] = [
  {
    section: "Typography & Colors",
    concepts: [
      "Font loading",
      "Typography properties",
      "text-wrap: balance / pretty",
      "Color formats",
      "Gradients",
      "Dark mode",
      "color-scheme & light-dark()",
    ],
  },
  {
    section: "Decoration — Background, Border, Shadow",
    concepts: ["Background", "Border, outline & box-shadow"],
  },
  {
    section: "Form & Native Control Styling",
    concepts: ["Customizing form controls", "Pure CSS toggle (no JavaScript)"],
  },
  {
    section: "Print & Paged Media",
    concepts: ["Print styles"],
  },
];

const titleToSection = new Map<string, string>(
  CSS_VISUAL_TOPIC_SECTIONS.flatMap(({ section, concepts }) =>
    concepts.map((title) => [title, section]),
  ),
);

export function isCssVisualTopicSlug(slug: string): boolean {
  return slug === CSS_VISUAL_TOPIC_SLUG;
}

export function cssVisualConceptSection(title: string): string | undefined {
  return titleToSection.get(title);
}

export function withCssVisualConceptGroups<
  T extends { readonly title: string },
>(items: readonly T[]): (T & { group?: string })[] {
  return items.map((item) => {
    const group = cssVisualConceptSection(item.title);
    return group ? { ...item, group } : item;
  });
}
