<!-- 601b7f4e-45a4-49b1-938f-14be4a59c46f cc08aa0a-f68d-4bfb-8865-6643b34cb246 -->
# Integrate Claude Sonnet 4.5 via Vercel AI SDK with streaming chat

## Scope

- Provider: Vercel AI SDK anthropic provider using `ANTHROPIC_API_KEY`
- Chat: Server-Sent Events (SSE) streaming with tool calls (web search)
- Other endpoints: non-streaming `generateText()`
- Optional: prompt caching and extended thinking toggles for long tasks

## Changes

### 1) Dependencies

- Add `ai` and `@ai-sdk/anthropic`

### 2) Provider setup

- Edit `lib/ai-provider.ts` to export Anthropic model factory:
  - `import { anthropic } from '@ai-sdk/anthropic'`
  - Helper `getClaude(model='claude-sonnet-4-5-20250929')`

### 3) Streaming chat API (SSE)

- Edit `app/api/chat/route.ts` to use AI SDK `streamText` and `toDataStreamResponse`:
  - Model: `anthropic('claude-sonnet-4-5-20250929')`
  - Tools: wire `webSearch` from `lib/web-search-tool.ts` as an AI SDK `tool`
  - Emit SSE for: tokens, tool_calls, tool_results, and final message
  - Accept params: `extendedThinking` (bool), `usePromptCache` (bool)

Minimal server sketch (essential parts):

```startLine:endLine:app/api/chat/route.ts
// pseudo: parse req, call streamText({ model, tools, system, messages }),
// return toDataStreamResponse(stream, { headers: { 'Cache-Control': 'no-store' } })
```

### 4) Client chat UI

- Edit `components/chat-interface.tsx` to consume SSE stream:
  - Use `useChat` from `ai/react` (api: `/api/chat`)
  - Render partial tokens progressively
  - Show tool activity (e.g., "Searching the web…") when tool events arrive

### 5) Non-chat endpoints use generateText

- Update:
  - `app/api/completion/route.ts`
  - `app/api/generate-module-content/route.ts`
  - `app/api/gamification/route.ts` (and similar)
- Replace existing model calls with:
  - `import { generateText } from 'ai'`
  - `model: anthropic('claude-sonnet-4-5-20250929')`

### 6) Prompt caching (optional)

- For long, stable `system` prompts, add passthrough provider options:
  - When `usePromptCache=true`, include Anthropic `cache_control` on the final static block via provider options (SDK pass-through), or add a fallback direct Anthropic client path for this endpoint only

### 7) Extended thinking toggle (optional)

- Pass Anthropic provider option to enable thinking budget for complex tasks; document that it may affect caching

### 8) Env and config

- Ensure `ANTHROPIC_API_KEY` is read server-side (Next.js App Router)
- No key exposure to client; avoid logging

### 9) Tests

- Add basic integration tests for streaming route (server-only) and non-streaming endpoints

## Notes

- Model id: `claude-sonnet-4-5-20250929`
- Keep SSE headers correct and disable body buffering
- Tool events: clearly prefix in stream so client can render activity

### To-dos

- [ ] Add ai and @ai-sdk/anthropic dependencies
- [ ] Implement Anthropic provider in lib/ai-provider.ts
- [ ] Implement SSE streaming chat in app/api/chat/route.ts with tools
- [ ] Update components/chat-interface.tsx to stream via useChat
- [ ] Switch non-chat API routes to generateText with Anthropic
- [ ] Add optional prompt caching passthrough/alternate client
- [ ] Add extended thinking toggle and document effects
- [ ] Add basic tests for streaming and non-streaming endpoints