import Link from "next/link";
import { teamHref } from "@/lib/tournament/seasonRoutes";
import type { Team } from "@/lib/tournament/types";

interface TeamCardProps {
  team: Team;
  categorySlug: string;
  seasonSlug: string;
}

export function TeamCard({ team, categorySlug, seasonSlug }: TeamCardProps) {
  return (
    <Link href={teamHref(seasonSlug, categorySlug, team.slug)} className="group flex min-h-16 items-center justify-between gap-3 border-b border-border py-3 focus-visible:outline-2 focus-visible:outline-primary">
      <span>
        <span className="block font-heading text-lg font-bold text-foreground transition-colors group-hover:text-primary">
          {team.name}
        </span>
        {team.captain_name && (
          <span className="mt-0.5 block text-sm text-muted-foreground">Capitán: {team.captain_name}</span>
        )}
      </span>
      <span aria-hidden="true" className="text-primary">↗</span>
    </Link>
  );
}
