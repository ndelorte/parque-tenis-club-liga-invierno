export const site = {
  name: "Parque Tenis Club",
  tagline: "Tenis, pasión y comunidad",
  description:
    "Club de tenis, entrenamientos, torneos, escuela y alquiler de canchas.",
  whatsapp: {
    number: "5491100000000", // OQ-09: completar con número real
    message: "Hola, me gustaría obtener más información sobre Parque Tenis Club.",
  },
  location: {
    address: "Dirección del club, Buenos Aires", // OQ-10: completar
    mapsUrl: "https://maps.google.com", // OQ-10: completar con link real
  },
  social: {
    instagram: "",
    facebook: "",
  },
  seo: {
    home: {
      title: "Parque Tenis Club",
      description:
        "Club de tenis, entrenamientos, torneos, escuela y alquiler de canchas.",
    },
    liga: {
      title: "Liga de Invierno | Parque Tenis Club",
      description:
        "Fixture, resultados, equipos y tabla de posiciones de la Liga de Invierno de Parque Tenis Club.",
    },
  },
};

export type Site = typeof site;
