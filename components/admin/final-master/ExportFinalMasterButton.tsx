"use client"

import { ExportBracketButton } from "@/components/admin/circuito/ExportBracketButton"
import type { FinalMasterExport } from "@/lib/final-master/exportImage"
import { renderFinalMasterJpeg } from "./exportFinalMasterImage"

interface Props {
  data: FinalMasterExport
  year: number
  categoryName: string
  fileName: string
}

// Botón de exportar el cuadro del Final Master como JPEG para Instagram
// (misma barra que el torneo mensual; el dibujo es el de "Especiales").
export function ExportFinalMasterButton({ data, year, categoryName, fileName }: Props) {
  return (
    <ExportBracketButton
      description="Exportá las zonas, las semifinales y la final como imagen para Instagram. Si hay parejas con compañero a confirmar, salen con “A confirmar”."
      renderImage={(format) => renderFinalMasterJpeg({ data, year, categoryName, format })}
      fileName={fileName}
    />
  )
}
