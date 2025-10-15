import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  GraduationCap,
  HeartPulse,
  MapPinned,
  RadioReceiver,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users2,
} from "lucide-react"

import { Reveal } from "@/components/reveal"
import { MedReadyLogo } from "@/components/medready-logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

type Highlight = {
  title: string
  description: string
  icon: LucideIcon
}

type Snapshot = {
  title: string
  value: string
  trend: string
  icon: LucideIcon
  accent: string
}

type Metric = {
  value: string
  label: string
  detail: string
}

type Feature = {
  title: string
  description: string
  icon: LucideIcon
  accentClass?: string
}

type Pillar = {
  title: string
  summary: string
  bullets: string[]
  icon: LucideIcon
}

type WorkflowStep = {
  title: string
  description: string
  impact: string
}

type PlatformBenefit = {
  title: string
  description: string
}

const heroHighlights: Highlight[] = [
  {
    title: "Personalized journeys for 12+ clinical roles",
    description: "Adaptive skill assessments calibrate curriculum for ASHAs, ANMs, nurses, and telemedicine coaches.",
    icon: Sparkles,
  },
  {
    title: "AI insights localized for every district",
    description: "Risk scores blend public health data with on-ground feedback to prioritize interventions where they matter most.",
    icon: MapPinned,
  },
  {
    title: "Secure by design, compliant with NDHM",
    description: "Role-based access, encrypted records, and audit-ready logs keep healthcare data protected at every step.",
    icon: ShieldCheck,
  },
]

const heroSnapshot: Snapshot[] = [
  {
    title: "AI-Powered Learning Paths",
    value: "Adaptive",
    trend: "Personalized for each user",
    icon: Sparkles,
    accent: "text-primary",
  },
  {
    title: "Rural Healthcare Focus",
    value: "Multi-district",
    trend: "Scalable deployment support",
    icon: MapPinned,
    accent: "text-secondary",
  },
  {
    title: "Emergency Preparedness",
    value: "24/7 Ready",
    trend: "Real-time orchestration",
    icon: RadioReceiver,
    accent: "text-accent",
  },
]

const metrics: Metric[] = [
  {
    value: "Real-time",
    label: "Learning analytics and insights",
    detail: "Track progress across all modules",
  },
  {
    value: "AI-Driven",
    label: "Personalized recommendations",
    detail: "Adaptive learning paths for every role",
  },
  {
    value: "Scalable",
    label: "District-wide deployment support",
    detail: "Built for public health scale",
  },
]

const featureHighlights: Feature[] = [
  {
    title: "Adaptive Learning Paths",
    description: "AI calibrates modules to skill level, language preference, and connectivity constraints.",
    icon: BookOpenCheck,
    accentClass: "bg-primary/10 text-primary",
  },
  {
    title: "Clinical Decision Co-pilot",
    description: "Point-of-care prompts deliver differential diagnoses, dosage safety, and triage checklists instantly.",
    icon: Stethoscope,
    accentClass: "bg-secondary/10 text-secondary",
  },
  {
    title: "Population Health Intelligence",
    description: "District dashboards interpret surveillance data to flag emerging outbreaks before they escalate.",
    icon: Activity,
    accentClass: "bg-accent/10 text-accent",
  },
  {
    title: "Emergency Response Playbooks",
    description: "Command center templates orchestrate multi-agency drills and track readiness gaps in real time.",
    icon: HeartPulse,
    accentClass: "bg-primary/10 text-primary",
  },
  {
    title: "Competency Certifications",
    description: "Digital badges issued with verifiable QR codes unlock new career pathways and incentives.",
    icon: GraduationCap,
    accentClass: "bg-secondary/10 text-secondary",
  },
  {
    title: "Workforce Collaboration",
    description: "Communities of practice connect rural clinicians with specialists for rapid escalation and mentorship.",
    icon: Users2,
    accentClass: "bg-accent/10 text-accent",
  },
]

const platformPillars: Pillar[] = [
  {
    title: "Learning & Knowledge",
    summary: "Guided micro-modules keep frontline teams future-ready in under 20 minutes a day.",
    bullets: [
      "Role-based journeys curated with national health programs",
      "Offline-first delivery for low bandwidth contexts",
      "Instant translation across English, Hindi, Marathi, and Bengali",
    ],
    icon: BrainCircuit,
  },
  {
    title: "Operations Command",
    summary: "One command view aligns capacity, supply chains, and emergency escalation pathways.",
    bullets: [
      "Unified incident log for district rapid response teams",
      "Automated SOP reminders triggered by surveillance alerts",
      "Compliance tracking mapped to state health scorecards",
    ],
    icon: ShieldCheck,
  },
  {
    title: "Deployment Intelligence",
    summary: "Data-backed recommendations ensure the right clinician reaches the right community faster.",
    bullets: [
      "AI matching blends competencies with local burden indices",
      "Travel-ready packs organised for remote outposts",
      "Outcome monitoring closes the loop with community feedback",
    ],
    icon: MapPinned,
  },
]

