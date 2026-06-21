import Link from "next/link";
import { site } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Club info */}
        <div>
          <p className="text-white font-bold text-base mb-2">{site.name}</p>
          <p className="text-sm leading-relaxed">
            Club de tenis en Buenos Aires.
            <br />
            Entrenamientos, torneos, escuela y alquiler de canchas.
          </p>
        </div>

        {/* Links */}
        <div>
          <p className="text-white font-semibold text-sm mb-3">Secciones</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Inicio
              </Link>
            </li>
            <li>
              <Link href="/liga-invierno" className="hover:text-white transition-colors">
                Liga de Invierno
              </Link>
            </li>
            <li>
              <Link href="/#actividades" className="hover:text-white transition-colors">
                Actividades
              </Link>
            </li>
            <li>
              <Link href="/#contacto" className="hover:text-white transition-colors">
                Contacto
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-white font-semibold text-sm mb-3">Contacto</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={`https://wa.me/${site.whatsapp.number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                WhatsApp
              </a>
            </li>
            {site.location.address && (
              <li>
                <a
                  href={site.location.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {site.location.address}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        &copy; {year} {site.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
