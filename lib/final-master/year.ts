// Año del Final Master que usan el panel y la web pública.
// Solo para pruebas e2e (Cypress): FINAL_MASTER_YEAR=2099 permite trabajar con
// una edición de prueba sin tocar la real. Es server-only (sin NEXT_PUBLIC_)
// y NO hay que setearla en Vercel.
export function getFinalMasterYear(): number {
  const raw = process.env.FINAL_MASTER_YEAR
  const n = Number(raw)
  if (raw && Number.isInteger(n) && n >= 2000 && n <= 2100) return n
  return new Date().getFullYear()
}
