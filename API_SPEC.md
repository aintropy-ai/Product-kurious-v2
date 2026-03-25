# Kurious Frontend API Specification
**Version:** 20260325
**Base URL:** `https://kurious-backend-api.centralus.cloudapp.azure.com/api/v1`
**Auth:** All requests require `X-API-Key` header (or JWT `Authorization: Bearer <token>` via Keycloak).

---

## Table of Contents
1. [Conversations (Chat History)](#1-conversations-chat-history)
2. [Intelligent Search — Quick Mode](#2-intelligent-search--quick-mode)
3. [Intelligent Search — Deep Think Mode](#3-intelligent-search--deep-think-mode)
4. [Streaming Search (SSE)](#4-streaming-search-sse)
5. [Data Types Reference](#5-data-types-reference)
6. [Migration Guide (Breaking Changes)](#6-migration-guide)

---

## 1. Conversations (Chat History)

### 1.1 Create Conversation
```
POST /conversations
```
**Request body:**
```json
{
  "title": "optional string, auto-set from first query if omitted",
  "mode": "quick" | "deep_think"   // default: "quick"
}
```
**Response `201`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "keycloak-user-id",
  "company_id": "company-id",
  "title": "NJ education budget",
  "mode": "quick",
  "created_at": "2026-03-25T10:00:00",
  "updated_at": "2026-03-25T10:00:00"
}
```

---

### 1.2 List Conversations
```
GET /conversations?skip=0&limit=20
```
Returns conversations for the authenticated user, sorted by `updated_at` descending.

**Response `200`:**
```json
{
  "conversations": [
    {
      "id": "...",
      "title": "NJ education budget",
      "mode": "quick",
      "created_at": "2026-03-25T10:00:00",
      "updated_at": "2026-03-25T10:05:00"
    }
  ],
  "total": 42,
  "skip": 0,
  "limit": 20
}
```

---

### 1.3 Get Conversation
```
GET /conversations/{conversation_id}
```
Returns the conversation metadata. Returns `404` if it doesn't belong to the authenticated user.

---

### 1.4 Get Messages
```
GET /conversations/{conversation_id}/messages?skip=0&limit=50
```
Returns messages ordered oldest-first.

**Response `200`:**
```json
{
  "conversation_id": "550e8400-...",
  "messages": [
    {
      "id": "msg-uuid",
      "conversation_id": "conv-uuid",
      "role": "user",
      "content": "What is the education budget?",
      "tool_name": null,
      "sources_json": null,
      "format_used": null,
      "elapsed_ms": null,
      "model_used": null,
      "created_at": "2026-03-25T10:00:00"
    },
    {
      "id": "msg-uuid-2",
      "conversation_id": "conv-uuid",
      "role": "assistant",
      "content": "The NJ education budget for FY2024 is $11.5B...",
      "tool_name": null,
      "sources_json": "[{\"source_type\":\"structured\",\"category\":\"primary\",...}]",
      "format_used": "auto",
      "elapsed_ms": 2340,
      "model_used": "meta-llama/llama-3.3-70b-instruct",
      "created_at": "2026-03-25T10:00:02"
    }
  ]
}
```
`sources_json` is a JSON-encoded `SourceAttribution[]` array (see §5).

---

### 1.5 Delete Conversation
```
DELETE /conversations/{conversation_id}
```
Soft-deletes. Returns `204 No Content`. Returns `404` if not found.

---

## 2. Intelligent Search — Quick Mode

```
POST /intelligent/_search
```

### New request fields (all optional, backward-compatible)
```json
{
  "query": "Which NJ townships have the most employees with terminal leave?",
  "limit": 100,
  "mode": "quick",
  "response_format": "auto",
  "conversation_id": "550e8400-..."
}
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `query` | string | required | Max 2000 chars |
| `limit` | int | 100 | Max SQL rows |
| `mode` | `"quick"` \| `"deep_think"` | `"quick"` | See §3 for deep think |
| `response_format` | `"text"` \| `"table"` \| `"bullets"` \| `"auto"` | `"auto"` | LLM formats output accordingly |
| `conversation_id` | string (UUID) | null | If provided, previous messages are included as context and the turn is saved |
| `force_route` | `"structured"` \| `"unstructured"` | null | Legacy override — prefer leaving null |

### Response
```json
{
  "request_id": "uuid",
  "query": "Which NJ townships have the most employees with terminal leave?",
  "answer": "Based on the database, **Edison Township** leads with 847 employees...\n\nAccording to policy documents [S1], terminal leave is defined as...\n\n<sources>[{\"index\":1,\"category\":\"primary\"}]</sources>",
  "routing_decision": "unified",

  "sql": "SELECT township, COUNT(*) as emp_count FROM employees WHERE terminal_leave = true ...",
  "sql_columns": ["township", "emp_count"],
  "sql_row_count": 25,

  "sources": [
    {
      "source_type": "unstructured",
      "content": { "title": "NJ Leave Policy", "text": "...", "url": "...", "_score": 0.87 }
    }
  ],
  "references": [
    { "type": "table", "name": "employees", "description": "NJ employee records", "column_count": 14 },
    { "title": "NJ Leave Policy", "url": "https://..." }
  ],
  "retrieval_counts": { "structured": 25, "unstructured": 8 },
  "elapsed_ms": 1840,
  "created_at": "2026-03-25T10:00:00",

  "attributed_sources": [
    {
      "source_type": "structured",
      "category": "primary",
      "table_name": "employees",
      "excerpt": "NJ employee records table"
    },
    {
      "source_type": "unstructured",
      "category": "supporting",
      "title": "NJ Leave Policy",
      "url": "https://...",
      "relevance_score": 0.87,
      "excerpt": "Terminal leave is defined as..."
    }
  ],
  "tool_calls_made": [
    { "tool": "search_structured", "query": "townships most employees terminal leave" },
    { "tool": "search_unstructured", "query": "townships most employees terminal leave" }
  ],
  "iterations": null,

  "conversation_id": "550e8400-...",
  "message_id": "msg-uuid-of-assistant-reply",
  "mode": "quick",
  "response_format": "auto",
  "metadata": { "elapsed_ms": 1840, "embedding_elapsed_ms": 120, "parallel_search_elapsed_ms": 800, "llm_answer_elapsed_ms": 920 }
}
```

### Key changes from previous API
- `routing_decision` is now `"unified"` instead of `"structured"` / `"unstructured"` for default mode
- Both structured and unstructured results are always attempted — no more "no context" errors
- `attributed_sources[]` is new — use this to render the Sources panel
- `conversation_id` and `message_id` are returned when a conversation is active

---

## 3. Intelligent Search — Deep Think Mode

Same endpoint, same request shape — just change `mode`:

```json
{
  "query": "What is the total education budget and what policies govern spending?",
  "mode": "deep_think",
  "response_format": "bullets",
  "conversation_id": "550e8400-..."
}
```

**Behaviour differences:**
- Uses `deepseek/deepseek-r1` (thinking model) via OpenRouter
- LLM may call `search_structured` and `search_unstructured` **multiple times** with refined queries
- Up to 5 iterations; each refines the search before answering
- Higher latency (~5–15s) vs Quick (~1–3s) — use the **streaming endpoint** for Deep Think

**Response:** Same shape as Quick, with additional fields:
```json
{
  "routing_decision": "deep_think",
  "iterations": 2,
  "tool_calls_made": [
    { "iteration": 1, "tool": "search_structured", "args": { "query": "education budget total" } },
    { "iteration": 1, "tool": "search_unstructured", "args": { "query": "education spending policy NJ" } },
    { "iteration": 2, "tool": "search_unstructured", "args": { "query": "NJ DOE appropriations guidelines" } }
  ]
}
```

---

## 4. Streaming Search (SSE)

```
POST /intelligent/_search/stream
Content-Type: application/json
Accept: text/event-stream
```
Same request body as §2/§3.

### Quick Mode event sequence
```
data: {"stage": "searching", "tools": ["structured", "unstructured"]}

data: {"stage": "tool_result", "tool": "structured", "sql": "SELECT ...", "row_count": 25, "error": null}

data: {"stage": "tool_result", "tool": "unstructured", "hit_count": 8, "error": null}

data: {"stage": "answer", "answer": "Based on...", "attributed_sources": [...]}

data: {"stage": "done", "total_elapsed_ms": 1840}
```

### Deep Think event sequence
```
data: {"stage": "thinking", "iteration": 1}

data: {"stage": "tool_call", "iteration": 1, "tool": "search_structured", "query": "education budget"}

data: {"stage": "tool_result", "iteration": 1, "tool": "search_structured", "summary": {"row_count": 12, "error": null}}

data: {"stage": "tool_call", "iteration": 1, "tool": "search_unstructured", "query": "education policy NJ"}

data: {"stage": "tool_result", "iteration": 1, "tool": "search_unstructured", "summary": {"hit_count": 7, "error": null}}

data: {"stage": "thinking", "iteration": 2}

data: {"stage": "tool_call", "iteration": 2, "tool": "search_unstructured", "query": "NJ DOE appropriations"}

data: {"stage": "tool_result", "iteration": 2, "tool": "search_unstructured", "summary": {"hit_count": 5, "error": null}}

data: {"stage": "answer", "answer": "• Total budget: $11.5B\n• Policy: ...", "attributed_sources": [...], "iterations": 2}

data: {"stage": "done", "total_elapsed_ms": 8420}
```

### Error event
```
data: {"stage": "error", "detail": "NL2SQL service unavailable"}
```

**Implementation notes:**
- Use `EventSource` or `fetch` with `ReadableStream` to consume SSE
- Render results progressively: show "Searching…" spinner on `searching`, show SQL/hit counts as `tool_result` events arrive, swap in the final answer on `answer`
- For Deep Think: show "Thinking (iteration N)…" indicator per `thinking` event, and display tool calls as they happen

---

## 5. Data Types Reference

### `SourceAttribution`
```typescript
interface SourceAttribution {
  source_type: "structured" | "unstructured";
  category: "primary" | "supporting" | "additional";
  title?: string;          // document title (unstructured)
  url?: string;            // document URL (unstructured)
  relevance_score?: number; // OpenSearch score
  excerpt?: string;        // text snippet used
  table_name?: string;     // DB table name (structured)
}
```

### `ConversationResponse`
```typescript
interface ConversationResponse {
  id: string;
  user_id: string;
  company_id?: string;
  title?: string;
  mode: "quick" | "deep_think";
  created_at: string;  // ISO 8601
  updated_at: string;
}
```

### `MessageResponse`
```typescript
interface MessageResponse {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_name?: string;
  sources_json?: string;   // JSON-encoded SourceAttribution[]
  format_used?: string;
  elapsed_ms?: number;
  model_used?: string;
  created_at: string;
}
```

### `IntelligentQueryRequest`
```typescript
interface IntelligentQueryRequest {
  query: string;                          // required
  limit?: number;                         // default 100
  mode?: "quick" | "deep_think";          // default "quick"
  response_format?: "text" | "table" | "bullets" | "auto"; // default "auto"
  conversation_id?: string;               // UUID, optional
  force_route?: "structured" | "unstructured"; // legacy, leave null
}
```

---

## 6. Migration Guide

### What changed for existing frontend code

| Before | After | Action |
|--------|-------|--------|
| `routing_decision: "structured" \| "unstructured"` | Now also `"unified"` (default) and `"deep_think"` | Handle new values in routing display |
| No `attributed_sources` field | Now present — use for Sources panel | Add Sources panel UI |
| No `conversation_id` / `message_id` in response | Present when conversation active | Store for multi-turn |
| No `mode` in request | New optional field | Wire up Quick/Deep Dive toggle |
| No `response_format` | New optional field | Wire up format selector |
| Streaming had fixed stage names | New stages: `searching`, `tool_call`, `tool_result`, `answer` | Update SSE handler |
| No `/conversations` endpoints | New CRUD endpoints | Implement sidebar chat history |

### Recommended frontend flows

**New chat (Quick):**
1. `POST /conversations` → get `conversation_id`
2. `POST /intelligent/_search` with `conversation_id` + `mode: "quick"`
3. Display `answer` + `attributed_sources`
4. Subsequent messages: same endpoint with same `conversation_id`

**New chat (Deep Think — streaming):**
1. `POST /conversations` with `mode: "deep_think"` → get `conversation_id`
2. `POST /intelligent/_search/stream` with `conversation_id` + `mode: "deep_think"`
3. Render SSE events progressively (thinking indicators, tool results, final answer)

**Chat history sidebar:**
1. On load: `GET /conversations?limit=20` → populate sidebar
2. Click conversation: `GET /conversations/{id}/messages` → render thread
3. Continue conversation: send new message with existing `conversation_id`

---

## 7. Env / Config for Frontend

| Feature | Config needed |
|---------|--------------|
| Deep Think model | `OPENROUTER_THINKING_MODEL=deepseek/deepseek-r1` (backend, already set) |
| History depth | `MAX_CONVERSATION_TURNS=5` (backend, configurable) |
| Format options | `response_format` field in request — no backend config needed |
| Source categories | Parsed automatically — no backend config needed |
