export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function parseName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { first_name: parts[0], last_name: "" }
  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts[parts.length - 1],
  }
}

export function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith("--")) {
        args[key] = next
        i++
      } else {
        args[key] = true
      }
    }
  }
  return args
}

export function log(msg: string) {
  console.log(msg)
}

export function ok(msg: string) {
  console.log(`  ✓ ${msg}`)
}

export function warn(msg: string) {
  console.warn(`  ⚠ ${msg}`)
}

export function err(msg: string) {
  console.error(`  ✗ ${msg}`)
}
