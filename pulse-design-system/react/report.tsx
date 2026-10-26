"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, IconButton } from "./buttons";
import { ChevronDown, ChevronLeft, ChevronRight, Download } from "./icons";
import { cx } from "./cx";
import { accordion, fadeInUp, revealOnScroll, staggerContainer } from "./motion";

// The report is a document, not a chat card: square corners, rule lines,
// upright bold serif headings, violet only for structure.

/** The report frame: eyebrow + big subject title + Download button, then sections. */
export function ReportDocument({
  eyebrow,
  title,
  onDownload,
  downloading,
  downloadLabel = "Download PDF",
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  onDownload?: () => void;
  downloading?: boolean;
  downloadLabel?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rx-report"
    >
      <header className="rx-report__header">
        <div style={{ minWidth: 0 }}>
          <Eyebrow style={{ marginBottom: 12 }}>{eyebrow}</Eyebrow>
          <h1 className="rx-report__title">{title}</h1>
        </div>
        {onDownload && (
          <Button variant="report" onClick={onDownload} disabled={downloading} icon={<Download className="rx-icon rx-icon--sm" />}>
            {downloading ? "Preparing…" : downloadLabel}
          </Button>
        )}
      </header>
      {children}
    </motion.section>
  );
}

/** A chapter. Give it an id so ChaptersNav can jump to it. */
export function Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cx("rx-section", className)}>
      {children}
    </section>
  );
}

