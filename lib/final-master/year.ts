// Año del Final Master que usan el panel y la web pública.
//
// Override solo para pruebas e2e (Cypress): FINAL_MASTER_YEAR=2099 permite
// trabajar con una edición de prueba sin tocar la real. Es server-only (sin
// NEXT_PUBLIC_) y NO hay que setearla en Vercel.
const AR_TIME_ZONE = "America/Argentina/Buenos_Aires"

// Año calendario en Argentina (el servidor de Vercel corre en UTC: el 31/12 a
// la noche en Buenos Aires ya es 1/1 en UTC).
export function getArgentinaYear(now: Date = new Date()): number {
  const year = new Intl.DateTimeFormat("en-CA", { timeZone: AR_TIME_ZONE, year: "numeric" }).format(now)
  return Number(year)
}

export function getFinalMasterYearOverride(): number | null {
  const raw = process.env.FINAL_MASTER_YEAR
  const n = Number(raw)
  return raw && Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : null
}

// Año para crear un Final Master nuevo: el override o el año actual en AR.
export function getFinalMasterYear(now: Date = new Date()): number {
  return getFinalMasterYearOverride() ?? getArgentinaYear(now)
}
