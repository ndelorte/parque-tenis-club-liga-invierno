"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { site } from "@/content/site";

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Liga de Invierno", href: "/liga-invierno" },
  { label: "Actividades", href: "/#actividades" },
  { label: "Contacto", href: "/#contacto" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-brand text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-lg tracking-tight hover:text-white/90 transition-colors"
        >
          {site.name}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white/80 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(site.whatsapp.message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent hover:bg-accent-dark text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
          >
            WhatsApp
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded hover:bg-white/10 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/20 bg-brand">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2.5 text-sm font-medium hover:text-white/80 transition-colors border-b border-white/10 last:border-0"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(site.whatsapp.message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 bg-accent text-white text-center py-2.5 rounded-lg text-sm font-semibold"
              onClick={() => setOpen(false)}
            >
              Consultar por WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
