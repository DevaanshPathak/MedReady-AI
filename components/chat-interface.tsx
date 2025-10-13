"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
import { SourcesBar } from "@/components/sources-bar"
import { useChat } from '@ai-sdk/react'

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
  initialSessions: Array<{
    id: string
    title: string
    created_at: string
    updated_at: string
    chat_messages: Array<{
      id: string
      role: string
      content: string
      created_at: string
    }>
  }>
  currentSessionId?: string
}

export function ChatInterface({ userId, profile, initialMessages, initialSessions, currentSessionId }: ChatInterfaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("general")
  const [extendedThinking, setExtendedThinking] = useState<boolean>(false)
  const [conversation, setConversation] = useState<Array<{
    id: string
    role: "user" | "assistant"
    content: string
    citations?: Array<{
      title: string
      url: string
      publishedDate?: string
      domain?: string
    }>
    toolCalls?: Array<{
      toolName: string
      args: any
      result?: any
      timestamp: string
    }>
    thinking?: string
    created_at: string
  }>>(initialMessages.map(msg => ({
    ...msg,
    role: msg.role as "user" | "assistant",
    citations: [],
    toolCalls: [],
    thinking: undefined
  })))
  const [sessions, setSessions] = useState(initialSessions)
  const [currentSession, setCurrentSession] = useState(currentSessionId)
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

  // Session management functions
  const createNewSession = async () => {
    try {
      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: userId,
          title: "New Chat",
        })
        .select()
        .single()

      if (error) throw error

      setSessions(prev => [newSession, ...prev])
      setCurrentSession(newSession.id)
      setConversation([])
    } catch (error) {
      console.error("Error creating new session:", error)
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })

      if (error) throw error

      setCurrentSession(sessionId)
      setConversation(messages.map(msg => ({
        ...msg,
        role: msg.role as "user" | "assistant",
        citations: [],
        toolCalls: [],
        thinking: undefined
      })))
    } catch (error) {
      console.error("Error loading session:", error)
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId)

      if (error) throw error

      setSessions(prev => prev.filter(s => s.id !== sessionId))
      
      // If we deleted the current session, create a new one
      if (currentSession === sessionId) {
        await createNewSession()
      }
    } catch (error) {
      console.error("Error deleting session:", error)
    }
  }

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ title: newTitle })
        .eq("id", sessionId)

      if (error) throw error

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title: newTitle } : s
      ))
    } catch (error) {
      console.error("Error updating session title:", error)
    }
  }

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)

    // Create session ONLY if we don't have one yet
    let sessionId = currentSession
    if (!sessionId) {
      try {
        const { data: newSession, error } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: userId,
            title: "New Chat", // Temporary, will be updated after first message
          })
          .select()
          .single()

        if (error) throw error

        sessionId = newSession.id
        setSessions(prev => [newSession, ...prev])
        setCurrentSession(sessionId)
      } catch (error) {
        console.error("Error creating session:", error)
        setIsLoading(false)
        return
      }
    }

    // Add user message to conversation immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: message,
      created_at: new Date().toISOString(),
    }
    setConversation(prev => [...prev, userMessage])

    // Save user message to database
    try {
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        role: "user",
        content: message,
      })
    } catch (error) {
      console.error("Error saving user message:", error)
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...conversation.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: "user",
              content: message,
              data: {
                userId,
                userRole: profile?.role,
                specialization: profile?.specialization,
                location: profile?.location,
                category: selectedCategory,
                sessionId
              }
            }
          ],
          userId,
          userRole: profile?.role,
          specialization: profile?.specialization,
          location: profile?.location,
          category: selectedCategory,
          sessionId,
          extendedThinking
        }),
      })

      if (!response.ok || !response.body) {
        console.error("Failed to start stream:", response.status, response.statusText)
        setIsLoading(false)
        return
      }

      // Create an assistant placeholder message for streaming
      const assistantId = `assistant-${Date.now()}`
      setConversation(prev => [...prev, {
        id: assistantId,
        role: "assistant",
        content: "",
        citations: [],
        toolCalls: [],
        thinking: undefined,
        created_at: new Date().toISOString(),
      }])

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let currentToolCall: any = null

      const processChunk = (chunkText: string) => {
        buffer += chunkText
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data:")) continue
          const jsonStr = trimmed.slice(5).trim()
          if (!jsonStr || jsonStr === "[DONE]") continue
          try {
            const evt = JSON.parse(jsonStr)
            // Handle AI SDK data stream event types
            if (evt.type === 'text-delta' && typeof evt.delta === 'string') {
              setConversation(prev => prev.map(m => 
                m.id === assistantId ? { ...m, content: m.content + evt.delta } : m
              ))
            } else if (evt.type === 'thinking-delta' && typeof evt.delta === 'string') {
              // Extended thinking tokens (Claude Sonnet 4.5)
              setConversation(prev => prev.map(m => 
                m.id === assistantId ? { ...m, thinking: (m.thinking || '') + evt.delta } : m
              ))
            } else if (evt.type === 'tool-call') {
              // Tool is being invoked
              currentToolCall = {
                toolName: evt.toolName,
                args: evt.args,
                timestamp: new Date().toISOString()
              }
              setConversation(prev => prev.map(m => 
                m.id === assistantId ? { 
                  ...m, 
                  toolCalls: [...(m.toolCalls || []), currentToolCall]
                } : m
              ))
            } else if (evt.type === 'tool-result') {
              // Tool result received
              if (currentToolCall) {
                setConversation(prev => prev.map(m => {
                  if (m.id === assistantId && m.toolCalls) {
                    const updatedToolCalls = [...m.toolCalls]
                    const lastCall = updatedToolCalls[updatedToolCalls.length - 1]
                    if (lastCall) {
                      lastCall.result = evt.result
                    }
                    return { ...m, toolCalls: updatedToolCalls }
                  }
                  return m
                }))
                currentToolCall = null
              }
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        processChunk(chunk)
      }

      // Update session metadata and generate title if this is the first message
      const currentSessionData = sessions.find(s => s.id === sessionId)
      const isFirstMessage = currentSessionData?.title === "New Chat" && conversation.length === 0
      
      if (isFirstMessage) {
        // Generate a smart title using Claude Haiku
        try {
          const titleResponse = await fetch("/api/generate-chat-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message,
              userId,
              sessionId,
            }),
          })

          if (titleResponse.ok) {
            const { title } = await titleResponse.json()
            setSessions(prev => prev.map(s => 
              s.id === sessionId 
                ? { ...s, updated_at: new Date().toISOString(), title } 
                : s
            ))
          } else {
            // Fallback to truncated message if API fails
            const fallbackTitle = message.length > 50 ? message.substring(0, 50) + "..." : message
            await supabase
              .from("chat_sessions")
              .update({ title: fallbackTitle, updated_at: new Date().toISOString() })
              .eq("id", sessionId)
            setSessions(prev => prev.map(s => 
              s.id === sessionId 
                ? { ...s, updated_at: new Date().toISOString(), title: fallbackTitle } 
                : s
            ))
          }
        } catch (error) {
          console.error("Error generating title:", error)
        }
      } else {
        // Just update timestamp for subsequent messages
        await supabase
          .from("chat_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", sessionId)
        setSessions(prev => prev.map(s => 
          s.id === sessionId 
            ? { ...s, updated_at: new Date().toISOString() } 
            : s
        ))
      }
    } catch (error) {
      console.error("Error streaming AI response:", error)
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

  // Component to display thinking process
  const ThinkingBlock = ({ thinking }: { thinking: string }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    
    return (
      <div className="my-3 overflow-hidden rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="font-medium text-purple-900 dark:text-purple-100">
              Extended Thinking
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400">
              ({thinking.length} chars)
            </span>
          </div>
          <svg
            className={`h-4 w-4 text-purple-600 dark:text-purple-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div className="border-t border-purple-200 dark:border-purple-800 px-4 py-3">
            <div className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap font-mono text-xs leading-relaxed">
              {thinking}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Component to display tool calls
  const ToolCallsBlock = ({ toolCalls }: { toolCalls: Array<{ toolName: string; args: any; result?: any; timestamp: string }> }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
    
    return (
      <div className="my-3 space-y-2">
        {toolCalls.map((tool, index) => (
          <div key={index} className="overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <button
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {tool.toolName === 'medicalWebSearch' ? '🔍 Medical Web Search' : tool.toolName}
                </span>
                {tool.result && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    Complete
                  </span>
                )}
                {!tool.result && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-600 animate-pulse" />
                    Searching...
                  </span>
                )}
              </div>
              <svg
                className={`h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedIndex === index && (
              <div className="border-t border-blue-200 dark:border-blue-800 px-4 py-3 space-y-3">
                <div>
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Query:</div>
                  <div className="text-sm text-blue-900 dark:text-blue-100 bg-blue-100/50 dark:bg-blue-900/20 rounded px-2 py-1">
                    {tool.args?.query || JSON.stringify(tool.args)}
                  </div>
                </div>
                {tool.result && (
                  <div>
                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      Results ({Array.isArray(tool.result) ? tool.result.length : '1'}):
                    </div>
                    <div className="text-sm text-blue-900 dark:text-blue-100 space-y-2">
                      {Array.isArray(tool.result) && tool.result.map((item: any, i: number) => (
                        <div key={i} className="bg-blue-100/50 dark:bg-blue-900/20 rounded px-2 py-2">
                          <div className="font-medium text-xs mb-1">{item.title}</div>
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate"
                          >
                            {item.url}
                          </a>
                          {item.content && (
                            <div className="text-xs text-blue-800 dark:text-blue-200 mt-1 line-clamp-2">
                              {item.content.slice(0, 150)}...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex w-full h-full">
      {/* Sidebar */}
      <div className="hidden w-80 flex-col border-r bg-muted/30 lg:flex">
        <div className="flex flex-col gap-4 p-4">
          {/* Knowledge Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
              Knowledge Categories
            </h3>
            <div className="space-y-1">
              {[
                { id: "general", label: "General Medical", icon: "🏥" },
                { id: "emergency", label: "Emergency Care", icon: "🚨" },
                { id: "maternal", label: "Maternal Health", icon: "🤱" },
                { id: "pediatric", label: "Pediatric Care", icon: "👶" },
                { id: "infectious", label: "Infectious Diseases", icon: "🦠" },
                { id: "drugs", label: "Drug Information", icon: "💊" },
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <span className="text-base">{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                Chat History
              </h3>
              <Button
                onClick={createNewSession}
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs font-medium"
              >
                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </Button>
            </div>
            
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Type a message below to start</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative rounded-lg transition-all duration-200 ${
                      currentSession === session.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 p-3">
                      <button
                        onClick={() => loadSession(session.id)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="font-medium text-sm truncate mb-1">
                          {session.title}
                        </div>
                        <div className={`text-xs ${
                          currentSession === session.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}>
                          {new Date(session.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => deleteSession(session.id)}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md ${
                          currentSession === session.id
                            ? "hover:bg-primary-foreground/20"
                            : "hover:bg-destructive hover:text-destructive-foreground"
                        }`}
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col h-full bg-background">
        {/* Chat Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0066CC] to-[#00A86B]">
                <MedReadyLogo size="sm" showText={false} className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {sessions.find(s => s.id === currentSession)?.title || "MedReady AI Assistant"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Ask medical questions, check protocols, or search drug interactions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </Badge>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background/50">
                <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-xs font-medium text-muted-foreground">Thinking</span>
                <button
                  onClick={() => setExtendedThinking(!extendedThinking)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    extendedThinking ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      extendedThinking ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {conversation.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-6 py-12">
              <div className="mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066CC] to-[#00A86B] mx-auto mb-4">
                  <MedReadyLogo size="lg" showText={false} className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-semibold bg-gradient-to-r from-[#0066CC] to-[#00A86B] bg-clip-text text-transparent">
                  Welcome to MedReady AI
                </h3>
                <p className="mb-8 max-w-md text-muted-foreground leading-relaxed">
                  Your AI-powered medical knowledge assistant. Ask questions about protocols, treatments, drug
                  interactions, and more. Start typing below to begin!
                </p>
                <div className="text-sm text-muted-foreground/70 italic">
                  💡 Your chat will be automatically titled based on your first message
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-6 space-y-6">
              {conversation.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0066CC] to-[#00A86B] shadow-sm">
                      <MedReadyLogo size="sm" showText={false} className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user" 
                        ? "bg-gradient-to-r from-[#0066CC] to-[#0052A3] text-white shadow-lg" 
                        : "bg-muted/50 border border-border/50 text-foreground shadow-sm"
                    }`}
                  >
                    {/* Display thinking if available (only for assistant) */}
                    {message.role === "assistant" && message.thinking && (
                      <ThinkingBlock thinking={message.thinking} />
                    )}
                    
                    {/* Display tool calls if available (only for assistant) */}
                    {message.role === "assistant" && message.toolCalls && message.toolCalls.length > 0 && (
                      <ToolCallsBlock toolCalls={message.toolCalls} />
                    )}
                    
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
                            
                    {/* Display sources bar if available */}
                    {message.citations && message.citations.length > 0 && (
                      <SourcesBar citations={message.citations} />
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0066CC] to-[#0052A3] shadow-sm">
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
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0066CC] to-[#00A86B] shadow-sm">
                    <MedReadyLogo size="sm" showText={false} className="h-4 w-4 text-white animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-muted/50 border border-border/50 px-4 py-3 shadow-sm">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-[#0066CC] [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-[#00A86B] [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-[#0066CC]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-6 py-4">
            <form onSubmit={handleFormSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a medical question..."
                  disabled={isLoading}
                  className="pr-12 h-12 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background transition-all duration-200"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="h-12 px-6 bg-gradient-to-r from-[#0066CC] to-[#00A86B] hover:from-[#0052A3] hover:to-[#008F5A] text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <p>
                AI responses are for educational purposes. Always verify critical information and follow local protocols.
              </p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
