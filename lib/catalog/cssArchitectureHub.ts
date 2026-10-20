/** CSS Architecture topic (`css-architecture`) — handbook section groups. */
export const CSS_ARCHITECTURE_TOPIC_SLUG = "css-architecture";

export const CSS_ARCHITECTURE_TOPIC_SECTIONS: readonly {
  readonly section: string;
  readonly concepts: readonly string[];
}[] = [
  {
    section: "Architecture & Tooling",
    concepts: [
      "BEM (Block Element Modifier)",
      "CSS preprocessors (Sass/SCSS, Less)",
      "PostCSS & Autoprefixer",
      "CSS Modules",
      "styled-components (CSS-in-JS)",
      "Tailwind CSS (utility-first)",
      "Bootstrap",
      "CSS methodologies comparison",
    ],
  },
  {
    section: "Performance",
    concepts: [
      "Reflow, repaint, composite",
      "Critical CSS",
      "Compositor layers & GPU",
      "contain & content-visibility",
      "CSS sprites (historical)",
      "Shorthand pitfalls",
      "Accessibility in CSS",
      "Interview Practice",
    ],
  },
];

const titleToSection = new Map<string, string>(
  CSS_ARCHITECTURE_TOPIC_SECTIONS.flatMap(({ section, concepts }) =>
    concepts.map((title) => [title, section]),
  ),
);

export function isCssArchitectureTopicSlug(slug: string): boolean {
  return slug === CSS_ARCHITECTURE_TOPIC_SLUG;
}

export function cssArchitectureConceptSection(
  title: string,
): string | undefined {
  return titleToSection.get(title);
}

export function withCssArchitectureConceptGroups<
  T extends { readonly title: string },
>(items: readonly T[]): (T & { group?: string })[] {
  return items.map((item) => {
    const group = cssArchitectureConceptSection(item.title);
    return group ? { ...item, group } : item;
  });
}
