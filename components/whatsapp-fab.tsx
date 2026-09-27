import { MessageCircle } from "lucide-react"
import { waLink } from "@/lib/site"

export function WhatsappFab() {
  return (
    <a
      href={waLink("Hola! Quiero hacer una consulta sobre Parque Tenis Club.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="press fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-50 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg ring-4 ring-accent/20 [@media(hover:hover)]:hover:brightness-110 sm:hidden"
    >
      <MessageCircle aria-hidden="true" className="size-7" />
    </a>
  )
}
