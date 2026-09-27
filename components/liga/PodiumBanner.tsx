import { Trophy, Medal, Award } from "lucide-react";

type Place = {
  label: string;
  name: string | null;
  icon: typeof Trophy;
  wrapperClass: string;
  iconClass: string;
};

export function PodiumBanner({
  championName,
  runnerUpName,
  thirdPlaceName,
}: {
  championName: string | null;
  runnerUpName: string | null;
  thirdPlaceName: string | null;
}) {
  const places: Place[] = [
    {
      label: "Campeón",
      name: championName,
      icon: Trophy,
      wrapperClass: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950/50 dark:to-amber-900/30 dark:border-amber-800/60",
      iconClass: "text-amber-500",
    },
    {
      label: "Subcampeón",
      name: runnerUpName,
      icon: Medal,
      wrapperClass: "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 dark:from-slate-800/50 dark:to-slate-700/30 dark:border-slate-600/60",
      iconClass: "text-muted-foreground",
    },
    {
      label: "Tercer puesto",
      name: thirdPlaceName,
      icon: Award,
      wrapperClass: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950/50 dark:to-orange-900/30 dark:border-orange-800/60",
      iconClass: "text-orange-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {places.map(({ label, name, icon: Icon, wrapperClass, iconClass }) => (
        <div key={label} className={`rounded-xl border p-6 text-center ${wrapperClass}`}>
          <Icon className={`mx-auto size-9 ${iconClass}`} aria-hidden="true" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <h3 className="font-heading text-xl font-bold text-foreground">{name ?? "A confirmar"}</h3>
        </div>
      ))}
    </div>
  );
}
