export const CLUB = {
  name: "Parque Tenis Club",
  shortName: "Parque Tenis",
  tagline: "Viví el club",
  phoneDisplay: "+54 9 11 5728-7851",
  whatsapp: "+54 9 11 5728-7851",
  email: "parquetenisclub@gmail.com",
  address: "Primera junta 726, Quilmes, Buenos Aires",
  hours: "Lun a Vier · 8:00 a 23:00 - Sab a Dom · 8:00 a 20:00",
  mapsEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4094.6364414014197!2d-58.24266628780437!3d-34.72724576392108!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95a32e5223b0926f%3A0x468799f47d90418a!2sParque%20Tenis!5e1!3m2!1ses!2sar!4v1782056640642!5m2!1ses!2sar",
} as const

export function waLink(message: string, number?: string) {
  const digits = (number ?? CLUB.whatsapp).replace(/\D/g, "")
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export const NAV_LINKS = [
  { label: "Actividades", href: "/#actividades" },
  { label: "Liga de Invierno", href: "/liga-invierno" },
  { label: "Ubicación", href: "/#ubicacion" },
  { label: "Contacto", href: "/#contacto" },
]

export const ACTIVITIES = [
  {
    id: "alquiler",
    title: "Alquiler de canchas",
    description:
      "Canchas de polvo de ladrillo en excelente estado. Reservá tu horario y vení a jugar con amigos.",
    image: "/images/cancha horizontal.jpeg",
    points: ["Polvo de ladrillo", "Iluminación nocturna", "Vestuarios"],
    waMessage:
      "Hola! Quiero consultar por el alquiler de canchas en Parque Tenis Club.",
  },
  {
    id: "entrenamientos",
    title: "Entrenamientos",
    description:
      "Clases personalizadas para todos los niveles. Mejorá tu técnica con profesores certificados.",
    image: "/images/fondo-entrenamiento.jpeg",
    points: ["Profes certificados", "Grupos reducidos", "Todos los niveles"],
    waMessage:
      "Hola! Quiero info sobre los entrenamientos en Parque Tenis Club.",
  },
  {
    id: "escuela",
    title: "Escuela de tenis",
    description:
      "Formación para chicos y chicas. Aprenden jugando, en un ambiente seguro y divertido.",
    image: "/images/escuelatenis.jpeg",
    points: ["Desde los 5 años", "Profes formadores", "Ambiente seguro"],
    waMessage:
      "Hola! Quiero info sobre la escuela de tenis para chicos en Parque Tenis Club.",
  },
  {
    id: "torneos",
    title: "Torneos y competencia",
    description:
      "Competí todo el año en torneos por categorías. Ranking, premios y mucho tenis.",
    image: "/images/torneosCDP.jpeg",
    imagePosition: "object-[20%]",
    imageAspect: "aspect-[4/5]",
    points: ["Por categorías", "Ranking del club", "Premios"],
    waNumber: "+5491134359489",
    waMessage:
      "Hola! Quiero info sobre los torneos y la competencia en Parque Tenis Club.",
  },
] as const
