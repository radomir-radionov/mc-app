"use client";

import { useHandbookMobileNavOpen } from "@/components/nav/context/handbookMobileNavContext";
import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { ConceptHeaderActionProps } from "@/components/topic/conceptFooterActionsContext";
import type { ChromeCopy } from "@/lib/nav";
import { CopyConceptLinkButton } from "./CopyConceptLinkButton";
import { TopicBookmarkButton } from "./TopicBookmarkButton";

const HEADER_GRID =
  "grid grid-cols-1 items-start gap-x-2 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-3";

const DETAIL_HEADER = `concept-detail-toolbar sm:sticky sm:top-[var(--handbook-sticky-inset,0px)] sm:z-10 ${HEADER_GRID} rounded-t-[calc(0.75rem-1px)] border-b border-yellow-200 bg-yellow-50 px-4 py-2.5 max-sm:rounded-t-none dark:border-yellow-800 dark:bg-yellow-950`;

const INDEX_HEADER =
  "flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800";

const TITLE_CLASS =
  "col-start-1 row-start-1 min-w-0 w-full text-pretty text-xl font-semibold leading-7 tracking-tight text-zinc-900 sm:text-2xl sm:leading-8 dark:text-zinc-50";

const INDEX_TITLE_CLASS =
  "min-w-0 flex-[1_1_10rem] text-pretty text-xl font-semibold leading-7 tracking-tight text-zinc-900 sm:text-2xl sm:leading-8 dark:text-zinc-50";

const TITLE_TOGGLE_CLASS =
  "w-full cursor-pointer border-0 bg-transparent p-0 text-left font-inherit text-inherit";

const ACTIONS_CLASS =
  "col-start-1 row-start-2 flex w-full shrink-0 items-center justify-start gap-1 sm:col-start-2 sm:row-start-1 sm:w-auto sm:justify-end sm:justify-self-end sm:gap-1.5";

const INDEX_ACTIONS_CLASS =
  "ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5";

const NAV_GROUP = "inline-flex shrink-0 items-center gap-1";

const NAV_BTN_DETAIL =
  "inline-flex size-11 touch-manipulation cursor-pointer items-center justify-center gap-1 rounded-full border border-amber-200/80 bg-white/95 px-0 text-[13px] font-medium text-zinc-700 shadow-sm ring-1 ring-amber-100/50 transition-colors hover:bg-amber-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 sm:size-8 sm:h-8 sm:min-h-8 sm:w-auto sm:min-w-0 sm:rounded-md sm:px-2.5 dark:border-amber-900/50 dark:bg-zinc-950/95 dark:text-zinc-200 dark:ring-amber-950/40 dark:hover:bg-amber-950/50 dark:focus-visible:ring-amber-500/40";

const NAV_BTN_DETAIL_COMPACT =
  "inline-flex size-9 touch-manipulation cursor-pointer items-center justify-center gap-1 rounded-md border border-amber-200/80 bg-white/95 px-0 text-[13px] font-medium text-zinc-700 shadow-sm ring-1 ring-amber-100/50 transition-colors hover:bg-amber-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 dark:border-amber-900/50 dark:bg-zinc-950/95 dark:text-zinc-200 dark:ring-amber-950/40 dark:hover:bg-amber-950/50 dark:focus-visible:ring-amber-500/40";

const NAV_BTN_INDEX =
  "inline-flex size-11 touch-manipulation cursor-pointer items-center justify-center gap-1 rounded-full border border-zinc-200 bg-white px-0 text-[13px] font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 sm:size-8 sm:h-8 sm:min-h-8 sm:w-auto sm:min-w-0 sm:rounded-md sm:px-2.5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500/40";

const NAV_ICON =
  "size-3.5 shrink-0 text-zinc-500 sm:size-3.5 sm:text-zinc-400 dark:text-zinc-400 sm:dark:text-zinc-500";

const ACTION_DIVIDER_DETAIL =
  "mx-0.5 h-6 w-px shrink-0 bg-amber-200/70 dark:bg-amber-900/50";

const ACTION_DIVIDER_INDEX =
  "mx-0.5 h-6 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700";

