import { Trophy } from "lucide-react";
import type { Team } from "@/lib/tournament/types";

// Mismo lenguaje visual que components/circuito/champion-card.tsx (trofeo en
// --ball sobre --board, rounded-md, jerarquía font-heading) para que un
// campeón se vea igual en Liga y en Circuito.
export function ChampionBanner({ champion }: { champion: Team | null }) {
  if (!champion) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-md border-2 border-dashed border-border p-6 text-center text-muted-foreground">
        <Trophy aria-hidden="true" className="size-8" />
        <span className="font-heading text-xl font-extrabold">Campeón a confirmar</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-md bg-board p-6 text-center text-board-foreground">
      <Trophy aria-hidden="true" className="size-9 text-ball" />
      <p className="text-xs font-semibold uppercase tracking-wide text-board-foreground/80">Campeón</p>
      <h3 className="font-heading text-2xl font-extrabold leading-[0.95]">{champion.name}</h3>
    </div>
  );
}
