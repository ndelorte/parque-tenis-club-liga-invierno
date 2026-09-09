import type { Metadata } from "next"
import { Users, Swords, Calendar, ClipboardList, Trophy, CreditCard, MessageCircle, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StandingsTable } from "@/components/interparque/StandingsTable"
import { MatchesList } from "@/components/interparque/MatchesList"
import { getInterparqueMatches, getInterparquePlayers, getInterparqueStandings } from "@/lib/data/interparque"

export const metadata: Metadata = {
  title: "Interparque | Parque Tenis Club",
  description:
    "Interparque: la modalidad de partidos de single exclusiva para alumnos del club. Cada game suma — tabla de posiciones y partidos jugados.",
}

const RULES = [
  {
    icon: Users,
    title: "Exclusivo para alumnos",
    body: "Pensado exclusivamente para alumnos del club, para poner en práctica en el juego lo que se viene entrenando.",
  },
  {
    icon: Swords,
    title: "Se juega de single",
    body: "Serie de partidos de single entre alumnos, divididos en dos niveles que juegan con rivales diferentes. Los niveles son por categoría, mezclando varones y mujeres.",
  },
  {
    icon: Calendar,
    title: "¿Cuánto dura?",
    body: "Desde el primer domingo de septiembre hasta el último domingo de octubre. No es obligación jugar todas las fechas, pero cuantas más juegues, más oportunidad de sumar tenés.",
  },
  {
    icon: Calendar,
    title: "¿Cuándo se juega?",
    body: "Todos los domingos hay fecha, en horario a convenir.",
  },
  {
    icon: ClipboardList,
    title: "¿Cómo se programan los partidos?",
    body: "Antes del inicio del torneo se hace una grilla con todos los jugadores. Cada semana se programa el horario.",
  },
  {
    icon: Trophy,
    title: "¿Cómo se juega cada partido?",
    body: "Al mejor de 3 sets — el último es super tie-break.",
  },
  {
    icon: Trophy,
    title: "¿Cómo se suma puntos?",
    body: "Cada game ganado vale 1 punto, y por partido ganado se suma un bonus de 3 puntos. Ejemplo: si ganás 6-2 6-3, sumás 15 puntos (12 games + 3 por ganar) y tu rival suma 5.",
  },
  {
    icon: CreditCard,
    title: "¿Cuál es el costo?",
    body: "$12.000 por partido. Incluye cancha y pelotas.",
  },
  {
    icon: MessageCircle,
    title: "¿Cómo sigo el certamen?",
    body: "Todas las semanas se suben los resultados y la tabla de posiciones acá mismo.",
  },
  {
    icon: Award,
    title: "¿Qué se lleva el ganador de cada categoría?",
    body: "Entrenamiento sin cargo en el grupo de adultos, dos veces por semana durante el mes de noviembre.",
  },
]

export default async function InterparquePage() {
  const [standings, matches, players] = await Promise.all([
    getInterparqueStandings(),
    getInterparqueMatches(),
    getInterparquePlayers(),
  ])

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="bg-brand text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Parque Tenis Club
          </p>
          <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Inter<span className="text-accent">Parque</span>
          </h1>
          <p className="mt-3 max-w-xl text-lg text-white/90">Cada game suma.</p>
          <p className="mt-4 max-w-2xl text-sm text-white/70">
            Todos juegan, todos suman — el nuevo formato de partidos de single exclusivo
            para alumnos del club.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Reglas */}
        <section id="reglas">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Reglas
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {RULES.map((rule) => (
              <Card key={rule.title}>
                <CardHeader>
                  <span className="mb-1 flex size-9 items-center justify-center rounded-lg bg-brand-light text-brand">
                    <rule.icon className="size-5" />
                  </span>
                  <CardTitle>{rule.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{rule.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tabla de posiciones */}
        <section id="tabla" className="mt-14">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Tabla de posiciones
          </h2>
          <div className="mt-6">
            <StandingsTable standings={standings} />
          </div>
        </section>

        {/* Partidos jugados */}
        <section id="partidos" className="mt-14">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Partidos jugados
          </h2>
          <div className="mt-6">
            <MatchesList matches={matches} players={players} />
          </div>
        </section>
      </main>
    </div>
  )
}