function ConceptNavControl({
  href,
  onActivate,
  label,
  className,
  children,
}: {
  href: string | null;
  onActivate?: () => void;
  label: string;
  className: string;
  children: ReactNode;
}) {
  if (!href || !onActivate) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={className}
      onClick={() => onActivate?.()}
    >
      {children}
    </button>
  );
}

function ConceptNavGroup({
  showBack,
  backHref,
  onBack,
  showNext,
  nextHref,
  onNext,
  chrome,
  variant,
}: {
  showBack: boolean;
  backHref: string | null;
  onBack?: () => void;
  showNext: boolean;
  nextHref: string | null;
  onNext?: () => void;
  chrome: ChromeCopy;
  variant: "index" | "detail" | "footer";
}) {
  if (!showBack && !showNext) {
    return null;
  }

  const btnClass =
    variant === "footer"
      ? NAV_BTN_DETAIL_COMPACT
      : variant === "detail"
        ? NAV_BTN_DETAIL
        : NAV_BTN_INDEX;

  return (
    <div
      className={NAV_GROUP}
      role="group"
      aria-label={`${chrome.back} / ${chrome.next}`}
    >
      {showBack ? (
        <ConceptNavControl
          href={backHref}
          onActivate={onBack}
          label={chrome.back}
          className={btnClass}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className={NAV_ICON}>
            <path
              d="M15 18l-6-6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">{chrome.back}</span>
        </ConceptNavControl>
      ) : null}
      {showNext ? (
        <ConceptNavControl
          href={nextHref}
          onActivate={onNext}
          label={chrome.next}
          className={btnClass}
        >
          <span className="hidden sm:inline">{chrome.next}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className={NAV_ICON}>
            <path
              d="M9 18l6-6-6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ConceptNavControl>
      ) : null}
    </div>
  );
}

function ConceptTitleHeading({
  title,
  chrome,
  level,
  variant,
}: {
  title: string;
  chrome: ChromeCopy;
  level: "h1" | "h2";
  variant: "index" | "detail";
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [expandedTitle, setExpandedTitle] = useState<string | null>(null);
  const expanded = expandedTitle === title;
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) {
      return;
    }

    const measure = () => {
      if (window.matchMedia("(min-width: 640px)").matches) {
        setTruncated(false);
        return;
      }
      if (expanded) {
        return;
      }
      setTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [title, expanded]);

  const clampClass = expanded ? "" : "max-sm:line-clamp-2";
  const toggleLabel = expanded
    ? chrome.collapseConceptTitle
    : chrome.expandConceptTitle;
  const showToggle = truncated || expanded;

  const inner = showToggle ? (
    <button
      type="button"
      className={TITLE_TOGGLE_CLASS}
      aria-expanded={expanded}
      aria-label={`${title}. ${toggleLabel}`}
      onClick={() =>
        setExpandedTitle((current) => (current === title ? null : title))
      }
    >
      {title}
    </button>
  ) : (
    title
  );

  const titleBase = variant === "detail" ? TITLE_CLASS : INDEX_TITLE_CLASS;
  const className = `${titleBase} ${clampClass}`;

  if (level === "h1") {
    return (
      <h1 ref={titleRef} className={className}>
        {inner}
      </h1>
    );
  }

  return (
    <h2 ref={titleRef} className={className}>
      {inner}
    </h2>
  );
}

const DETAIL_ACTIONS_DOCK =
  "flex min-h-11 touch-manipulation items-center justify-center border-t border-yellow-200 bg-yellow-50 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-1px_0_rgba(0,0,0,0.04)] dark:border-yellow-800 dark:bg-yellow-950 dark:shadow-[0_-1px_0_rgba(255,255,255,0.06)]";

