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

  // Fetch recent chat history
  const { data: chatHistory } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50)

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardNav />
      <main className="flex flex-1 overflow-hidden">
        <ChatInterface userId={user.id} profile={profile} initialMessages={chatHistory || []} />
      </main>
    </div>
  )
}
