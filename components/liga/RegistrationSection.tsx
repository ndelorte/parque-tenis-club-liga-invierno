import { isRegistrationPreview, PREVIEW_SEASON } from "@/lib/liga/registration/preview"
import { RegistrationForm } from "@/components/liga/RegistrationForm"
import { formatDate } from "@/lib/utils"
import type { RegistrationAvailability } from "@/lib/liga/registration/availability"

// Formulario de inscripción + encabezado. Lo usan la vista de la edición
// (embebido, es el contenido principal) y /[season]/inscripcion (acceso directo).
export function RegistrationSection({
  seasonSlug,
  categories,
  availability,
  headingId = "liga-inscripcion-title",
}: {
  seasonSlug: string
  categories: Array<{ id: string; name: string }>
  availability: RegistrationAvailability
  headingId?: string
}) {
  if (!availability.open) {
    return (
      <section aria-labelledby={headingId} className="liga-registration-closed" role="status">
        <h2 id={headingId} className="liga-registration-closed-title">La inscripción está cerrada</h2>
        <p>Si tenés dudas, escribinos por WhatsApp y te contamos.</p>
      </section>
    )
  }
  return (
    <section aria-labelledby={headingId} className="grid gap-4">
      {isRegistrationPreview() && seasonSlug === PREVIEW_SEASON && (
        <p role="status" className="rounded-lg border border-border bg-card p-4">
          Vista de prueba. Podés completar el formulario para revisarlo; no se envían ni guardan inscripciones.
        </p>
      )}
      <h2 id={headingId}>Inscribí tu equipo</h2>
      <p className="liga-registration-lede">
        Completá los datos del equipo. El organizador revisa cada inscripción y se comunica con el capitán.
        {availability.deadline && (
          <>
            {" "}
            Podés inscribirte hasta el{" "}
            <strong>
              <time dateTime={availability.deadline}>{formatDate(availability.deadline, { weekday: false, year: true, utc: true })}</time>
            </strong>
            .
          </>
        )}
      </p>
      <RegistrationForm seasonSlug={seasonSlug} categories={categories} min={availability.min} max={availability.max} />
    </section>
  )
}
