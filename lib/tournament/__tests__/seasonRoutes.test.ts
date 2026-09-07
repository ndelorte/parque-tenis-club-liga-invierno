import { describe, it, expect } from "vitest";
import { seasonHref, categoryHref, teamHref } from "../seasonRoutes";

describe("seasonRoutes", () => {
  it("construye el href de una edición", () => {
    expect(seasonHref("liga-invierno-2026")).toBe("/liga-invierno/liga-invierno-2026");
  });

  it("construye el href de una categoría dentro de la edición", () => {
    expect(categoryHref("liga-invierno-2026", "caballeros-a")).toBe(
      "/liga-invierno/liga-invierno-2026/categorias/caballeros-a"
    );
  });

  it("construye el href de un equipo dentro de la edición y categoría", () => {
    expect(teamHref("liga-invierno-2026", "caballeros-a", "los-halcones")).toBe(
      "/liga-invierno/liga-invierno-2026/equipos/caballeros-a/los-halcones"
    );
  });

  it("el mismo slug de categoría produce hrefs distintos según la temporada", () => {
    const href2025 = categoryHref("liga-invierno-2025", "caballeros-a");
    const href2026 = categoryHref("liga-invierno-2026", "caballeros-a");
    expect(href2025).not.toBe(href2026);
  });
});
