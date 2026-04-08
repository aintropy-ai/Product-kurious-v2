# Kurious Solutions

## What is a Solution?

A solution is Kurious applied to a specific domain or use case. The platform is the same. The data, the intelligence, the UX. The solution is how we package it for a specific customer or industry.

## Solutions Roadmap

| Priority | Solution | Domain | Status |
|---|---|---|---|
| 1 | NJ Open Data | Government, public records | Live |
| 2 | Legal Videos | Legal, government meetings | In Progress |
| 3 | TBD | See proposed options below | For discussion |

---

## Solution 1: NJ Open Data

**Status:** Live

**What it proves:** Kurious can search 85M records across 23 agencies, 8+ formats, in under 200ms. Text, structured data, images. One query, one answer with citations.

**User:** Government researchers, journalists, analysts, citizens

**Stage:** Play (zero touch, public demo)

**What success looks like:**
- Cited, multi-source answer in under 3 seconds
- Answers pull from multiple agencies and formats in one response
- Every answer has inline citations linking to the original source
- Unmatched queries get a helpful redirect, not an error
- Video clip play rate above 25%
- Session depth above 3 queries per session

**User stories:**

*Journalist:*
James is investigating NJ infrastructure spending. He needs to know how much NJ DOT spent on road maintenance, where the money came from, and how it compares to previous years. Today he spends half a day digging through Treasury reports, DOT budget PDFs, and federal allocation documents across 3 different agency websites. With Kurious, he types one question and gets a complete answer with a data table, a chart, and 3 cited sources from NJDOT, NJ Treasury, and Federal Highway Admin. All in 0.19 seconds.

*Policy researcher:*
Anika works for a think tank analyzing environmental policy. She needs to compare pollution violations across all 21 NJ counties for a report due Friday. Today she downloads 6 spreadsheets from DEP, manually cross-references county names, and builds her own comparison table. With Kurious, she asks "Which NJ counties had the most environmental violations in 2022?" and gets a ranked table with a chart, sourced from DEP enforcement records, with breakdowns by violation type. She copies it directly into her report.

*Citizen:*
David wants to know if his local school district's budget increased or decreased. He has no idea which agency tracks this or where to look. With Kurious, he types it in plain language and gets an answer with the exact budget numbers, trend over 3 years, and a link to the source document. No government website navigation needed.

---

## Solution 2: Legal Videos

**Status:** In Progress

**What it proves:** Kurious can understand video at scale. Find exact moments, identify speakers, extract meaning from unclear audio and visual-only content.

**User:** Legal professionals, court administrators, compliance officers, researchers

**Stage:** Play (building toward demo)

**What's built:**
- 4,000 hours ingested (LocalView + Seattle City Council)
- Knowledge graph with 12 entity types (Person, Court, LegalCase, Committee, etc.)
- 88.6% eval accuracy on 1,000 QA pairs
- Natural language query API

**What success looks like:**
- User asks about a topic and gets the exact 3-7 second video clip, not a link to a 90-minute recording
- Clips show before text. The video moment IS the answer.
- Speaker identified on every clip with name and role
- 3 content types handled: clear speech (transcript), unclear audio (AI summary), visual-only (scene description)
- Cross-modal answers: video clips + documents + data combined in one response
- Eval accuracy above 85% on legal video queries

**What's next:** Video-first UX in the prototype, legal video demo ready for external sharing

**User stories:**

*Compliance officer:*
Maria is reviewing what NJ Transit's board decided about safety in 2023. Today she watches 3 board meeting recordings (4.5 hours total), takes notes, and cross-references with NTSB safety reports. With Kurious, she types one question and gets 2 video clips: the board chair announcing PTC funding approval (4 sec) and the CEO presenting bus safety pilot results (5 sec), each with full transcript, followed by a text summary citing the NTSB compliance report. She gets in 5 seconds what took her a full afternoon.

*Attorney:*
Raj is preparing for a zoning case. He needs to find every mention of downtown zoning proposals across 2 years of council meetings. Today his paralegal spends 2 days watching recordings and tagging relevant moments. With Kurious, he asks one question and gets 6 video clips from different meetings, each with speaker name, role, and what they said. All organized by relevance, not chronology.

*Court administrator:*
Lisa needs to audit how many times a specific judge referenced a particular statute in the past year. Today this is impossible without watching every recording manually. With Kurious, she asks and gets every instance with context and the judge's exact words.

---

## Solution 3: Proposed Options

The first two solutions prove Kurious can search and find. The third solution should prove Kurious can do more. Here are 4 options. Each is a genuinely new capability, not just Kurious on different data.

