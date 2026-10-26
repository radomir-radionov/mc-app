/** Next.js Data (`nextjs-data`) — handbook section groups. */
export const NEXTJS_DATA_TOPIC_SLUG = "nextjs-data";

/** Section title → concept `<summary>` titles in handbook order. */
export const NEXTJS_DATA_TOPIC_SECTIONS: readonly {
  readonly section: string;
  readonly concepts: readonly string[];
}[] = [
  {
    section: "Data fetching",
    concepts: [
      "Server Component fetching",
      "Choosing a data fetch path",
      "Fetching from a remote API",
      "Colocated backend in Next.js",
      "Fetching from a separate backend",
      "fetch cache options",
      "Avoiding waterfalls",
      "Client-side fetching",
      "draftMode",
    ],
  },
  {
    section: "Caching & revalidation",
    concepts: [
      "Revalidation and invalidation across the stack",
      "Caching model overview",
      "use cache directive",
      "revalidateTag",
      "revalidatePath",
      "updateTag",
      "router.refresh()",
      "unstable_noStore",
      "Common pitfall: stale UI after mutation",
      "Vercel CDN cache headers",
      "Deprecated patterns (Next.js 16)",
    ],
  },
  {
    section: "Server Actions vs Route Handlers",
    concepts: [
      "Handling mutations in Next.js",
      "Server Actions",
      "Server Action arguments (bind)",
      "Closures and encryption",
      "Serialization and return values",
      "Cookies and headers in Server Actions",
      "formAction and programmatic invocation",
      "Optimistic UI with Server Actions",
      "Route Handlers",
      "BFF Route Handler",
      "Handling CORS in Next.js",
      "Webhooks in Route Handlers",
      "Caching GET Route Handlers",
      "Comparison table",
      "CSRF with Server Actions",
    ],
  },
];

const titleToSection = new Map<string, string>(
  NEXTJS_DATA_TOPIC_SECTIONS.flatMap(({ section, concepts }) =>
    concepts.map((title) => [title, section]),
  ),
);

export function isNextjsDataTopicSlug(slug: string): boolean {
  return slug === NEXTJS_DATA_TOPIC_SLUG;
}

export function nextjsDataConceptSection(title: string): string | undefined {
  return titleToSection.get(title);
}

export function withNextjsDataConceptGroups<
  T extends { readonly title: string },
>(items: readonly T[]): (T & { group?: string })[] {
  return items.map((item) => {
    const group = nextjsDataConceptSection(item.title);
    return group ? { ...item, group } : item;
  });
}
