import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Reveal } from "@/components/reveal"
import Link from "next/link"

export default async function LearnPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch all modules
  const { data: modules } = await supabase.from("modules").select("*").order("created_at", { ascending: false })

  // Fetch user progress for all modules
  const { data: progressData } = await supabase.from("progress").select("*").eq("user_id", user.id)

  const progressMap = new Map(progressData?.map((p) => [p.module_id, p]) || [])

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Reveal as="h1" className="text-3xl font-bold tracking-tight" variant="down">
                Learning Modules
              </Reveal>
              <Reveal as="p" className="text-muted-foreground" delay="xs">
                Explore courses designed for healthcare professionals
              </Reveal>
            </div>
            <Reveal variant="scale" delay="sm">
              <Button asChild variant="outline">
                <Link href="/learn/history">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Assessment History
                </Link>
              </Button>
            </Reveal>
          </div>
        </div>

        {/* Filter/Category Section */}
        <Reveal className="mb-6 flex flex-wrap gap-2" variant="scale" delay="sm">
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            All Modules
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Emergency Care
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Primary Care
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Maternal Health
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Infectious Diseases
          </Badge>
        </Reveal>

        {/* Modules Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules && modules.length > 0 ? (
            modules.map((module, index) => {
              const progress = progressMap.get(module.id)
              const isStarted = !!progress
              const completionPercent = progress?.completion_percent || 0
              const delays: Array<"none" | "xs" | "sm" | "md" | "lg" | "xl"> = ["none", "xs", "sm", "md", "lg", "xl"]
              const delay = delays[index % delays.length]

              return (
                <Reveal key={module.id} delay={delay}>
                  <Card className="flex flex-col h-full">
                  <CardHeader>
                    <div className="mb-2 flex items-start justify-between">
                      <Badge variant={module.difficulty === "beginner" ? "secondary" : "default"}>
                        {module.difficulty}
                      </Badge>
                      {module.estimated_hours && (
                        <span className="text-sm text-muted-foreground">{module.estimated_hours}h</span>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2">{module.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    {isStarted && (
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{completionPercent}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <Button asChild className="w-full">
                      <Link href={`/learn/${module.id}`}>{isStarted ? "Continue" : "Start Learning"}</Link>
                    </Button>
                  </CardContent>
                </Card>
                </Reveal>
              )
            })
          ) : (
            <Reveal delay="none">
              <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-4 h-12 w-12 text-muted-foreground"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
                <h3 className="mb-2 text-lg font-semibold">No modules available yet</h3>
                <p className="text-center text-sm text-muted-foreground">Check back soon for new learning content</p>
              </CardContent>
            </Card>
            </Reveal>
          )}
        </div>
      </main>
    </div>
  )
}
