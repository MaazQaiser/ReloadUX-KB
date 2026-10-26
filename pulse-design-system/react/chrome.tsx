"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Logo } from "./brand";
import { LinkButton } from "./buttons";
import { ThemeToggle } from "./theme";
import { cx } from "./cx";
import { springs } from "./motion";

/**
 * Sticky glass header: logo left; title + live status line + theme toggle
 * right. The status line cross-fades when it changes.
 */
export function PageHeader({
  title,
  step,
  logoHref = "/",
  logo,
  right,
}: {
  title: string;
  step?: string;
  logoHref?: string;
  logo?: ReactNode;
  /** Replace the theme toggle (e.g. a controlled <ThemeToggle variant="header" …/>). */
  right?: ReactNode;
}) {
  return (
    <header className="rx-header">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rx-header__row"
      >
        <a href={logoHref} style={{ textDecoration: "none" }}>
          {logo ?? <Logo size="header" />}
        </a>
        <div className="rx-header__right">
          <div className="rx-header__meta">
            <div className="rx-header__title">{title}</div>
            <AnimatePresence mode="wait">
              {step && (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="rx-header__step"
                >
                  {step}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {right ?? <ThemeToggle variant="header" />}
        </div>
      </motion.div>
    </header>
  );
}

/**
 * The conversation column. With `leftRail`/`rightRail` (the report view) it
 * widens to 90rem and, at ≥1280px, becomes 14rem | 840px | 14rem with sticky
 * rails. Children are spaced 32px apart. Bottom padding clears the composer.
 */
export function ThreadLayout({
  children,
  leftRail,
  rightRail,
}: {
  children: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
}) {
  const withRails = Boolean(leftRail || rightRail);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      <main className={cx("rx-thread", withRails && "rx-thread--report")}>
        <div className="rx-thread__grid">
          {withRails && (
            <div className="rx-thread__rail">
              <div className="rx-thread__rail-sticky">{leftRail}</div>
            </div>
          )}
          <div className="rx-thread__col">{children}</div>
          {withRails && (
            <div className="rx-thread__rail">
              <div className="rx-thread__rail-sticky">{rightRail}</div>
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
}

/**
 * Report chapters card with a scroll-spy (IntersectionObserver) and a sliding
 * active pill. Each chapter id must match an element id on the page.
 */
export function ChaptersNav({ chapters, title = "Chapters" }: { chapters: { id: string; label: string }[]; title?: string }) {
  const [activeId, setActiveId] = useState(chapters[0]?.id);

  useEffect(() => {
    const targets = chapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActiveId(topMost.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [chapters]);

  return (
    <motion.nav
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      aria-label="Report chapters"
      className="rx-chapters"
    >
      <span className="rx-chapters__title">{title}</span>
      <ul>
        {chapters.map((chapter) => {
          const active = chapter.id === activeId;
          return (
            <li key={chapter.id} style={{ position: "relative" }}>
              {active && (
                <motion.span
                  layoutId="pulse-chapter-active-pill"
                  transition={springs.chapterPill}
                  style={{ position: "absolute", inset: 0, borderRadius: 12, background: "var(--pulse-tint)" }}
                />
              )}
              <button
                type="button"
                onClick={() => document.getElementById(chapter.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={cx(active && "is-active")}
                style={{ position: "relative", zIndex: 10, background: "transparent" }}
              >
                {chapter.label}
              </button>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}

/** The dark "Get full audit" side card with the drifting violet glow. */
export function PromoCard({
  title = "Get full audit",
  body = "This basic scan catches the obvious stuff. A full ReloadUX audit goes deeper: goal-mapped findings, root-cause analysis across five expert lenses, and a fix-it roadmap your team can act on.",
  cta = "Talk to an expert",
  href = "https://reloadux.com/contact",
}: {
  title?: ReactNode;
  body?: ReactNode;
  cta?: ReactNode;
  href?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -3 }}
      className="rx-promo rx-gradient-card"
    >
      <Avatar size="lg" />
      <p className="rx-promo__title">{title}</p>
      <p className="rx-promo__text">{body}</p>
      <LinkButton href={href} variant="white">
        {cta}
      </LinkButton>
    </motion.div>
  );
}
