"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useChat } from "ai/react"
import { createClient } from "@/lib/supabase/client"

interface ChatInterfaceProps {
  userId: string
  profile: {
    full_name: string
    role: string
    specialization?: string
    location?: string
  } | null
  initialMessages: Array<{
    id: string
    role: string
    content: string
    created_at: string
  }>
}

const quickPrompts = [
  "What are the signs of septic shock?",
  "How do I manage postpartum hemorrhage?",
  "Explain malaria treatment protocol",
  "What are contraindications for aspirin?",
  "Emergency management of snake bite",
]

export function ChatInterface({ userId, profile, initialMessages }: ChatInterfaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("general")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: initialMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    body: {
      userId,
      userRole: profile?.role,
      specialization: profile?.specialization,
      location: profile?.location,
      category: selectedCategory,
    },
    onFinish: async (message) => {
      // Save assistant message to database
      await supabase.from("chat_messages").insert({
        user_id: userId,
        role: message.role,
        content: message.content,
        category: selectedCategory,
      })
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleQuickPrompt = (prompt: string) => {
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>

    handleInputChange({
      target: { value: prompt },
    } as React.ChangeEvent<HTMLInputElement>)

    setTimeout(() => {
      handleSubmit(syntheticEvent)
    }, 100)
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Save user message to database
    await supabase.from("chat_messages").insert({
      user_id: userId,
      role: "user",
      content: input,
      category: selectedCategory,
    })

    handleSubmit(e)
  }

  return (
    <div className="flex w-full gap-6 p-6">
      {/* Sidebar */}
      <div className="hidden w-80 flex-col gap-6 lg:flex">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Knowledge Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { id: "general", label: "General Medical" },
              { id: "emergency", label: "Emergency Care" },
              { id: "maternal", label: "Maternal Health" },
              { id: "pediatric", label: "Pediatric Care" },
              { id: "infectious", label: "Infectious Diseases" },
              { id: "drugs", label: "Drug Information" },
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {category.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Prompts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt)}
                className="w-full rounded-lg border p-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                disabled={isLoading}
              >
                {prompt}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Knowledge Base Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Updated</span>
              <Badge variant="secondary">Today</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Protocols</span>
              <span className="font-medium">2,847</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Drug Database</span>
              <span className="font-medium">15,432</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Guidelines</span>
              <span className="font-medium">1,256</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        <Card className="flex flex-1 flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>MedReady AI Assistant</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask medical questions, check protocols, or search drug interactions
                </p>
              </div>
              <Badge variant="outline" className="bg-accent/10">
                {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </Badge>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-primary"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M8 10h.01" />
                    <path d="M12 10h.01" />
                    <path d="M16 10h.01" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">Welcome to MedReady AI</h3>
                <p className="mb-6 max-w-md text-sm text-muted-foreground">
                  Your AI-powered medical knowledge assistant. Ask questions about protocols, treatments, drug
                  interactions, and more.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickPrompts.slice(0, 3).map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPrompt(prompt)}
                      disabled={isLoading}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 text-primary-foreground"
                        >
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    </div>
                    {message.role === "user" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-primary-foreground"
                      >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-3">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a medical question..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 animate-spin"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                )}
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              AI responses are for educational purposes. Always verify critical information and follow local protocols.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
