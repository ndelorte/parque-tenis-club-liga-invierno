"use client"

import { useState } from "react"
import { Pause, Play } from "lucide-react"

export function SeasonAtmosphere({ decoration }: { decoration: "snow" | "sun" | null }) {
  const [paused, setPaused] = useState(false)

  return (
    <div className={`liga-hero-band${paused ? " liga-atmosphere-paused" : ""}`}>
      {decoration && <div className={`liga-atmosphere liga-atmosphere-${decoration}`} aria-hidden="true" />}
      <div className="liga-half-court" aria-hidden="true" />
      <div className="liga-band-baseline" aria-hidden="true" />
      {decoration && (
        <button type="button" className="liga-motion-toggle" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
          {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          {paused ? "Reanudar animación" : "Pausar animación"}
        </button>
      )}
    </div>
  )
}
