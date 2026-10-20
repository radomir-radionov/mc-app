/** CSS Core topic (`css-core`) — handbook section groups. */
export const CSS_CORE_TOPIC_SLUG = "css-core";

export const CSS_CORE_TOPIC_SECTIONS: readonly {
  readonly section: string;
  readonly concepts: readonly string[];
}[] = [
  {
    section: "Core",
    concepts: [
      "Ways to add CSS",
      "@import anti-patterns",
      "CSS rule syntax",
      "Global keywords",
      "Code style — property order",
      "Reset.css vs Normalize.css",
    ],
  },
  {
    section: "Selectors & Cascade",
    concepts: [
      "Selector types",
      "Combinators",
      "Class vs ID",
      "Modern functional selectors",
      "Specificity calculation",
      "Cascade origins",
      "Inheritance",
      "@layer (cascade layers)",
      "Pseudo-classes",
      "Pseudo-elements",
      "attr() function",
    ],
  },
  {
    section: "Box Model & Display",
    concepts: [
      "CSS box model",
      "box-sizing",
      "Margin & padding",
      "Containing block",
      "Intrinsic & extrinsic sizing",
      "Block formatting context (BFC)",
      "display",
      "display: contents",
      "visibility vs display",
      "overflow, aspect-ratio, object-fit",
      "Logical properties",
      "scrollbar-gutter",
    ],
  },
];

const titleToSection = new Map<string, string>(
  CSS_CORE_TOPIC_SECTIONS.flatMap(({ section, concepts }) =>
    concepts.map((title) => [title, section]),
  ),
);

export function isCssCoreTopicSlug(slug: string): boolean {
  return slug === CSS_CORE_TOPIC_SLUG;
}

export function cssCoreConceptSection(title: string): string | undefined {
  return titleToSection.get(title);
}

export function withCssCoreConceptGroups<T extends { readonly title: string }>(
  items: readonly T[],
): (T & { group?: string })[] {
  return items.map((item) => {
    const group = cssCoreConceptSection(item.title);
    return group ? { ...item, group } : item;
  });
}
