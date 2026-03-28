# Kurious — Product Requirements Document

**Version 1.0** · Owner: Kunal Sawarkar · Last updated: March 2026

> 👥 **[View Personas & User Journeys →](https://aintropy-ai.github.io/Product-kurious-v2/personas.html)**
> *(Opens interactive persona board — walk through each user, their journey, and how Kurious fits their world)*

---

## TL;DR

Kurious is an AI-powered knowledge engine that lets enterprise teams query structured and unstructured data in natural language. It retrieves answers across 85M+ records with full source transparency — showing exactly which document, row, or video timestamp was used. This PRD covers the 2-week sprint to ship a production-ready v1.

---

## Problem Statement

Enterprise teams sit on enormous datasets — government records, internal docs, videos, databases — but can't query them without a data analyst or hours of manual search. Existing tools (search engines, BI tools, LLMs) either lack source transparency or can't handle multi-modal enterprise data.

Kurious solves this by combining RAG retrieval with a conversational UI that shows its reasoning at every step.

**Who feels this pain most:**
- Policy analysts spending 3+ hours finding one data point
- Data scientists repeating the same ad-hoc queries weekly
- Business leaders who can't self-serve from their own data
- Journalists and compliance officers who need audit-proof citations

> 💡 See how each persona experiences this pain — and how Kurious solves it — in the **[Persona Board](https://aintropy-ai.github.io/Product-kurious-v2/personas.html)**

---

## Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Users get accurate answers | Answer acceptance rate (👍) | > 75% |
| Users trust the sources | Source panel open rate | > 40% |
| Speed feels fast | Time to first answer token | < 3s Quick · < 10s Think Deeper |
| Users come back | D7 retention | > 50% |
| Easy to demo | Time for new user to get first answer | < 60 seconds |

---

## Non-Goals (v1)

- No user authentication / SSO — demo uses hardcoded user
- No real-time data ingestion — static dataset
- No mobile app
- No API access / developer tier
- No multi-language support

---

## User Personas

Seven personas across enterprise, government, journalism, compliance, and sales.

| # | Name | Role | Primary Need |
|---|------|------|-------------|
| 1 | Maya | Policy Analyst | Citations she can defend to her boss |
| 2 | Rajiv | VP of Operations | Quick answer before a board meeting |
| 3 | Sam | AI Engineer | Evaluate Kurious for internal data stack |
| 4 | Priya | Investigative Journalist | Cross-reference + fact-check at speed |
| 5 | Daniel | Compliance Officer | Audit-proof source verification |
| 6 | Aisha | City Council Member | Plain-English answers for constituents |
| 7 | Leila | Head of Sales | Live demo weapon that closes deals |

> 👉 **[Explore all 7 personas with full user journeys →](https://aintropy-ai.github.io/Product-kurious-v2/personas.html)**

---

## Features & Priority

### ✅ P0 — Core loop (Done)

| Feature | Description |
|---------|-------------|
| Conversational search | Natural language query → AI answer |
| Quick vs Think Deeper | Two retrieval modes with different depth |
| Live thinking state | Step-by-step trace with ✓ ticks and counts |
| Answer block | Formatted answer with metadata |
| Inline citations | [1][2][3] linked to sources, scroll-to-source |
| Source panel | Expandable sources grouped by role |
| Deep-links | Video timestamp, doc passage, table row |
| Sidebar navigation | Chats + Projects tabs, rename, pin, delete |
| Saved answers | Bookmark any answer, accessible from header |

### ✅ P1 — Polish (Done)

| Feature | Description |
|---------|-------------|
| Profile settings | Name, photo, job title, notifications, password, danger zone |
| Sidebar toggle | Cyan accent strip + edge toggle tab |
| Suggestion cards | AI-generated "try asking" prompts |
| Feedback bar | 👍 👎 with follow-up tags |
| Light / dark mode | Toggle in account menu |
| Workspace settings | Members panel, role-based access (Admin / Viewer) |
| Typography | 15px prose, 1.65 line-height, 68ch max-width |
| Micro-animations | 150ms transitions, slide-up entrance, glassmorphism dropdowns |

### 🔜 P2 — Next sprint (Week 3+)

| Feature | Description |
|---------|-------------|
| Real backend connection | Wire UI to live RAG pipeline |
| Auth & login | Google SSO or magic link |
| Export answer | Copy as markdown, download as PDF |
| Search history | Persistent across sessions |
| Vibe-Discovery Studio | Pipeline builder (BM25, FAISS, Hybrid) |
| API keys page | For developer tier |
| Analytics dashboard | Query trends, source utilization |

---

## 2-Week Timeline

### Week 1 — Foundation & Core UX

| Day | Task | Owner |
|-----|------|-------|
| Day 1–2 | Audit existing prototype, lock design system | Design + PM |
| Day 3–4 | Build conversational states 1–3 (Idle → Typing → Thinking) | Frontend |
| Day 5 | Answer block: citations, source panel, feedback bar | Frontend |
| Day 6 | Deep-links: video timestamp, doc passage, table row | Frontend |
| Day 7 | QA pass, fix bugs, deploy to staging | All |

### Week 2 — Polish, Settings & Ship

| Day | Task | Owner |
|-----|------|-------|
| Day 8–9 | Sidebar: toggle, rename, pin, projects, profile settings | Frontend |
| Day 10 | Suggestion cards, search history, bookmark panel | Frontend |
| Day 11 | Light mode, accessibility pass, mobile check | Frontend |
| Day 12 | End-to-end demo script testing (all states, both modes) | PM + QA |
| Day 13 | Performance audit, loading states, final copy review | All |
| Day 14 | Deploy to production URL, share with team + pilot users | PM |

---

## Design Principles

1. **Trust through transparency** — always show how the answer was found
2. **Speed as a feature** — animate result arrival, never show a blank screen
3. **Progressive disclosure** — simple for executives, deep for analysts
4. **One source of truth** — no duplicate controls, no ambiguous affordances

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Backend latency > 10s | Medium | Live thinking steps make wait feel productive |
| Users don't trust AI answers | High | Source panel + citations + role labels build trust |
| Demo breaks during pitch | Medium | Static demo mode with pre-loaded answers as fallback |
| Scope creep in Week 2 | High | P2 features locked — no exceptions without PM sign-off |

---

## Open Questions

> ⏳ *To be revisited in the backend integration sprint*

- [ ] Should Quick mode cap at 3 sources and Think Deeper at 10?
- [ ] Do we show confidence scores to analysts but hide from executives?
- [ ] What's the fallback if the RAG pipeline returns zero results?
- [ ] Should bookmarks sync across devices (requires auth)?

---

## Links

| Resource | URL |
|----------|-----|
| Live prototype | https://aintropy-ai.github.io/Product-kurious-v2/ |
| Persona board | https://aintropy-ai.github.io/Product-kurious-v2/personas.html |
| GitHub repo | https://github.com/aintropy-ai/Product-kurious-v2 |
