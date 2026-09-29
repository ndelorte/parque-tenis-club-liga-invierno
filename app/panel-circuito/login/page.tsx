import type { Metadata } from "next"
import { LoginCard } from "@/components/admin/login-card"

export const metadata: Metadata = { title: "Acceso | Panel" }

export default function PanelCircuitoLoginPage() {
  return <LoginCard panel="circuito" />
}
