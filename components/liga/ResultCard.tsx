"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Series } from "@/lib/tournament/types";
import { SeriesDetail } from "./SeriesDetail";

interface ResultCardProps {
  series: Series;
}

export function ResultCard({ series }: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const homeWon =
    series.winner_team_id === series.home_team_id ||
    series.walkover_winner_team_id === series.home_team_id;
  const awayWon =
    series.winner_team_id === series.away_team_id ||
    series.walkover_winner_team_id === series.away_team_id;

  const isWalkover = series.status === "walkover" || series.is_general_walkover;

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      <div
        className="px-4 py-3 cursor-pointer hover:bg-surface transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">{series.round?.name ?? ""}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-semibold text-sm truncate ${homeWon ? "text-gray-900" : "text-gray-400"}`}
              >
                {series.home_team?.name ?? series.home_team_id}
              </span>
              <span className="text-xs font-bold text-gray-600 shrink-0">
                {isWalkover
                  ? "WO"
                  : `${series.home_courts_won ?? 0}-${series.away_courts_won ?? 0}`}
              </span>
              <span
                className={`font-semibold text-sm truncate ${awayWon ? "text-gray-900" : "text-gray-400"}`}
              >
                {series.away_team?.name ?? series.away_team_id}
              </span>
            </div>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label={expanded ? "Colapsar detalle" : "Ver detalle de canchas"}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-surface px-4 py-3">
          <SeriesDetail series={series} />
        </div>
      )}
    </div>
  );
}
