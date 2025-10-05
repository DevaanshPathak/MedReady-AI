"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ModuleContentProps {
  module: {
    id: string
    title: string
    description: string
    category: string
    content: unknown
  }
  progress: {
    id: string
    current_section: number
    completion_percent: number
  } | null
  userId: string
}

interface AIGeneratedSection {
  title: string
  content: string
  keyPoints: string[]
  practicalTips: string[]
  warningSigns?: string[]
}

export function ModuleContent({ module, progress, userId }: ModuleContentProps) {
  const [currentSection, setCurrentSection] = useState(progress?.current_section || 0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [aiContent, setAiContent] = useState<AIGeneratedSection[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const generateContent = async () => {
      // Check if module has static content
      const sections = Array.isArray(module.content) ? module.content : []
      if (sections.length > 0) {
        setAiContent(sections as AIGeneratedSection[])
        return
      }

      // Generate dynamic content using AI
      setIsGenerating(true)
      try {
        const response = await fetch("/api/generate-module-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleId: module.id, userId }),
        })

        if (response.ok) {
          const data = await response.json()
          setAiContent(data.content.sections)
        }
      } catch (error) {
        console.error("[v0] Error generating content:", error)
      } finally {
        setIsGenerating(false)
      }
    }

    generateContent()
  }, [module.id, module.content, userId])

  const totalSections = aiContent?.length || 0

  const handleNextSection = async () => {
    if (currentSection < totalSections - 1) {
      const nextSection = currentSection + 1
      setCurrentSection(nextSection)
      await updateProgress(nextSection)
    }
  }

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const updateProgress = async (section: number) => {
    setIsUpdating(true)
    try {
      const completionPercent = Math.round(((section + 1) / totalSections) * 100)

      await supabase
        .from("progress")
        .update({
          current_section: section,
          completion_percent: completionPercent,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("module_id", module.id)

      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating progress:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const markAsComplete = async () => {
    setIsUpdating(true)
    try {
      await supabase
        .from("progress")
        .update({
          completion_percent: 100,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("module_id", module.id)

      router.refresh()
    } catch (error) {
      console.error("[v0] Error marking as complete:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <h3 className="mb-2 text-lg font-semibold">Generating personalized content...</h3>
          <p className="text-center text-sm text-muted-foreground">
            Our AI is creating tailored learning materials for you
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!aiContent || aiContent.length === 0) {
    return (
      <Card>
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
          <h3 className="mb-2 text-lg font-semibold">Content unavailable</h3>
          <p className="text-center text-sm text-muted-foreground">Unable to generate content. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  const currentContent = aiContent[currentSection]

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Section {currentSection + 1} of {totalSections}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentSection + 1) / totalSections) * 100)}% Complete
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((currentSection + 1) / totalSections) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentContent.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">{currentContent.content}</p>
          </div>

          {currentContent.keyPoints && currentContent.keyPoints.length > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="mb-3 font-semibold text-foreground">Key Points to Remember</h4>
              <ul className="space-y-2">
                {currentContent.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentContent.practicalTips && currentContent.practicalTips.length > 0 && (
            <div className="rounded-lg border border-success/20 bg-success/5 p-4">
              <h4 className="mb-3 font-semibold text-foreground">Practical Tips for Rural Settings</h4>
              <ul className="space-y-2">
                {currentContent.practicalTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-success"
                    >
                      <path d="M12 2v20M2 12h20" />
                    </svg>
                    <span className="text-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentContent.warningSigns && currentContent.warningSigns.length > 0 && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
              <h4 className="mb-3 font-semibold text-foreground">Warning Signs to Watch For</h4>
              <ul className="space-y-2">
                {currentContent.warningSigns.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning"
                    >
                      <path d="M12 9v4M12 17h.01M12 2L2 22h20L12 2z" />
                    </svg>
                    <span className="text-foreground">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (currentSection > 0) {
              setCurrentSection(currentSection - 1)
            }
          }}
          disabled={currentSection === 0}
        >
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
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Previous
        </Button>

        {currentSection < totalSections - 1 ? (
          <Button
            onClick={async () => {
              const nextSection = currentSection + 1
              setCurrentSection(nextSection)
              await updateProgress(nextSection)
            }}
            disabled={isUpdating}
          >
            {isUpdating ? "Saving..." : "Next Section"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2 h-4 w-4"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        ) : (
          <Button onClick={markAsComplete} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Mark as Complete"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2 h-4 w-4"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  )
}
