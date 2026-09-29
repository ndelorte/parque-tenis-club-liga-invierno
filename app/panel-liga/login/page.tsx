import type { Metadata } from "next"
import { LoginCard } from "@/components/admin/login-card"

export const metadata: Metadata = { title: "Acceso | Panel" }

export default function PanelLoginPage() {
  return <LoginCard panel="liga" />
}
