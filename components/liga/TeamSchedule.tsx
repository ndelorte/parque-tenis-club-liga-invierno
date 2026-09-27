import type { Series, Team } from "@/lib/tournament/types";
import { ResultCard } from "./ResultCard";

interface TeamScheduleProps {
  team: Team;
  series: Series[];
}

export function TeamSchedule({ team, series }: TeamScheduleProps) {
  const played = series.filter(
    (s) => s.status === "completed" || s.status === "walkover"
  );
  const upcoming = series.filter(
    (s) => s.status === "scheduled" || s.status === "rescheduled"
  );

  return (
    <div className="space-y-6">
      {played.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3">
            Fechas jugadas ({played.length})
          </h3>
          <div className="space-y-2">
            {played.map((s) => (
              <ResultCard key={s.id} series={s} />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3">
            Fixture pendiente ({upcoming.length})
          </h3>
          <div className="space-y-2">
            {upcoming.map((s) => {
              const isHome = s.home_team_id === team.id;
              const rival = isHome ? s.away_team : s.home_team;
              return (
                <div
                  key={s.id}
                  className="bg-card border border-border rounded-lg px-4 py-3"
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {s.round?.name ?? ""}
                    {s.rescheduled_reason && (
                      <span className="ml-2 text-accent">· {s.rescheduled_reason}</span>
                    )}
                  </p>
                  <p className="font-semibold text-foreground">
                    vs {rival?.name ?? "Por definir"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isHome ? "Local" : "Visitante"} ·{" "}
                    {s.scheduled_date
                      ? new Date(`${s.scheduled_date}T00:00:00`).toLocaleDateString("es-AR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })
                      : "Fecha a confirmar"}
                    {s.scheduled_time && ` · ${s.scheduled_time}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {played.length === 0 && upcoming.length === 0 && (
        <p className="text-muted-foreground text-sm">Sin fechas cargadas para este equipo.</p>
      )}
    </div>
  );
}
