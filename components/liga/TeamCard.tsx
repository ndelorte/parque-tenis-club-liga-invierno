import Link from "next/link";
import { teamHref } from "@/lib/tournament/seasonRoutes";
import type { Team } from "@/lib/tournament/types";
import { TeamMedals } from "./medals/medal-badges";

interface TeamCardProps {
  team: Team;
  categorySlug: string;
  seasonSlug: string;
}

// Link "estirado": el <a> cubre toda la tarjeta con un ::after, y las medallas
// (botones) quedan afuera del <a>, por encima, para que se puedan tocar sin
// anidar un botón dentro de un enlace.
export function TeamCard({ team, categorySlug, seasonSlug }: TeamCardProps) {
  return (
    <div className="group relative flex min-h-16 items-center justify-between gap-3 border-b border-border py-3 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-primary">
      <span>
        <span className="block font-heading text-lg font-bold text-foreground transition-colors group-hover:text-primary">
          <Link href={teamHref(seasonSlug, categorySlug, team.slug)} className="outline-none after:absolute after:inset-0 after:content-['']">
            {team.name}
          </Link>
          <span className="relative z-10"><TeamMedals teamId={team.id} /></span>
        </span>
        {team.captain_name && (
          <span className="mt-0.5 block text-sm text-muted-foreground">Capitán: {team.captain_name}</span>
        )}
      </span>
      <span aria-hidden="true" className="text-primary">↗</span>
    </div>
  );
}
