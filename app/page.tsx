import Link from "next/link"

import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Reveal as="div" className="flex items-center gap-2" variant="left">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-primary-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="text-lg font-semibold">MedReady AI</span>
          </Reveal>
          <Reveal as="div" className="flex items-center gap-2" variant="right" delay="xs">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </Reveal>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal as="h1" className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl" variant="down">
            Transform Healthcare Workforce Readiness with AI
          </Reveal>
          <Reveal as="p" className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground" delay="xs">
            MedReady AI provides personalized training, real-time knowledge updates, and strategic deployment
            recommendations for healthcare professionals across India.
          </Reveal>
          <Reveal as="div" className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center" delay="sm">
            <Button asChild size="lg" className="text-base">
              <Link href="/auth/sign-up">Start Learning</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base bg-transparent">
              <Link href="#features">Learn More</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Comprehensive Healthcare Training Platform
            </Reveal>
            <Reveal as="p" className="mt-4 text-pretty leading-relaxed text-muted-foreground" delay="xs">
              Built for healthcare workers, by healthcare experts, powered by AI
            </Reveal>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal delay="none">
              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                      <path d="M12 2v2" />
                      <path d="M12 22v-2" />
                      <path d="m17 20.66-1-1.73" />
                      <path d="M11 10.27 7 3.34" />
                      <path d="m20.66 17-1.73-1" />
                      <path d="m3.34 7 1.73 1" />
                      <path d="M14 12h8" />
                      <path d="M2 12h2" />
                      <path d="m20.66 7-1.73 1" />
                      <path d="m3.34 17 1.73-1" />
                      <path d="m17 3.34-1 1.73" />
                      <path d="m11 13.73-4 6.93" />
                    </svg>
                  </div>
                  <CardTitle>Adaptive Learning</CardTitle>
                  <CardDescription>
                    AI-powered skill assessment and personalized learning paths tailored to your role and location
                  </CardDescription>
                </CardHeader>
              </Card>
            </Reveal>

            <Reveal delay="xs">
              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-accent"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <path d="M8 10h.01" />
                      <path d="M12 10h.01" />
                      <path d="M16 10h.01" />
                    </svg>
                  </div>
                  <CardTitle>Real-time Knowledge Sync</CardTitle>
                  <CardDescription>
                    Stay updated with latest medical protocols, drug interactions, and treatment guidelines
                  </CardDescription>
                </CardHeader>
              </Card>
            </Reveal>

            <Reveal delay="sm">
              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <CardTitle>Rural Deployment Intelligence</CardTitle>
                  <CardDescription>
                    Smart matching for healthcare worker deployment based on skills and regional needs
                  </CardDescription>
                </CardHeader>
              </Card>
            </Reveal>

            <Reveal delay="md">
              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(var(--alert-orange))]/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-[hsl(var(--alert-orange))]"
                    >
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                    </svg>
                  </div>
                  <CardTitle>Emergency Response Training</CardTitle>
                  <CardDescription>
                    Predictive emergency training based on regional risk factors and simulation assessments
                  </CardDescription>
                </CardHeader>
              </Card>
            </Reveal>

            <Reveal delay="lg">
              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-accent"
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                      <path d="M8 14h.01" />
                      <path d="M12 14h.01" />
                      <path d="M16 14h.01" />
                      <path d="M8 18h.01" />
                      <path d="M12 18h.01" />
                      <path d="M16 18h.01" />
                    </svg>
                  </div>
                  <CardTitle>Digital Certifications</CardTitle>
                  <CardDescription>
                    Verified certificates with skill badges and career progression tracking
                  </CardDescription>
                </CardHeader>
              </Card>
            </Reveal>

            <Reveal delay="xl">
              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <CardTitle>Community Support</CardTitle>
                  <CardDescription>
                    Connect with healthcare professionals, share experiences, and learn from peers
                  </CardDescription>
                </CardHeader>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl" variant="down">
              Ready to Transform Healthcare Training?
            </Reveal>
            <Reveal as="p" className="mt-4 text-pretty leading-relaxed text-muted-foreground" delay="xs">
              Join thousands of healthcare professionals improving their skills and making a difference in rural India
            </Reveal>
            <Reveal as="div" className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center" delay="sm">
              <Button asChild size="lg" className="text-base">
                <Link href="/auth/sign-up">Create Free Account</Link>
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 py-8">
        <div className="container mx-auto px-4">
          <Reveal className="flex flex-col items-center justify-between gap-4 sm:flex-row" variant="up">
            <p className="text-sm text-muted-foreground">© 2025 MedReady AI. Built for MumbaiHacks 2025.</p>
            <div className="flex gap-4">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </div>
          </Reveal>
        </div>
      </footer>
    </div>
  )
}
