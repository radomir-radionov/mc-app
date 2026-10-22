import {
  clusterHref,
  getCluster,
  getSubject,
  getTrack,
  subjectHref,
  trackHref,
  type Subject,
  type Topic,
  type Track,
} from "@/lib/catalog";
import { chromeFor } from "@/lib/i18n/chrome";
import { catalogBlurb } from "@/lib/i18n/catalog";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { homeHref, withLocale } from "@/lib/i18n/paths";
import type { Crumb, HashCrumb } from "./types";

function homeCrumb(locale: Locale): Crumb {
  return { label: chromeFor(locale).home, href: homeHref(locale) };
}

function L(locale: Locale, href: string): string {
  return withLocale(locale, href);
}

export function trackCrumbs(
  track: Track,
  locale: Locale = DEFAULT_LOCALE,
): readonly Crumb[] {
  return [homeCrumb(locale), { label: catalogBlurb(locale, track.title) }];
}

export function subjectCrumbs(
  subject: Subject,
  locale: Locale = DEFAULT_LOCALE,
): readonly Crumb[] {
  const trail: Crumb[] = [homeCrumb(locale)];
  const track = getTrack(subject.track);
  if (track && subjectHref(subject) !== trackHref(track.id)) {
    trail.push({
      label: catalogBlurb(locale, track.title),
      href: L(locale, trackHref(track.id)),
    });
  }
  trail.push({ label: subject.title });
  return trail;
}

export function topicCrumbs(
  topic: Topic,
  locale: Locale = DEFAULT_LOCALE,
): readonly Crumb[] {
  const trail: Crumb[] = [homeCrumb(locale)];
  const track = getTrack(topic.track);
  const subject = topic.grouping
    ? getSubject(topic.track, topic.grouping.subject)
    : undefined;
  const subjectPath = subject ? subjectHref(subject) : undefined;

  if (track && subjectPath !== trackHref(track.id)) {
    trail.push({
      label: catalogBlurb(locale, track.title),
      href: L(locale, trackHref(track.id)),
    });
  }

  if (subject && subjectPath) {
    trail.push({ label: subject.title, href: L(locale, subjectPath) });
    const cluster = topic.grouping
      ? getCluster(subject, topic.grouping.cluster)
      : undefined;
    if (cluster && !subject.flatNav && cluster.title.trim()) {
      trail.push({
        label: cluster.title,
        href: L(locale, clusterHref(subject, cluster)),
      });
    }
  }

  trail.push({ label: catalogBlurb(locale, topic.title) });
  return trail;
}

export function crumbsWithActive(
  items: readonly Crumb[],
  pageHref: string,
  hashCrumbs: readonly HashCrumb[],
  activeId: string,
): readonly Crumb[] {
  if (!activeId || items.length === 0) {
    return items;
  }
  const match = hashCrumbs.find((item) => item.id === activeId);
  if (!match) {
    return items;
  }
  const last = items[items.length - 1];
  if (!last || last.label === match.label) {
    return items;
  }
  return [
    ...items.slice(0, -1),
    { label: last.label, href: last.href ?? pageHref },
    { label: match.label },
  ];
}
