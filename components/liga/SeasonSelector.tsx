import { SeasonCard } from "@/components/liga/SeasonCard";
import type { Tournament } from "@/lib/tournament/types";

export function SeasonSelector({ tournaments }: { tournaments: Tournament[] }) {
  if (tournaments.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
        Todavía no hay ediciones cargadas.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-heading text-2xl font-bold text-gray-900 mb-1">Liga Invierno/Verano</h1>
      <p className="text-gray-600 mb-6">Elegí una temporada para ver tabla, fixture y equipos.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {tournaments.map((t) => (
          <SeasonCard key={t.id} tournament={t} />
        ))}
      </div>
    </div>
  );
}
