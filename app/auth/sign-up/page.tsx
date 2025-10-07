"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MedReadyLogo } from "@/components/medready-logo"
import { Reveal } from "@/components/reveal"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<string>("")
  const [specialization, setSpecialization] = useState("")
  const [location, setLocation] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            role,
            specialization,
            location,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        router.push("/auth/sign-up-success")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 py-12">
      <div className="w-full max-w-md">
        <Reveal className="mb-10 text-center" variant="down">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <MedReadyLogo size="md" />
          </Link>
        </Reveal>

        <Reveal delay="sm">
          <Card className="border-border/50 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="text-2xl font-semibold tracking-tight">Create Account</CardTitle>
              <CardDescription className="text-base">Join MedReady AI to start your learning journey</CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <form onSubmit={handleSignUp} className="space-y-4.5">
              <div className="space-y-2.5">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Dr. Priya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 transition-all focus:shadow-md"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="healthcare@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 transition-all focus:shadow-md"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="h-11 transition-all focus:shadow-md"
                />
              </div>
              <div className="space-y-2.5 relative z-10">
                <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                <Select value={role} onValueChange={setRole} required disabled={isLoading}>
                  <SelectTrigger id="role" className="h-11 transition-all focus:shadow-md">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="healthcare_worker">Healthcare Worker</SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="institution">Institution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="specialization" className="text-sm font-medium">Specialization</Label>
                <Input
                  id="specialization"
                  type="text"
                  placeholder="e.g., General Physician, Nurse"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  disabled={isLoading}
                  className="h-11 transition-all focus:shadow-md"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., Mumbai, Maharashtra"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isLoading}
                  className="h-11 transition-all focus:shadow-md"
                />
              </div>
              {error && (
                <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full h-11 font-medium shadow-lg hover:shadow-xl transition-all mt-6" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-primary hover:underline transition-colors">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
        </Reveal>
      </div>
    </div>
  )
}
