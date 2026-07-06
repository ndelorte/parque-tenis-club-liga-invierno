"use client"

import { useEffect, useRef, type ReactNode } from "react"

interface Props {
  children: ReactNode
  delay?: number
  className?: string
}

export function MmReveal({ children, delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`
          el.classList.add("mm-revealed")
          observer.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`mm-reveal-target ${className}`}>
      {children}
    </div>
  )
}
