import { Snowflake } from "lucide-react"
import { cn } from "@/lib/utils"

// Deterministic snowflake field (no random => no hydration mismatch).
// Decorative only; hidden from assistive tech.
const FLAKES = [
  { left: "6%", size: 14, delay: "0s", duration: "11s", drift: "1.5rem", opacity: 0.5 },
  { left: "18%", size: 10, delay: "3s", duration: "14s", drift: "-1rem", opacity: 0.35 },
  { left: "29%", size: 18, delay: "1.5s", duration: "9s", drift: "2rem", opacity: 0.6 },
  { left: "41%", size: 12, delay: "5s", duration: "13s", drift: "-1.5rem", opacity: 0.4 },
  { left: "53%", size: 16, delay: "2s", duration: "10s", drift: "1rem", opacity: 0.55 },
  { left: "64%", size: 10, delay: "6s", duration: "15s", drift: "-2rem", opacity: 0.3 },
  { left: "73%", size: 20, delay: "0.5s", duration: "8s", drift: "1.5rem", opacity: 0.6 },
  { left: "84%", size: 13, delay: "4s", duration: "12s", drift: "-1rem", opacity: 0.45 },
  { left: "92%", size: 11, delay: "2.5s", duration: "13s", drift: "1rem", opacity: 0.4 },
]

export function Snowfall({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {FLAKES.map((f, i) => (
        <Snowflake
          key={i}
          className="absolute -top-6 animate-snow text-winter-foreground"
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animationDelay: f.delay,
            animationDuration: f.duration,
            ["--snow-drift" as string]: f.drift,
          }}
        />
      ))}
    </div>
  )
}
