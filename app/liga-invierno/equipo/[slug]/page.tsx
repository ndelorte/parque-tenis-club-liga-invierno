import { redirect } from "next/navigation"

export default async function EquipoRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/liga-invierno/equipos/${slug}`)
}