/** `.h-sec` — violet serif heading (the "about you" sections). */
export function SectionHeading({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <h2 className="rx-h-sec" style={style}>{children}</h2>;
}

/** `.h-black` — ink serif heading (the analysis sections). */
export function TopicHeading({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <h2 className="rx-h-topic" style={style}>{children}</h2>;
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="rx-h3">{children}</h3>;
}

/** Small violet uppercase label. */
export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span className="rx-eyebrow" style={style}>{children}</span>;
}

/** Report paragraph (14 / 1.65, secondary grey; <strong> turns ink). */
export function Body({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p className="rx-body" style={style}>{children}</p>;
}

export function Caption({ children }: { children: ReactNode }) {
  return <p className="rx-caption">{children}</p>;
}

export type Band = "high" | "medium" | "low";

/** Severity/effort chip — monochrome on purpose (violet means structure). */
export function Chip({ band, children }: { band: Band; children: ReactNode }) {
  return <span className={cx("rx-chip", `rx-chip--${band}`)}>{children}</span>;
}

/** Violet chip for a value that was inferred rather than observed. */
export function SoftChip({ children }: { children: ReactNode }) {
  return <span className="rx-chip rx-chip--soft">{children}</span>;
}

/** The report's one table, with the violet→black header gradient. */
export function GradientTable({ columns, children }: { columns: { header: string; width?: string }[]; children: ReactNode }) {
  return (
    <div className="rx-table-wrap">
      <table className="rx-table">
        <thead className="rx-table-head">
          <tr>
            {columns.map((c) => (
              <th key={c.header} style={c.width ? { width: c.width } : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** Table cell. `k` = bold ink key column; `num` = tabular numerals ("01"). */
export function Td({ children, k, num }: { children: ReactNode; k?: boolean; num?: boolean }) {
  return <td className={cx(k && "k", num && "num")}>{children}</td>;
}

/** Ruled row of big serif numerals; only the first is violet (set `accent`). */
export function StatRow({ stats, style }: { stats: { value: string; label: string; accent?: boolean }[]; style?: CSSProperties }) {
  return (
    <div className="rx-stats" style={style}>
      {stats.map((s) => (
        <div key={s.label} className={cx("rx-stat", s.accent && "rx-stat--accent")}>
          <div className="rx-stat__value">{s.value}</div>
          <div className="rx-stat__label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * One wide lead cell (1.4fr) + one cell per lens, drawn with 1px gaps over a
 * rule background. `score: null` shows an honest en dash.
 */
export function ScoreGrid({
  overall,
  lenses,
}: {
  overall?: { label: string; score: number | null; rationale?: string };
  lenses: { label: string; score: number | null; rationale?: string }[];
}) {
  const cell = (c: { label: string; score: number | null; rationale?: string }, lead?: boolean) => (
    <div key={c.label} title={c.rationale} className={cx("rx-score", lead && "rx-score--lead")}>
      <div className="rx-score__value">
        {c.score === null ? (
          <span style={{ color: "var(--pulse-tertiary)" }}>–</span>
        ) : (
          <>
            {c.score.toFixed(1)}
            <span className="rx-score__unit">/10</span>
          </>
        )}
      </div>
      <div className="rx-score__label">{c.label}</div>
    </div>
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rx-scoregrid"
      style={{
        gridTemplateColumns: overall
          ? `1.4fr repeat(${lenses.length}, minmax(0, 1fr))`
          : `repeat(${lenses.length}, minmax(0, 1fr))`,
      }}
    >
      {overall && cell(overall, true)}
      {lenses.map((l) => cell(l))}
    </motion.div>
  );
}

/** Violet-tinted callout with a violet left rule (Confidence Signal). */
export function SignalCallout({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="rx-callout rx-callout--signal">
      <Eyebrow>{label}</Eyebrow>
      <div className="rx-callout__text">{children}</div>
    </div>
  );
}

/** Neutral callout with a violet left rule (scope, how-to-use). */
export function ScopeCallout({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="rx-callout rx-callout--scope">
      <Eyebrow>{label}</Eyebrow>
      <div className="rx-callout__text">{children}</div>
    </div>
  );
}

/**
 * A detailed finding: chip gutter, then title → what's on the page → why it
 * costs → "Fix →". A ruled row, not a card. Reveals once on scroll.
 */
export function FindingRow({
  band,
  level,
  title,
  observation,
  why,
  fix,
  reference,
  notTested,
  evidence,
  evidenceLabel = "Show evidence",
}: {
  band: Band;
  /** Text in the chip, e.g. "High", "Medium", "Critical", "Suggestion". */
  level: string;
  title: ReactNode;
  observation: ReactNode;
  why?: ReactNode;
  fix?: ReactNode;
  /** e.g. "Nielsen #1: Visibility of System Status · high confidence · trivial to fix" */
  reference?: ReactNode;
  notTested?: boolean;
  /** Optional expandable content (screenshot crop, code). */
  evidence?: ReactNode;
  evidenceLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.li {...revealOnScroll(8, 0.3)} className="rx-finding" style={{ listStyle: "none" }}>
      <div>
        <Chip band={band}>{level}</Chip>
      </div>
      <div style={{ minWidth: 0 }}>
        <h3 className="rx-finding__title">{title}</h3>
        <p className="rx-finding__text">{observation}</p>
        {notTested ? (
          <p className="rx-finding__text" style={{ color: "var(--pulse-tertiary)", fontStyle: "italic", marginTop: 6 }}>
            Not tested: no live URL provided.
          </p>
        ) : (
          <>
            {why && <p className="rx-finding__why">{why}</p>}
            {fix && (
              <p className="rx-finding__fix">
                <b>Fix → </b>
                {fix}
              </p>
            )}
          </>
        )}
        {reference && <div className="rx-finding__ref">{reference}</div>}
        {evidence && (
          <div>
            <button type="button" className="rx-finding__toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {evidenceLabel}
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: "flex" }}>
                <ChevronDown className="rx-icon rx-icon--sm" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div {...accordion} style={{ overflow: "hidden" }}>
                  <div style={{ marginTop: 12, maxWidth: 672 }}>{evidence}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.li>
  );
}

/** Wrap FindingRows in this. */
export function FindingList({ children }: { children: ReactNode }) {
  return <ul style={{ margin: 0, padding: 0 }}>{children}</ul>;
}

/** Ruled list (What's Working). */
export function RuledList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="rx-ruled" style={{ margin: 0, padding: 0 }}>
      {items.map((item, i) => (
        <motion.li key={i} {...revealOnScroll(6, 0.25)}>
          {item}
        </motion.li>
      ))}
    </ul>
  );
}

/** Square dark gradient card inside the report ("Unlock the In-Depth Audit"). */
export function UnlockCard({
  title = "Unlock the In-Depth Audit",
  text,
  tiles,
  cta = "Talk to an expert",
  href = "https://reloadux.com/contact",
}: {
  title?: ReactNode;
  text?: ReactNode;
  tiles: { label: string; count: ReactNode; description: ReactNode }[];
  cta?: ReactNode;
  href?: string;
}) {
  return (
    <motion.div {...revealOnScroll(12, 0.4, "-60px")} className="rx-unlock rx-gradient-card">
      <p className="rx-unlock__title">{title}</p>
      {text && <p className="rx-unlock__text">{text}</p>}
      <div className="rx-unlock__grid">
        {tiles.map((t) => (
          <div key={t.label} className="rx-unlock__tile">
            <div className="rx-unlock__tile-head">
              <p className="rx-unlock__tile-label">{t.label}</p>
              <p className="rx-unlock__tile-count">{t.count}</p>
            </div>
            <p className="rx-unlock__tile-text">{t.description}</p>
          </div>
        ))}
      </div>
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
        <a href={href} target="_blank" rel="noreferrer" className="rx-btn rx-btn--white rx-btn--lg" style={{ fontWeight: 700 }}>
          {cta}
        </a>
      </motion.div>
    </motion.div>
  );
}

/** Horizontal, snap-scrolling case-study strip (rounded cards inside the document). */
export function CaseStudies({
  title = "How we solve this for other businesses",
  subtitle = "A finding is only useful if someone can act on it. Here's what that's looked like for other teams.",
  items,
  allHref = "https://reloadux.com/case-studies/",
  allLabel = "View all case studies →",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  items: { client: string; image?: string; problem: ReactNode; outcome: ReactNode; quote?: ReactNode; href?: string }[];
  allHref?: string;
  allLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => trackRef.current?.scrollBy({ left: dir * 304, behavior: "smooth" });
  return (
    <section style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <h2 className="rx-cases__title">{title}</h2>
          <p className="rx-cases__sub">{subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <IconButton variant="nav" label="Previous case study" onClick={() => scroll(-1)}>
            <ChevronLeft strokeWidth={1.5} />
          </IconButton>
          <IconButton variant="nav" label="Next case study" onClick={() => scroll(1)}>
            <ChevronRight strokeWidth={1.5} />
          </IconButton>
        </div>
      </div>
      <motion.div
        ref={trackRef}
        variants={staggerContainer(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="rx-cases__strip"
      >
        {items.map((cs) => (
          <motion.a
            key={cs.client}
            href={cs.href}
            target={cs.href ? "_blank" : undefined}
            rel="noreferrer"
            variants={fadeInUp}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="rx-case"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            {cs.image ? <img src={cs.image} alt="" className="rx-case__img" /> : <div className="rx-case__img" />}
            <div className="rx-case__body">
              <div>
                <h3 className="rx-case__client">{cs.client}</h3>
                <p className="rx-case__problem">{cs.problem}</p>
                <p className="rx-case__outcome">{cs.outcome}</p>
              </div>
              {cs.quote && <p className="rx-case__quote">{cs.quote}</p>}
            </div>
          </motion.a>
        ))}
      </motion.div>
      <a href={allHref} target="_blank" rel="noreferrer" className="rx-cases__all">
        {allLabel}
      </a>
    </section>
  );
}

/** Closing block: "Your report is ready to download" + big Download button. */
export function ReportCTA({
  text = "Your report is ready to download",
  onDownload,
  downloading,
  label = "Download PDF",
}: {
  text?: ReactNode;
  onDownload: () => void;
  downloading?: boolean;
  label?: string;
}) {
  return (
    <div className="rx-report__cta">
      <p>{text}</p>
      <Button variant="report" size="lg" onClick={onDownload} disabled={downloading} icon={<Download className="rx-icon rx-icon--sm" />}>
        {downloading ? "Preparing…" : label}
      </Button>
    </div>
  );
}
