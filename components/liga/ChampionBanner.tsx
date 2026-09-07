import { Trophy } from "lucide-react";
import type { Team } from "@/lib/tournament/types";

export function ChampionBanner({ champion }: { champion: Team | null }) {
  if (!champion) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-gray-500">
        Campeón a confirmar.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-6 text-center">
      <Trophy className="mx-auto size-10 text-amber-500" aria-hidden="true" />
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Campeón</p>
      <h3 className="font-heading text-2xl font-bold text-gray-900">{champion.name}</h3>
    </div>
  );
}
