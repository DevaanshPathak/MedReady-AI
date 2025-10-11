"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, TrendingDown, BookOpen } from "lucide-react"
import Link from "next/link"

interface WeakArea {
  category: string
  topic: string
  accuracy: number
  attempts: number
  priority: string
}

export function WeakAreasCard() {
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWeakAreas()
  }, [])

  const loadWeakAreas = async () => {
    try {
      const response = await fetch("/api/weak-areas")
      if (response.ok) {
        const data = await response.json()
        setWeakAreas(data.weakAreas || [])
      }
    } catch (error) {
      console.error("Failed to load weak areas:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weak Areas</CardTitle>
          <CardDescription>Analyzing your performance...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (weakAreas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Weak Areas
          </CardTitle>
          <CardDescription>Areas that need more practice</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Great job! No weak areas identified yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Keep practicing to maintain your performance.
            </p>
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
              <TrendingDown className="h-5 w-5 text-destructive" />
              Weak Areas
            </CardTitle>
            <CardDescription>Focus on these topics to improve</CardDescription>
          </div>
          <Badge variant="outline">{weakAreas.length} areas</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weakAreas.slice(0, 5).map((area, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{area.topic}</h4>
                    <Badge variant={getPriorityColor(area.priority) as any} className="text-xs">
                      {area.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {area.category} • {area.attempts} attempts
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-destructive">
                    {Math.round(area.accuracy)}%
                  </div>
                  <div className="text-xs text-muted-foreground">accuracy</div>
                </div>
              </div>
              <Progress value={area.accuracy} className="h-2" />
            </div>
          ))}
        </div>
        {weakAreas.length > 5 && (
          <Button variant="outline" className="w-full mt-4" asChild>
            <Link href="/learn">View All Weak Areas</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

