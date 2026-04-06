# Kurious — Product Backlog

> Last updated: 2026-04-02 | Owner: Shivangi Mishra (PM)

---

## Product Overview

Kurious is AIntropy's AI-powered knowledge engine that transforms how users explore and extract insights from large-scale public datasets. Built on 85M+ NJ Open Data records with sub-200ms retrieval, Kurious delivers conversational search with multi-modal answers — including text, structured data, and extracted video clips — through a production-grade UI featuring quick/deep think modes, inline citations, and intelligent source panels.

---

## Key Proof Points

| Metric | Value |
|---|---|
| Records indexed | 85M+ |
| Average retrieval latency | 0.2s |
| Data sources | NJ Open Data (multi-modal: text, structured, video) |
| Benchmark performance | Top-tier on retrieval accuracy and relevance |
| Video intelligence | 3 content types (speech, unclear audio, visual-only) |
| Clip layouts | 2 modes (highlight, grid) |

---

## User Personas

See the full persona board with 7 user personas and journeys:
[Persona Board](https://aintropy-ai.github.io/Product-kurious-v2/personas.html)

---

## Success Metrics

| Metric | Target | Tracking |
|---|---|---|
| Query-to-answer time | < 3s (quick), < 8s (deep) | Backend logs |
| Citation click-through rate | > 15% | Analytics |
| Session depth (queries/session) | > 3 | Analytics |
| User satisfaction (feedback) | > 80% positive | In-app feedback |
| Video clip engagement | > 25% play rate | Analytics |
| Fallback rate (unmatched) | < 10% | Backend logs |

---

## Related Documents

| Document | Link |
|---|---|
| PRD | [docs/PRD.md](./docs/PRD.md) |
| API Spec | [API_SPEC.md](./API_SPEC.md) |
| UX Improvements Spec | [specs/ux-improvements.md](./specs/ux-improvements.md) |
| Live Prototype | [aintropy-ai.github.io/Product-kurious-v2](https://aintropy-ai.github.io/Product-kurious-v2/) |
| Persona Board | [personas.html](https://aintropy-ai.github.io/Product-kurious-v2/personas.html) |
| Project Board | Trello (internal) |

---

## v1 — Foundation (Done)

All P0 and P1 features from the PRD. Shipped as static prototype with mock data.

| # | Feature | Description | Owner | Status |
|---|---|---|---|---|
| 1 | Conversational search | Natural language query input with contextual understanding | Shivangi | Done |
| 2 | Quick think mode | Fast retrieval for straightforward questions | Engineering | Done |
| 3 | Deep think mode | Extended reasoning for complex, multi-source queries | Engineering | Done |
| 4 | Live thinking state | Animated progress indicator showing reasoning steps | Shivangi | Done |
| 5 | Answer blocks | Structured answer rendering with headings, bullets, tables | Shivangi | Done |
| 6 | Inline citations | Clickable citation markers linking to source panel | Shivangi | Done |
| 7 | Source panel with deep-links | Side panel showing all sources with direct links to originals | Shivangi | Done |
| 8 | Sidebar navigation | Persistent sidebar with search history and quick actions | Shivangi | Done |
| 9 | Bookmarks | Save and organize important answers | Shivangi | Done |
| 10 | Suggestion cards | Pre-built query suggestions to guide exploration | Shivangi | Done |
| 11 | Feedback mechanism | Thumbs up/down on answers for quality tracking | Shivangi | Done |
| 12 | Profile settings | User preferences and account management | Shivangi | Done |
| 13 | Dark/light mode | Full theme support across all components | Shivangi | Done |
| 14 | Video clip extraction | Extract relevant segments from video sources | Shivangi | Done |
| 15 | Highlight layout | Single featured clip with context and transcript | Shivangi | Done |
| 16 | Grid layout | Multi-clip grid for browsing multiple segments | Shivangi | Done |
| 17 | Clip card intelligence — speech | Clips with clear speech transcripts | Shivangi | Done |
| 18 | Clip card intelligence — unclear | Clips with unclear audio, contextual description | Shivangi | Done |
| 19 | Clip card intelligence — visual-only | Clips with no speech, visual description only | Shivangi | Done |
| 20 | Staggered animations | Sequential fade-in of answer blocks for polish | Shivangi | Done |
| 21 | Format icons | Visual indicators for source type (PDF, video, data) | Shivangi | Done |
| 22 | Grouped suggestions | Suggestion cards organized by category | Shivangi | Done |
| 23 | Positive fallback | Friendly, helpful response for unmatched queries | Shivangi | Done |

---

## v0.2 — UX Polish (Current Sprint: Apr 7-11)

Refining the prototype UI based on team feedback. Preparing for backend connection.

| # | Feature | Description | Owner | Status |
|---|---|---|---|---|
| 1 | Landing page headline & subtitle | Compelling hero text that communicates value prop | Shivangi | Done |
| 2 | Format icons on suggestion cards | Show source-type icons (video, data, doc) on each card | Shivangi | Done |
| 3 | Staggered answer appearance | Sequential block reveal with tuned delays (800/1400/2000ms) | Shivangi | Done |
| 4 | Multi-modal source badge | Badge indicating mixed source types in results | Shivangi | In Progress |
| 5 | Video clip UX — highlight layout | Single featured clip with expanded context | Shivangi | Done |
| 6 | Video clip UX — grid layout | Multi-clip browsing grid (6-8 clips per question) | Shivangi | Done |
| 7 | Video intelligence — speech | Transcribed clips with speaker roles | Shivangi | Done |
| 8 | Video intelligence — unclear audio | Contextual description for unclear segments | Shivangi | Done |
| 9 | Video intelligence — visual-only | Visual description for silent/visual content | Shivangi | Done |
| 10 | Grouped suggestion categories | Organize suggestions into themed groups | Shivangi | Done |
| 11 | Positive fallback for unmatched queries | Helpful redirect instead of error state | Shivangi | Done |
| 12 | Connect frontend to backend API (start) | Begin wiring mock data to live API endpoints | Engineering | Not Started |

---

## v1.0 — Production Ready (Sprint 2: Apr 14-18)

Full backend integration, auth, and production-quality polish.

| # | Feature | Description | Owner | Status |
|---|---|---|---|---|
| 1 | Connect frontend to live backend API (complete) | All queries, sources, and clips served from live pipeline | Engineering | Not Started |
| 2 | Auth & login — Google SSO | Sign in with Google for frictionless access | Engineering | Not Started |
| 3 | Auth & login — magic link | Email-based passwordless login alternative | Engineering | Not Started |
| 4 | Export answers — PDF | Download answer as formatted PDF | Engineering | Not Started |
| 5 | Export answers — Markdown | Copy or download answer as Markdown | Engineering | Not Started |
| 6 | Export answers — clipboard copy | One-click copy of full answer text | Shivangi | Not Started |
| 7 | Search history persistence | Save and retrieve past queries (requires auth) | Engineering | Not Started |
| 8 | Performance optimization | Bundle size, lazy loading, caching, sub-second paint | Engineering | Not Started |
| 9 | QA pass — all user journeys | End-to-end testing of every persona journey | Shivangi | Not Started |
| 10 | Test with real data pipeline | Validate answers, citations, and clips with live data | Engineering | Not Started |

---

## v2.0 — Platform & Scale (Future)

Expand Kurious from a product into a platform.

| # | Feature | Description | Owner | Status |
|---|---|---|---|---|
| 1 | Vibe-Discovery Studio | Custom RAG tuning — visual pipeline builder for data sources | Kunal | Not Started |
| 2 | Analytics dashboard | Query trends, source utilization, user engagement metrics | Engineering | Not Started |
| 3 | API keys & developer tier | Public API access with rate limits and usage tracking | Engineering | Not Started |
| 4 | Custom data source upload | Users upload their own datasets for RAG indexing | Engineering | Not Started |
| 5 | Collaborative sharing — team workspaces | Share answers, bookmarks, and searches within teams | Engineering | Not Started |
| 6 | Mobile optimization | Responsive layouts and touch-friendly interactions | Shivangi | Not Started |
| 7 | Enterprise SSO (Okta/Azure AD) | SAML/OIDC integration for enterprise identity providers | Engineering | Not Started |
| 8 | Audit logging | Track all user actions for compliance and security | Engineering | Not Started |
| 9 | RBAC | Role-based access control for teams and orgs | Engineering | Not Started |
| 10 | Data governance | Data retention policies, PII handling, compliance controls | Kunal | Not Started |

---

Built by [AIntropy](https://aintropy.ai)
