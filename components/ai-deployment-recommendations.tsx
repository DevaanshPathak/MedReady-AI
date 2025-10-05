"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DeploymentRecommendationsProps {
  userId: string
}

export function AIDeploymentRecommendations({ userId }: DeploymentRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateRecommendations = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/deployment-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error("[v0] Error generating recommendations:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Deployment Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        {!recommendations ? (
          <div className="text-center py-8">
            <p className="mb-4 text-muted-foreground">
              Get personalized deployment recommendations based on your skills and experience
            </p>
            <Button onClick={generateRecommendations} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                "Generate Recommendations"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="mb-2 font-semibold">Overall Analysis</h4>
              <p className="text-sm text-muted-foreground">{recommendations.overallAnalysis}</p>
            </div>

            <div className="space-y-4">
              {recommendations.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{rec.location}</h3>
                      <p className="text-sm text-muted-foreground">
                        {rec.district}, {rec.state}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                      {rec.matchScore}% Match
                    </span>
                  </div>

                  <p className="mb-4 text-sm">{rec.reasoning}</p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.requiredSkills.map((skill: string, i: number) => (
                          <span key={i} className="rounded-full bg-secondary px-2 py-1 text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-success">Benefits</h4>
                      <ul className="space-y-1">
                        {rec.benefits.map((benefit: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-warning">Challenges</h4>
                      <ul className="space-y-1">
                        {rec.challenges.map((challenge: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {challenge}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Preparation Steps</h4>
                      <ol className="space-y-1">
                        {rec.preparationSteps.map((step: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            {i + 1}. {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <Button className="mt-4 w-full">Apply for This Deployment</Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={generateRecommendations}
              disabled={isGenerating}
              className="w-full bg-transparent"
            >
              Regenerate Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
