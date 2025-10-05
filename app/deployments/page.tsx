import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { AIDeploymentRecommendations } from "@/components/ai-deployment-recommendations"

export default async function DeploymentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

  const { data: deployments } = await supabase
    .from("rural_deployments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  const { data: userDeployment } = await supabase
    .from("rural_deployments")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  const { data: recommendations } = await supabase
    .rpc("get_deployment_recommendations", { p_user_id: user.id })
    .limit(5)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Rural Deployment Intelligence</h1>
          <p className="text-muted-foreground">
            AI-powered deployment recommendations based on your skills and regional needs
          </p>
        </div>

        {userDeployment && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Current Deployment</h3>
                <p className="text-sm text-muted-foreground mb-2">{userDeployment.location}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">Duration: {userDeployment.duration_months} months</span>
                  <span className="text-muted-foreground">
                    Started: {new Date(userDeployment.start_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 bg-success/20 text-success text-xs font-medium rounded-full">Active</span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <AIDeploymentRecommendations userId={user.id} />
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recommended Deployments</h2>
            <div className="space-y-4">
              {recommendations && recommendations.length > 0 ? (
                recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-foreground">{rec.location}</h3>
                      <span className="text-xs font-medium text-primary">{rec.match_score}% match</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {rec.required_skills}
                      </span>
                      <span className="text-xs text-muted-foreground">{rec.duration_months} months</span>
                    </div>
                    <button className="w-full py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                      Apply for Deployment
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">Complete more training modules to unlock deployment recommendations</p>
                  <Link href="/learn" className="text-primary hover:underline text-sm">
                    Browse Learning Modules
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Active Deployments</h2>
            <div className="space-y-3">
              {deployments && deployments.length > 0 ? (
                deployments.slice(0, 8).map((deployment: any) => (
                  <div key={deployment.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-sm text-foreground">{deployment.location}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          deployment.status === "active"
                            ? "bg-success/20 text-success"
                            : deployment.status === "completed"
                              ? "bg-muted text-muted-foreground"
                              : "bg-warning/20 text-warning"
                        }`}
                      >
                        {deployment.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{deployment.required_skills}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{deployment.duration_months} months</span>
                      <span>{new Date(deployment.start_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground text-sm">No active deployments</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Deployment Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {deployments?.filter((d: any) => d.status === "active").length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Active Deployments</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-success mb-1">
                {deployments?.filter((d: any) => d.status === "completed").length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground mb-1">{profile?.location || "N/A"}</div>
              <div className="text-xs text-muted-foreground">Your Region</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground mb-1">{profile?.specialization || "General"}</div>
              <div className="text-xs text-muted-foreground">Specialization</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
