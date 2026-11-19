// E2E del Final Master. Requiere el server con FINAL_MASTER_YEAR=2099 (ver README, sección Pruebas e2e).
// Los tests son secuenciales y comparten estado en la base (edición final-master-2099).
const YEAR = 2099
const EDITION_SLUG = `final-master-${YEAR}`
const CATEGORY_SLUG = "caballeros-primera-single"
const CATEGORY_NAME = "Single Caballeros Primera"
const PANEL_CATEGORY = `/panel-circuito/final-master/${CATEGORY_SLUG}`
const ALL_PLAYERS = Array.from({ length: 12 }, (_, i) => `Zz E2E ${String(i + 1).padStart(2, "0")}`)
const PLAYERS = ALL_PLAYERS.slice(0, 7)
// Serpentina: 1 A, 2 B, 3 B, 4 A, 5 A, 6 B, 7 B.
const ZONES = ["A", "B", "B", "A", "A", "B", "B"]

const WRONG_SERVER = "El server no corre con FINAL_MASTER_YEAR=2099: abortando para no tocar el Final Master real"

// Cypress no tiene "bail" nativo dentro de un spec (es de Cypress Cloud): cada test chequea esta
// bandera, que afterEach levanta ante el primer fallo, y no sigue si ya falló uno.
let suiteFailed = false

// Verifica que el panel esté sobre la edición de prueba (2099) antes de escribir.
function assertTestEdition() {
  cy.visit("/panel-circuito/final-master")
  cy.contains(`Final Master ${YEAR}`).should("exist")
}

