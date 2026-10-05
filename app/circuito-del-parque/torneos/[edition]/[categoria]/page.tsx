import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCircuitoEditionBySlug } from "@/lib/data/circuito/editions"
import { getCircuitoCategoryBySlug } from "@/lib/data/circuito/categories"
import { getCircuitoParticipants } from "@/lib/data/circuito/participants"
import { getCircuitoMatches } from "@/lib/data/circuito/matches"
import type { CircuitoMatchRow, CircuitoParticipantRow } from "@/lib/data/circuito/types"
import type { CircuitoCategoryRow } from "@/lib/data/circuito/types"
import { selectDrawRule } from "@/lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "@/lib/circuito/formatSpec"
import { classifyMainBracketSections, eliminationSections, type DisplayMatch } from "@/lib/circuito/bracketDisplay"
import { buildBracketTree, type BracketTreeParticipant } from "@/lib/circuito/bracketTree"
import { calculateZoneStandings } from "@/lib/circuito/calculateZoneStandings"
import { parseCircuitoScore } from "@/lib/circuito/parseCircuitoScore"
import { isGrandSlamMonth, pointsForInstance } from "@/lib/circuito/pointsTable"
import type { CircuitoParticipant, DrawFormatKind } from "@/lib/circuito/types"
import { BracketTreeView } from "@/components/circuito/bracket-tree"
import { RoundsView } from "@/components/circuito/rounds-view"
import { ChampionCard } from "@/components/circuito/champion-card"
import { BracketMatchCard } from "@/components/circuito/bracket-match-card"
import { ZoneStandingsTable, type ZoneMatchRow, type ZoneStandingsRow } from "@/components/circuito/zone-standings-table"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ edition: string; categoria: string }>
}): Promise<Metadata> {
  const { edition, categoria } = await params
  const ed = await getCircuitoEditionBySlug(edition)
  const cat = ed ? await getCircuitoCategoryBySlug(ed.id, categoria) : null
  return { title: cat ? `${cat.name} — ${ed!.name} | Circuito del Parque` : "Circuito del Parque" }
}

// "Campeón"/"Campeona"/"Campeones" — dato de presentación (no una regla
// deportiva): dobles siempre es una pareja ("Campeones"), single femenino
// "Campeona", el resto "Campeón".
function championWord(category: Pick<CircuitoCategoryRow, "type" | "name">): string {
  if (category.type === "dobles") return "Campeones"
  return category.name.includes("Damas") ? "Campeona" : "Campeón"
}

function toParticipantsMap(participants: CircuitoParticipantRow[]): Record<string, BracketTreeParticipant> {
  return Object.fromEntries(participants.map((p) => [p.id, { name: p.display_name, seed: p.seed }]))
}

// Re-numera round_number para que un tramo del cuadro (p. ej. semis+final, a
// partir de round 2) se pueda pasar a buildBracketTree como un cuadro propio
// (que siempre espera que la 1ª ronda sea la 1).
function knockoutTail(matches: CircuitoMatchRow[], fromRound: number): CircuitoMatchRow[] {
  return matches.filter((m) => m.round_number >= fromRound).map((m) => ({ ...m, round_number: m.round_number - fromRound + 1 }))
}

function formatDiff(n: number): string {
  return n > 0 ? `+${n}` : `${n}`
}

