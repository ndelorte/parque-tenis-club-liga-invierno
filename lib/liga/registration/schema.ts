import { z } from "zod"
import { isValidDni, normalizeDni } from "./normalizeDni"

// Schema compartido entre el formulario público (cliente) y la server action
// (servidor, que revalida todo: nunca se confía en lo que manda el cliente).
// min/max vienen de la configuración de la edición.

export const LIMITS = {
  teamName: 60,
  personName: 50,
  phone: 30,
  notes: 500,
} as const

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Completá ${label}`)
    .max(max, `${label} es demasiado largo (máximo ${max} caracteres)`)

export const BIRTH_DATE_MIN = "1920-01-01"

// "YYYY-MM-DD" de hoy en UTC (el servidor corre en UTC; Argentina va atrás,
// así que nunca rechaza una fecha válida del día).
export function todayIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

// Fecha de nacimiento opcional: vacía es válida; si viene, tiene que ser una
// fecha real entre 1920-01-01 y hoy.
const birthDateSchema = z
  .string()
  .trim()
  .optional()
  .refine((v) => {
    if (!v) return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
    const d = new Date(`${v}T00:00:00Z`)
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return false
    return v >= BIRTH_DATE_MIN && v <= todayIsoDate()
  }, "La fecha de nacimiento no es válida")

export const playerSchema = z.object({
  firstName: requiredText("el nombre", LIMITS.personName),
  lastName: requiredText("el apellido", LIMITS.personName),
  dni: z.string().trim().refine(isValidDni, "El DNI tiene que tener 7 u 8 dígitos"),
  birthDate: birthDateSchema,
})

export type RegistrationPlayerInput = z.infer<typeof playerSchema>

// Campos sueltos, compartidos con la edición desde el panel (ficha del equipo).
export const teamNameSchema = requiredText("el nombre del equipo", LIMITS.teamName)

export const captainPhoneSchema = z
  .string()
  .trim()
  .min(1, "Completá el teléfono del capitán")
  .max(LIMITS.phone, "El teléfono es demasiado largo")
  .regex(/^[0-9+()\-\s]+$/, "Usá solo números, espacios, + y guiones")
  .refine((v) => v.replace(/\D/g, "").length >= 8, "El teléfono tiene que tener al menos 8 dígitos")

export const notesSchema = z.string().trim().max(LIMITS.notes, `Máximo ${LIMITS.notes} caracteres`)

export function buildRegistrationSchema({ min, max }: { min: number; max: number }) {
  return z
    .object({
      teamName: teamNameSchema,
      categoryId: z.string().min(1, "Elegí una categoría"),
      players: z
        .array(playerSchema)
        .min(min, `Cargá al menos ${min} jugadores`)
        .max(max, `Podés cargar hasta ${max} jugadores`),
      captainIndex: z.number().int().min(0, "Marcá quién es el capitán"),
      captainPhone: captainPhoneSchema,
      notes: notesSchema.optional(),
      // Honeypot: un humano no lo ve ni lo completa. Si llega con contenido, es un bot.
      website: z.string().max(200).optional(),
    })
    .superRefine((value, ctx) => {
      if (value.captainIndex >= value.players.length) {
        ctx.addIssue({ code: "custom", path: ["captainIndex"], message: "Marcá quién es el capitán" })
      }
      const seen = new Map<string, number>()
      value.players.forEach((player, index) => {
        if (!isValidDni(player.dni)) return
        const dni = normalizeDni(player.dni)
        if (seen.has(dni)) {
          ctx.addIssue({
            code: "custom",
            path: ["players", index, "dni"],
            message: "Este DNI está repetido en la inscripción",
          })
        } else {
          seen.set(dni, index)
        }
      })
    })
}

export type RegistrationInput = z.infer<ReturnType<typeof buildRegistrationSchema>>
