import { COMPOUND_GIVEN_NAMES, GIVEN_NAMES } from "./givenNames"
import { nameTokens } from "./similarNames"

export type NameOrderVerdict =
  | { kind: "ok" } // ya está "Apellido Nombre" (o no se puede saber)
  | { kind: "flip"; suggested: string } // está "Nombre Apellido": se propone darlo vuelta
  | { kind: "ambiguous" } // primera y última palabra parecen nombres de pila: revisar a mano
  | { kind: "single" } // una sola palabra

// Cuántas palabras iniciales (>= 1) son el nombre de pila. Reconoce nombres
// compuestos ("juan cruz") y nunca consume todas las palabras.
function leadingGivenCount(tokens: string[]): number {
  let i = 0
  while (i < tokens.length - 1) {
    const pair = `${tokens[i]} ${tokens[i + 1]}`
    if (i + 2 <= tokens.length - 1 && COMPOUND_GIVEN_NAMES.includes(pair)) {
      i += 2
    } else if (GIVEN_NAMES.has(tokens[i])) {
      i += 1
    } else break
  }
  return i
}

// Detecta si un nombre está escrito "Nombre Apellido" y propone el formato del
// sitio, "Apellido Nombre". Conserva mayúsculas y tildes originales.
export function suggestSurnameFirst(displayName: string): NameOrderVerdict {
  const words = displayName.trim().replace(/\s+/g, " ").split(" ")
  if (words.length < 2) return { kind: "single" }

  const norm = words.map((w) => nameTokens(w).join(""))
  const first = norm[0]
  const last = norm[norm.length - 1]
  if (!GIVEN_NAMES.has(first)) return { kind: "ok" }
  if (GIVEN_NAMES.has(last)) return { kind: "ambiguous" }

  const lead = leadingGivenCount(norm)
  if (lead === 0) return { kind: "ok" }
  const suggested = [...words.slice(lead), ...words.slice(0, lead)].join(" ")
  return { kind: "flip", suggested }
}
