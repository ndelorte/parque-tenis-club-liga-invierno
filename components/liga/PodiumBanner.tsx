import { Trophy } from "lucide-react"

export function PodiumBanner({
  championName,
  runnerUpName,
  thirdPlaceName,
}: {
  championName: string | null
  runnerUpName: string | null
  thirdPlaceName: string | null
}) {
  return (
    <div className="liga-podium">
      <div className="liga-podium-champion">
        <span className="liga-podium-rank">01 / Campeón</span>
        <strong>{championName ?? "A confirmar"}</strong>
        <Trophy size={32} strokeWidth={1.6} aria-hidden="true" />
      </div>
      <ol className="liga-podium-places" start={2}>
        <li><span className="liga-podium-medal liga-podium-silver" aria-hidden="true">2</span><span><small>Subcampeón</small><strong>{runnerUpName ?? "A confirmar"}</strong></span></li>
        <li><span className="liga-podium-medal liga-podium-bronze" aria-hidden="true">3</span><span><small>Tercer puesto</small><strong>{thirdPlaceName ?? "A confirmar"}</strong></span></li>
      </ol>
    </div>
  )
}
