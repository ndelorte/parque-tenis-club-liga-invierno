// Nombres de pila frecuentes (sin tildes, en minúsculas) para reconocer cuándo
// un nombre está escrito "Nombre Apellido" y pasarlo a "Apellido Nombre", el
// formato del sitio. Es una ayuda para proponer cambios que se revisan antes
// de aplicarse: no decide nada por sí sola.

const SINGLE = `
adrian adriana agustin agustina alan alberto alejandra alejandro alexis alfredo ali alicia alvaro amalia ana andrea andres angel
ariel armando arturo augusto axel barbara bautista beatriz belen benjamin bernardo bianca bruno camila camilo candela carla carlos
carolina cecilia cesar charly christian claudia claudio constanza cristian cristina cristhian damian daniel daniela dario david
delfina diana diego dolores dominga eduardo elena eliana elias emanuel emilia emiliano enrique enzo ernesto esteban eugenia
ezequiel exequiel fabian fabiana fabricio facundo federico felipe fernanda fernando florencia florencio francisco franco gabriel
gabriela gaston gerardo german gisela gisella gonzalo gregorio guido guillermo gustavo hector hernan horacio hugo ian ignacio
irene iris ivan ivana jacinto javier jeronimo joaquin jorge jose josefina juan julia julian julieta karina karen kevin laura
lautaro leandro leonardo leonel leonidas liliana lionel lisandro lorena lorenzo lourdes lucas lucia luciana luciano lucio luis
luisa macarena magdalena manuel marcela marcelo marcos mariana mariano maria mariela marina mario marta martin martina mateo
matias mauricio maximiliano maximo melina melisa mercedes micaela miguel mijal milagros mirta monica nadia natalia nazareno
nelson nestor nicolas noelia norberto octavio olga omar oscar pablo paola patricia patricio paula pedro priscila rafael ramiro
ramon raul rebeca ricardo roberto rocio rodolfo rodrigo roman romina ronald rosa rosana ruben sabrina samuel santiago santino
sara sebastian sergio silvana silvia silvio simon sofia sol soledad stella tamara tatiana teresa thiago tiago tomas valentin
valentina valeria vanesa vanina vera veronica vicente victor victoria victorio viviana walter william ximena yamila yesica
zoe alejo jonatan joao antonio paulo nora dino dante carola mauro brian ismael alexander rolando
`.split(/\s+/).filter(Boolean)

// Apodos y abreviaturas habituales.
const NICKNAMES = "nacho facu maxi maxy jero leo nico fede santi gonza rodri seba cris mati ale lucho manu dami gabi juancho nahuel".split(" ")

// Nombres compuestos que van juntos ("Juan Cruz", "María Paula").
export const COMPOUND_GIVEN_NAMES = [
  "juan cruz", "juan carlos", "juan manuel", "juan pablo", "juan martin", "juan ignacio", "juan jose", "juan luis", "juan andres",
  "juan francisco", "juan sebastian", "juan bautista", "juan alberto", "jose luis", "jose maria", "jose manuel", "jose antonio",
  "luis alberto", "carlos alberto", "carlos alejandro", "maria jose", "maria eugenia", "maria paula", "maria laura", "maria cecilia",
  "maria julieta", "maria mercedes", "maria victoria", "maria belen", "maria alejandra", "maria fernanda", "maria martha",
  "ana paula", "ana maria", "ana laura", "cristian diego", "nestor daniel", "daniel alberto", "kevin daniel", "walter hugo",
  "pablo daniel", "diego armando", "marcelo daniel", "jorge luis", "jorge alberto", "joao paulo", "antonio paulo",
]

export const GIVEN_NAMES: ReadonlySet<string> = new Set([...SINGLE, ...NICKNAMES])
