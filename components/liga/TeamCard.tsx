import Link from "next/link";
import type { Team } from "@/lib/tournament/types";

interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Link href={`/liga-invierno/equipos/${team.slug}`}>
      <div className="bg-white border border-border rounded-lg px-4 py-3 hover:border-brand hover:shadow-sm transition-all group">
        <p className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
          {team.name}
        </p>
        {team.captain_name && (
          <p className="text-xs text-gray-500 mt-0.5">Cap: {team.captain_name}</p>
        )}
      </div>
    </Link>
  );
}
