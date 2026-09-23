import { describe, it, expect } from "vitest"
import { classifyMainBracketSections, eliminationSections, type DisplayMatch } from "../bracketDisplay"

function m(
  id: string,
  round_number: number,
  a: string | null,
  b: string | null,
  winner: string | null = null,
): DisplayMatch {
  return {
    id,
    round_number,
    participant_a_id: a,
    participant_b_id: b,
    score: winner ? "6-4 6-4" : null,
    winner_id: winner,
    status: winner ? "played" : "pending",
  }
}

describe("classifyMainBracketSections", () => {
  it("N=4 (round_robin_with_final): agrupa las 6 rondas de todos-contra-todos en 'Fase de grupos' y detecta la Final como el par que se repite", () => {
    // 4 participantes: P1..P4, round robin completo (6 partidos) + final (rematch del par ganador)
    const matches: DisplayMatch[] = [
      m("1", 1, "P1", "P2", "P1"),
      m("2", 1, "P3", "P4", "P3"),
      m("3", 2, "P1", "P3", "P1"),
      m("4", 2, "P2", "P4", "P2"),
      m("5", 3, "P1", "P4", "P1"),
      m("6", 3, "P2", "P3", "P2"),
      m("7", 4, "P1", "P3", "P1"), // final: rematch de P1 vs P3
    ]
    const sections = classifyMainBracketSections(matches)
    expect(sections).toHaveLength(2)
    expect(sections[0].label).toBe("Fase de grupos (todos contra todos)")
    expect(sections[0].matches).toHaveLength(6)
    expect(sections[1].label).toBe("Final")
    expect(sections[1].matches).toEqual([matches[6]])
    // Ninguna sección debe llamarse "Cuartos de final" u "Octavos de final"
    for (const s of sections) {
      expect(s.label).not.toMatch(/Cuartos|Octavos|Semifinal/)
    }
  })

  it("N=4 con la revancha en el medio de la secuencia (patrón real observado en Challonge, ej. Cincinnati Open): igual detecta la Final aunque no sea el último partido", () => {
    // Caso real: Challonge no numera las rondas por significado del partido.
    // El par que se repite (Carola vs Gabriela) aparece en la posición 5 de 7,
    // no al final — el clasificador debe encontrarlo igual.
    const matches: DisplayMatch[] = [
      m("1", 1, "Karina", "Gabriela", "Gabriela"),
      m("2", 1, "Carola", "Paola", "Carola"),
      m("3", 1, "Carola", "Gabriela", "Carola"),
      m("4", 2, "Paola", "Karina", "Karina"),
      m("5", 2, "Gabriela", "Carola", "Carola"), // revancha de #3 → esta es la Final
      m("6", 3, "Carola", "Karina", "Carola"),
      m("7", 3, "Gabriela", "Paola", "Gabriela"),
    ]
    const sections = classifyMainBracketSections(matches)
    expect(sections).toHaveLength(2)
    expect(sections[0].matches).toHaveLength(6)
    expect(sections[1].label).toBe("Final")
    expect(sections[1].matches).toEqual([matches[4]])
  })

  it("N=4 sin par repetido identificable: no arriesga a inventar una Final, todo va a Fase de grupos", () => {
    const matches: DisplayMatch[] = [
      m("1", 1, "P1", "P2", "P1"),
      m("2", 1, "P3", "P4", "P3"),
      m("3", 2, "P1", "P3", "P1"),
      m("4", 2, "P2", "P4", "P2"),
      m("5", 3, "P1", "P4", "P1"),
      m("6", 3, "P2", "P3", "P2"),
    ]
    const sections = classifyMainBracketSections(matches)
    expect(sections).toHaveLength(1)
    expect(sections[0].label).toBe("Fase de grupos (todos contra todos)")
    expect(sections[0].matches).toHaveLength(6)
  })

  it("N=5 (round_robin_pure): una sola sección de fase de grupos, sin Final", () => {
    const participants = ["P1", "P2", "P3", "P4", "P5"]
    const matches: DisplayMatch[] = []
    let id = 0
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push(m(String(id++), 1, participants[i], participants[j], participants[i]))
      }
    }
    expect(matches).toHaveLength(10)
    const sections = classifyMainBracketSections(matches)
    expect(sections).toHaveLength(1)
    expect(sections[0].label).toBe("Fase de grupos (todos contra todos)")
    expect(sections[0].matches).toHaveLength(10)
  })

  it("N=6 (groups_then_knockout): reconstruye Zona A / Zona B por componentes conexos + Semifinales + Final", () => {
    // Zona A: P1,P2,P3 · Zona B: P4,P5,P6
    const matches: DisplayMatch[] = [
      m("1", 1, "P1", "P2", "P1"),
      m("2", 1, "P1", "P3", "P1"),
      m("3", 1, "P2", "P3", "P2"),
      m("4", 1, "P4", "P5", "P4"),
      m("5", 1, "P4", "P6", "P4"),
      m("6", 1, "P5", "P6", "P5"),
      m("7", 2, "P1", "P5", "P1"), // semi cruzada
      m("8", 2, "P4", "P2", "P4"), // semi cruzada
      m("9", 3, "P1", "P4", "P1"), // final
    ]
    const sections = classifyMainBracketSections(matches)
    const labels = sections.map((s) => s.label)
    expect(labels).toEqual(["Zona A", "Zona B", "Semifinales", "Final"])
    expect(sections.find((s) => s.label === "Zona A")!.matches).toHaveLength(3)
    expect(sections.find((s) => s.label === "Zona B")!.matches).toHaveLength(3)
    expect(sections.find((s) => s.label === "Semifinales")!.matches).toHaveLength(2)
    expect(sections.find((s) => s.label === "Final")!.matches).toHaveLength(1)
  })

  it("N=8+ (single_elimination): mantiene las etiquetas clásicas de eliminación directa", () => {
    const matches: DisplayMatch[] = [
      m("1", 1, "P1", "P2", "P1"),
      m("2", 1, "P3", "P4", "P3"),
      m("3", 1, "P5", "P6", "P5"),
      m("4", 1, "P7", "P8", "P7"),
      m("5", 2, "P1", "P3", "P1"),
      m("6", 2, "P5", "P7", "P5"),
      m("7", 3, "P1", "P5", "P1"),
    ]
    const sections = classifyMainBracketSections(matches)
    expect(sections.map((s) => s.label)).toEqual(["Cuartos de final", "Semifinal", "Final"])
  })

  it("cuadro vacío devuelve sin secciones", () => {
    expect(classifyMainBracketSections([])).toEqual([])
  })
})

describe("eliminationSections (usado también por RepechajeView)", () => {
  it("etiqueta Semifinal/Final por profundidad de ronda, sin importar cantidad real de jugadores", () => {
    const matches: DisplayMatch[] = [
      m("1", 1, "P1", "P2", "P1"),
      m("2", 1, "P3", "P4", "P3"),
      m("3", 2, "P1", "P3", "P1"),
    ]
    const sections = eliminationSections(matches)
    expect(sections.map((s) => s.label)).toEqual(["Semifinal", "Final"])
  })
})
