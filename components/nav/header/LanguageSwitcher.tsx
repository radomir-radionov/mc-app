"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { pathWithoutLocale, withLocale } from "@/lib/i18n/paths";
import {
  followHandbookHref,
  getHash,
  getServerHash,
  queueHandbookHref,
  subscribeHash,
} from "../utils/hash";

const LABELS: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
};

const NAMES: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
};

export function LanguageSwitcher({
  locale,
  variant = "links",
}: {
  locale: Locale;
  variant?: "links" | "select";
}) {
  const pathname = usePathname() ?? `/${locale}`;
  const router = useRouter();
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const rest = pathWithoutLocale(pathname);
  const pathRest = rest === "/" ? "/" : rest;

  const navigateToLocale = useCallback(
    (next: Locale) => {
      if (next === locale) {
        return;
      }
      const href = `${withLocale(next, pathRest)}${hash}`;
      followHandbookHref(href, pathname, (path) => {
        router.push(path, { scroll: false });
      });
    },
    [hash, locale, pathRest, pathname, router],
  );

  if (variant === "select") {
    return <LanguageSwitcherMenu locale={locale} onSelect={navigateToLocale} />;
  }

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-700"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((item) => {
        const href = `${withLocale(item, pathRest)}${hash}`;
        const active = item === locale;
        return (
          <Link
            key={item}
            href={href}
            hrefLang={item}
            lang={item}
            scroll={false}
            aria-current={active ? "page" : undefined}
            onClick={() => {
              if (active) {
                return;
              }
              queueHandbookHref(href);
            }}
            className={
              active
                ? "rounded px-1.5 py-0.5 text-xs font-semibold text-zinc-900 dark:text-zinc-50"
                : "rounded px-1.5 py-0.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }
          >
            {LABELS[item]}
          </Link>
        );
      })}
    </div>
  );
}

function LanguageSwitcherMenu({
  locale,
  onSelect,
}: {
  locale: Locale;
  onSelect: (locale: Locale) => void;
}) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    left: number;
    bottom: number;
    minWidth: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const syncMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    setMenuStyle({
      left: rect.left,
      bottom: window.innerHeight - rect.top + 4,
      minWidth: Math.max(rect.width, 148),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    syncMenuPosition();
    window.addEventListener("resize", syncMenuPosition);
    window.addEventListener("scroll", syncMenuPosition, true);
    return () => {
      window.removeEventListener("resize", syncMenuPosition);
      window.removeEventListener("scroll", syncMenuPosition, true);
    };
  }, [open, syncMenuPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menu =
    open && menuStyle
      ? createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label="Language"
            className="fixed z-[100] overflow-hidden rounded-md border border-zinc-200 bg-white py-0.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            style={{
              left: menuStyle.left,
              bottom: menuStyle.bottom,
              minWidth: menuStyle.minWidth,
            }}
          >
            {LOCALES.map((item) => {
              const selected = item === locale;
              return (
                <li key={item} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    lang={item}
                    onClick={() => {
                      setOpen(false);
                      onSelect(item);
                    }}
                    className={
                      selected
                        ? "flex w-full touch-manipulation cursor-pointer items-center gap-2 px-2.5 py-2 text-left text-xs font-semibold text-zinc-900 dark:text-zinc-50"
                        : "flex w-full touch-manipulation cursor-pointer items-center gap-2 px-2.5 py-2 text-left text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }
                  >
                    <span className="min-w-0 flex-1">{NAMES[item]}</span>
                    {selected ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 16 16"
                        className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400"
                      >
                        <path
                          d="M3 8.5 6.5 12 13 4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label="Language"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 min-w-[3.25rem] touch-manipulation cursor-pointer items-center justify-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs font-semibold text-zinc-900 outline-none hover:bg-zinc-100 focus-visible:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 dark:focus-visible:border-zinc-500"
      >
        <span>{LABELS[locale]}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={`size-3 shrink-0 text-zinc-500 transition-transform dark:text-zinc-400 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {menu}
    </>
  );
}
