import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Reveal } from "@/components/reveal"

export default async function CertificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: certifications } = await supabase
    .from("certifications")
    .select("*")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false })

  const { data: progress } = await supabase
    .from("module_progress")
    .select("*, learning_modules(*)")
    .eq("user_id", user.id)
    .eq("completed", true)

  const completedModules = progress?.length || 0
  const activeCerts = certifications?.filter((c) => c.status === "active").length || 0
  const expiringSoon =
    certifications?.filter((c) => {
      if (!c.expires_at) return false
      const daysUntilExpiry = Math.floor((new Date(c.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    }).length || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <Reveal as="h1" className="text-2xl font-bold text-foreground mb-2" variant="down">
            Digital Certifications
          </Reveal>
          <Reveal as="p" className="text-muted-foreground" delay="xs">
            Blockchain-verified healthcare credentials and achievements
          </Reveal>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Reveal delay="none">
            <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Active Certificates</h3>
              <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-success mb-1">{activeCerts}</div>
            <p className="text-sm text-muted-foreground">Valid certifications</p>
          </div>
          </Reveal>

          <Reveal delay="xs">
            <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Completed Modules</h3>
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-primary mb-1">{completedModules}</div>
            <p className="text-sm text-muted-foreground">Training completed</p>
          </div>
          </Reveal>

          <Reveal delay="sm">
            <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Expiring Soon</h3>
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-warning mb-1">{expiringSoon}</div>
            <p className="text-sm text-muted-foreground">Renewal required</p>
          </div>
          </Reveal>
        </div>

        {certifications && certifications.length > 0 ? (
          <Reveal delay="md">
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Your Certifications</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {certifications.map((cert: any) => {
                const isExpiringSoon =
                  cert.expires_at &&
                  Math.floor((new Date(cert.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30

                return (
                  <div key={cert.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{cert.certification_name}</h3>
                        <p className="text-sm text-muted-foreground">{cert.issuing_authority}</p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          cert.status === "active"
                            ? "bg-success/20 text-success"
                            : cert.status === "expired"
                              ? "bg-destructive/20 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {cert.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Issued:</span>
                        <span className="text-foreground">{new Date(cert.issued_at).toLocaleDateString()}</span>
                      </div>
                      {cert.expires_at && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Expires:</span>
                          <span className={isExpiringSoon ? "text-warning font-medium" : "text-foreground"}>
                            {new Date(cert.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Certificate ID:</span>
                        <span className="text-foreground font-mono text-xs">{cert.certificate_id}</span>
                      </div>
                    </div>

                    {isExpiringSoon && (
                      <div className="mb-3 p-2 bg-warning/10 border border-warning/20 rounded text-xs text-warning">
                        Renewal required within 30 days
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                        Download Certificate
                      </button>
                      <button className="px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-colors">
                        Verify
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          </Reveal>
        ) : (
          <Reveal delay="md">
            <div className="bg-card border border-border rounded-lg p-12 text-center mb-6">
            <svg
              className="w-16 h-16 text-muted-foreground mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Certifications Yet</h3>
            <p className="text-muted-foreground mb-4">
              Complete learning modules and assessments to earn certifications
            </p>
            <Link
              href="/learn"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Learning
            </Link>
          </div>
          </Reveal>
        )}

        <Reveal delay="lg">
          <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Available Certifications</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">Emergency Response Specialist</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Master emergency protocols and life-saving procedures
              </p>
              <div className="text-xs text-muted-foreground mb-3">
                Requirements: Complete Emergency Response module + pass assessment
              </div>
              <button className="w-full py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                View Requirements
              </button>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">Maternal Health Expert</h3>
              <p className="text-sm text-muted-foreground mb-3">Specialized training in maternal and prenatal care</p>
              <div className="text-xs text-muted-foreground mb-3">
                Requirements: Complete Maternal Health module + pass assessment
              </div>
              <button className="w-full py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                View Requirements
              </button>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">Infectious Disease Control</h3>
              <p className="text-sm text-muted-foreground mb-3">Advanced knowledge in disease prevention and control</p>
              <div className="text-xs text-muted-foreground mb-3">
                Requirements: Complete Infectious Diseases module + pass assessment
              </div>
              <button className="w-full py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                View Requirements
              </button>
            </div>
          </div>
        </div>
        </Reveal>
      </div>
    </div>
  )
}
