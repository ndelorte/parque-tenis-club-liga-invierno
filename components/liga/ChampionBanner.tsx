import { Trophy } from "lucide-react";
import type { Team } from "@/lib/tournament/types";

export function ChampionBanner({ champion }: { champion: Team | null }) {
  if (!champion) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
        Campeón a confirmar.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-board bg-board p-6 text-center text-board-foreground">
      <Trophy className="mx-auto size-10" aria-hidden="true" />
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide">Campeón</p>
      <h3 className="font-heading text-2xl font-bold">{champion.name}</h3>
    </div>
  );
}
