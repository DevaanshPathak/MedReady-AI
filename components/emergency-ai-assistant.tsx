"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface EmergencyAIAssistantProps {
  userId: string
}

export function EmergencyAIAssistant({ userId }: EmergencyAIAssistantProps) {
  const [formData, setFormData] = useState({
    symptoms: "",
    severity: "medium",
    patientAge: "",
    patientGender: "",
    vitalSigns: {
      heartRate: "",
      bloodPressure: "",
      temperature: "",
      respiratoryRate: "",
      oxygenSaturation: "",
    },
  })
  const [guidance, setGuidance] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)

    try {
      const response = await fetch("/api/emergency-guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userId }),
      })

      if (response.ok) {
        const data = await response.json()
        setGuidance(data.guidance)
      }
    } catch (error) {
      console.error("[v0] Error getting emergency guidance:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Emergency Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        {!guidance ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="symptoms">Symptoms</Label>
              <Textarea
                id="symptoms"
                placeholder="Describe patient symptoms in detail..."
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                required
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patientAge">Patient Age</Label>
                <Input
                  id="patientAge"
                  type="number"
                  placeholder="Age"
                  value={formData.patientAge}
                  onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="patientGender">Gender</Label>
                <select
                  id="patientGender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.patientGender}
                  onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                  required
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Severity Level</Label>
              <div className="flex gap-2">
                {["low", "medium", "high", "critical"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity: level })}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      formData.severity === level
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vital Signs (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Heart Rate (bpm)"
                  value={formData.vitalSigns.heartRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitalSigns: { ...formData.vitalSigns, heartRate: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="BP (mmHg)"
                  value={formData.vitalSigns.bloodPressure}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitalSigns: { ...formData.vitalSigns, bloodPressure: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Temp (°F)"
                  value={formData.vitalSigns.temperature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitalSigns: { ...formData.vitalSigns, temperature: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="SpO2 (%)"
                  value={formData.vitalSigns.oxygenSaturation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitalSigns: { ...formData.vitalSigns, oxygenSaturation: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <Button type="submit" disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Analyzing Emergency...
                </>
              ) : (
                "Get AI Guidance"
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                ⚠️ This is AI-generated guidance. Always prioritize patient safety and refer when in doubt.
              </p>
            </div>

            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm">{guidance}</div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setGuidance(null)
                setFormData({
                  symptoms: "",
                  severity: "medium",
                  patientAge: "",
                  patientGender: "",
                  vitalSigns: {
                    heartRate: "",
                    bloodPressure: "",
                    temperature: "",
                    respiratoryRate: "",
                    oxygenSaturation: "",
                  },
                })
              }}
              className="w-full"
            >
              New Emergency Case
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