// Tabla de posiciones + partidos de una zona ya jugada — usa
// calculateZoneStandings (mismo criterio de desempate que el motor) para el
// orden; PJ/PG/Sets/Games son solo aritmética de presentación.
function buildZoneDisplay(
  zoneParticipants: CircuitoParticipant[],
  zoneMatches: CircuitoMatchRow[],
  names: Record<string, BracketTreeParticipant>,
  qualifiesCount: number,
): { rows: ZoneStandingsRow[]; matches: ZoneMatchRow[] } {
  const completed = zoneMatches.filter((m) => m.winner_id && m.score && m.participant_a_id && m.participant_b_id)
  const results = completed.map((m) => ({
    participantAId: m.participant_a_id!,
    participantBId: m.participant_b_id!,
    winnerId: m.winner_id!,
    score: m.score!,
  }))

  const stats = new Map(
    zoneParticipants.map((p) => [p.id, { played: 0, wins: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 }]),
  )
  for (const m of completed) {
    const a = stats.get(m.participant_a_id!)
    const b = stats.get(m.participant_b_id!)
    if (!a || !b) continue
    a.played++
    b.played++

    // Datos importados (Challonge) pueden traer un score con un formato
    // atípico que parseCircuitoScore no puede interpretar (ver
    // lib/circuito/parseCircuitoScore.ts). En vez de tirar abajo toda la
    // página con una excepción sin capturar, se loguea y ese partido
    // puntual queda sin sumar a sets/games — el resto de la zona se sigue
    // mostrando normalmente.
    try {
      const parsed = parseCircuitoScore(m.score!, { isFinal: false })
      a.setsWon += parsed.setsWonA
      a.setsLost += parsed.setsWonB
      b.setsWon += parsed.setsWonB
      b.setsLost += parsed.setsWonA
      a.gamesWon += parsed.gamesWonA
      a.gamesLost += parsed.gamesWonB
      b.gamesWon += parsed.gamesWonB
      b.gamesLost += parsed.gamesWonA
    } catch (err) {
      console.error(`[buildZoneDisplay] score no interpretable "${m.score}" para el partido ${m.id}: no se suman sets/games`, err)
    }

    if (m.winner_id === m.participant_a_id) a.wins++
    else if (m.winner_id === m.participant_b_id) b.wins++
    else console.error(`[buildZoneDisplay] winner_id "${m.winner_id}" no coincide con ninguno de los 2 participantes del partido ${m.id}`)
  }

  const order = calculateZoneStandings(zoneParticipants, results)
  const rows: ZoneStandingsRow[] = order.map((p, i) => {
    const s = stats.get(p.id)!
    return {
      id: p.id,
      name: names[p.id]?.name ?? "?",
      played: s.played,
      wins: s.wins,
      setsDiff: formatDiff(s.setsWon - s.setsLost),
      gamesDiff: formatDiff(s.gamesWon - s.gamesLost),
      qualifies: i < qualifiesCount,
    }
  })

  const matchRows: ZoneMatchRow[] = completed.map((m) => ({
    id: m.id,
    winnerName: names[m.winner_id!]?.name ?? "?",
    loserName: names[m.winner_id === m.participant_a_id ? m.participant_b_id! : m.participant_a_id!]?.name ?? "?",
    score: m.score!,
  }))

  return { rows, matches: matchRows }
}

