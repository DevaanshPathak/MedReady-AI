export function getChatTitlePrompt(message: string): string {
  return `Generate a concise, clinically precise title (3-5 words maximum) for a medical consultation that begins with this message:

"${message}"

## TITLE GENERATION RULES:

**PRECISION REQUIREMENTS:**
- Maximum 5 words - be extremely concise
- Use medical terminology when appropriate (not lay terms)
- Capture the core clinical question or topic
- Be specific enough to distinguish from other conversations

**FORMAT REQUIREMENTS:**
- Use title case (capitalize major words)
- NO quotes, periods, or punctuation at the end
- NO articles ("the", "a", "an") unless essential
- NO complete sentences - use noun phrases

**CONTENT GUIDELINES:**
- Prioritize: Condition/Disease > Symptom > Drug > Procedure
- Include patient population if relevant (Pediatric, Maternal, Neonatal)
- Include urgency level if emergency (Emergency, Acute, Urgent)
- Use standard medical abbreviations when clearer (PPH, GDM, SAM, IMNCI)

**EXAMPLES:**
- "Severe Malaria Treatment Protocol"
- "Pediatric Pneumonia Management"
- "Postpartum Hemorrhage Emergency"
- "Amoxicillin Dosing Children"
- "Neonatal Jaundice Assessment"
- "Gestational Diabetes Screening"
- "Acute Diarrhea Dehydration"
- "Preeclampsia Warning Signs"
- "TB Treatment Adherence"
- "Vaccine Schedule Query"

**AVOID:**
- Generic titles: "Medical Question", "Health Concern"
- Vague terms: "Problem", "Issue", "Help"
- Patient names or identifying information
- Overly technical jargon if simpler term exists

Title:`
}
