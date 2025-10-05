import Exa from "exa-js"

let exaClient: Exa | null = null

export function getExaClient(): Exa {
  if (!exaClient) {
    const apiKey = process.env.EXA_API_KEY
    if (!apiKey) {
      throw new Error("EXA_API_KEY environment variable is not set")
    }
    exaClient = new Exa(apiKey)
  }
  return exaClient
}

export interface MedicalSearchOptions {
  query: string
  numResults?: number
  category?: "emergency" | "maternal" | "pediatric" | "infectious" | "general"
  includeText?: boolean
}

export async function searchMedicalKnowledge(options: MedicalSearchOptions) {
  const exa = getExaClient()

  // Target trusted medical sources
  const medicalDomains = [
    "who.int",
    "cdc.gov",
    "nih.gov",
    "mohfw.gov.in", // Ministry of Health India
    "icmr.gov.in", // Indian Council of Medical Research
    "pubmed.ncbi.nlm.nih.gov",
    "bmj.com",
    "thelancet.com",
    "nejm.org",
    "jamanetwork.com",
  ]

  try {
    const results = await exa.searchAndContents(options.query, {
      numResults: options.numResults || 5,
      includeDomains: medicalDomains,
      useAutoprompt: true,
      text: options.includeText !== false,
      highlights: true,
    })

    return results
  } catch (error) {
    console.error("[v0] Exa.ai search error:", error)
    throw new Error("Failed to retrieve medical knowledge")
  }
}

export async function findSimilarMedicalContent(url: string, numResults = 3) {
  const exa = getExaClient()

  try {
    const results = await exa.findSimilar(url, {
      numResults,
      useAutoprompt: true,
    })

    return results
  } catch (error) {
    console.error("[v0] Exa.ai similar content error:", error)
    throw new Error("Failed to find similar medical content")
  }
}
