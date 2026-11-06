// DNI argentino: 7 u 8 dígitos. Se aceptan puntos, espacios y guiones al
// escribirlo ("12.345.678") y se limpian antes de guardar o comparar.

export function normalizeDni(raw: string): string {
  return raw.replace(/[\s.\-]/g, "")
}

export function isValidDni(raw: string): boolean {
  return /^\d{7,8}$/.test(normalizeDni(raw))
}
