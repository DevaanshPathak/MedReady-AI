import OpenAI from 'openai'

// Determine which AI provider to use
const aiProvider = process.env.AI_PROVIDER || 'openai'

// Configuration for different AI providers
const getOpenAIClient = () => {
  if (aiProvider === 'vercel' && process.env.VERCEL_AI_GATEWAY_URL) {
    // Use Vercel AI Gateway
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
      baseURL: process.env.VERCEL_AI_GATEWAY_URL,
    })
  } else {
    // Use standard OpenAI
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
    })
  }
}

const openai = getOpenAIClient()

export default openai
export { aiProvider }
