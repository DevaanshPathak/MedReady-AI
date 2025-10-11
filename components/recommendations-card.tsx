"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lightbulb, Target, RefreshCw, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

interface Recommendation {
  id: string
  recommendation_type: string
  title: string
  description: string
  module_id: string
  priority: number
  reason: string
  is_completed: boolean
}

export function RecommendationsCard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      const response = await fetch("/api/recommendations")
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "weak_area":
        return <Target className="h-4 w-4" />
      case "review":
        return <RefreshCw className="h-4 w-4" />
      case "next_topic":
        return <BookOpen className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "weak_area":
        return "Weak Area"
      case "review":
        return "Review"
      case "next_topic":
        return "Next Topic"
      default:
        return "New Skill"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "weak_area":
        return "destructive"
      case "review":
        return "secondary"
      case "next_topic":
        return "default"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
          <CardDescription>Generating recommendations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Personalized Recommendations
          </CardTitle>
          <CardDescription>AI-powered learning suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Complete some assessments to get personalized recommendations
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/learn">Start Learning</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Recommendations For You
            </CardTitle>
            <CardDescription>Personalized based on your performance</CardDescription>
          </div>
          <Badge variant="outline">{recommendations.length} total</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.slice(0, 5).map((rec) => (
            <div
              key={rec.id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="mt-0.5">
                {getTypeIcon(rec.recommendation_type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                  <Badge variant={getTypeColor(rec.recommendation_type) as any} className="text-xs">
                    {getTypeLabel(rec.recommendation_type)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rec.description}</p>
                {rec.reason && (
                  <p className="text-xs text-muted-foreground italic">
                    Reason: {rec.reason}
                  </p>
                )}
              </div>
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/learn/${rec.module_id}`}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
        {recommendations.length > 5 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            +{recommendations.length - 5} more recommendations
          </p>
        )}
      </CardContent>
    </Card>
  )
}

