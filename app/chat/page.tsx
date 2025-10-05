import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { ChatInterface } from "@/components/chat-interface"

export default async function ChatPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user profile for context
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch chat sessions with their latest messages
  const { data: chatSessions } = await supabase
    .from("chat_sessions")
    .select(`
      *,
      chat_messages (
        id,
        role,
        content,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  // Get the most recent session's messages for initial load
  const currentSession = chatSessions?.[0]
  const initialMessages = currentSession?.chat_messages?.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  ) || []

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardNav />
      <main className="flex flex-1 overflow-hidden">
        <ChatInterface 
          userId={user.id} 
          profile={profile} 
          initialMessages={initialMessages}
          initialSessions={chatSessions || []}
          currentSessionId={currentSession?.id}
        />
      </main>
    </div>
  )
}
