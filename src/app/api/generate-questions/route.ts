import { NextResponse } from 'next/server'
import openai from '@/lib/openai'

export async function POST(request: Request) {
  try {
    const { topic, difficulty, count = 5 } = await request.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const prompt = `Generate ${count} multiple-choice questions for medical students on the topic: "${topic}" with ${difficulty} difficulty level.

For each question, provide:
1. The question text
2. Four options (A, B, C, D)
3. The correct answer (as a number 0-3)
4. A detailed explanation of the correct answer

Format the response as a JSON array of objects with this structure:
{
  "question_text": "...",
  "options": ["option A", "option B", "option C", "option D"],
  "correct_answer": 0,
  "explanation": "..."
}

Make the questions clinically relevant, evidence-based, and appropriate for medical exam preparation.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert medical educator creating high-quality MCQs for medical students. Always respond with valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const responseText = completion.choices[0].message.content || '[]'
    
    // Extract JSON from the response (in case it's wrapped in markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate questions' },
      { status: 500 }
    )
  }
}
