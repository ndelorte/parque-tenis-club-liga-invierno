import Link from "next/link";

const sections = [
  { label: "Equipos", href: "/admin/liga-invierno/equipos", description: "Crear y editar equipos" },
  { label: "Jugadores", href: "/admin/liga-invierno/jugadores", description: "Gestionar lista de buena fe" },
  { label: "Fixture", href: "/admin/liga-invierno/fixture", description: "Cargar y editar fixture" },
  { label: "Resultados", href: "/admin/liga-invierno/resultados", description: "Cargar resultados por cancha" },
  { label: "Reprogramaciones", href: "/admin/liga-invierno/reprogramaciones", description: "Cambiar fechas y horarios" },
];

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">Liga de Invierno 2026</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white border border-border rounded-xl px-5 py-5 hover:border-brand hover:shadow-sm transition-all group"
          >
            <p className="font-semibold text-gray-900 group-hover:text-brand transition-colors mb-1">
              {s.label}
            </p>
            <p className="text-sm text-gray-500">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
