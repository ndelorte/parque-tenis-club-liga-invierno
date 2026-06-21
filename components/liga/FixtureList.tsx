import type { Series } from "@/lib/tournament/types";
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

function formatDate(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return "Fecha a confirmar";
  const date = new Date(`${dateStr}T00:00:00`);
  const d = date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return timeStr ? `${d} · ${timeStr}` : d;
}

export function FixtureList({ series, title }: FixtureListProps) {
  if (series.length === 0) {
    return (
      <div>
        {title && <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>}
        <p className="text-gray-500 text-sm">Sin fechas cargadas.</p>
      </div>
    );
  }

  const completed = series.filter((s) => s.status === "completed" || s.status === "walkover");
  const pending = series.filter((s) => s.status !== "completed" && s.status !== "walkover");

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">
            {title ?? "Próximas fechas"}
          </h3>
          <div className="space-y-2">
            {pending.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-border rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">
                    {s.round?.name ?? ""}
                    {s.rescheduled_reason && (
                      <span className="ml-2 text-accent font-medium">
                        · {s.rescheduled_reason}
                      </span>
                    )}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {s.home_team?.name ?? s.home_team_id} vs{" "}
                    {s.away_team?.name ?? s.away_team_id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {formatDate(s.scheduled_date, s.scheduled_time)}
                  </p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
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
          <h3 className="font-semibold text-gray-800 mb-3">Últimos resultados</h3>
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
