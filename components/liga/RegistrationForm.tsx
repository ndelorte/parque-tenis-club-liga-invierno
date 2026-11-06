"use client"

import { useMemo, useState } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitLigaRegistration, type SubmitRegistrationResult } from "@/app/actions/liga-registration-public"
import { BIRTH_DATE_MIN, buildRegistrationSchema, LIMITS, type RegistrationInput } from "@/lib/liga/registration/schema"

interface Props {
  seasonSlug: string
  categories: Array<{ id: string; name: string }>
  min: number
  max: number
  // Carga manual desde el panel: otra action (con guardia admin) y qué hacer
  // al guardar, en vez de la confirmación pública.
  submit?: (values: RegistrationInput) => Promise<SubmitRegistrationResult>
  onSent?: (teamName: string) => void
  buttonClassName?: string
}

const field = "min-h-11 text-base"
const errorText = "mt-1 text-sm font-semibold text-loss"

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className={errorText}>
      {message}
    </p>
  )
}

export function RegistrationForm({ seasonSlug, categories, min, max, submit, onSent, buttonClassName }: Props) {
  const schema = useMemo(() => buildRegistrationSchema({ min, max }), [min, max])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sentTeam, setSentTeam] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      teamName: "",
      categoryId: "",
      players: Array.from({ length: min }, () => ({ firstName: "", lastName: "", dni: "", birthDate: "" })),
      captainIndex: -1,
      captainPhone: "",
      notes: "",
      website: "",
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: "players" })

  async function onSubmit(values: RegistrationInput) {
    setSubmitError(null)
    const result = submit ? await submit(values) : await submitLigaRegistration(seasonSlug, values)
    if (result.success && onSent) {
      reset()
      onSent(result.teamName)
      return
    }
    if (result.success) {
      setSentTeam(result.teamName)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    if (result.fieldErrors) {
      for (const [path, message] of Object.entries(result.fieldErrors)) {
        setError(path as Parameters<typeof setError>[0], { type: "server", message })
      }
    }
    setSubmitError(result.error)
  }

  if (sentTeam) {
    return (
      <div role="status" className="grid gap-3 rounded-lg border-[1.5px] border-border bg-card p-5">
        <CheckCircle2 className="size-8 text-[var(--liga-ink)]" aria-hidden />
        <h2 className="font-heading text-3xl font-extrabold uppercase leading-none">¡Recibimos tu inscripción!</h2>
        <p>
          Recibimos la inscripción de <strong>{sentTeam}</strong>. El organizador la va a revisar y se va a comunicar con el capitán.
        </p>
      </div>
    )
  }

  const playersError = errors.players?.root?.message ?? errors.players?.message

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6">
      {/* Honeypot: invisible para personas y lectores de pantalla. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="reg-website">No completar este campo</label>
        <input id="reg-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="reg-team">Nombre del equipo</Label>
          <Input
            id="reg-team"
            maxLength={LIMITS.teamName}
            autoComplete="off"
            className={field}
            aria-invalid={!!errors.teamName}
            aria-describedby={errors.teamName ? "reg-team-error" : undefined}
            {...register("teamName")}
          />
          <FieldError id="reg-team-error" message={errors.teamName?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="reg-category">Categoría</Label>
          <select
            id="reg-category"
            className="min-h-11 w-full rounded-lg border border-input bg-background px-2.5 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
            aria-invalid={!!errors.categoryId}
            aria-describedby={errors.categoryId ? "reg-category-error" : undefined}
            {...register("categoryId")}
          >
            <option value="">Elegí una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError id="reg-category-error" message={errors.categoryId?.message} />
        </div>
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-1 font-heading text-2xl font-extrabold uppercase">Jugadores</legend>
        <p className="text-sm text-muted-foreground">
          Entre {min} y {max} jugadores. Marcá quién es el capitán. El DNI y la fecha de nacimiento se usan solo para identificar a cada jugador y no se muestran en el sitio.
        </p>

        <ul className="grid gap-4">
          {fields.map((item, index) => {
            const e = errors.players?.[index]
            return (
              <li key={item.id} className="grid gap-3 rounded-lg border-[1.5px] border-border bg-card p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">Jugador {index + 1}</p>
                  {fields.length > min && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-bold text-loss focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      aria-label={`Quitar jugador ${index + 1}`}
                    >
                      <Trash2 className="size-4" aria-hidden /> Quitar
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor={`reg-p${index}-first`}>Nombre</Label>
                    <Input
                      id={`reg-p${index}-first`}
                      autoComplete="off"
                      maxLength={LIMITS.personName}
                      className={field}
                      aria-invalid={!!e?.firstName}
                      aria-describedby={e?.firstName ? `reg-p${index}-first-error` : undefined}
                      {...register(`players.${index}.firstName`)}
                    />
                    <FieldError id={`reg-p${index}-first-error`} message={e?.firstName?.message} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`reg-p${index}-last`}>Apellido</Label>
                    <Input
                      id={`reg-p${index}-last`}
                      autoComplete="off"
                      maxLength={LIMITS.personName}
                      className={field}
                      aria-invalid={!!e?.lastName}
                      aria-describedby={e?.lastName ? `reg-p${index}-last-error` : undefined}
                      {...register(`players.${index}.lastName`)}
                    />
                    <FieldError id={`reg-p${index}-last-error`} message={e?.lastName?.message} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`reg-p${index}-dni`}>DNI</Label>
                    <Input
                      id={`reg-p${index}-dni`}
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={12}
                      className={field}
                      aria-invalid={!!e?.dni}
                      aria-describedby={e?.dni ? `reg-p${index}-dni-error` : undefined}
                      {...register(`players.${index}.dni`)}
                    />
                    <FieldError id={`reg-p${index}-dni-error`} message={e?.dni?.message} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`reg-p${index}-birth`}>Fecha de nacimiento (opcional)</Label>
                    <Input
                      id={`reg-p${index}-birth`}
                      type="date"
                      min={BIRTH_DATE_MIN}
                      max={new Date().toLocaleDateString("en-CA")}
                      autoComplete="off"
                      className={field}
                      aria-invalid={!!e?.birthDate}
                      aria-describedby={e?.birthDate ? `reg-p${index}-birth-error` : undefined}
                      {...register(`players.${index}.birthDate`)}
                    />
                    <FieldError id={`reg-p${index}-birth-error`} message={e?.birthDate?.message} />
                  </div>
                </div>
                <Controller
                  control={control}
                  name="captainIndex"
                  render={({ field: f }) => (
                    <label className="flex min-h-11 items-center gap-3">
                      <input
                        type="radio"
                        name="captain"
                        className="size-5"
                        checked={f.value === index}
                        onChange={() => f.onChange(index)}
                        onBlur={f.onBlur}
                      />
                      <span className="font-semibold">Es el capitán</span>
                    </label>
                  )}
                />
              </li>
            )
          })}
        </ul>
        <FieldError id="reg-captain-error" message={errors.captainIndex?.message} />
        <FieldError id="reg-players-error" message={playersError} />

        {fields.length < max && (
          <button
            type="button"
            onClick={() => append({ firstName: "", lastName: "", dni: "", birthDate: "" })}
            className="inline-flex min-h-11 items-center justify-center gap-2 justify-self-start rounded-md border-[1.5px] border-border bg-background px-4 font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Plus className="size-4" aria-hidden /> Agregar jugador
          </button>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="reg-phone">Teléfono del capitán</Label>
          <Input
            id="reg-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={LIMITS.phone}
            className={field}
            aria-invalid={!!errors.captainPhone}
            aria-describedby={errors.captainPhone ? "reg-phone-error" : "reg-phone-help"}
            {...register("captainPhone")}
          />
          <p id="reg-phone-help" className="text-xs text-muted-foreground">
            Lo usa el organizador para comunicarse. No se publica.
          </p>
          <FieldError id="reg-phone-error" message={errors.captainPhone?.message} />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="reg-notes">Observaciones (opcional)</Label>
          <textarea
            id="reg-notes"
            rows={3}
            maxLength={LIMITS.notes}
            className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
            aria-invalid={!!errors.notes}
            aria-describedby={errors.notes ? "reg-notes-error" : "reg-notes-help"}
            {...register("notes")}
          />
          <p id="reg-notes-help" className="text-xs text-muted-foreground">
            Para cualquier restricción de horario o sugerencia que quieras hacerle al organizador
          </p>
          <FieldError id="reg-notes-error" message={errors.notes?.message} />
        </div>
      </div>

      {submitError && (
        <p role="alert" className="rounded-lg border-l-4 border-loss bg-loss-soft px-4 py-3 font-semibold">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={buttonClassName ?? "liga-solid-link justify-center justify-self-start disabled:opacity-60"}
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Enviar inscripción
      </button>
    </form>
  )
}
