import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Reveal } from "@/components/reveal"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

  const { data: completedModules } = await supabase
    .from("module_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", true)

  const { data: certifications } = await supabase
    .from("certifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Reveal as="h1" className="text-2xl font-bold text-foreground mb-2" variant="down">
            Profile
          </Reveal>
          <Reveal as="p" className="text-muted-foreground" delay="xs">
            Manage your account and view your progress
          </Reveal>
        </div>

        <Reveal delay="sm">
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {profile?.full_name || "Healthcare Professional"}
              </h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {profile?.full_name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <p className="text-foreground mt-1">{profile?.role || "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Specialization</label>
              <p className="text-foreground mt-1">{profile?.specialization || "General"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Location</label>
              <p className="text-foreground mt-1">{profile?.location || "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Experience</label>
              <p className="text-foreground mt-1">
                {profile?.experience_years ? `${profile.experience_years} years` : "Not specified"}
              </p>
            </div>
          </div>
        </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Reveal delay="none">
            <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Modules Completed</h3>
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-primary">{completedModules?.length || 0}</div>
          </div>
          </Reveal>

          <Reveal delay="xs">
            <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Active Certificates</h3>
              <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-success">{certifications?.length || 0}</div>
          </div>
          </Reveal>

          <Reveal delay="sm">
            <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Member Since</h3>
              <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="text-lg font-bold text-foreground">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                : "N/A"}
            </div>
          </div>
          </Reveal>
        </div>

        <Reveal delay="md">
          <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Account Settings</h2>
          <div className="space-y-3">
            <button className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-left transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium">Edit Profile</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-left transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium">Change Password</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-left transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium">Notification Preferences</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
        </Reveal>
      </div>
    </div>
  )
}