describe("Final Master", () => {
  before(() => {
    // Primero la guarda (sin escribir nada): si el server no corre con el
    // override, aborta antes de tocar la base.
    cy.loginAdmin()
    cy.visit("/panel-circuito/final-master")
    cy.get("body").then(($body) => {
      if (!$body.text().includes(`Final Master ${YEAR}`)) throw new Error(WRONG_SERVER)
    })
    cy.task("cleanupFinalMaster", YEAR)
    cy.task("ensureE2ePlayers", 12)
  })

  after(() => {
    cy.task("cleanupFinalMaster", YEAR)
    cy.task("cleanupE2ePlayers")
  })

  beforeEach(() => {
    // Los window.confirm del panel se aceptan.
    cy.on("window:confirm", () => true)
    cy.then(() => {
      if (suiteFailed) throw new Error("Se omite: falló un test anterior (las pruebas son secuenciales).")
    })
    cy.loginAdmin()
  })

  afterEach(function () {
    if (this.currentTest?.state === "failed") suiteFailed = true
  })

  it("panel: crea la edición borrador con las 10 categorías", () => {
    cy.visit("/panel-circuito/final-master")
    cy.contains("button", `Crear Final Master ${YEAR}`).click()
    cy.contains("Borrador").should("be.visible")
    cy.get('a[href^="/panel-circuito/final-master/"]').should("have.length", 10)
    cy.contains(CATEGORY_NAME).should("be.visible")
  })

  it("público: el borrador está oculto", () => {
    cy.request({ url: `/circuito-del-parque/especiales/${EDITION_SLUG}`, failOnStatusCode: false })
      .its("status")
      .should("eq", 404)
    cy.visit("/circuito-del-parque/final-master")
    cy.location("pathname").should("eq", "/circuito-del-parque/final-master")
  })

  it("carga 7 jugadores con el combobox, en orden de carga y zonas en serpentina", () => {
    assertTestEdition()
    cy.visit(PANEL_CATEGORY)
    PLAYERS.forEach((name, i) => {
      cy.get('input[role="combobox"]').type(name)
      cy.contains('[role="option"]', name).click()
      cy.contains("button", "Agregar").click()
      cy.contains("p", `${i + 1}/8`).should("be.visible")
    })
    cy.get('[data-testid="entries-list"] > li').should("have.length", 7)
    cy.get('[data-testid="entries-list"] > li').each(($li, i) => {
      expect($li.text()).to.contain(PLAYERS[i])
      expect($li.text()).to.contain(`Zona ${ZONES[i]}`)
      expect($li.text()).to.contain("Sin ranking")
    })
  })

  it("dobles: se arman los cuadros con una pareja a confirmar y se completa después sin re-sortear", () => {
    assertTestEdition()
    cy.visit("/panel-circuito/final-master/caballeros-primera-dobles")
    const pick = (selector: string, name: string) => {
      cy.get(selector).type(name)
      cy.contains('[role="option"]', name).click()
    }
    // 5 parejas completas (01/02 ... 09/10) + 1 sin compañero (11).
    const pairs: Array<[number, number | null]> = [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, null]]
    pairs.forEach(([a, b], i) => {
      pick('input[role="combobox"][placeholder^="Jugador/a 1"]', ALL_PLAYERS[a - 1])
      if (b) pick('input[role="combobox"][placeholder^="Jugador/a 2"]', ALL_PLAYERS[b - 1])
      cy.contains("button", "Agregar").click()
      cy.contains("p", `${i + 1}/8`).should("be.visible")
    })
    cy.get('[data-testid="entries-list"] > li').should("have.length", 6)
    cy.get('[data-testid="entries-list"]').contains("A confirmar").should("be.visible")
    cy.contains("Hay parejas con compañero a confirmar").should("be.visible")
    cy.contains("button", "Armar cuadros").should("not.be.disabled").click()

    // Con cuadros armados: bloque de pendientes arriba de las zonas.
    cy.contains("Fase de zonas").should("be.visible")
    cy.get('[data-testid="pending-partners"]').should("be.visible").and("contain", "Zz E2E 11")
    cy.get('[data-testid="pending-partners"] [data-testid="choose-partner"]')
      .click()
      .should("have.attr", "aria-expanded", "true")
    cy.get('[data-testid="pending-partners"] input[role="combobox"]').type("Zz E2E 12")
    cy.contains('[role="option"]', "Zz E2E 12").click()
    cy.get('[data-testid="confirm-partner"]').click()
    cy.get('[data-testid="pending-partners"]').should("not.exist")
    cy.contains("Zz E2E 11 / Zz E2E 12").should("exist")

    // Se deshacen los cuadros y se quitan las parejas: si no, "Publicar torneo" fallaría
    // por esta categoría sin cuadros.
    cy.contains("button", "Deshacer cuadros").click()
    cy.contains("h2", "Inscriptos").should("be.visible")
    for (let left = 6; left > 0; left--) {
      cy.get('[data-testid="entries-list"] > li').first().find('button[aria-label^="Quitar"]').click()
      cy.contains("p", `${left - 1}/8`).should("be.visible")
    }
  })

  it("no se puede publicar sin cuadros armados", () => {
    assertTestEdition()
    cy.visit("/panel-circuito/final-master")
    cy.contains("button", "Publicar torneo").click()
    cy.contains("al menos una categoría con los cuadros armados").should("be.visible")
    cy.contains("button", "Publicar torneo").should("be.visible")
  })

  it("arma los cuadros (zonas de 3 y 4) y carga fecha y hora de un partido", () => {
    assertTestEdition()
    cy.visit(PANEL_CATEGORY)
    cy.contains("button", "Armar cuadros").click()
    cy.contains("Fase de zonas").should("be.visible")
    cy.contains("4 participantes · 0/6 partidos jugados").should("be.visible")
    cy.contains("3 participantes · 0/3 partidos jugados").should("be.visible")
    cy.contains("p", "Semifinales").should("exist")
    cy.contains("p", /^Final$/).should("exist")

    // Primer partido de zona: abrir el formulario (pestaña "Fecha y hora" por defecto).
    cy.get('[data-testid="match-row"]').first().find('[data-testid="match-toggle"]').click()
    cy.get('input[type="date"]').first().type("2099-03-15")
    cy.get('input[type="time"]').first().type("18:30")
    cy.contains("button", "Guardar fecha").click()
    cy.contains("Fecha guardada.").should("be.visible")
  })

  it("publica: la página pública redirige al torneo y muestra categoría y fecha", () => {
    assertTestEdition()
    cy.visit("/panel-circuito/final-master")
    cy.contains("button", "Publicar torneo").click()
    cy.contains("button", "Despublicar").should("be.visible")

    cy.visit("/circuito-del-parque/final-master")
    cy.location("pathname").should("eq", `/circuito-del-parque/especiales/${EDITION_SLUG}`)
    cy.contains(CATEGORY_NAME).should("be.visible")
    cy.contains("2 zonas de jugadores (3 y 4)").should("exist")

    cy.visit(`/circuito-del-parque/especiales/${EDITION_SLUG}/categorias/${CATEGORY_SLUG}`)
    cy.contains("2 zonas de jugadores (3 y 4)").should("exist")
    cy.contains("18:30 h").should("exist")
  })

  it("despublica: vuelve el 404 público", () => {
    assertTestEdition()
    cy.visit("/panel-circuito/final-master")
    cy.contains("button", "Despublicar").click()
    cy.contains("button", "Publicar torneo").should("be.visible")
    cy.request({ url: `/circuito-del-parque/especiales/${EDITION_SLUG}`, failOnStatusCode: false })
      .its("status")
      .should("eq", 404)
  })

  it("deshace los cuadros: vuelve la lista de inscriptos", () => {
    assertTestEdition()
    cy.visit(PANEL_CATEGORY)
    cy.contains("button", "Deshacer cuadros").click()
    cy.contains("h2", "Inscriptos").should("be.visible")
    cy.contains("p", "7/8").should("be.visible")
    cy.get('[data-testid="entries-list"] > li').should("have.length", 7)
  })
})