---

### Option A: AI Research Agent

**What it is:** Search answers "find me X." A research agent answers "figure out Y for me." Instead of returning results and leaving the user to connect the dots, Kurious reads everything about a topic, cross-references across sources, and produces a structured, cited research brief.

| | Search (today) | Research Agent |
|---|---|---|
| What you ask | "Find me X" | "Figure out Y for me" |
| What it does | Retrieves and ranks results | Plans, gathers, cross-references, synthesizes |
| What you get | A list of results. You do the thinking. | A structured brief. The agent did the thinking. |
| Iteration | You refine your query manually | Agent refines automatically, tries different angles |
| Time | Seconds per query, hours to synthesize | Minutes for a complete brief |

**What we'd need to build:**
- Multi-step reasoning (agent asks follow-up questions to itself)
- Synthesis (combine findings into a structured report)
- Iteration (try different search angles if first pass is not enough)
- This is mostly an orchestration/prompt change, not a new pipeline

**Effort:** Low to medium. We already search, cite, and do cross-modal reasoning. The addition is orchestration.

**Why it matters:**
- Knowledge workers spend 20-30% of their time searching and synthesizing
- Enterprise search market is $5B (2025). Knowledge automation market is $30B+
- Positions Kurious as "beyond search"

**Why now:** OpenAI launched Deep Research in Feb 2026. Perplexity Pro is growing. Hebbia raised $130M. Nobody does it on enterprise multimodal data yet. We have a window before Glean or TwelveLabs add this.

**Who's doing this:**
- Hebbia ($130M) does it for finance documents only
- Perplexity Pro does it for the public web only
- OpenAI Deep Research does it for general web only
- Nobody does it for enterprise multimodal data (video + docs + data)

**User stories:**

*Compliance analyst:*
Sarah's boss asks: "Give me everything we know about water quality issues in Essex County. Are we in compliance? What changed since last year?" Today Sarah spends 3 hours searching 4 databases, watching 2 council meeting recordings, and cross-referencing DEP violation reports. With Kurious Research Agent, she types that question and gets a 2-page cited brief in 45 seconds. The brief pulls from DEP violation records, a council meeting video clip where the board discussed the issue, and water quality datasets, with a year-over-year comparison table.

*Policy advisor:*
Mike needs a briefing on NJ transportation infrastructure for the governor's office by tomorrow. He needs spending data, recent board decisions, federal funding status, and upcoming projects. Today that's 6 hours across multiple agencies. With Kurious, he asks for a comprehensive brief and gets a structured document covering all 4 areas, cited from DOT budgets, Transit board meeting clips, IIJA allocation reports, and capital program data. Ready in under a minute.

*Investigative reporter:*
Priya is working on a story about how NJ agencies handle environmental complaints. She needs to trace a complaint from filing to resolution across multiple agencies. Today this requires OPRA requests and weeks of waiting. With Kurious, she asks the question and gets a timeline of actions across DEP, local council meetings (with video clips of relevant discussions), and enforcement records. All cited. All verifiable.

---

### Option B: Workflow Automation

**What it is:** Kurious observes how users interact with data. It detects patterns and suggests or builds automated workflows. If someone searches the same data every quarter, Kurious says "Want me to automate this report?" If an analyst follows the same 5-step process every time, Kurious packages it into a one-click workflow.

**What we'd need to build:**
- User activity tracking (what queries, how often, what patterns)
- Pattern detection (identify recurring behavior)
- Workflow builder (package repeated actions into automated flows)
- Agent framework (Kurious creates agents on the fly)

**Effort:** High. Needs agent framework, activity tracking, and workflow builder. Multiple new systems.

**Why it matters:**
- This is the "platform play." Kurious goes from answering questions to doing work.
- Level 4 intelligence from Kunal's framework (build and edit workflows on the fly)
- Sticky product. Once workflows are built, users don't leave.
- No competitor does this. Glean searches, they don't automate.

**Why now or later:** High effort means longer timeline. Could be Solution 4 after Research Agent proves the "beyond search" value. But strategically this is the biggest differentiator.

**Who's doing this:**
- Nobody in the enterprise search space
- Zapier/Make do workflow automation but with no intelligence
- The combination of search + understanding + automation is unique

**User stories:**

*Government analyst:*
Tom runs the same environmental compliance report every quarter. He searches the same 4 data sources, pulls the same metrics, and formats the same spreadsheet. With Kurious Workflow Automation, after his 3rd time doing this, Kurious asks: "I noticed you pull this data every quarter. Want me to automate this? I'll run it on the first Monday of each quarter and send you the report." Tom says yes. He never runs that report manually again.

