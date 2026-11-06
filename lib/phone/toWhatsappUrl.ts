// Link de WhatsApp para un teléfono argentino. Solo para el panel (el
// teléfono nunca se muestra en vistas públicas).
//
// Formatos que entiende (todos terminan en wa.me/549 + 10 dígitos):
//   11 5555-1234 · 011 5555 1234 · 011 15 5555-1234 · 15 5555-1234 (sin área: no alcanza)
//   +54 9 11 5555 1234 · 54 11 5555 1234 · 0054 9 11 5555 1234
// Si no se puede armar un número completo, devuelve null.

const NATIONAL_LENGTH = 10 // código de área + abonado, sin 0 ni 15

function stripMobilePrefix15(national: string): string {
  // Con el 15 son 12 dígitos: área (2 a 4) + "15" + abonado. El área de
  // Buenos Aires es 11; el resto tiene 3 o 4 dígitos.
  if (national.length !== NATIONAL_LENGTH + 2) return national
  const areaLengths = national.startsWith("11") ? [2] : [3, 4]
  for (const areaLength of areaLengths) {
    if (national.slice(areaLength, areaLength + 2) === "15") {
      return national.slice(0, areaLength) + national.slice(areaLength + 2)
    }
  }
  return national
}

export function toWhatsappUrl(phone: string | null | undefined): string | null {
  if (!phone) return null
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)

  let national: string
  if (digits.startsWith("54")) {
    national = digits.slice(2)
    // Celular: 54 9 <área><abonado>
    if (national.startsWith("9") && national.length === NATIONAL_LENGTH + 1) national = national.slice(1)
  } else {
    national = digits
  }
  if (national.startsWith("0")) national = national.slice(1)
  national = stripMobilePrefix15(national)

  if (national.length !== NATIONAL_LENGTH) return null
  // Ningún código de área empieza con 0 ni con 15: es un celular sin área.
  if (national.startsWith("15")) return null
  return `https://wa.me/549${national}`
}
