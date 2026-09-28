import { PodiumBanner } from "@/components/liga/PodiumBanner"
import type { Category } from "@/lib/tournament/types"

type ClosedCategoryBundle = {
  category: Category
  championName: string | null
  runnerUpName: string | null
  thirdPlaceName: string | null
}

export function ClosedSeasonView({ bundles }: { bundles: ClosedCategoryBundle[] }) {
  return (
    <section className="liga-closed liga-container" aria-labelledby="liga-closed-title">
      <div className="liga-section-heading">
        <p className="liga-eyebrow">Una edición para recordar</p>
        <h2 id="liga-closed-title">El podio de cada categoría</h2>
        <p>Los equipos que llegaron más lejos en esta temporada.</p>
      </div>
      {bundles.length === 0 ? <p className="liga-empty">Todavía no hay categorías cargadas para esta edición.</p> : (
        <div className="liga-podium-grid">
          {bundles.map(({ category, championName, runnerUpName, thirdPlaceName }) => (
            <article className="liga-podium-card" key={category.id} aria-label={category.name}>
              <h3>{category.name}</h3>
              <PodiumBanner championName={championName} runnerUpName={runnerUpName} thirdPlaceName={thirdPlaceName} />
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
