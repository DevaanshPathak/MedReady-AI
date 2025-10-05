"use client"

import React from "react"
import { ExternalLink } from "lucide-react"

interface Citation {
  title: string
  url: string
  publishedDate?: string
  domain?: string
}

interface SourcesBarProps {
  citations: Citation[]
  className?: string
}

export function SourcesBar({ citations, className = "" }: SourcesBarProps) {
  if (!citations || citations.length === 0) {
    return null
  }

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  return (
    <div className={`mt-3 pt-3 border-t border-border/20 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-2 h-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs font-medium text-muted-foreground">Sources</span>
        </div>
        <span className="text-xs text-muted-foreground/60">{citations.length}</span>
      </div>
      
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {citations.map((citation, index) => (
          <a
            key={index}
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border/30 bg-muted/20 hover:bg-muted/40 hover:border-border/50 transition-all duration-200 min-w-0 max-w-[280px]"
          >
            <div className="flex-shrink-0 w-4 h-4 rounded-sm bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {citation.title}
              </div>
              <div className="text-xs text-muted-foreground/60 truncate">
                {getDomain(citation.url)}
              </div>
            </div>
            <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  )
}
