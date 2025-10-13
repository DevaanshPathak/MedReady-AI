export function getChatTitlePrompt(message: string): string {
  return `Generate a short, descriptive title (3-5 words max) for a medical chat conversation that starts with this message:

"${message}"

Rules:
- Maximum 5 words
- Be specific and medical when possible
- Capitalize properly
- No quotes or punctuation at the end
- Examples: "Malaria Treatment Protocol", "Pediatric Fever Management", "Drug Interaction Query"

Title:`
}
