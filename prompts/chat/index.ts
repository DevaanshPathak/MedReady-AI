import { generalMedicalPrompt } from './general'
import { emergencyMedicalPrompt } from './emergency'
import { maternalHealthPrompt } from './maternal'
import { pediatricCarePrompt } from './pediatric'
import { infectiousDiseasesPrompt } from './infectious'
import { drugInformationPrompt } from './drugs'

export const chatSystemPrompts = {
  general: generalMedicalPrompt,
  emergency: emergencyMedicalPrompt,
  maternal: maternalHealthPrompt,
  pediatric: pediatricCarePrompt,
  infectious: infectiousDiseasesPrompt,
  drugs: drugInformationPrompt,
} as const

export type ChatCategory = keyof typeof chatSystemPrompts

export function getChatSystemPrompt(category: ChatCategory): string {
  return chatSystemPrompts[category]
}
