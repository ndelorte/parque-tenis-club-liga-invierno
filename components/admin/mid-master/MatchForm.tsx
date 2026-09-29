"use client"

import { useState } from "react"
import { Calendar, Trophy, Trash2, ChevronDown, ChevronUp, Users } from "lucide-react"
import {
  updateMmMatchSchedule,
  updateMmMatchResult,
  clearMmMatchResult,
  assignMmMatchParticipants,
} from "@/app/actions/mid-master"
import type { DbMmMatch, DbMmParticipant } from "@/lib/data/mid-master/types"

interface Props {
  match: DbMmMatch
  participants: DbMmParticipant[]
  isFinal?: boolean
}

function participantName(participants: DbMmParticipant[], id: string | null) {
  if (!id) return "Por definir"
  return participants.find((p) => p.id === id)?.name ?? "Por definir"
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function fmtDate(d: string) {
  const dt = new Date(d + "T12:00:00")
  return `${DAYS[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`
}

export function MatchForm({ match, participants, isFinal = false }: Props) {
  const isKnockout = match.group_id === null
  const needsParticipants = isKnockout && (!match.participant_1_id || !match.participant_2_id)

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"schedule" | "result" | "players">(
    needsParticipants ? "players" : "schedule"
  )
  const [date, setDate] = useState(match.scheduled_date ?? "")
  const [time, setTime] = useState(match.scheduled_time ?? "")
  const [score, setScore] = useState(match.score ?? "")
  const [p1Id, setP1Id] = useState(match.participant_1_id ?? "")
  const [p2Id, setP2Id] = useState(match.participant_2_id ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const nameA = participantName(participants, match.participant_1_id)
  const nameB = participantName(participants, match.participant_2_id)
  const isCompleted = match.status === "played"

  async function handleSchedule() {
    setLoading(true); setError(""); setSuccess("")
    const result = await updateMmMatchSchedule(match.id, date, time)
    setLoading(false)
    if (result.ok) setSuccess("Fecha guardada.")
    else setError(result.error)
  }

  async function handleResult() {
    if (!score.trim()) { setError("Ingresá el score."); return }
    setLoading(true); setError(""); setSuccess("")
    const result = await updateMmMatchResult(match.id, score.trim(), isFinal)
    setLoading(false)
    if (result.ok) { setSuccess("Resultado guardado."); setOpen(false) }
    else setError(result.error)
  }

  async function handleClear() {
    if (!confirm("¿Borrar el resultado?")) return
    setLoading(true); setError("")
    await clearMmMatchResult(match.id)
    setLoading(false)
  }

  async function handleAssignPlayers() {
    setLoading(true); setError(""); setSuccess("")
    const result = await assignMmMatchParticipants(match.id, p1Id, p2Id)
    setLoading(false)
    if (result.ok) { setSuccess("Participantes asignados."); setActiveTab("schedule") }
    else setError(result.error)
  }

  return (
    <div className="border-b border-border last:border-0">
      {/* Row */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Status indicator */}
        <span className={`size-2 shrink-0 rounded-full ${
          isCompleted ? "bg-win-soft0" :
          match.status === "scheduled" ? "bg-accent" :
          "bg-muted-foreground/30"
        }`} />

        {/* Names + score */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className={`truncate ${isCompleted && match.winner_participant_id === match.participant_1_id ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {nameA}
            </span>
            {isCompleted ? (
              <span className="shrink-0 font-mono text-xs font-semibold text-foreground">
                {match.score}
              </span>
            ) : (
              <span className="shrink-0 text-xs text-muted-foreground">vs</span>
            )}
            <span className={`truncate text-right ${isCompleted && match.winner_participant_id === match.participant_2_id ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {nameB}
            </span>
          </div>
          {match.scheduled_date && !isCompleted && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {fmtDate(match.scheduled_date)}
              {match.scheduled_time && ` · ${match.scheduled_time}`}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {isCompleted && (
            <button
              onClick={handleClear}
              disabled={loading}
              className="rounded p-1.5 text-muted-foreground hover:bg-loss-soft hover:text-loss"
              title="Borrar resultado"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
          <button
            onClick={() => { setOpen(!open); setError(""); setSuccess("") }}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expandable form */}
      {open && (
        <div className="border-t border-border bg-card px-4 py-4">
          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
            {isKnockout && (
              <button
                onClick={() => setActiveTab("players")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "players" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="size-3.5" />
                Jugadores
              </button>
            )}
            <button
              onClick={() => setActiveTab("schedule")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                activeTab === "schedule" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="size-3.5" />
              Fecha y hora
            </button>
            <button
              onClick={() => setActiveTab("result")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                activeTab === "result" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="size-3.5" />
              Resultado
            </button>
          </div>

          {activeTab === "players" && isKnockout && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Jugador / Pareja 1</label>
                <select
                  value={p1Id}
                  onChange={(e) => setP1Id(e.target.value)}
                  className="w-full rounded border border-border-strong bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="">— Sin asignar —</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === p2Id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Jugador / Pareja 2</label>
                <select
                  value={p2Id}
                  onChange={(e) => setP2Id(e.target.value)}
                  className="w-full rounded border border-border-strong bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="">— Sin asignar —</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === p1Id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAssignPlayers}
                disabled={loading || !p1Id || !p2Id || p1Id === p2Id}
                className="w-full rounded bg-accent py-2 text-xs font-semibold text-accent-foreground hover:bg-accent-dark disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Asignar participantes"}
              </button>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded border border-border-strong bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Hora</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded border border-border-strong bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
              </div>
              <button
                onClick={handleSchedule}
                disabled={loading}
                className="w-full rounded bg-primary py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar fecha"}
              </button>
            </div>
          )}

          {activeTab === "result" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Score — ej: 6-4 6-2 · 6-4 3-6 {isFinal ? "6-4" : "7-6"}
                </label>
                <input
                  type="text"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder={isFinal ? "6-4 6-2 (o 6-4 3-6 6-4)" : "6-4 6-2 (o 6-4 3-6 7-6)"}
                  className="w-full rounded border border-border-strong bg-card px-2 py-1.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                {!isFinal && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tercer set: siempre 7-6 (supertiebreak). Final: set completo.
                  </p>
                )}
              </div>
              <button
                onClick={handleResult}
                disabled={loading || !match.participant_1_id || !match.participant_2_id}
                className="w-full rounded bg-accent py-2 text-xs font-semibold text-accent-foreground hover:bg-accent-dark disabled:opacity-50"
                title={!match.participant_1_id ? "Asigná los participantes primero" : ""}
              >
                {loading ? "Guardando..." : "Cargar resultado"}
              </button>
              {(!match.participant_1_id || !match.participant_2_id) && (
                <p className="text-xs text-muted-foreground">
                  Primero asigná los participantes a este partido.
                </p>
              )}
            </div>
          )}

          {(error || success) && (
            <p className={`mt-3 rounded px-3 py-2 text-xs ${error ? "bg-loss-soft text-loss" : "bg-win-soft text-win"}`}>
              {error || success}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
