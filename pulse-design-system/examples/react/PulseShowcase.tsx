"use client";

// A complete Pulse screen built only from the kit: landing → conversation →
// report → Q&A. Copy pieces of it into your own pages.
// Import path assumes this file stays in pulse-design-system/examples/react.
import { useState } from "react";
import {
  AnsweredCard,
  AnswerChip,
  Body,
  CaseStudies,
  ChaptersNav,
  ChatComposer,
  DoneMessage,
  FindingList,
  FindingRow,
  GoalOptionCards,
  GradientTable,
  InputPreview,
  LandingPage,
  Message,
  PageHeader,
  PromoCard,
  PulseRoot,
  ReportCTA,
  ReportDocument,
  RUNNING_PHRASES,
  ScopeCallout,
  ScoreGrid,
  Section,
  SectionHeading,
  SignalCallout,
  SkipChip,
  SoftChip,
  StatRow,
  StatusMessage,
  Suggestions,
  Td,
  ThreadLayout,
  TopicHeading,
  Chip,
  Caption,
  UnlockCard,
  UserBubble,
  RuledList,
} from "../../react";

const CHAPTERS = [
  { id: "chapter-summary", label: "The Summary" },
  { id: "chapter-about", label: "About reloadux.com" },
  { id: "chapter-experience", label: "Overall Experience" },
  { id: "chapter-inventory", label: "Findings Inventory" },
  { id: "chapter-findings", label: "Detailed Findings" },
  { id: "chapter-strengths", label: "What's Working" },
  { id: "chapter-scope", label: "What This Covers" },
  { id: "chapter-case-studies", label: "Case Studies" },
];

