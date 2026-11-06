import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

// Las server actions escriben con la service role key (bypasea RLS) y son
// endpoints POST invocables desde cualquier ruta — proxy.ts no las protege.
// Cada action exportada tiene que validar el rol admin antes de hacer nada.
// Excepción: los signOut*, que solo cierran la sesión propia.
// Excepción explícita (PUBLIC_ACTIONS): actions pensadas para el público sin
// sesión, que no pueden tener guardia admin. Cada una está en su propio
// archivo y se endurece de otra forma (Zod en el servidor, honeypot, chequeo
// de ventana de inscripción). No agregar acá actions que escriban datos del
// panel.

const ACTIONS_DIR = join(process.cwd(), "app/actions")
const PUBLIC_ACTIONS: Record<string, string[]> = {
  // Inscripción pública a la Liga: formulario sin login.
  "liga-registration-public.ts": ["submitLigaRegistration"],
}
// requireAdminActor() es la misma guardia, pero devuelve el email del admin
// (null si no es admin) para el historial de cambios.
const GUARD_PATTERN = /isRequestFromAdmin\(\)|isAdminUser\(|requireAdminActor\(\)/
// Cuánto del cuerpo de la función se mira: la guardia tiene que estar al
// principio, no enterrada después de una escritura.
const GUARD_WINDOW = 400

function exportedActions(source: string): Array<{ name: string; body: string }> {
  const result: Array<{ name: string; body: string }> = []
  const re = /export async function (\w+)\s*\(/g
  let match: RegExpExecArray | null
  while ((match = re.exec(source))) {
    // El cuerpo abre con ") {" o "> {" (tipo de retorno); así no se confunde
    // con la llave de un parámetro tipado inline como `params: {`.
    const rest = source.slice(match.index)
    const bodyStart = match.index + rest.search(/[)>] \{\n/)
    result.push({ name: match[1], body: source.slice(bodyStart, bodyStart + GUARD_WINDOW) })
  }
  return result
}

describe("server actions admin guard", () => {
  const files = readdirSync(ACTIONS_DIR).filter((f) => f.endsWith(".ts"))

  it.each(files)("%s: toda action exportada valida el rol admin", (file) => {
    const source = readFileSync(join(ACTIONS_DIR, file), "utf-8")
    const unguarded = exportedActions(source)
      .filter((a) => !a.name.startsWith("signOut"))
      .filter((a) => !(PUBLIC_ACTIONS[file] ?? []).includes(a.name))
      .filter((a) => !GUARD_PATTERN.test(a.body))
      .map((a) => a.name)

    expect(unguarded, `Actions sin guardia admin en ${file}: ${unguarded.join(", ")}`).toEqual([])
  })
})
