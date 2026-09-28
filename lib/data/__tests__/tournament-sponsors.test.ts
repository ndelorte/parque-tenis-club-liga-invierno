import { describe, expect, it } from "vitest"
import { validateSponsorImage } from "@/lib/data/tournament-sponsors"

const png = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]
const jpeg = [255, 216, 255, 224, 0, 0, 0, 0, 0, 0, 0, 0]
const webp = [82, 73, 70, 70, 4, 0, 0, 0, 87, 69, 66, 80]

function file(bytes: number[], type: string): File {
  return new File([new Uint8Array(bytes)], "logo", { type })
}

describe("validación de logos de sponsors", () => {
  it("acepta imágenes con tipo y firma coincidentes", async () => {
    expect(await validateSponsorImage(file(png, "image/png"))).toBeNull()
    expect(await validateSponsorImage(file(jpeg, "image/jpeg"))).toBeNull()
    expect(await validateSponsorImage(file(webp, "image/webp"))).toBeNull()
  })

  it("rechaza tipo declarado que no coincide con los bytes", async () => {
    expect(await validateSponsorImage(file(png, "image/jpeg"))).toMatch(/no coincide/)
    expect(await validateSponsorImage(file([60, 115, 118, 103, 62], "image/png"))).toMatch(/no coincide/)
  })

  it("rechaza SVG y archivos superiores al límite", async () => {
    expect(await validateSponsorImage(file([60, 115, 118, 103, 62], "image/svg+xml"))).toMatch(/PNG/)
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "logo.png", { type: "image/png" })
    expect(await validateSponsorImage(oversized)).toMatch(/5 MB/)
  })
})
