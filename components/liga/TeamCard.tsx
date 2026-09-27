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
    <Link href={teamHref(seasonSlug, categorySlug, team.slug)}>
      <div className="bg-card border border-border rounded-lg px-4 py-3 hover:border-brand hover:shadow-sm transition-all group">
        <p className="font-semibold text-foreground group-hover:text-brand transition-colors">
          {team.name}
        </p>
        {team.captain_name && (
          <p className="text-xs text-muted-foreground mt-0.5">Cap: {team.captain_name}</p>
        )}
      </div>
    </Link>
  );
}
