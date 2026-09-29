import { redirect } from "next/navigation"

// Antes era un placeholder; la sección vive en el dashboard.
export default function Page() {
  redirect("/panel-liga?seccion=fixture")
}
