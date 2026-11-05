"use client"

import { useState } from "react"
import { ImageDown, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BracketTree } from "@/lib/circuito/bracketTree"
import { IG_FORMATS, renderBracketJpeg, type IgFormat } from "./exportBracketImage"

interface Props {
  tree: BracketTree
  title: string
  subtitle: string
  championLabel: string
  fileName: string
}

export function ExportBracketButton({ tree, title, subtitle, championLabel, fileName }: Props) {
  const [format, setFormat] = useState<IgFormat>("feed")
  const [busy, setBusy] = useState<"download" | "share" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canShareFiles = typeof navigator !== "undefined" && typeof navigator.canShare === "function"

  const name = `${fileName}-${format}.jpg`

  async function render(): Promise<Blob> {
    return renderBracketJpeg({ tree, title, subtitle, championLabel, format })
  }

  async function download() {
    setBusy("download")
    setError(null)
    try {
      const blob = await render()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError("No se pudo generar la imagen. Probá de nuevo.")
    } finally {
      setBusy(null)
    }
  }

  async function share() {
    setBusy("share")
    setError(null)
    try {
      const blob = await render()
      const file = new File([blob], name, { type: "image/jpeg" })
      if (!navigator.canShare?.({ files: [file] })) {
        setError("Este dispositivo no permite compartir la imagen. Usá Descargar JPG.")
        return
      }
      await navigator.share({ files: [file] })
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setError("No se pudo compartir la imagen. Probá de nuevo.")
      }
    } finally {
      setBusy(null)
    }
  }

  const selectId = `ig-format-${fileName}`

  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Exportá el cuadro como imagen para Instagram.</p>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={selectId} className="sr-only">
            Formato de la imagen
          </label>
          <select
            id={selectId}
            value={format}
            onChange={(e) => setFormat(e.target.value as IgFormat)}
            disabled={busy !== null}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          >
            {(Object.keys(IG_FORMATS) as IgFormat[]).map((k) => (
              <option key={k} value={k}>
                {IG_FORMATS[k].label}
              </option>
            ))}
          </select>
          <Button type="button" size="sm" variant="outline" onClick={() => void download()} disabled={busy !== null}>
            <ImageDown className="size-4" />
            {busy === "download" ? "Generando..." : "Descargar JPG"}
          </Button>
          {canShareFiles && (
            <Button type="button" size="sm" variant="outline" onClick={() => void share()} disabled={busy !== null}>
              <Share2 className="size-4" />
              {busy === "share" ? "Generando..." : "Compartir"}
            </Button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-loss">{error}</p>}
    </div>
  )
}
