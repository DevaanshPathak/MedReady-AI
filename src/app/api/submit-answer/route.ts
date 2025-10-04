import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { user_id, question_id, selected_answer, is_correct, time_taken } = await request.json()

    if (!user_id || question_id === undefined || selected_answer === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // In a real app, you would save this to the database
    // For now, we'll just return success
    const answer = {
      id: Math.random().toString(36).substring(7),
      user_id,
      question_id,
      selected_answer,
      is_correct,
      time_taken,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, answer })
  } catch (error: any) {
    console.error('Error submitting answer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit answer' },
      { status: 500 }
    )
  }
}
