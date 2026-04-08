# Kurious — Product Master

## Vision

Kurious is AIntropy's AI-powered knowledge infrastructure that makes enterprise-scale unstructured data — documents, videos, images, spreadsheets — searchable and actionable in one query. Not just search. The place enterprises stay in to get work done.

## Product Principles

1. Clips first, text second — video is our differentiator
2. Zero manual input — everything auto-detects and suggests
3. Answer quality over speed — a wrong fast answer is worse than a right slow one
4. Privacy-first — never read content, only metadata and timestamps
5. Every answer cites its sources — no hallucination
6. The system should feel like it's assembling intelligence, not retrieving documents

## User Journeys

| Stage | What it means | Touch level | Where we are |
|---|---|---|---|
| **Play** | Public demo, discover value, drive curiosity | Zero touch | NOW — NJ Open Data demo live |
| **Try** | Try on your own data, SaaS/hosted | Zero-low touch | Not started |
| **Buy** | Client environment, airgapped, compliance | Low touch | Future |
| **Deploy** | Dedicated deployment, one-click setup | ~1 week | Future |

## Product Lifecycle

Every feature moves through these phases:

| Phase | What happens | Completion criteria |
|---|---|---|
| **Inception** | Identify use case, chart UX, list data sources, link to backlog | Product backlog entry exists |
| **Elaboration** | Specs, architecture, prototype, resolve major risks | Spec complete, prototype validated |
| **Construction** | Build iteratively, ship features, test | Feature live in staging/production |
| **Production** | Deploy, monitor, iterate, document in marketing-ready format | Live, metrics tracked, documented |

---

## Layer 1: Data & Pipelines (Foundation)

**What this layer does:** What data goes into Kurious and how.

**Competitive edge:** We index 85M multimodal records across 8+ formats. Competitors do text-only or single-format.

| Feature | Status | Lifecycle Phase | Details |
|---|---|---|---|
| **NJ Open Data** | Active | Production | 85M docs, 613 datasets, 23 agencies. Formats: PDF, CSV, JSON, HTML, DOCX. Stored as Parquet catalogs in Azure Blob. |
| **Legal Videos** | Active | Production | 4,000 hours (LocalView + Seattle City Council). Transcripts extracted, knowledge graph built, 12 entity types, 1,000 QA eval pairs, 88.6% pass rate. |
| **Supported Formats** | Active | Production | PDF, CSV, JSON, HTML, DOCX, Video, Images, Images from PDF |
| **Data Quality** | Planned | Inception | Freshness tracking, deduplication, metadata accuracy. Dedup partially exists in schema ingestion pipeline. |
| **Expansion Strategy** | Future | — | Next dataset, next vertical (government, legal, healthcare). Aspirational: Surgery Videos (100K hrs), Gameplay (1M hrs). |
| **Enterprise Connectors** | Future | — | Slack, Google Drive, Confluence, SharePoint. `data-ingestion` repo exists but empty. |

**Success metrics:**
- Records indexed
- Formats supported
- Ingestion latency (time from source to searchable)
- Data freshness

**Dependencies:** None — this is the foundation.

---

## Layer 2: ML & Intelligence (Brain)

**What this layer does:** How Kurious understands, retrieves, and reasons across data.

**Competitive edge:** Beats GPT-5.4, Claude Sonnet 4.6, Gemini 3 Flash on retrieval benchmarks. Published research paper (arxiv 2404.07220).

| Feature | Status | Lifecycle Phase | Details |
|---|---|---|---|
| **Retrieval Quality** | Active | Production | Blended RAG (BM25 + KNN hybrid, 0.7/0.3 scoring). 94.89% Top-5 on SQuAD. Beats baselines on TREC-COVID and NQ. Embedding: Qwen3 (1024-dim). LLM: Llama 3.3 70B. |
| **Video Understanding** | Active | Production | 4,000 hours processed. 12 entity types extracted (Person, Court, LegalCase, etc.). Natural language query API via NebulaGraph. 88.6% eval pass rate. |
| **Cross-Modal Reasoning** | Active | Production | Combines video KG + document search + NL2SQL in one answer. Cross-agency, cross-format. |
| **Latency** | Active | Production | Quick mode: 1-3s. Deep think: 3-10s. Retrieval: sub-200ms. Production on AKS. |
| **Eval Framework** | Active | Construction | Synthetic QA generation via Gemini. Supports PDF/JSON/HTML/CSV. Eval runs happening. Several benchmark targets still open (legal videos vs baseline, NJ EDA, rich text, KG synergy). |

**Success metrics:**
- Benchmark scores (Top-5 accuracy, NDCG@10, EM, F1)
- Retrieval latency (p50, p95)
- Answer accuracy per format type
- Video understanding eval pass rate

**Dependencies:** Depends on Layer 1 (data must be ingested and indexed).

---

## Layer 3: Solution (What It Does)

**What this layer does:** What problems Kurious solves and what capabilities it offers.

**Competitive edge:** Only product that searches video + docs + data + images in one query and returns the exact clip, not just a link.

