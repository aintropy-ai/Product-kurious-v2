# Kurious UX Improvements Spec

**Priority:** Must Have
**Live Prototype:** [Kurious v2](https://aintropy-ai.github.io/Product-kurious-v2/#/chat)
**GitHub Issue:** [Video Clip UX #4](https://github.com/aintropy-ai/Product-kurious-v2/issues/4)
**GitHub Project:** [Kurious](https://github.com/orgs/aintropy-ai/projects/4)
**Sprint:** Sprint 1 (Apr 6-10)

---

## Goal

Make the Kurious prototype feel like a premium product where the "aha moment" hits within 3 seconds. Every element should communicate: this is not another chatbot — this searches everything your organization knows, including video.

---

## Changes Made

### 1. Landing Page Headline

**Before:** No context. User sees a search bar and suggestion cards with no idea what this product does.

**After:** Small muted text above search bar: "Ask anything about New Jersey's 85 million public records"

**Why:** Sets context in 1 second. User immediately knows what this is and what it can do.

**Style:** text-sm, muted (text-k-muted/60), centered, light weight. Not bold. Context-setter, not hero.

---

### 2. Search Bar Subtitle

**Before:** Generic placeholder text.

**After:** "Documents. Videos. Spreadsheets. Images. One search."

**Why:** This is the differentiator. Every other search tool does one format. Kurious does all of them. This should be visible before anyone types.

**Style:** Small, muted, centered below search input.

---

### 3. Format Icons on Suggestion Cards

**Before:** All 4 cards look identical. User doesn't know clicking "zoning proposal" shows video clips.

**After:** Each card has a format indicator:
- 📊 How much did NJ DOT spend on road maintenance in 2023?
- 🎬 What did the council decide about the downtown zoning proposal?
- 📄 Which NJ counties had the most environmental violations in 2022?
- 🎬 Show me all discussions about budget cuts in the last 6 months

**Why:** Creates curiosity. "Wait, it can search videos?" Signals what kind of answer to expect.

---

### 4. Staggered Answer Appearance

**Before:** Everything appears at once — text, clips, chart, sources. Overwhelming.

**After:** Progressive reveal:
- Answer text: 0ms (immediate)
- Relevant Clips: 300ms delay
- Chart: 500ms delay
- Metadata row: 700ms delay

**Why:** Creates a feeling of the system "assembling" the answer from multiple sources. Feels premium. Reduces cognitive overload.

---

### 5. Multi-Modal Source Badge

**Before:** No indication of how rich the answer is until you scroll through it.

**After:** Small line at top of answer: "ANSWER FROM 7 SOURCES · 3 VIDEO CLIPS · 2 DOCUMENTS · 1 DATASET · 1 IMAGE"

**Why:** Immediately communicates this isn't a regular text answer. Shows the breadth of sources. Builds trust.

**Style:** text-[11px], text-k-muted/50, uppercase tracking-wider. Very subtle. One line.

---

### 6. Video Clip Layouts (Two Scenarios)

#### Scenario A: Highlight Layout
When the answer comes primarily from 1-2 key clips.
- Top 2 clips shown prominently (full cards with transcript)
- "··· N more clips" expansion bar below
- Expanded: 2-column grid with remaining clips

**Demo question:** "What did the council decide about the downtown zoning proposal?" (clipLayout: 'highlight')

#### Scenario B: Grid Layout
When the answer is a combination of many equally important clips.
- All clips shown in 2-column grid immediately
- No collapse — everything visible because all clips matter equally

**Demo question:** "Show me all discussions about budget cuts in the last 6 months" (clipLayout: 'grid')

---

### 7. Video Intelligence — Three Content Types

The clip card adapts based on what's in the video:

| Video type | What Kurious shows |
|---|---|
| **Someone speaking clearly** | Clip + transcript of exact words + speaker name/role |
| **Unclear/blurred speech** | Clip + AI summary of who spoke what |
| **No speech (visual only)** | Clean clip + visual description (e.g., "Aerial footage showing discoloration patterns along northern bank") |

Demo includes at least one visual-only clip to demonstrate this intelligence.

---

### 8. Grouped Suggestion Categories

**Before:** "More ideas" shows random questions.

**After:** Suggestions grouped by theme:
- 🎬 Try a video search
- 📊 Try a data question
- 🔗 Try a cross-agency question
- 🎬 Try a multi-clip search

**Why:** Guides user through capabilities in order. Tells a story instead of random exploration.

---

### 9. Positive Fallback for Unmatched Questions

**Before:** Generic/empty response when question doesn't match demo data.

**After:** "Right now, Kurious is searching across NJ Open Data — 85 million records, 23 agencies, 8+ formats including documents, videos, spreadsheets, and images. Try asking anything about New Jersey!"

Shows suggestion cards below so user can try a real question.

**Why:** No negative language. Shows capability. Redirects constructively.

---

### 10. Subtle "Watch Full Video" Link

When a clip is expanded, below the transcript:
"Watch full video: Council Meeting #423 (90 min) →"

**Style:** 11px, very muted (50% opacity), only visible when clip is already expanded. Never competes with the clip itself. Just there if someone needs more context.

---

## Clip Card Design (Final)

Each clip shows:
- Thumbnail (160x90, dark bg, centered play button, duration badge "12 sec")
- Speaker name (bold) + role (muted)
- Source title + clip duration in cyan
- Transcript excerpt in quotes, italic, max 2 lines
- NO timestamps (no "14:32 – 14:40")
- NO "Jump to" links
- NO source video duration
- Paused by default, plays inline when clicked
- Expanded: 16:9 player + transcript + "Watch full video" link (subtle)

---

### 11. Video-First Answer Layout

**Before:** For video questions, text answer appears first, then clips below. The video power is buried.

**After:** When a question has video clips as the answer, clips are shown FIRST (prominently at the top), then the text summary below, then sources.

**Why:** This is the "aha moment" — Kurious finds the exact clip. If text comes first, it looks like every other chatbot. Clips first = instant differentiation. Shows the user: "we didn't just find text, we found the exact moment in a video."

**Example:** "What did the council decide about the downtown zoning proposal?" → Shows the 2 relevant video clips immediately, then the text summary explaining the decision, then document sources.

**Non-video questions are unaffected** — text-first layout remains for data/document questions.

---

## What's NOT Changing
- Sidebar (already has hide option)
- Thinking animation (already polished)
- Document/image/structured data display in sources panel
- Bookmark/share/download/feedback features
- Overall dark theme and color scheme

---

*Last updated: April 6, 2026*
