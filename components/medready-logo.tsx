import React from "react"
import { cn } from "@/lib/utils"

interface MedReadyLogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function MedReadyLogo({ className, showText = true, size = "md" }: MedReadyLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl"
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-green-500 p-1",
        sizeClasses[size]
      )}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full text-white"
        >
          {/* Medical Cross with Circuit Pattern */}
          <path
            d="M12 2L12 22M2 12L22 12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Top section - Blue circuit pattern */}
          <g fill="currentColor">
            <circle cx="6" cy="6" r="0.8" />
            <circle cx="12" cy="6" r="0.8" />
            <circle cx="18" cy="6" r="0.8" />
            <circle cx="6" cy="12" r="0.8" />
            <circle cx="18" cy="12" r="0.8" />
            <path d="M6 6L12 6M12 6L18 6M6 12L6 6M12 6L12 12M18 6L18 12" stroke="currentColor" strokeWidth="0.5" />
          </g>
          {/* Bottom section - Green circuit pattern */}
          <g fill="currentColor">
            <circle cx="6" cy="18" r="0.8" />
            <circle cx="12" cy="18" r="0.8" />
            <circle cx="18" cy="18" r="0.8" />
            <circle cx="12" cy="12" r="0.8" />
            <path d="M6 12L6 18M12 12L18 18M12 18L18 18" stroke="currentColor" strokeWidth="0.5" />
          </g>
        </svg>
      </div>
      {showText && (
        <span className={cn("font-semibold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent", textSizeClasses[size])}>
          MedReady AI
        </span>
      )}
    </div>
  )
}
