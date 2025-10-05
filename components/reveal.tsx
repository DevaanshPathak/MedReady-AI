"use client"

import { cn } from "@/lib/utils"
import type { HTMLAttributes, MutableRefObject, ReactNode } from "react"
import { useEffect, useRef, useState } from "react"

type RevealVariant = "up" | "down" | "left" | "right" | "scale"
type RevealDelay = "none" | "xs" | "sm" | "md" | "lg" | "xl"

type RevealProps = {
  as?: keyof JSX.IntrinsicElements
  children: ReactNode
  className?: string
  variant?: RevealVariant
  delay?: RevealDelay
  once?: boolean
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">

const variantClasses: Record<RevealVariant, string> = {
  up: "reveal-up",
  down: "reveal-down",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
}

const delayClasses: Record<RevealDelay, string> = {
  none: "reveal-delay-none",
  xs: "reveal-delay-xs",
  sm: "reveal-delay-sm",
  md: "reveal-delay-md",
  lg: "reveal-delay-lg",
  xl: "reveal-delay-xl",
}

export function Reveal({
  as,
  children,
  className,
  variant = "up",
  delay = "none",
  once = true,
  ...rest
}: RevealProps) {
  const Component = as ?? "div"
  const elementRef = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current

    if (!element) {
      return
    }

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            observer.unobserve(entry.target)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -10%",
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [once])

  return (
    <Component
      ref={elementRef as MutableRefObject<HTMLElement | null>}
      className={cn(
        "reveal-element",
        variantClasses[variant],
        delayClasses[delay],
        isVisible && "reveal-visible",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  )
}
