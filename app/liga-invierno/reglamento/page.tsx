import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reglamento | Liga de Invierno | Parque Tenis Club",
  description: "Formato, puntos, desempates y WO de la Liga de Invierno.",
};

const sections = [
  {
    title: "Formato del torneo",
    content: [
      "6 categorías: Caballeros A, Caballeros B, Damas A, Damas B, Mixto A y Mixto B.",
      "Fase regular: todos contra todos, ida y vuelta.",
      "Cada equipo juega dos veces contra cada rival.",
    ],
  },
  {
    title: "Formato de serie",
    content: [
      "Cada serie es un enfrentamiento entre dos equipos.",
      "Se juegan 3 canchas de dobles.",
      "Gana la serie el equipo que gane 2 de las 3 canchas.",
    ],
  },
  {
    title: "Sistema de puntos",
    content: [
      "Serie ganada: 2 puntos.",
      "Serie perdida: 1 punto.",
      "WO general (equipo ausente): 0 puntos.",
    ],
  },
  {
    title: "Desempates",
    content: [
      "1. Puntos",
      "2. Diferencia de canchas ganadas",
      "3. Diferencia de sets",
      "4. Diferencia de games",
      "5. Enfrentamiento directo (mini-tabla entre equipos empatados)",
    ],
  },
  {
    title: "WO general",
    content: [
      "Ocurre cuando un equipo no se presenta a la serie completa.",
      "El equipo ausente recibe 0 puntos y 3 canchas, 6 sets y 36 games en contra.",
      "El equipo ganador recibe 2 puntos y 3 canchas, 6 sets y 36 games a favor.",
    ],
  },
  {
    title: "WO de cancha individual",
    content: [
      "Ocurre cuando un equipo no presenta pareja para exactamente una cancha.",
      "Esa cancha se registra 6-0 6-0 a favor del equipo que sí se presentó.",
      "La serie continúa normalmente con las otras dos canchas.",
      "No cuenta como WO general.",
    ],
  },
  {
    title: "Playoffs",
    content: [
      "Los playoffs se disputarán al finalizar la fase regular.",
      "El formato y los cruces se anunciarán oportunamente.",
    ],
  },
];

export default function ReglamentoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reglamento</h1>
      <p className="text-gray-500 text-sm mb-8">Liga de Invierno — Parque Tenis Club</p>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="font-semibold text-gray-900 text-base mb-3 pb-2 border-b border-border">
              {section.title}
            </h2>
            <ul className="space-y-2">
              {section.content.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-brand mt-0.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
