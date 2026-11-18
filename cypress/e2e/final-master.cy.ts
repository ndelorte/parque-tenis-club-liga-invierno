// E2E del Final Master. Requiere el server con FINAL_MASTER_YEAR=2099 (ver README, sección Pruebas e2e).
// Los tests son secuenciales y comparten estado en la base (edición final-master-2099).
const YEAR = 2099
const EDITION_SLUG = `final-master-${YEAR}`
const CATEGORY_SLUG = "caballeros-primera-single"
const CATEGORY_NAME = "Single Caballeros Primera"
const PANEL_CATEGORY = `/panel-circuito/final-master/${CATEGORY_SLUG}`
const PLAYERS = Array.from({ length: 7 }, (_, i) => `Zz E2E ${String(i + 1).padStart(2, "0")}`)
// Serpentina: 1 A, 2 B, 3 B, 4 A, 5 A, 6 B, 7 B.
const ZONES = ["A", "B", "B", "A", "A", "B", "B"]

describe("Final Master", () => {
  before(() => {
    cy.task("cleanupFinalMaster", YEAR)
    cy.task("ensureE2ePlayers", 8)
  })

  after(() => {
    cy.task("cleanupFinalMaster", YEAR)
    cy.task("cleanupE2ePlayers")
  })

  beforeEach(() => {
    // Los window.confirm del panel se aceptan.
    cy.on("window:confirm", () => true)
    cy.loginAdmin()
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
    cy.visit(PANEL_CATEGORY)
    PLAYERS.forEach((name, i) => {
      cy.get('input[role="combobox"]').type(name)
      cy.contains('[role="option"]', name).click()
      cy.contains("button", "Agregar").click()
      cy.contains("p", `${i + 1}/8`).should("be.visible")
    })
    cy.get("ol > li").should("have.length", 7)
    cy.get("ol > li").each(($li, i) => {
      expect($li.text()).to.contain(PLAYERS[i])
      expect($li.text()).to.contain(`Zona ${ZONES[i]}`)
      expect($li.text()).to.contain("Sin ranking")
    })
  })

  it("no se puede publicar sin cuadros armados", () => {
    cy.visit("/panel-circuito/final-master")
    cy.contains("button", "Publicar torneo").click()
    cy.contains("al menos una categoría con los cuadros armados").should("be.visible")
    cy.contains("button", "Publicar torneo").should("be.visible")
  })

  it("arma los cuadros (zonas de 4 y 3) y carga fecha y hora de un partido", () => {
    cy.visit(PANEL_CATEGORY)
    cy.contains("button", "Armar cuadros").click()
    cy.contains("Fase de zonas").should("be.visible")
    cy.contains("4 participantes · 0/6 partidos jugados").should("be.visible")
    cy.contains("3 participantes · 0/3 partidos jugados").should("be.visible")
    cy.contains("h3", "Semifinales").should("exist")
    cy.contains("Final").should("exist")

    // Primer partido de zona: abrir el formulario (pestaña "Fecha y hora" por defecto).
    cy.contains("span", "vs").first().closest("div.border-b").within(() => {
      cy.get("button").last().click()
    })
    cy.get('input[type="date"]').first().type("2099-03-15")
    cy.get('input[type="time"]').first().type("18:30")
    cy.contains("button", "Guardar fecha").click()
    cy.contains("Fecha guardada.").should("be.visible")
  })

  it("publica: la página pública redirige al torneo y muestra categoría y fecha", () => {
    cy.visit("/panel-circuito/final-master")
    cy.contains("button", "Publicar torneo").click()
    cy.contains("button", "Despublicar").should("be.visible")

    cy.visit("/circuito-del-parque/final-master")
    cy.location("pathname").should("eq", `/circuito-del-parque/especiales/${EDITION_SLUG}`)
    cy.contains(CATEGORY_NAME).should("be.visible")
    cy.contains("2 zonas de jugadores (4 y 3)").should("exist")

    cy.visit(`/circuito-del-parque/especiales/${EDITION_SLUG}/categorias/${CATEGORY_SLUG}`)
    cy.contains("2 zonas de jugadores (4 y 3)").should("exist")
    cy.contains("18:30 h").should("exist")
  })

  it("despublica: vuelve el 404 público", () => {
    cy.visit("/panel-circuito/final-master")
    cy.contains("button", "Despublicar").click()
    cy.contains("button", "Publicar torneo").should("be.visible")
    cy.request({ url: `/circuito-del-parque/especiales/${EDITION_SLUG}`, failOnStatusCode: false })
      .its("status")
      .should("eq", 404)
  })

  it("deshace los cuadros: vuelve la lista de inscriptos", () => {
    cy.visit(PANEL_CATEGORY)
    cy.contains("button", "Deshacer cuadros").click()
    cy.contains("h2", "Inscriptos").should("be.visible")
    cy.contains("p", "7/8").should("be.visible")
    cy.get("ol > li").should("have.length", 7)
  })
})
