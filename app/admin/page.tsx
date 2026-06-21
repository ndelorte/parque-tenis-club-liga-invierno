import type { Metadata } from "next"
import Link from "next/link"
import { Snowflake, ArrowLeft, ClipboardList, Trophy, Users, CalendarClock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ResultLoader } from "@/components/admin/result-loader"
import { TeamManager } from "@/components/admin/team-manager"
import { FixtureManager } from "@/components/admin/fixture-manager"

export const metadata: Metadata = {
  title: "Panel de carga | Liga de Invierno",
  description:
    "Dashboard interno para cargar resultados de la Liga de Invierno de Parque Tenis Club.",
}

export default function AdminPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
            <ClipboardList className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-bold leading-tight">
              Panel de carga
            </p>
            <p className="flex items-center gap-1 text-xs text-primary-foreground/70">
              <Snowflake className="size-3 text-winter" />
              Liga de Invierno
            </p>
          </div>
          <Badge className="ml-auto bg-accent text-accent-foreground hover:bg-accent">
            Admin
          </Badge>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="hidden bg-primary-foreground text-primary hover:bg-primary-foreground/90 sm:inline-flex"
          >
            <Link href="/liga-invierno">
              <ArrowLeft className="size-4" />
              Ver liga
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Gestión de la liga
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cargá resultados, administrá los planteles de cada equipo y reprogramá las fechas del fixture.
          </p>
        </div>

        <Tabs defaultValue="resultados">
          <TabsList className="h-auto w-full flex-wrap gap-1 bg-muted p-1 sm:w-auto">
            <TabsTrigger value="resultados" className="h-9 gap-1.5 px-3">
              <Trophy className="size-4" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="jugadores" className="h-9 gap-1.5 px-3">
              <Users className="size-4" />
              Jugadores
            </TabsTrigger>
            <TabsTrigger value="fixture" className="h-9 gap-1.5 px-3">
              <CalendarClock className="size-4" />
              Fixture
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resultados" className="mt-5">
            <ResultLoader />
          </TabsContent>
          <TabsContent value="jugadores" className="mt-5">
            <TeamManager />
          </TabsContent>
          <TabsContent value="fixture" className="mt-5">
            <FixtureManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
