import { tool } from 'ai'
import { z } from 'zod'
import { getExaClient } from './exa-client'

export const medicalWebSearch = tool({
  description: 'Search the web for up-to-date medical information from trusted sources like WHO, CDC, NIH, ICMR, and medical journals',
  parameters: z.object({
    query: z.string().min(1).max(100).describe('The medical search query'),
  }),
  execute: async ({ query }: { query: string }) => {
    const exa = getExaClient()
    
    // Target trusted medical sources for healthcare workers
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
      "mayoclinic.org",
      "webmd.com",
      "medscape.com"
    ]

    try {
      const { results } = await exa.searchAndContents(query, {
        livecrawl: 'always',
        numResults: 3,
        includeDomains: medicalDomains,
        useAutoprompt: true,
        text: true,
        highlights: true,
      })

      return results.map(result => ({
        title: result.title,
        url: result.url,
        content: result.text?.slice(0, 1000) || '', // Take first 1000 characters as per docs
        publishedDate: result.publishedDate,
        highlights: result.highlights || [],
      }))
    } catch (error) {
      console.error('[v0] Exa web search error:', error)
      return []
    }
  },
})

export const emergencyWebSearch = tool({
  description: 'Search for emergency medical protocols and latest emergency care guidelines',
  parameters: z.object({
    query: z.string().min(1).max(100).describe('The emergency medical search query'),
  }),
  execute: async ({ query }: { query: string }) => {
    const exa = getExaClient()
    
    // Focus on emergency medicine and critical care sources
    const emergencyDomains = [
      "who.int",
      "cdc.gov",
      "mohfw.gov.in",
      "icmr.gov.in", 
      "pubmed.ncbi.nlm.nih.gov",
      "emra.org", // Emergency Medicine Residents Association
      "acep.org", // American College of Emergency Physicians
      "rcuk.ac.uk", // Resuscitation Council UK
      "bmj.com",
      "nejm.org"
    ]

    try {
      const { results } = await exa.searchAndContents(query, {
        livecrawl: 'always',
        numResults: 3,
        includeDomains: emergencyDomains,
        useAutoprompt: true,
        text: true,
        highlights: true,
      })

      return results.map(result => ({
        title: result.title,
        url: result.url,
        content: result.text?.slice(0, 1000) || '',
        publishedDate: result.publishedDate,
        highlights: result.highlights || [],
      }))
    } catch (error) {
      console.error('[v0] Emergency web search error:', error)
      return []
    }
  },
})