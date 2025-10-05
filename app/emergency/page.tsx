import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { EmergencyAIAssistant } from "@/components/emergency-ai-assistant"
import { Reveal } from "@/components/reveal"

export default async function EmergencyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: alerts } = await supabase
    .from("emergency_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  const activeAlerts = alerts?.filter((a) => a.status === "active") || []
  const resolvedAlerts = alerts?.filter((a) => a.status === "resolved") || []

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <Reveal as="h1" className="text-2xl font-bold text-foreground mb-2" variant="down">
            Emergency Response Orchestrator
          </Reveal>
          <Reveal as="p" className="text-muted-foreground" delay="xs">
            Real-time emergency alerts and response coordination
          </Reveal>
        </div>

        <Reveal className="mb-6" delay="sm">
          <EmergencyAIAssistant userId={user.id} />
        </Reveal>

        {activeAlerts.length > 0 && (
          <Reveal className="mb-6" delay="md" variant="left">
            <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="font-semibold text-destructive">Active Emergency Alerts ({activeAlerts.length})</h2>
            </div>
            <div className="space-y-3">
              {activeAlerts.map((alert: any) => (
                <div key={alert.id} className="p-4 bg-background rounded-lg border border-destructive/20">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{alert.alert_type}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{alert.location}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        alert.severity === "critical"
                          ? "bg-destructive text-destructive-foreground"
                          : alert.severity === "high"
                            ? "bg-warning text-warning-foreground"
                            : "bg-primary/20 text-primary"
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mb-3">{alert.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span>Reported: {new Date(alert.created_at).toLocaleString()}</span>
                    {alert.affected_population && (
                      <span>Affected: {alert.affected_population.toLocaleString()} people</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                      Respond to Alert
                    </button>
                    <button className="px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </Reveal>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Reveal delay="none">
            <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Active Alerts</h3>
              <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-destructive mb-1">{activeAlerts.length}</div>
            <p className="text-sm text-muted-foreground">Requiring immediate attention</p>
          </div>
          </Reveal>

          <Reveal delay="xs">
            <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Resolved</h3>
              <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-success mb-1">{resolvedAlerts.length}</div>
            <p className="text-sm text-muted-foreground">Successfully handled</p>
          </div>
          </Reveal>

          <Reveal delay="sm">
            <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Response Time</h3>
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-primary mb-1">12m</div>
            <p className="text-sm text-muted-foreground">Average response time</p>
          </div>
          </Reveal>
        </div>

        <Reveal delay="md">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Emergency History</h2>
          <div className="space-y-3">
            {resolvedAlerts.length > 0 ? (
              resolvedAlerts.slice(0, 10).map((alert: any) => (
                <div key={alert.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">{alert.alert_type}</h3>
                      <p className="text-sm text-muted-foreground">{alert.location}</p>
                    </div>
                    <span className="px-3 py-1 bg-success/20 text-success text-xs font-medium rounded-full">
                      Resolved
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Reported: {new Date(alert.created_at).toLocaleDateString()}</span>
                    {alert.resolved_at && <span>Resolved: {new Date(alert.resolved_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-muted-foreground">No emergency history</p>
            )}
          </div>
        </div>
        </Reveal>
      </div>
    </div>
  )
}
