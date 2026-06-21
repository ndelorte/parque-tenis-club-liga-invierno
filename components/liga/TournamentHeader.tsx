import type { Tournament } from "@/lib/tournament/types";

interface TournamentHeaderProps {
  tournament: Tournament;
}

export function TournamentHeader({ tournament }: TournamentHeaderProps) {
  return (
    <div className="bg-brand text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">
          Temporada {tournament.season}
        </p>
        <h1 className="text-3xl font-bold">{tournament.name}</h1>
        {tournament.description && (
          <p className="mt-2 text-white/80 text-sm max-w-xl">
            {tournament.description}
          </p>
        )}
      </div>
    </div>
  );
}
