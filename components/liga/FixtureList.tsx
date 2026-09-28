import type { Series } from "@/lib/tournament/types";
import { formatDate } from "@/lib/utils";
import { ResultCard } from "./ResultCard";

interface FixtureListProps {
  series: Series[];
  title?: string;
}

const statusLabel: Record<string, string> = {
  scheduled: "Programado",
  rescheduled: "Reprogramado",
  completed: "Jugado",
  walkover: "WO",
  cancelled: "Cancelado",
  in_progress: "En curso",
};

function dateLabel(dateStr?: string, timeStr?: string): string {
  return formatDate(dateStr ?? "", { month: "short", utc: true, time: timeStr, emptyLabel: "Fecha a confirmar" });
}

export function FixtureList({ series, title }: FixtureListProps) {
  if (series.length === 0) {
    return (
      <div>
        {title && <h3 className="font-semibold text-foreground mb-3">{title}</h3>}
        <p className="text-muted-foreground text-sm">Sin fechas cargadas.</p>
      </div>
    );
  }

  const completed = series.filter((s) => s.status === "completed" || s.status === "walkover");
  const pending = series.filter((s) => s.status !== "completed" && s.status !== "walkover");

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <div>
          <h3 className="mb-3 font-heading text-2xl font-bold text-foreground">
            {title ?? "Próximas fechas"}
          </h3>
          <div className="space-y-2">
            {pending.map((s) => (
              <div
                key={s.id}
                className="flex min-h-16 flex-col gap-2 rounded-md border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">
                    {s.round?.name ?? ""}
                    {s.rescheduled_reason && (
                      <span className="ml-2 text-accent font-medium">
                        · {s.rescheduled_reason}
                      </span>
                    )}
                  </p>
                  <p className="font-heading text-base font-bold text-foreground">
                    {s.home_team?.name ?? s.home_team_id} vs{" "}
                    {s.away_team?.name ?? s.away_team_id}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-muted-foreground">
                    {dateLabel(s.scheduled_date, s.scheduled_time)}
                  </p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {statusLabel[s.status] ?? s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="mb-3 font-heading text-2xl font-bold text-foreground">Últimos resultados</h3>
          <div className="space-y-2">
            {completed.map((s) => (
              <ResultCard key={s.id} series={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
