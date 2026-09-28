import { Trophy } from "lucide-react"

export function PodiumBanner({
  categoryName,
  championName,
  runnerUpName,
  thirdPlaceName,
}: {
  categoryName: string
  championName: string | null
  runnerUpName: string | null
  thirdPlaceName: string | null
}) {
  const hasPodium = Boolean(championName || runnerUpName || thirdPlaceName)

  return (
    <div className="liga-podium">
      <div className="liga-podium-champion">
        <span className="liga-podium-cat">{categoryName}</span>
        {hasPodium ? (
          <>
            <strong>{championName ?? "A confirmar"}</strong>
            <span className="sr-only">Campeón</span>
            <Trophy size={22} strokeWidth={1.8} aria-hidden="true" className="liga-podium-trophy" />
          </>
        ) : (
          <span className="liga-podium-tbd">Podio a confirmar</span>
        )}
      </div>
      {hasPodium && (
        <ol className="liga-podium-places" start={2}>
          <li><span className="liga-podium-medal liga-podium-silver" aria-hidden="true">2</span><span><small>Subcampeón</small><strong>{runnerUpName ?? "A confirmar"}</strong></span></li>
          <li><span className="liga-podium-medal liga-podium-bronze" aria-hidden="true">3</span><span><small>Tercer puesto</small><strong>{thirdPlaceName ?? "A confirmar"}</strong></span></li>
        </ol>
      )}
    </div>
  )
}