| Feature | Status | Lifecycle Phase | Details |
|---|---|---|---|
| **Enterprise Knowledge Search** | Active | Production | One search across all formats. Cross-agency, cross-format answers. Inline citations. Multi-modal source badge. Two search modes (quick/deep). |
| **Video Intelligence** | Active | Production | Find specific moments in hours of video. Speaker ID on every clip. 3 content types (speech, unclear, visual-only). Clip extraction with relevant segments. |
| **Data Analysis** | Active | Production | Answer questions from structured data. Charts and tables generated. NL2SQL pipeline live (text → SQL → PostgreSQL). |
| **Internal Admin Tools** | Planned | Inception | For internal team use only. Feedback analytics, usage tracking, eval results, access control. UX designed ([live mockup](https://aintropy-ai.github.io/Product-kurious-v2/admin-feedback.html)). Keycloak auth exists. |
| **Workflow Automation** | Future | — | Pattern detection, agent creation, proactive suggestions. The platform play — Kurious observes user behavior and suggests/builds workflows. |

**Success metrics:**
- Query-to-answer time
- Citation click-through rate
- Video clip play rate
- Session depth (queries per session)
- Fallback rate (unmatched queries)

**Dependencies:** Depends on Layer 2 (ML must retrieve accurately) and Layer 1 (data must be available).

---

## Layer 4: User Experience (What User Sees)

**What this layer does:** How the user interacts with Kurious. The "wow moment."

**Competitive edge:** Only product that shows the exact 3-7 second video clip as the primary answer, not buried under text.

| Feature | Status | Lifecycle Phase | Details |
|---|---|---|---|
| **First Impression** | Active | Production | Landing page: "Ask anything about 85 million public records." Subtitle: "Documents. Videos. Spreadsheets. Images. One search." Suggestion cards with format icons. Grouped categories. Positive fallback. Goal: understand what this is in 3 seconds. |
| **Search & Discovery** | Active | Production | Search bar with quick/deep modes. Answer blocks (markdown, tables). Inline citations (clickable). Progressive reveal (clips → text → chart → sources). Multi-modal source badge. Goal: great answer on first query. |
| **Video Experience** | Active | Construction | Video-first layout: clips before text. Two layouts: highlight + grid. Clip card: thumbnail, speaker, role, transcript, 3-7s duration. 3 video intelligence types. Inline 16:9 player. "Watch full video" link. Still refining. Goal: user sees something no other product does. |
| **Engagement & Retention** | Active | Production | Bookmarks, feedback (thumbs up/down), copy/share/download, dark/light mode, sidebar navigation, search history. Goal: user comes back. |

**Success metrics:**
- Time to "wow moment" (first 3 seconds)
- Video clip play rate (target: >25%)
- User satisfaction (>80% positive feedback)
- Session depth (>3 queries per session)
- Return visit rate

**Dependencies:** Depends on Layer 3 (solution must return the right data) and Layer 2 (ML must retrieve accurately).

---

## Cross-Layer Dependencies

| Feature | Layer 4 (UX) | Layer 3 (Solution) | Layer 2 (ML) | Layer 1 (Data) | Status |
|---|---|---|---|---|---|
| Video-first layout | Clips before text | Video search API | Video understanding | Legal videos ingested | Active across all layers |
| Cross-agency answers | Multi-source badge | Cross-agency query | Cross-modal reasoning | Multiple agencies indexed | Active across all layers |
| Enterprise search | Search UI | Search API | Blended RAG | NJ Open Data | Active across all layers |
| Data analysis | Charts & tables | NL2SQL | Query processing | Structured data indexed | Active across all layers |
| Internal admin tools | Admin console | Feedback API | — | Feedback data | Planned (Inception) |
| Workflow automation | Proactive suggestions | Pattern detection | Usage learning | User activity data | Future |

---

## Quarterly Roadmap

| Quarter | Focus | Key deliverables |
|---|---|---|
| **Q2 2026 (now)** | Play stage | NJ Open Data demo polished, video experience refined, publications proving the tech, website live, internal admin tools started |
| **Q3 2026** | Try stage | Self-serve trial, upload own data, SaaS login, first external users |
| **Q4 2026** | Buy/Deploy | Enterprise features, compliance, integrations, dedicated deployments |

---

## Release History

| Week | What shipped | Version |
|---|---|---|
| Mar 24 | First release: multi-tenant engine, Blended RAG, NL2SQL, Keycloak auth, Docker + K8s | v0.0.1 |
| Apr 2 | CI/CD, embedding service on AKS, Elasticsearch 8.17, legal video extraction (4K hrs), 1K QA eval pairs, NJ Open Data feedback on leaderboard | v0.0.2 |
| Apr 6-12 | Video-first layout, progressive reveal, clip duration tuning, UX improvements | TBD |

---

## Live Links

| Resource | Link |
|---|---|
| Prototype | https://aintropy-ai.github.io/Product-kurious-v2/chat |
| Project Board | https://github.com/orgs/aintropy-ai/projects/4 |
| UX Spec | https://github.com/aintropy-ai/Product-kurious-v2/blob/main/specs/ux-improvements.md |
| Backlog | https://github.com/aintropy-ai/Product-kurious-v2/blob/main/backlog.md |
| NJ Open Data Demo | https://aintropy-ai.github.io/nj-open-data-demo/ |
| Engineering Board | https://github.com/orgs/aintropy-ai/projects/1 |
| Engine Repo | https://github.com/aintropy-ai/aintropy-engine-product |
| Knowledge Graph Repo | https://github.com/aintropy-ai/knowledge-graph-pipeline |
| Eval Framework | https://github.com/aintropy-ai/eval-framework |

---

*Last updated: April 7, 2026*
