# Admin Feedback & Analytics UX — Spec

**Priority:** Sprint 1
**Assigned to:** Shivangi (design) + Aditya (implementation)
**GitHub Issue:** [nj-open-data-demo #5](https://github.com/aintropy-ai/nj-open-data-demo/issues/5)
**Design system:** Matches NJ Open Data demo — Kurious dark theme, Inter font, cyan/teal accents
**Visual Mockup (live):** [admin-feedback.html](https://aintropy-ai.github.io/Product-kurious-v2/admin-feedback.html)
**Layout:** Tabbed view — Feedback | Analytics | Actions & Issues

---

## Goal

Admin users can inspect all user feedback, understand what's working and what's not, and see analytics — all in the same UX as the NJ Open Data product. No raw data dumps. Clean, actionable, at a glance.

---

## Who Sees This

- **Admin users only** — not visible to regular users
- Access via a toggle or separate route (e.g., `/admin` or an admin icon in the header)
- Authenticated via Keycloak (already exists in the engine)

---

## Page Layout

Tabbed layout with 4 stat cards always visible at the top. Three tabs below: Feedback, Analytics, Actions & Issues. No scrolling needed to find anything.

### Always Visible: Feedback Overview (top of page, above tabs)

A row of 4 stat cards showing the big picture at a glance.

| Card | What it shows | Visual |
|---|---|---|
| **Total Feedback** | Total count of all feedback received | Large number (e.g., "142") with small text "all time" |
| **Satisfaction Rate** | Percentage of positive (thumbs up) | Large percentage in cyan (e.g., "78%") with up/down trend arrow |
| **Top Issue** | Most common negative feedback reason | Text (e.g., "Answer incomplete") with count |
| **This Week** | Feedback count this week vs last week | Number with +/- comparison (e.g., "34 (+8)") |

**Design:**
- 4 cards in a row, equal width
- `bg-k-card` background, `border-k-border`, `rounded-2xl`
- Large numbers in `text-k-text`, labels in `text-k-muted`
- Cyan accent for positive metrics, `text-k-error` for negative

---

### Tab 1: Feedback

Scrollable list of all feedback items, most recent first. Each item has a "Try query" button to test the exact query.

**Each feedback row shows:**

```
┌─────────────────────────────────────────────────────────────┐
│ 👍  "How much did NJ DOT spend on road maintenance?"        │
│                                                             │
│ Tags: Accurate, Fast                                        │
│ 3 sources · 0.19s · Apr 7, 2026 2:34 PM                   │
│                                                     [View] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👎  "What are the latest zoning changes in Newark?"         │
│                                                             │
│ Reason: The answer didn't address my question               │
│ Comment: "It showed data from 2021, not current"            │
│ 5 sources · 1.24s · Apr 7, 2026 1:12 PM                   │
│                                                     [View] │
└─────────────────────────────────────────────────────────────┘
```

**Each row includes:**
- Thumbs up/down icon (green for positive, red for negative)
- The query the user asked
- For positive: tags selected (Accurate, Fast, Great sources, Easy to read)
- For negative: reason selected + written comment (if any)
- Metadata: source count, response time, timestamp
- [View] button to expand the full answer

**Filters (above the list):**
- **All / Positive / Negative** — toggle pills
- **Date range** — this week, last week, last 30 days, custom
- **Search** — search within feedback text

**Design:**
- List items: `bg-k-card`, `border-k-border`, `rounded-xl`, `p-4`
- Thumbs up: green circle, thumbs down: red circle
- Query text: `text-k-text`, `font-medium`
- Metadata: `text-k-muted`, `text-xs`
- Hover: subtle `bg-k-border/10` transition
- [View] button: `text-k-cyan`, `text-sm`

---

### Tab 2: Analytics

Simple, actionable charts. Not a dashboard — just what the admin needs.

**Chart 1: Feedback Trend**
- Line chart showing positive vs negative feedback per day (last 30 days)
- Green line for positive, red line for negative
- X-axis: dates, Y-axis: count
- Hover: tooltip with exact count

**Chart 2: Top Negative Reasons**
- Horizontal bar chart showing the 5 negative feedback reasons ranked by count
- Bars in `text-k-error` color
- Labels: "Answer incomplete" (23), "Sources not relevant" (18), etc.

**Chart 3: Query Types Getting Most Feedback**
- Horizontal bar chart grouped by query type
- Video queries vs data queries vs document queries
- Shows both positive and negative per type
- Helps identify which content type needs improvement

**Design:**
- Charts use `recharts` (already in the prototype)
- Chart container: `bg-k-card`, `border-k-border`, `rounded-2xl`, `p-4`
- Chart colors: cyan for positive, `k-error` for negative, `k-muted` for neutral
- Chart titles: `text-xs`, `text-k-muted`, uppercase, `tracking-wider`

---

### Tab 3: Actions & Issues

Actionable insights that tell the admin what to do, not just what happened.

**Action Needed (red pulsing indicator):**
- Auto-generated top 3 things to fix right now based on feedback patterns
- Example: "'Answer incomplete' is #1 issue (23 reports), mostly on video queries"

**Recurring Issues:**
- Queries that get repeated negative feedback from multiple users, grouped together
- Shows: query, number of negative reports, common complaint
- "Try this query" button on each to test it immediately
- Example: "Newark zoning changes" with 4 negative, all saying "outdated data"

**Impact: Fixed Queries (before/after):**
- Shows improvement when a query gets fixed
- Example: "DOT spending: 60% positive → 95% positive (fixed Apr 3)"
- Proves to the team that fixing feedback issues actually works

**Weekly Summary:**
- Pre-formatted summary ready for Friday demo day
- One-click "Copy for standup" button
- Contains: this week's count, satisfaction rate, top issue, improvements, action items

---

## Detail View (when admin clicks [View] in Feedback tab)

Expands inline (not a new page) showing:

```
┌─────────────────────────────────────────────────────────────┐
│ 👎  "What are the latest zoning changes in Newark?"         │
│                                                             │
│ ANSWER                                                      │
│ [Full markdown answer as the user saw it]                   │
│                                                             │
│ SOURCES                                                     │
│ 1. Newark Zoning Board Minutes 2021 (PDF)                  │
│ 2. NJ DEP Land Use Report (Structured)                     │
│ 3. City Council Meeting Recording (Video)                  │
│                                                             │
│ FEEDBACK                                                    │
│ Reason: The answer didn't address my question               │
│ Comment: "It showed data from 2021, not current"            │
│                                                             │
│ METADATA                                                    │
│ Mode: Quick · Sources: 5 · Time: 1.24s                     │
│ Date: Apr 7, 2026 1:12 PM                                  │
│                                                             │
│                                              [Collapse ▲]  │
└─────────────────────────────────────────────────────────────┘
```

**Design:**
- Expands with `animate-slide-up` animation
- Answer rendered with same markdown styling as the search results (prose classes)
- Sources list matches the existing source panel style
- Collapse button at bottom right

---

## Interactions

| Action | What happens |
|---|---|
| Click filter pill (All/Positive/Negative) | List filters instantly, no page reload |
| Click date range | Dropdown with preset options + custom date picker |
| Click [View] on a feedback item | Row expands inline showing full answer + sources |
| Click [Collapse] | Row collapses back |
| Search in feedback | Filters list as you type (debounced 300ms) |
| Hover on chart data point | Tooltip with exact number |

---

## What This Does NOT Include

- No ability to edit or delete feedback (read-only for admin)
- No user identification (feedback is anonymous for now)
- No export to CSV/PDF (can add later)
- No real-time updates (refresh page to see new feedback)
- No comparison with other products/benchmarks

---

## Technical Notes

- Matches existing design system: Kurious dark theme, Inter font, cyan/teal accents
- Uses existing components where possible: FeedbackBar patterns, AnswerBlock for detail view, recharts for charts
- Route: `/admin/feedback` or toggled via admin icon in header
- Data source: Kurious backend API (feedback endpoint already stores thumbs up/down + tags + comments)
- Auth: Keycloak admin role check

---

## Success Criteria

| Criteria | Target |
|---|---|
| Admin can see all feedback at a glance | Overview cards load in < 1s |
| Admin can find specific feedback | Filter + search works |
| Admin can understand what's failing | Top negative reasons visible immediately |
| Admin can see the full context | Detail view shows query + answer + sources + feedback together |
| Matches existing product UX | Same theme, same components, feels like part of the product |

---

*Last updated: April 7, 2026*
