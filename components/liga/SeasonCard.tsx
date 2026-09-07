import Link from "next/link";
import { ArrowRight, Snowflake, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { seasonHref } from "@/lib/tournament/seasonRoutes";
import type { Tournament } from "@/lib/tournament/types";

const STATUS_LABEL: Record<Tournament["status"], string> = {
  active: "En curso",
  upcoming: "Próximamente",
  finished: "Finalizada",
};

const STATUS_VARIANT: Record<Tournament["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  upcoming: "secondary",
  finished: "outline",
};

export function SeasonCard({ tournament }: { tournament: Tournament }) {
  const Icon = tournament.name.toLowerCase().includes("verano") ? Sun : Snowflake;

  return (
    <Link href={seasonHref(tournament.slug)}>
      <Card
        className={cn(
          "group h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
          tournament.status === "active" && "ring-2 ring-brand"
        )}
      >
        <CardContent className="flex items-center gap-4 p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand">
            <Icon className="size-6" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Temporada {tournament.season}
            </p>
            <h3 className="font-heading text-lg font-bold text-gray-900 group-hover:text-brand transition-colors">
              {tournament.name}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={STATUS_VARIANT[tournament.status]}>
              {STATUS_LABEL[tournament.status]}
            </Badge>
            <ArrowRight className="size-4 text-gray-400 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
