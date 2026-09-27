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
    <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 dark:from-amber-950/50 dark:to-amber-900/30 dark:border-amber-800/60 p-6 text-center">
      <Trophy className="mx-auto size-10 text-amber-500" aria-hidden="true" />
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Campeón</p>
      <h3 className="font-heading text-2xl font-bold text-foreground">{champion.name}</h3>
    </div>
  );
}
