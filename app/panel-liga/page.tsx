import type { Metadata } from "next"
import { ResultLoader } from "@/components/admin/result-loader"
import { TeamManager } from "@/components/admin/team-manager"
import { FixtureManager } from "@/components/admin/fixture-manager"
import { PlayoffManager } from "@/components/admin/playoff-manager"
import { CloseTournamentButton } from "@/components/admin/close-tournament-button"
import { PhotoManager } from "@/components/admin/photo-manager"
import { SponsorManager } from "@/components/admin/sponsor-manager"
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell"
import { LIGA_SECTION_KEYS } from "@/components/admin/panels"
import {
  getAdminCategories,
  getAdminActiveTournament,
  getMissingFinalsForTournament,
  getTournamentsForPhotoAdmin,
} from "@/app/actions/admin"
import { getActiveTournament } from "@/lib/data/tournaments"

export const metadata: Metadata = {
  title: "Panel de carga | Liga de Invierno",
  description:
    "Dashboard interno para cargar resultados de la Liga de Invierno de Parque Tenis Club.",
}

const SECTION_HEADERS: Record<string, { title: string; lede: string }> = {
  resultados: {
    title: "Resultados",
    lede: "Elegí la categoría y la fecha para cargar el resultado de cada serie.",
  },
  jugadores: {
    title: "Jugadores",
    lede: "Administrá los planteles de cada equipo.",
  },
  fixture: {
    title: "Fixture",
    lede: "Cargá el fixture y reprogramá las fechas de las series.",
  },
  playoffs: {
    title: "Playoffs",
    lede: "Cuadro de playoffs por categoría: cargá los cruces y sus resultados.",
  },
  fotos: {
    title: "Fotos",
    lede: "Fotos de cada edición para el sitio público.",
  },
  sponsors: {
    title: "Sponsors",
    lede: "Sponsors de cada edición para el sitio público.",
  },
}

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string }>
}) {
  const { seccion } = await searchParams
  const section = seccion && LIGA_SECTION_KEYS.includes(seccion) ? seccion : "resultados"

  const categories = await getAdminCategories()
  const activeTournament = await getAdminActiveTournament()
  const missingFinals = activeTournament
    ? await getMissingFinalsForTournament(activeTournament.id)
    : []
  const photoTournaments = await getTournamentsForPhotoAdmin()
  // El slug de la edición es el `[season]` de la ruta pública.
  const publicTournament = await getActiveTournament()

  const header = SECTION_HEADERS[section]

  return (
    <AdminShell
      panel="liga"
      context={activeTournament ? `${activeTournament.name} ${activeTournament.season}` : "Sin edición activa"}
      currentSection={section}
      publicHref={
        publicTournament
          ? `/ligas-invierno-verano/${publicTournament.slug}`
          : "/ligas-invierno-verano"
      }
    >
      <AdminPageHeader title={header.title} lede={header.lede} />

      {section === "resultados" && (
        <>
          {activeTournament && (
            <div className="mb-4">
              <CloseTournamentButton
                tournamentId={activeTournament.id}
                tournamentName={`${activeTournament.name} ${activeTournament.season}`}
                missingCategories={missingFinals}
              />
            </div>
          )}
          <ResultLoader categories={categories} />
        </>
      )}
      {section === "jugadores" && <TeamManager categories={categories} />}
      {section === "fixture" && <FixtureManager categories={categories} />}
      {section === "playoffs" && <PlayoffManager categories={categories} />}
      {section === "fotos" && <PhotoManager tournaments={photoTournaments} />}
      {section === "sponsors" && <SponsorManager tournaments={photoTournaments} />}
    </AdminShell>
  )
}
