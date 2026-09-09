// 14 categorías fijas del Circuito del Parque (reglas-circuito-del-parque.md,
// respuesta a OQ-23). Dato puro (sin acceso a Supabase) para que lo puedan
// importar tanto componentes de servidor como de cliente — lib/data/circuito
// arrastra lib/supabase/server (next/headers), que rompe en componentes
// cliente.
export const CIRCUITO_FIXED_CATEGORIES: Array<{ name: string; slug: string; type: "single" | "dobles" }> = [
  { name: "Caballeros Primera", slug: "caballeros-primera-single", type: "single" },
  { name: "Caballeros Intermedia", slug: "caballeros-intermedia-single", type: "single" },
  { name: "Caballeros Segunda", slug: "caballeros-segunda-single", type: "single" },
  { name: "Caballeros Tercera", slug: "caballeros-tercera-single", type: "single" },
  { name: "Caballeros +50", slug: "caballeros-mas50-single", type: "single" },
  { name: "Damas Primera", slug: "damas-primera-single", type: "single" },
  { name: "Damas Segunda", slug: "damas-segunda-single", type: "single" },
  { name: "Caballeros Primera", slug: "caballeros-primera-dobles", type: "dobles" },
  { name: "Caballeros Intermedia", slug: "caballeros-intermedia-dobles", type: "dobles" },
  { name: "Caballeros Segunda", slug: "caballeros-segunda-dobles", type: "dobles" },
  { name: "Damas Primera", slug: "damas-primera-dobles", type: "dobles" },
  { name: "Damas Segunda", slug: "damas-segunda-dobles", type: "dobles" },
  { name: "Mixto Intermedia", slug: "mixto-intermedia-dobles", type: "dobles" },
  { name: "Mixto Segunda", slug: "mixto-segunda-dobles", type: "dobles" },
]