const workflowSteps: WorkflowStep[] = [
  {
    title: "Assess & Benchmark",
    description: "Healthcare workers complete baseline assessments aligned to national standards and community needs.",
    impact: "Personalized readiness plans generated instantly with measurable KPIs.",
  },
  {
    title: "Upskill & Coach",
    description: "Adaptive, mobile-first modules blend simulation, live cases, and specialist mentorship.",
    impact: "Competency uplift tracked continuously with AI nudges and peer review.",
  },
  {
    title: "Deploy & Monitor",
    description: "Workforce rosters sync with district operations, flagging risks and celebrating milestones.",
    impact: "Command center dashboard keeps leadership audit-ready with outcomes and impact trails.",
  },
]

const platformBenefits = [
  {
    title: "Evidence-Based Training",
    description: "Modules aligned with national health protocols and clinical best practices for immediate real-world application.",
  },
  {
    title: "Offline-First Design",
    description: "Works seamlessly in low-connectivity rural areas with automatic sync when connection is available.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Reveal as="div" variant="left">
            <MedReadyLogo size="sm" />
          </Reveal>
          <Reveal as="nav" variant="down" className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="#features" className="transition-colors hover:text-foreground">
              Platform
            </Link>
            <Link href="#pillars" className="transition-colors hover:text-foreground">
              Solutions
            </Link>
            <Link href="#workflow" className="transition-colors hover:text-foreground">
              How it works
            </Link>
            <Link href="#impact" className="transition-colors hover:text-foreground">
              Impact
            </Link>
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

      <main>
        <section className="landing-section py-20 md:py-28">
          <div className="landing-hero">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center">
              <div className="space-y-8">
                <Reveal as="div" variant="up" className="inline-flex">
                  <Badge variant="outline" className="bg-background/80 text-muted-foreground">
                    Empowering frontline healthcare in India
                  </Badge>
                </Reveal>
                <Reveal as="h1" className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl" variant="down">
                  Transform healthcare workforce readiness with precise AI guidance
                </Reveal>
                <Reveal as="p" className="text-pretty text-lg leading-relaxed text-muted-foreground" delay="xs">
                  MedReady AI unifies adaptive training, operational command, and deployment intelligence so every community clinic delivers safe, reliable care—no matter the postcode.
                </Reveal>
                <Reveal as="div" className="flex flex-col gap-3 sm:flex-row sm:items-center" delay="sm">
                  <Button asChild size="lg" className="text-base">
                    <Link href="/auth/sign-up" className="flex items-center gap-2">
                      Start free pilot
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-base">
                    <Link href="#workflow">See how it works</Link>
                  </Button>
                </Reveal>
                <Reveal as="ul" className="grid gap-4 sm:grid-cols-2" delay="md">
                  {heroHighlights.map(({ title, description, icon: Icon }) => (
                    <li key={title} className="rounded-lg border border-border bg-background p-4">
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <p className="font-semibold leading-snug text-foreground">{title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                    </li>
                  ))}
                </Reveal>
              </div>

              <Reveal className="landing-hero-panel" variant="left" delay="sm">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">AI command snapshot</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">Live readiness across your districts</h2>
                  <p className="text-sm text-muted-foreground">
                    Daily insights highlight critical gaps, successful interventions, and opportunities for rapid reinforcement.
                  </p>
                </div>
                <div className="space-y-5">
                  {heroSnapshot.map(({ title, value, trend, icon: Icon, accent }) => (
                    <div key={title} className="flex items-start justify-between rounded-lg border border-border bg-card p-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
                      </div>
                      <div className={cn("flex items-center gap-2 text-sm font-medium", accent)}>
                        <Icon className="size-4" />
                        {trend}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/10 p-5 text-primary">
                  <p className="text-sm font-semibold uppercase tracking-wide">Smart Deployment</p>
                  <p className="mt-2 text-sm text-primary/80">
                    AI-powered matching ensures the right healthcare workers reach communities that need them most.
                  </p>
                </div>
              </Reveal>
            </div>

            <Reveal className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" variant="up" delay="md">
              {metrics.map(({ value, label, detail }) => (
                <div key={label} className="landing-metric">
                  <strong>{value}</strong>
                  <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
                </div>
              ))}
            </Reveal>
          </div>

          <Reveal as="div" className="mt-14 text-center" delay="lg">
            <p className="text-sm font-medium text-muted-foreground">
              Built for MumbaiHacks 2025 - Healthcare Innovation Track
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              A comprehensive AI-powered platform transforming healthcare workforce readiness across India
            </p>
          </Reveal>
        </section>

        <section id="features" className="landing-section-muted py-20 md:py-28">
          <div className="landing-section">
            <div className="mx-auto max-w-2xl text-center">
              <Reveal as="h2" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl" variant="down">
                Comprehensive AI guidance for every stage of care delivery
              </Reveal>
              <Reveal as="p" className="mt-4 text-pretty leading-relaxed text-muted-foreground" delay="xs">
                Purpose-built modules, clinical copilots, and deployment intelligence keep your teams prepared for high-stakes healthcare moments.
              </Reveal>
            </div>

            <div className="mx-auto mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featureHighlights.map(({ title, description, icon: Icon, accentClass }) => (
                <Reveal key={title} variant="up" className="h-full" delay="sm">
                  <Card className="h-full">
                    <CardHeader className="gap-4">
                      <div className={cn("landing-feature-icon", accentClass)}>
                        <Icon className="size-6" />
                      </div>
                      <CardTitle>{title}</CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="pillars" className="landing-section py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal as="h2" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl" variant="down">
              Build a resilient healthcare workforce ecosystem
            </Reveal>
            <Reveal as="p" className="mt-4 text-pretty leading-relaxed text-muted-foreground" delay="xs">
              MedReady AI connects learning, operations, and deployment in one secure platform designed for public health scale.
            </Reveal>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {platformPillars.map(({ title, summary, bullets, icon: Icon }) => (
              <Reveal key={title} variant="up" className="h-full" delay="sm">
                <Card className="h-full">
                  <CardHeader className="gap-4">
                    <div className="landing-feature-icon">
                      <Icon className="size-6" />
                    </div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-6">
                    {bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <ArrowRight className="mt-1 size-4 text-primary" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="workflow" className="landing-section-muted py-20 md:py-28">
          <div className="landing-section">
            <div className="mx-auto max-w-2xl text-center">
              <Reveal as="h2" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl" variant="down">
                How MedReady AI elevates every healthcare worker
              </Reveal>
              <Reveal as="p" className="mt-4 text-pretty leading-relaxed text-muted-foreground" delay="xs">
                A repeatable three-step workflow aligns assessments, coaching, and deployment with measurable outcomes.
              </Reveal>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {workflowSteps.map(({ title, description, impact }, index) => (
                <Reveal key={title} variant="up" delay="sm">
                  <div className="landing-step" data-step={index + 1}>
                    <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                    <p className="mt-3 text-sm text-muted-foreground">{description}</p>
                    <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                      {impact}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="impact" className="landing-section py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Reveal as="h2" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl" variant="down">
                Built for public health scale and impact
              </Reveal>
              <Reveal as="p" className="mt-4 text-pretty leading-relaxed text-muted-foreground" delay="xs">
                From tier-3 cities to remote primary health centers, MedReady AI equips teams to respond faster, learn continuously, and document every impact metric.
              </Reveal>
              <Reveal as="div" className="mt-8 grid gap-4" delay="sm">
                <div className="rounded-xl border border-border bg-background/80 p-5 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Rapid deployment</p>
                  <p className="mt-1">Launch district-wide implementations with ready curricula and deployment playbooks.</p>
                </div>
                <div className="rounded-xl border border-border bg-background/80 p-5 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Compliance-ready</p>
                  <p className="mt-1">Automated audit logs align with state and national health quality frameworks.</p>
                </div>
              </Reveal>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {platformBenefits.map(({ title, description }) => (
                <Reveal key={title} variant="up" delay="sm">
                  <Card className="h-full border border-border/80 bg-card/95 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">{title}</CardTitle>
                      <CardDescription className="text-sm">{description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section-muted py-20 md:py-28">
          <div className="landing-section">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal as="h2" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl" variant="down">
                Ready to transform healthcare training?
              </Reveal>
              <Reveal as="p" className="mt-4 text-pretty leading-relaxed text-muted-foreground" delay="xs">
                Join healthcare professionals improving their skills and making a measurable difference in rural India.
              </Reveal>
              <Reveal as="div" className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center" delay="sm">
                <Button asChild size="lg" className="text-base">
                  <Link href="/auth/sign-up">Create free account</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/50 py-8">
        <div className="landing-section">
          <Reveal className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between" variant="up">
            <p>© 2025 MedReady AI. Built for MumbaiHacks 2025.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="#features" className="transition-colors hover:text-foreground">
                Platform
              </Link>
              <Link href="#workflow" className="transition-colors hover:text-foreground">
                Workflow
              </Link>
              <Link href="#impact" className="transition-colors hover:text-foreground">
                Impact
              </Link>
              <Link href="mailto:hello@medready.ai" className="transition-colors hover:text-foreground">
                Contact
              </Link>
            </div>
          </Reveal>
        </div>
      </footer>
    </div>
  )
}
