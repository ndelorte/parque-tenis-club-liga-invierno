declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Login del panel con el admin de prueba (cy.env ADMIN_EMAIL / ADMIN_PASSWORD), cacheado con cy.session. */
      loginAdmin(): Chainable<void>
    }
  }
}

Cypress.Commands.add("loginAdmin", () => {
  // Cypress 16: las variables de cypress.env.json se leen con cy.env().
  cy.env(["ADMIN_EMAIL", "ADMIN_PASSWORD"]).then(({ ADMIN_EMAIL: email, ADMIN_PASSWORD: password }) => {
    if (!email || !password) throw new Error("Faltan ADMIN_EMAIL / ADMIN_PASSWORD en cypress.env.json")
    cy.session(
      ["admin", email],
      () => {
        cy.visit("/panel-circuito/login")
        cy.get('input[type="email"]').type(email)
        cy.get('input[type="password"]').type(password, { log: false })
        cy.get('button[type="submit"]').click()
        cy.location("pathname", { timeout: 20000 }).should("not.include", "/login")
      },
      {
        validate() {
          cy.request({ url: "/panel-circuito/final-master", followRedirect: false }).its("status").should("eq", 200)
        },
      },
    )
  })
})

export {}