*Legal team lead:*
Diana's team reviews new legislation weekly to check if it affects ongoing cases. Every Monday someone searches for new bills, compares them against active cases, and flags conflicts. With Kurious, this becomes an automated workflow: every Monday, Kurious scans new legislation, cross-references with active cases, and sends the team a summary of what needs attention. No manual search needed.

*Operations manager:*
Kevin monitors vendor contract renewals across 50 vendors. Today he has a spreadsheet with dates and sets manual calendar reminders. With Kurious, it automatically monitors contract data, alerts him 30 days before expiry, and pulls up the full vendor history, past performance, and relevant communications when it's time to renew.

---

### Option C: Meeting Intelligence

**What it is:** Every meeting recording (Zoom, Teams, Google Meet) gets indexed automatically. Users can search across all meetings, find specific decisions, extract action items, and get context from past discussions during live meetings.

**What we'd need to build:**
- Meeting recording connectors (Zoom, Teams, Meet APIs)
- Real-time indexing (meetings become searchable shortly after they end)
- Action item extraction (detect decisions and to-dos from conversation)
- Live context surfacing (optional: show relevant past decisions during a meeting)

**Effort:** Medium. We already do video intelligence. The addition is meeting-specific connectors and real-time processing.

**Why it matters:**
- Every company records meetings. Nobody makes them truly searchable with context.
- Otter.ai and Fireflies do transcription. They don't do multimodal search across meetings + docs + data.
- "What did we decide about X last month?" is a question every team asks. Nobody can answer it quickly.

**Why now or later:** Medium effort. Good follow-up after Research Agent. The video intelligence tech is already built, just needs meeting-specific packaging.

**Who's doing this:**
- Otter.ai does meeting transcription (no search across meetings)
- Fireflies.ai does meeting notes (no cross-referencing with docs/data)
- Recall.ai does meeting recording API (infrastructure, not product)
- Nobody combines meeting search with document search with data search

**User stories:**

*Product manager:*
Shivangi needs to know what Kunal decided about the pricing model 3 weeks ago. The decision was made on a call but never written down. Today she scrolls through Slack, asks colleagues, and tries to remember. With Kurious Meeting Intelligence, she asks "What did Kunal decide about pricing?" and gets the exact 8-second clip from the meeting where he said it, with transcript and date.

*Engineering lead:*
Nirmit needs to understand why the team chose Elasticsearch over another option 2 months ago. The reasoning was discussed in a technical review meeting. With Kurious, he asks and gets the relevant discussion clips from that meeting, plus the architecture doc that was shared, plus the benchmark data they referenced. Full context in 10 seconds.

*Sales team:*
The sales team had a call with a prospect who asked about compliance features. Before the follow-up call, the account manager asks Kurious: "What did the prospect ask about compliance?" and gets the exact clips from the previous call, plus relevant compliance documentation, so they can prepare a targeted response.

---

### Option D: Compliance Monitoring

**What it is:** Kurious continuously monitors enterprise data for regulatory issues, policy conflicts, and documentation gaps. Instead of searching when you have a question, Kurious watches all the time and alerts you when something needs attention.

**What we'd need to build:**
- Continuous monitoring system (scheduled scans, not just on-demand search)
- Alert/notification system (email, Slack, in-app alerts)
- Rule engine (define what to watch for: expired policies, missing documents, conflicting regulations)
- Audit trail (log of what was checked, when, what was found)

**Effort:** High. Needs monitoring infrastructure, alerting system, and rule engine. Multiple new systems.

**Why it matters:**
- Google AI Overviews has 90% accuracy but millions of errors. Regulated industries need 99%+.
- Our citation model is the differentiator. Every finding is verifiable.
- Compliance is a pain point in every regulated industry (legal, healthcare, finance, government)
- High-value, sticky use case. Once compliance is automated, switching cost is enormous.

**Why now or later:** High effort, but high value for specific verticals. Best suited after the platform is more mature. Could target regulated industries as the first enterprise customers.

**Who's doing this:**
- Relativity does legal compliance (document review)
- Compliance.ai does regulatory monitoring (text only)
- Nobody does multimodal compliance (check video recordings + docs + data together)

**User stories:**

