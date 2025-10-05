"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from "next-themes"
import { Copy, Check } from "lucide-react"
import { MedReadyLogo } from "@/components/medready-logo"

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
  const [conversation, setConversation] = useState<Array<{
    id: string
    role: "user" | "assistant"
    content: string
    citations?: Array<{
      title: string
      url: string
      publishedDate?: string
    }>
    toolCalls?: number
    created_at: string
  }>>(initialMessages.map(msg => ({
    ...msg,
    role: msg.role as "user" | "assistant",
    citations: [],
    toolCalls: 0
  })))
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { theme } = useTheme()

  // Debug logging
  console.log("Chat Interface Debug:", {
    conversation: conversation,
    conversationLength: conversation?.length,
    isLoading,
    input
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])


  const handleQuickPrompt = async (prompt: string) => {
    setInput(prompt)
    await sendMessage(prompt)
  }

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)

    // Add user message to conversation immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: message,
      created_at: new Date().toISOString(),
    }
    setConversation(prev => [...prev, userMessage])

    try {
      const response = await fetch("/api/completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: message,
          userId,
          userRole: profile?.role,
          specialization: profile?.specialization,
          location: profile?.location,
          category: selectedCategory,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Add AI response to conversation
        const aiMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant" as const,
          content: data.completion,
          citations: data.citations || [],
          toolCalls: data.toolCalls || 0,
          created_at: new Date().toISOString(),
        }
        setConversation(prev => [...prev, aiMessage])
      } else {
        console.error("Failed to get AI response:", response.statusText)
      }
    } catch (error) {
      console.error("Error getting AI response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()

    if (!input.trim()) return

    await sendMessage(input)
    setInput("") // Clear input after sending
  }

  // Custom components for enhanced markdown rendering
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(id)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''
    const codeId = `code-${Date.now()}-${Math.random()}`
    
    if (!inline && language) {
      return (
        <div className="relative my-4 overflow-hidden rounded-lg border bg-muted/50">
          <div className="flex items-center justify-between border-b bg-muted px-4 py-2 text-sm">
            <span className="font-medium text-muted-foreground">{language}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), codeId)}
              className="h-6 w-6 p-0"
            >
              {copiedCode === codeId ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <SyntaxHighlighter
            style={theme === 'dark' ? oneDark : oneLight}
            language={language}
            PreTag="div"
            className="!m-0 !rounded-none"
            customStyle={{
              margin: 0,
              background: 'transparent',
              padding: '1rem',
              fontSize: '0.875rem',
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      )
    }
    
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono" {...props}>
        {children}
      </code>
    )
  }

  return (
    <div className="flex w-full h-full gap-6 p-6">
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

      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col h-full">
        <Card className="flex flex-1 flex-col h-full">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MedReadyLogo size="sm" showText={false} />
                <div>
                  <CardTitle>MedReady AI Assistant</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ask medical questions, check protocols, or search drug interactions
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-accent/10">
                {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </Badge>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-6 max-h-[600px]">
            {conversation.length === 0 ? (
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
                {conversation.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-green-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 text-white"
                        >
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${
                        message.role === "user" 
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white" 
                          : "bg-card border border-border/50 text-foreground"
                      }`}
                    >
                      <div className={`text-sm leading-relaxed ${
                        message.role === "user" 
                          ? "prose prose-sm max-w-none prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-ul:text-white prose-ol:text-white prose-li:text-white prose-a:text-blue-200 prose-a:no-underline hover:prose-a:underline"
                          : "prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50"
                      }`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: CodeBlock,
                            pre: ({ children, ...props }) => (
                              <pre className="overflow-x-auto" {...props}>
                                {children}
                              </pre>
                            ),
                            blockquote: ({ children, ...props }) => (
                              <blockquote className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 pl-4 py-2 my-2 rounded-r" {...props}>
                                {children}
                              </blockquote>
                            ),
                            table: ({ children, ...props }) => (
                              <div className="overflow-x-auto my-4">
                                <table className="min-w-full border border-border rounded-lg" {...props}>
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({ children, ...props }) => (
                              <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>
                                {children}
                              </th>
                            ),
                            td: ({ children, ...props }) => (
                              <td className="border border-border px-4 py-2" {...props}>
                                {children}
                              </td>
                            ),
                            ul: ({ children, ...props }) => (
                              <ul className="list-disc list-inside space-y-1 my-2" {...props}>
                                {children}
                              </ul>
                            ),
                            ol: ({ children, ...props }) => (
                              <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
                                {children}
                              </ol>
                            ),
                            h1: ({ children, ...props }) => (
                              <h1 className="text-xl font-bold mt-4 mb-2 border-b border-border pb-2" {...props}>
                                {children}
                              </h1>
                            ),
                            h2: ({ children, ...props }) => (
                              <h2 className="text-lg font-semibold mt-3 mb-2" {...props}>
                                {children}
                              </h2>
                            ),
                            h3: ({ children, ...props }) => (
                              <h3 className="text-base font-semibold mt-2 mb-1" {...props}>
                                {children}
                              </h3>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                            
                            {/* Display citations if available */}
                            {message.citations && message.citations.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-xs font-semibold text-gray-600 mb-2">
                                  📚 Sources ({message.citations.length}):
                                </div>
                                <div className="space-y-1">
                                  {message.citations.map((citation, index) => (
                                    <div key={index} className="text-xs">
                                      <a 
                                        href={citation.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                      >
                                        {index + 1}. {citation.title}
                                      </a>
                                      {citation.publishedDate && (
                                        <span className="text-gray-500 ml-2">
                                          ({new Date(citation.publishedDate).toLocaleDateString()})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
                onChange={(e) => setInput(e.target.value)}
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