export default async function CircuitoTorneoCategoriaPage({
  params,
}: {
  params: Promise<{ edition: string; categoria: string }>
}) {
  const { edition: editionSlug, categoria: categorySlug } = await params
  const edition = await getCircuitoEditionBySlug(editionSlug)
  if (!edition) notFound()

  const category = await getCircuitoCategoryBySlug(edition.id, categorySlug)
  if (!category || category.draw_size === null) notFound()

  const [participants, matches] = await Promise.all([
    getCircuitoParticipants(category.id),
    getCircuitoMatches(category.id),
  ])
  const names = toParticipantsMap(participants)
  const circuitoParticipants: CircuitoParticipant[] = participants.map((p) => ({ id: p.id, seed: p.seed }))

  const grandSlam = isGrandSlamMonth(edition.month)
  const championPoints = pointsForInstance("champion", grandSlam)
  const label = championWord(category)

  const mainMatches = matches.filter((m) => m.bracket === "main")
  const repechajeMatches = matches.filter((m) => m.bracket === "repechaje")
  const rule = selectDrawRule(category.draw_size, CIRCUITO_FORMAT_SPEC)
  // draw_size fuera de todo drawRule conocido (ej. cargado a mano o por un
  // import con menos del mínimo de 4 inscriptos) — reglas-circuito-del-parque.md:
  // "con menos de 4 inscriptos la categoría no se disputa ese mes". Sin esto,
  // la página seguía de largo y renderizaba solo el encabezado, sin ninguna
  // sección de contenido (pantalla en blanco sin explicación).
  if (!rule) notFound()

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/circuito-del-parque/torneos/${editionSlug}`}
        className="mb-3 inline-block text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        {edition.name}
      </Link>
      <h1 className="font-heading text-4xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-5xl lg:text-6xl">
        {category.name}
      </h1>
      <p className="mt-2 mb-8 text-base text-muted-foreground">
        {category.type === "single" ? "Single" : "Dobles"}, {category.draw_size}{" "}
        {category.type === "single" ? "inscriptos" : "parejas"}
        {grandSlam && ". Grand Slam: puntos dobles para el ranking."}
      </p>

      {rule?.format === "single_elimination" && (
        <EliminationSections
          mainMatches={mainMatches}
          repechajeMatches={repechajeMatches}
          names={names}
          championLabel={label}
          championPoints={championPoints}
        />
      )}

      {rule?.format === "round_robin_pure" && (
        <PureZoneSection participants={circuitoParticipants} matches={mainMatches} names={names} championLabel={label} championPoints={championPoints} />
      )}

      {rule?.format === "round_robin_with_final" && (
        <ZoneWithFinalSection
          participants={circuitoParticipants}
          matches={mainMatches}
          names={names}
          championLabel={label}
          championPoints={championPoints}
        />
      )}

      {rule?.format === "groups_then_knockout" && (
        <GroupsThenKnockoutSection
          participants={circuitoParticipants}
          matches={mainMatches}
          names={names}
          championLabel={label}
          championPoints={championPoints}
        />
      )}
    </main>
  )
}

// ── Eliminación directa (N≥8) ────────────────────────────────────────────

function EliminationSections({
  mainMatches,
  repechajeMatches,
  names,
  championLabel,
  championPoints,
}: {
  mainMatches: CircuitoMatchRow[]
  repechajeMatches: CircuitoMatchRow[]
  names: Record<string, BracketTreeParticipant>
  championLabel: string
  championPoints: number
}) {
  const mainTree = buildBracketTree(mainMatches, names)
  const repechajeTree = repechajeMatches.length > 0 ? buildBracketTree(repechajeMatches, names, { strictByes: true }) : null

  return (
    <div>
      {mainTree ? (
        <>
          <div className="hidden lg:block">
            <BracketTreeView
              tree={mainTree}
              championLabel={championLabel}
              championPoints={championPoints}
              idPrefix="principal"
              scrollAreaLabel="Cuadro principal"
            />
          </div>
          <div className="lg:hidden">
            <RoundsView tree={mainTree} championLabel={championLabel} />
          </div>
        </>
      ) : (
        <FallbackSections matches={mainMatches} names={names} />
      )}

      {repechajeMatches.length > 0 && (
        <section className="mt-14 border-t border-border pt-8">
          <h2 className="mb-2 font-heading text-3xl font-extrabold uppercase text-foreground">Repechaje</h2>
          <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
            Para quienes pierden su primer partido: asegura un segundo partido. Se va completando a medida que se juegan los partidos. No suma puntos al ranking.
          </p>
          {repechajeTree ? (
            <>
              <div className="hidden lg:block">
                <BracketTreeView
                  tree={repechajeTree}
                  championLabel="Ganó el repechaje"
                  idPrefix="repechaje"
                  scrollAreaLabel="Repechaje"
                />
              </div>
              <div className="lg:hidden">
                <RoundsView tree={repechajeTree} championLabel="Ganó el repechaje" />
              </div>
            </>
          ) : (
            // El repechaje SIEMPRE es eliminación directa (generateRepechaje.ts,
            // formatSpec.ts sección `repechaje`) — no hay que inferir el formato
            // por cantidad de jugadores como hace classifyMainBracketSections
            // (esa inferencia es para el cuadro PRINCIPAL). El repechaje suele
            // tener 4-7 jugadores (perdedores de 1ª ronda), que classify... lee
            // como round robin/zonas y muestra como "fase de grupos" — por eso
            // se fuerza acá el formato en vez de dejarlo inferir.
            <FallbackSections matches={repechajeMatches} names={names} format="single_elimination" />
          )}
        </section>
      )}
    </div>
  )
}

// Cuando buildBracketTree no puede armar un árbol válido (cuadros
// importados, ver bracketDisplay.ts): listas por ronda con el mismo estilo
// de tarjeta, sin conectores. `format`: si se pasa, fuerza esa clasificación
// en vez de inferirla por cantidad de participantes (el repechaje ya sabe su
// formato de antemano, no hay que inferirlo).
function FallbackSections({
  matches,
  names,
  format,
}: {
  matches: CircuitoMatchRow[]
  names: Record<string, BracketTreeParticipant>
  format?: DrawFormatKind
}) {
  const sections =
    format === "single_elimination"
      ? eliminationSections(matches as DisplayMatch[])
      : classifyMainBracketSections(matches as DisplayMatch[])
  if (sections.length === 0) return null

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <div key={section.label}>
          <h2 className="mb-3 font-heading text-2xl font-extrabold uppercase text-foreground">{section.label}</h2>
          <ol className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {section.matches.map((m) => (
              <li key={m.id}>
                <BracketMatchCard
                  compact
                  match={{
                    id: m.id,
                    position: 0,
                    a: m.participant_a_id ? { id: m.participant_a_id, name: names[m.participant_a_id]?.name ?? "?", seed: names[m.participant_a_id]?.seed ?? null } : null,
                    b: m.participant_b_id ? { id: m.participant_b_id, name: names[m.participant_b_id]?.name ?? "?", seed: names[m.participant_b_id]?.seed ?? null } : null,
                    score: m.score,
                    winnerId: m.winner_id,
                    isBye: !!m.participant_a_id && !m.participant_b_id,
                    isWalkover: m.status === "walkover",
                    status: m.status,
                  }}
                />
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}

// ── N=5: todos contra todos puro, sin final ─────────────────────────────

function PureZoneSection({
  participants,
  matches,
  names,
  championPoints,
}: {
  participants: CircuitoParticipant[]
  matches: CircuitoMatchRow[]
  names: Record<string, BracketTreeParticipant>
  championLabel: string
  championPoints: number
}) {
  const { rows, matches: matchRows } = buildZoneDisplay(participants, matches, names, 0)
  const champion = rows[0] ? { name: rows[0].name } : null

  return (
    <div className="flex flex-col gap-8">
      <ChampionCard champion={champion} points={champion ? championPoints : undefined} />
      <ZoneStandingsTable zoneName="Todos contra todos" rows={rows} matches={matchRows} />
      <p className="text-xs text-muted-foreground">
        Sin final: el campeón/la campeona es el 1° de la tabla de arriba. Desempate: partidos ganados, diferencia de
        sets, diferencia de games, partido entre ellos.
      </p>
    </div>
  )
}

// ── N=4: zona única + final entre los 2 primeros ────────────────────────

function ZoneWithFinalSection({
  participants,
  matches,
  names,
  championLabel,
  championPoints,
}: {
  participants: CircuitoParticipant[]
  matches: CircuitoMatchRow[]
  names: Record<string, BracketTreeParticipant>
  championLabel: string
  championPoints: number
}) {
  const zoneMatches = matches.filter((m) => m.round_number === 1)
  const nativeFinalTree = buildBracketTree(knockoutTail(matches, 2), names)

  // Camino nativo: round_number del motor propio (1=zona, 2=final) es
  // confiable y ya arma el árbol. Se usa tal cual, sin cambios.
  if (nativeFinalTree) {
    const { rows, matches: matchRows } = buildZoneDisplay(participants, zoneMatches, names, 2)
    return (
      <div className="flex flex-col gap-10">
        <div className="hidden lg:block">
          <BracketTreeView
            tree={nativeFinalTree}
            championLabel={championLabel}
            championPoints={championPoints}
            idPrefix="final"
          />
        </div>
        <div className="lg:hidden">
          <RoundsView tree={nativeFinalTree} championLabel={championLabel} />
        </div>
        <ZoneStandingsTable zoneName="Todos contra todos" rows={rows} matches={matchRows} />
        <p className="text-xs text-muted-foreground">
          Barra de color: clasifica a la final. Desempate: partidos ganados, diferencia de sets, diferencia de games,
          partido entre ellos.
        </p>
      </div>
    )
  }

  // Cuadro importado de Challonge: round_number no separa zona/final de
  // forma confiable (ver GroupsThenKnockoutSection). Se reconstruye
  // buscando el par que se repite — la final es siempre una revancha del
  // mismo par que ya se enfrentó en la fase de grupos (mismo criterio que
  // classifyMainBracketSections usa para N=4, con tests que lo cubren).
  const sections = classifyMainBracketSections(matches as DisplayMatch[])
  const group = sections.find((s) => s.label.startsWith("Fase de grupos"))
  const finalSection = sections.find((s) => s.label === "Final")
  if (!group) return <FallbackSections matches={matches} names={names} />

  const groupMatches = group.matches as CircuitoMatchRow[]
  // qualifiesCount=2: los primeros 2 de la zona clasifican a la Final (la
  // barra de color de ZoneStandingsTable marca justamente eso). Si por algo
  // no se pudo reconstruir la Final, no hay a quién marcar como clasificado.
  const { rows, matches: matchRows } = buildZoneDisplay(participants, groupMatches, names, finalSection ? 2 : 0)
  const reconstructedFinalTree = finalSection
    ? buildBracketTree(
        (finalSection.matches as CircuitoMatchRow[]).map((m) => ({ ...m, round_number: 1 })),
        names,
      )
    : null
  const champion = rows[0] ? { name: rows[0].name } : null

  return (
    <div className="flex flex-col gap-10">
      {reconstructedFinalTree ? (
        <>
          <div className="hidden lg:block">
            <BracketTreeView
              tree={reconstructedFinalTree}
              championLabel={championLabel}
              championPoints={championPoints}
              idPrefix="final"
            />
          </div>
          <div className="lg:hidden">
            <RoundsView tree={reconstructedFinalTree} championLabel={championLabel} />
          </div>
        </>
      ) : (
        <ChampionCard champion={champion} points={champion ? championPoints : undefined} />
      )}
      <ZoneStandingsTable zoneName="Todos contra todos" rows={rows} matches={matchRows} />
      <p className="text-xs text-muted-foreground">
        Barra de color: clasifica a la final. Desempate: partidos ganados, diferencia de sets, diferencia de games,
        partido entre ellos.
      </p>
    </div>
  )
}

// ── N=6-7: dos zonas + semifinales cruzadas + final ─────────────────────

function GroupsThenKnockoutSection({
  participants,
  matches,
  names,
  championLabel,
  championPoints,
}: {
  participants: CircuitoParticipant[]
  matches: CircuitoMatchRow[]
  names: Record<string, BracketTreeParticipant>
  championLabel: string
  championPoints: number
}) {
  // La columna `zone` (A/B) y el round_number con semántica "1=zona,
  // 2+=cruce" solo los persiste el motor propio (torneos armados desde el
  // panel). Los cuadros importados de Challonge no traen `zone` (ver
  // bracketDisplay.ts) y su round numérico crudo tampoco respeta esa
  // semántica.
  const hasZoneColumn = matches.some((m) => m.zone)

  if (hasZoneColumn) {
    const zoneMatches = matches.filter((m) => m.round_number === 1)
    const zones = (["A", "B"] as const).map((zone) => {
      const inZone = zoneMatches.filter((m) => m.zone === zone)
      const ids = new Set(inZone.flatMap((m) => [m.participant_a_id, m.participant_b_id]).filter((id): id is string => !!id))
      const zoneParticipants = participants.filter((p) => ids.has(p.id))
      return { zone, ...buildZoneDisplay(zoneParticipants, inZone, names, 2) }
    })
    const knockoutTree = buildBracketTree(knockoutTail(matches, 2), names)

    return (
      <div className="flex flex-col gap-10">
        {knockoutTree && (
          <>
            <div className="hidden lg:block">
              <BracketTreeView
                tree={knockoutTree}
                championLabel={championLabel}
                championPoints={championPoints}
                idPrefix="semifinales"
              />
            </div>
            <div className="lg:hidden">
              <RoundsView tree={knockoutTree} championLabel={championLabel} />
            </div>
          </>
        )}
        <div className="grid gap-10 sm:grid-cols-2">
          {zones.map(({ zone, rows, matches: matchRows }) => (
            <ZoneStandingsTable key={zone} zoneName={`Zona ${zone}`} rows={rows} matches={matchRows} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Barra de color: clasifica a semifinales. Desempate: partidos ganados, diferencia de sets, diferencia de
          games, partido entre ellos.
        </p>
      </div>
    )
  }

  // Cuadro importado de Challonge, sin columna `zone`: se reconstruyen las
  // 2 zonas por el grafo de resultados (reconstructTwoZonesFromGraph en
  // bracketDisplay.ts, sin mirar round_number ni zone), y se arma la misma
  // vista pulida (2 tablas de zona + árbol de semis/final) que el camino
  // nativo, en vez de la lista plana de FallbackSections.
  const sections = classifyMainBracketSections(matches as DisplayMatch[])
  const zoneASection = sections.find((s) => s.label === "Zona A")
  const zoneBSection = sections.find((s) => s.label === "Zona B")
  const semisSection = sections.find((s) => s.label === "Semifinales")
  const finalSection = sections.find((s) => s.label === "Final")

  if (!zoneASection || !zoneBSection) {
    // No se pudo reconstruir con confianza (zonas ambiguas): mostrar los
    // partidos reales sin ocultar nada, en vez de arriesgar una zona
    // incorrecta.
    return <FallbackSections matches={matches} names={names} />
  }

  const zoneSections = [
    { label: "Zona A", matches: zoneASection.matches as CircuitoMatchRow[] },
    { label: "Zona B", matches: zoneBSection.matches as CircuitoMatchRow[] },
  ].map(({ label, matches: zoneMatches }) => {
    const ids = new Set(zoneMatches.flatMap((m) => [m.participant_a_id, m.participant_b_id]).filter((id): id is string => !!id))
    const zoneParticipants = participants.filter((p) => ids.has(p.id))
    return { label, ...buildZoneDisplay(zoneParticipants, zoneMatches, names, 2) }
  })

  const knockoutMatches: CircuitoMatchRow[] = [
    ...(semisSection ? (semisSection.matches as CircuitoMatchRow[]).map((m) => ({ ...m, round_number: 1 })) : []),
    ...(finalSection ? (finalSection.matches as CircuitoMatchRow[]).map((m) => ({ ...m, round_number: 2 })) : []),
  ]
  const reconstructedKnockoutTree = knockoutMatches.length > 0 ? buildBracketTree(knockoutMatches, names) : null

  return (
    <div className="flex flex-col gap-10">
      {reconstructedKnockoutTree ? (
        <>
          <div className="hidden lg:block">
            <BracketTreeView
              tree={reconstructedKnockoutTree}
              championLabel={championLabel}
              championPoints={championPoints}
              idPrefix="semifinales"
            />
          </div>
          <div className="lg:hidden">
            <RoundsView tree={reconstructedKnockoutTree} championLabel={championLabel} />
          </div>
        </>
      ) : (
        semisSection && (
          <FallbackSections
            matches={[...semisSection.matches, ...(finalSection?.matches ?? [])] as CircuitoMatchRow[]}
            names={names}
          />
        )
      )}
      <div className="grid gap-10 sm:grid-cols-2">
        {zoneSections.map(({ label, rows, matches: matchRows }) => (
          <ZoneStandingsTable key={label} zoneName={label} rows={rows} matches={matchRows} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Barra de color: clasifica a semifinales. Desempate: partidos ganados, diferencia de sets, diferencia de games,
        partido entre ellos.
      </p>
    </div>
  )
}
