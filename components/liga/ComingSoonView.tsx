import Image from "next/image";
import { Hourglass } from "lucide-react";
import type { Tournament } from "@/lib/tournament/types";

export function ComingSoonView({ tournament }: { tournament: Tournament }) {
  const isVerano = tournament.name.toLowerCase().includes("verano");
  const logoSrc = isVerano ? "/images/logoligaverano.png" : "/images/logoligadeinvierno.png";
  const logoAlt = isVerano ? "Logo Liga de Verano" : "Logo Liga de Invierno";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <Image
        src={logoSrc}
        alt={logoAlt}
        width={128}
        height={128}
        className="size-28 rounded-3xl object-contain shadow-lg ring-4 ring-brand-light sm:size-32"
      />

      <Hourglass
        aria-hidden="true"
        className="mt-8 size-10 text-brand animate-hourglass motion-reduce:animate-none"
      />

      <h1 className="mt-6 font-heading text-2xl font-bold text-gray-900 sm:text-3xl">
        {tournament.name} {tournament.season}
      </h1>
      <p className="mt-2 max-w-md text-gray-600">
        Próximamente. Todavía no arrancó esta edición — volvé más adelante para ver categorías,
        equipos y fixture.
      </p>
    </div>
  );
}
