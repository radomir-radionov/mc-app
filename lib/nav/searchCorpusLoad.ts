import { TRACKS, type TrackId } from "@/lib/catalog";
import type { NavGroup } from "./types";

/** One failed track becomes an empty chunk so the rest of the corpus still loads. */
export async function loadSearchCorpusTracks(
  locale: string,
  loadTrack: (
    locale: string,
    trackId: TrackId,
  ) => Promise<readonly NavGroup[]>,
): Promise<readonly NavGroup[]> {
  const chunks = await Promise.all(
    TRACKS.map((track) =>
      loadTrack(locale, track.id).then(
        (groups) => groups,
        () => [] as readonly NavGroup[],
      ),
    ),
  );
  return chunks.flat();
}
