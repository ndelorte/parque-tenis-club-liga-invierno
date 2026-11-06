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

export const playerSchema = z.object({
  firstName: requiredText("el nombre", LIMITS.personName),
  lastName: requiredText("el apellido", LIMITS.personName),
  dni: z.string().trim().refine(isValidDni, "El DNI tiene que tener 7 u 8 dígitos"),
})

export type RegistrationPlayerInput = z.infer<typeof playerSchema>

export function buildRegistrationSchema({ min, max }: { min: number; max: number }) {
  return z
    .object({
      teamName: requiredText("el nombre del equipo", LIMITS.teamName),
      categoryId: z.string().min(1, "Elegí una categoría"),
      players: z
        .array(playerSchema)
        .min(min, `Cargá al menos ${min} jugadores`)
        .max(max, `Podés cargar hasta ${max} jugadores`),
      captainIndex: z.number().int().min(0, "Marcá quién es el capitán"),
      captainPhone: z
        .string()
        .trim()
        .min(1, "Completá el teléfono del capitán")
        .max(LIMITS.phone, "El teléfono es demasiado largo")
        .regex(/^[0-9+()\-\s]+$/, "Usá solo números, espacios, + y guiones")
        .refine((v) => v.replace(/\D/g, "").length >= 8, "El teléfono tiene que tener al menos 8 dígitos"),
      notes: z.string().trim().max(LIMITS.notes, `Máximo ${LIMITS.notes} caracteres`).optional(),
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