export default function PulseShowcase({ previewImage }: { previewImage?: string }) {
  const [draft, setDraft] = useState("");
  const [asked, setAsked] = useState<{ q: string; a: string }[]>([]);
  const [showGoals, setShowGoals] = useState(true);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setAsked((prev) => [...prev, { q, a: "Start with the stat block and the empty case-study cards: they sit in the page's main trust-building section." }]);
    setDraft("");
  };

  return (
    <PulseRoot page>
      <LandingPage onSubmit={() => document.getElementById("thread")?.scrollIntoView({ behavior: "smooth" })} />

      <div id="thread">
        <PageHeader title="Heuristic Analysis" step="Report" />
        <ThreadLayout leftRail={<ChaptersNav chapters={CHAPTERS} />} rightRail={<PromoCard />}>
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Message>Got it, here&apos;s what I&apos;ll be working from</Message>
            {previewImage && (
              <InputPreview
                src={previewImage}
                alt="Live capture of https://reloadux.com"
                caption="From reviewing your URL, you run reloadux, a UI/UX design agency helping B2B and SaaS companies design AI-native product experiences."
              />
            )}
          </section>

          <AnsweredCard items={[{ question: "Is there a specific goal or outcome you'd like this audit to speak to?", answer: "(skipped)" }]} />
          <UserBubble>Looks right, confirmed.</UserBubble>
          <StatusMessage phrases={RUNNING_PHRASES} intervalMs={2400} />
          <DoneMessage />

          <ReportDocument eyebrow="Pulse · Heuristic Analysis" title="reloadux.com" onDownload={() => {}}>
            <Section id="chapter-summary">
              <SectionHeading>The Summary</SectionHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Body>
                  The biggest cost sits in trust: the About Us stats all read as &apos;0.0x&apos; and &apos;+0%&apos;, and all
                  three case study cards are empty grey boxes. For a design agency, that&apos;s a storefront with{" "}
                  <strong>blank signs</strong>.
                </Body>
                <Body>The evidence points first to the missing stats and case study images. Sequencing beyond that is your call.</Body>
              </div>
            </Section>

            <Section id="chapter-confidence">
              <SignalCallout label="Confidence Signal">
                <strong>Solid</strong> on everything read directly off the page — heading structure, form markup, link and CTA
                copy. <strong>Thin</strong> on anything behind an interaction.
              </SignalCallout>
            </Section>

            <Section id="chapter-about">
              <SectionHeading>About reloadux.com</SectionHeading>
              <GradientTable columns={[{ header: "Dimension", width: "32%" }, { header: "What we found" }]}>
                <tr><Td k>Business</Td><Td>UI/UX design agency for AI-native SaaS, fintech, and healthcare products.</Td></tr>
                <tr><Td k>Primary goal</Td><Td>(skipped)</Td></tr>
                <tr><Td k>Form flow</Td><Td><SoftChip>Inferred</SoftChip> Read from markup; submission states not triggered.</Td></tr>
              </GradientTable>
            </Section>

            <Section id="chapter-experience">
              <TopicHeading style={{ marginBottom: 8 }}>Overall Experience</TopicHeading>
              <Body style={{ marginBottom: 20 }}>The overall score is a weighted blend of the lenses below.</Body>
              <ScoreGrid
                overall={{ label: "Overall Experience", score: 5.9 }}
                lenses={[
                  { label: "Conversion", score: 8.7 },
                  { label: "Accessibility", score: 7.3 },
                  { label: "Trust", score: 6.1 },
                  { label: "Content Quality", score: 10 },
                  { label: "Mobile Experience", score: null },
                ]}
              />
            </Section>

            <Section id="chapter-inventory">
              <TopicHeading>Findings Inventory</TopicHeading>
              <StatRow
                style={{ marginBottom: 28 }}
                stats={[
                  { value: "2", label: "High priority", accent: true },
                  { value: "7", label: "Medium priority" },
                  { value: "8", label: "Low priority" },
                ]}
              />
              <GradientTable columns={[{ header: "#", width: "34px" }, { header: "Check", width: "26%" }, { header: "Finding" }, { header: "Impact", width: "64px" }]}>
                <tr><Td num>01</Td><Td k>Stat block renders as placeholder values</Td><Td>The &quot;About Us&quot; section displays four stats as &apos;0.0x&apos;, &apos;+0&apos;, &apos;0%&apos;.</Td><Td><Chip band="high">High</Chip></Td></tr>
                <tr><Td num>02</Td><Td k>Service menu before qualification</Td><Td>The top nav exposes 12 distinct service links before the page says which applies.</Td><Td><Chip band="medium">Med</Chip></Td></tr>
                <tr><Td num>03</Td><Td k>Footer link density</Td><Td>Footer repeats the full service list a second time.</Td><Td><Chip band="low">Low</Chip></Td></tr>
              </GradientTable>
              <Caption>Showing 3 of 17. The remaining findings continue in the detailed section below.</Caption>
            </Section>

            <Section id="chapter-findings">
              <TopicHeading style={{ marginBottom: 6 }}>Detailed Findings</TopicHeading>
              <Body style={{ marginBottom: 8 }}>Each finding names what&apos;s on the page, why it costs you, and what to change.</Body>
              <FindingList>
                <FindingRow
                  band="high"
                  level="High"
                  title="Stat block renders as placeholder values"
                  observation="The &quot;About Us&quot; section displays four stats as '0.0x', '+0', '0%', '+0%'."
                  why="This section exists to prove credibility with numbers, but every number reads as an unfilled template."
                  fix="Populate the stat block with real figures before launch, or remove the section until the data is ready."
                  reference="Nielsen #1: Visibility of System Status · high confidence · high impact on users · trivial to fix"
                  evidence={<code className="rx-body">&lt;span class=&quot;stat&quot;&gt;0.0x&lt;/span&gt;</code>}
                />
                <FindingRow
                  band="medium"
                  level="Medium"
                  title="Service menu before qualification"
                  observation="The top nav exposes 12 distinct service links plus 3 industry links."
                  why="A visitor has to self-sort across 12+ overlapping service names before deciding where to click."
                  fix="Collapse the nav into the 2–3 top-level paths the hero already establishes."
                />
              </FindingList>
            </Section>

            <Section id="chapter-strengths">
              <TopicHeading>What&apos;s Working</TopicHeading>
              <RuledList items={["The hero correctly splits visitors into two real intents.", "Client logos appear above the fold."]} />
            </Section>

            <Section id="chapter-scope">
              <ScopeCallout label="What this scan covers, and doesn't">
                <p><strong>Covers:</strong> the resting homepage, its markup and accessibility checks.</p>
                <p><strong>Doesn&apos;t cover:</strong> signed-in flows and real devices.</p>
              </ScopeCallout>
            </Section>

            <UnlockCard
              text="This scan already turned up real issues across four more areas — a full ReloadUX audit unlocks the complete breakdown for each."
              tiles={[
                { label: "Business Impact Summary", count: 6, description: "How each issue translates into real business risk and cost." },
                { label: "AI SEO", count: 3, description: "Structured data, schema types, and AI-answer-engine readiness." },
              ]}
            />

            <div id="chapter-case-studies">
              <CaseStudies
                items={[
                  { client: "Nitro", problem: "A play-to-earn racing game needed a UI that felt as premium as its ambitions.", outcome: "$5M in funding secured within 3 months of the redesign.", quote: "“A futuristic play-to-earn racing experience.”" },
                  { client: "Encore", problem: "A B2B shift-management platform was buckling under scheduling complexity.", outcome: "10,000+ employee shifts streamlined through one platform.", quote: "“Revamped a B2B platform for streamlining shift management.”" },
                  { client: "NBCUniversal", problem: "An internal web app was slowing down daily work.", outcome: "A streamlined experience across the web app.", quote: "“Designed an intuitive web app.”" },
                ]}
              />
            </div>

            <ReportCTA onDownload={() => {}} />
          </ReportDocument>

          <Message>
            <p>Ask me anything about this report.</p>
            {asked.length === 0 && (
              <Suggestions
                items={["What are the major findings?", "What are the minor findings?", "What's the single biggest risk here?", "What should I fix first?"]}
                onPick={ask}
              />
            )}
          </Message>

          {asked.map((qa, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <UserBubble>{qa.q}</UserBubble>
              <Message>{qa.a}</Message>
            </div>
          ))}
        </ThreadLayout>

        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSubmit={() => ask(draft)}
          placeholder="Ask Pulse"
          chips={
            showGoals ? (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                <GoalOptionCards
                  question="Is there a specific goal or outcome you'd like this audit to speak to?"
                  options={[
                    { label: "More consultation bookings", description: "Make the path from landing to “Book a call” shorter and clearer." },
                    { label: "Stronger credibility", description: "Surface proof — case studies, outcomes, logos — earlier." },
                  ]}
                  onPick={() => setShowGoals(false)}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <AnswerChip onClick={() => setShowGoals(false)}>Homepage</AnswerChip>
                  <SkipChip onClick={() => setShowGoals(false)} />
                </div>
              </div>
            ) : undefined
          }
        />
      </div>
    </PulseRoot>
  );
}