export function ConceptDetailActionsFooter(props: ConceptHeaderActionProps) {
  const navOpen = useHandbookMobileNavOpen();
  const dockRef = useRef<HTMLDivElement>(null);
  const portalReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const hasActions =
    props.showBack || props.showNext || props.showBookmark || props.showShare;

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!hasActions || navOpen) {
      root.style.removeProperty("--handbook-concept-dock-h");
      return;
    }
    const node = dockRef.current;
    const syncHeight = () => {
      const height = node?.offsetHeight ?? 0;
      if (height > 0) {
        root.style.setProperty("--handbook-concept-dock-h", `${height}px`);
      }
    };
    syncHeight();
    if (!node) {
      return;
    }
    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--handbook-concept-dock-h");
    };
  }, [
    hasActions,
    navOpen,
    props.showBack,
    props.showNext,
    props.showBookmark,
    props.showShare,
  ]);

  if (!hasActions || navOpen) {
    return null;
  }

  const dock = !portalReady
    ? null
    : createPortal(
        <div
          ref={dockRef}
          className={`concept-detail-dock fixed inset-x-0 bottom-0 z-30 sm:hidden ${DETAIL_ACTIONS_DOCK}`}
          role="toolbar"
          aria-label={props.chrome.topicsNav}
        >
          <ConceptHeaderActions {...props} compact />
        </div>,
        document.body,
      );

  return (
    <>
      <div
        className="shrink-0 sm:hidden"
        style={{ height: "var(--handbook-concept-dock-h, 2.75rem)" }}
        aria-hidden="true"
      />
      {dock}
    </>
  );
}

export function ConceptHeaderActions({
  title,
  chrome,
  variant,
  compact = false,
  showBack = false,
  backHref = null,
  onBack,
  showNext = false,
  nextHref = null,
  onNext,
  showBookmark = false,
  showShare = false,
  conceptId,
}: ConceptHeaderActionProps & { compact?: boolean }) {
  const dividerClass =
    variant === "detail" ? ACTION_DIVIDER_DETAIL : ACTION_DIVIDER_INDEX;
  const navVariant = compact ? "footer" : variant;

  return (
    <div className="flex items-center justify-center gap-1">
      <ConceptNavGroup
        showBack={showBack}
        backHref={backHref}
        onBack={onBack}
        showNext={showNext}
        nextHref={nextHref}
        onNext={onNext}
        chrome={chrome}
        variant={navVariant}
      />
      {showBack || showNext ? (
        showShare || showBookmark ? (
          <span className={dividerClass} aria-hidden="true" />
        ) : null
      ) : null}
      {showShare ? (
        <CopyConceptLinkButton
          conceptId={conceptId}
          chrome={chrome}
          size="md"
          concealed={false}
        />
      ) : null}
      {showBookmark ? (
        <TopicBookmarkButton
          title={title}
          chrome={chrome}
          conceptId={conceptId}
          size="md"
        />
      ) : null}
    </div>
  );
}

export function ConceptTitleHeader({
  title,
  chrome,
  variant = "index",
  showBack = false,
  backHref = null,
  onBack,
  showNext = false,
  nextHref = null,
  onNext,
  showBookmark = false,
  showShare = false,
  conceptId,
  hideActionsOnMobile = false,
}: {
  title: string;
  chrome: ChromeCopy;
  variant?: "index" | "detail";
  hideActionsOnMobile?: boolean;
  showBack?: boolean;
  backHref?: string | null;
  onBack?: () => void;
  showNext?: boolean;
  nextHref?: string | null;
  onNext?: () => void;
  showBookmark?: boolean;
  showShare?: boolean;
  conceptId?: string;
}) {
  const actionProps: ConceptHeaderActionProps = {
    title,
    chrome,
    variant,
    showBack,
    backHref,
    onBack,
    showNext,
    nextHref,
    onNext,
    showBookmark,
    showShare,
    conceptId,
  };
  const hasActions = showBack || showNext || showBookmark || showShare;
  const headingLevel = variant === "detail" ? "h2" : "h1";
  const actionsBase = variant === "index" ? INDEX_ACTIONS_CLASS : ACTIONS_CLASS;
  const actionsClass = hideActionsOnMobile
    ? `${actionsBase} max-sm:hidden`
    : actionsBase;

  return (
    <div className={variant === "detail" ? DETAIL_HEADER : INDEX_HEADER}>
      <ConceptTitleHeading
        title={title}
        chrome={chrome}
        level={headingLevel}
        variant={variant}
      />
      {hasActions ? (
        <span className={actionsClass}>
          <ConceptHeaderActions {...actionProps} />
        </span>
      ) : null}
    </div>
  );
}
