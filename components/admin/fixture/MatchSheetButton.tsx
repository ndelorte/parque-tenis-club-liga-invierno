"use client"

import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MatchSheetButtonProps {
  seriesId: string
}

export function MatchSheetButton({ seriesId }: MatchSheetButtonProps) {
  function handleClick() {
    window.open(`/api/admin/series/${seriesId}/planilla.pdf`, "_blank")
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="h-9 gap-1.5 text-xs"
      title="Abrir planilla de partido en PDF"
    >
      <FileText className="size-3.5" />
      Ver planilla
    </Button>
  )
}
