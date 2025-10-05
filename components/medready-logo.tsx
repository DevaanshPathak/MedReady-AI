import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface MedReadyLogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function MedReadyLogo({ className, showText = true, size = "md" }: MedReadyLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-16 w-16"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl"
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative drop-shadow-sm", sizeClasses[size])}>
        <Image
          src="/medready.png"
          alt="MedReady AI Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={cn("font-semibold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent drop-shadow-sm", textSizeClasses[size])}>
          MedReady AI
        </span>
      )}
    </div>
  )
}