*Compliance director:*
Rachel manages regulatory compliance for a state agency. She needs to ensure all 23 departments have up-to-date privacy policies, safety protocols, and training certifications. Today she emails each department head quarterly and manually tracks responses in a spreadsheet. With Kurious Compliance Monitoring, the system automatically checks every document, flags expired policies, identifies departments with missing certifications, and sends Rachel a weekly compliance dashboard. "3 departments have expired safety protocols. 1 department has no privacy policy on file. Action needed."

*Legal counsel:*
After a new state regulation passes, Alex needs to check if any existing agency policies conflict with it. Today this is a manual review of hundreds of documents. With Kurious, the system automatically scans all policies against the new regulation and flags conflicts: "Your data retention policy in Section 4.2 conflicts with the new regulation Section 12. Here's the specific language that conflicts." With cited sources from both documents.

*Healthcare administrator:*
Dr. Patel's hospital needs to ensure all staff certifications are current and all procedures align with updated medical guidelines. With Kurious monitoring, any time a guideline changes, the system flags which procedures need updating, which staff need recertification, and which departments are affected. Proactive, not reactive.

---

## Comparison: All 4 Options

| | AI Research Agent | Workflow Automation | Meeting Intelligence | Compliance Monitoring |
|---|---|---|---|---|
| **What's new** | Synthesis and multi-step reasoning | Pattern detection and automated workflows | Meeting-specific search and real-time context | Continuous monitoring and alerting |
| **Effort** | Low-medium | High | Medium | High |
| **Impact** | High | Very high (platform play) | Medium-high | High (for regulated industries) |
| **Time to demo** | 4 weeks | 8-12 weeks | 6 weeks | 10-12 weeks |
| **Market** | $30B+ knowledge automation | Unique, no direct competitor | Otter/Fireflies but we're multimodal | Compliance SaaS, regulated verticals |
| **Builds on** | Everything we have today | Research Agent + agent framework | Video intelligence + connectors | Search + monitoring infrastructure |
| **Risk** | Low. Incremental on what exists. | High. New systems needed. | Medium. Needs connectors. | High. New infrastructure. |

---

## Competitive Landscape

### Direct Competitors

| Company | What they do | How we compare |
|---|---|---|
| **Glean** | Enterprise AI search across internal tools (Slack, Drive, Jira). $4.6B valuation. | Closest competitor. Text/document focused, no video intelligence. We do video + docs + data. |
| **TwelveLabs** | Video intelligence platform and API | API-only, no end-user product. They do video only, we do all formats with full UX. |
| **Hebbia** | AI research agent for finance/legal. Ingests 10K+ page documents. $130M raised. | Domain-specific (finance only). We're general enterprise + multimodal. |
| **Perplexity** | AI search for the web | Web-only, consumer. Can't touch enterprise private data. |

### Video and Multimodal Space

| Company | What they do | How we compare |
|---|---|---|
| **Napster** | Video agents, multimodal search for content discovery | Early stage. Overlap on video agents. We have more data types and production infrastructure. |
| **Troveo** | Sells training-ready video data to AI labs | Different business: they sell data, we search it. Could be a partner, not a competitor. |
| **Jina AI** | Multimodal search infrastructure (text, image, video embeddings) | Open-source developer toolkit. Not a packaged product. Overlaps on multimodal tech. |

### Infrastructure and Platform Layer

| Company | What they do | How we compare |
|---|---|---|
| **Cohere** | Enterprise LLM provider (Command, Embed, Rerank) | They sell models, we build the product. Different layer. |
| **Contextual AI** | RAG 2.0, grounded enterprise search. Ex-Google founder. $80M raised. | Focused on reducing hallucination. No multimodal video. |
| **Vectara** | RAG-as-a-service with hallucination detection | Developer API, not end-user product. Infrastructure layer. |
| **Exa** | Search infrastructure (ex-Google Zurich, 70 people) | Developer infra. We build the full product. |

### AI Search and Research

| Company | What they do | How we compare |
|---|---|---|
| **Google AI Overviews** | AI answers in Google search | 90% accurate, millions of errors, no citations. We cite every source. Verifiable. |
| **Feynman** | Open source AI research agent | Research synthesis from public papers. We do the same on enterprise private data. |
| **Inworld** | Real-time voice AI for gaming/applications | Voice/gaming focused. Not enterprise knowledge. Different market. |

### Our Positioning

Most competitors are either text-only enterprise search (Glean), infrastructure/API layers (Vectara, Cohere, Jina), or domain-specific agents (Hebbia).

Nobody does multimodal (video + text + data) search as a packaged product with full UX. And nobody is building solutions that combine search + video intelligence + synthesis on enterprise data.

That's our gap.

---

*Last updated: April 7, 2026*
