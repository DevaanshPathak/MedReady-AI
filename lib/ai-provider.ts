import { createGateway } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

/**
 * Vercel AI Gateway configuration
 * Uses AI_GATEWAY_API_KEY from environment for authentication
 * 
 * The gateway automatically routes requests to different AI providers
 * (xAI, OpenAI, Anthropic, etc.) based on the model ID format:
 * - 'xai/grok-4-fast-reasoning' → xAI
 * - 'openai/gpt-4' → OpenAI
 * - 'anthropic/claude-3' → Anthropic
 * 
 * Authentication: Explicitly configured with API key from .env file
 */

// Create a custom gateway instance with explicit API key authentication
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? '',
})

/**
 * Helper to get a language model through AI Gateway
 * Usage: getModel('xai/grok-4-fast-reasoning')
 */
export function getModel(modelId: string) {
  return gateway.languageModel(modelId)
}

/**
 * Helper to get an Anthropic Claude model directly via AI SDK provider
 */
export function getClaude(modelId: string = 'claude-sonnet-4-5-20250929') {
  return anthropic(modelId)
}

