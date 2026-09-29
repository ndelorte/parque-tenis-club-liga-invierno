# Plan — Refactor visual del sitio

> **Estado:** Aprobado para arrancar (2026-09-27). Las decisiones de diseño concretas se cierran fase por fase con maquetas.
> **Ramas:** todo el refactor se integra en la rama `refactor-visual` (sale de `main`). Cada fase va en un sub-PR contra `refactor-visual` (la Fase 1 en dos); cuando están todas, un único PR `refactor-visual` → `main` lo lleva a producción.
> Antecedente: sección "Refactor visual del sitio" de `backlog.md` (pendientes relevados el 2026-09-08/09).

---

## 0. Decisiones tomadas (2026-09-27)

| Tema | Decisión |
|---|---|
| Cómo se aprueba el diseño | **Maqueta HTML primero.** Por cada fase: maqueta navegable con 2–3 variantes → el humano elige → recién ahí se programa. |
| Identidad | **Base común Parque Tenis Club + sub-identidades por sección** (Liga Invierno, Liga Verano, Circuito, Especiales/Mid Master, Interparque). Charlable en la maqueta de la Fase 1. |
| Home | Se diseña **y se programa en la Fase 1**, junto con la base: define la identidad que respetan las demás secciones. |
| Modo oscuro | **Sí.** Sigue al sistema y hay un botón en el header. Aplica al sitio público. Mid Master (y Final Master) son oscuras siempre. Los paneles quedan en claro. |
| Animaciones | **Sutiles, CSS primero** (criterio de Emil Kowalski): Motion solo para layout, salidas y springs. Un solo momento orquestado por página, nada de revelar secciones al scrollear en pantallas de uso diario, celebración reservada al campeón. Siempre respetando "reducir movimiento" (§3.5). |
| Dirección de la home | **A "Marcador"**, en su versión refinada tras revisarla con las skills frontend-design, UI UX Pro Max y las de Emil Kowalski, y auditarla con web-design-guidelines (2026-09-27). Pendiente la aprobación final del humano. |
| Invierno vs verano | La estación se **deriva del slug** de la edición en un helper de presentación (`liga-invierno-AAAA` / `liga-verano-AAAA-AAAA`). No se toca la base ni `lib/`. |
| Paleta de la Liga | **Base verde/naranja de los logos LI/LV + un acento por estación**: invierno azul hielo + nieve; verano amarillo sol + luz/calor. |
| Fotos | El humano **consigue fotos nuevas** (lista en §7). El diseño las aprovecha (carrusel, galerías). |
| Fuera de alcance | **Solo los logos** (PTC, LI, LV, CDP) no se modifican. Todo lo demás (textos, estructura de la home, paneles) puede cambiar si la maqueta lo justifica. |

---

## 1. Objetivo y alcance

### Qué problema resuelve

- **No se ve como un sitio unificado y profesional.** Hoy conviven cuatro estéticas armadas por separado (§2).
- **Parece "diseñado con IA".** Componentes genéricos de shadcn con grises por defecto, cards iguales, sin lenguaje visual propio del club ni del tenis.
- **Falta una identidad madre.** Cada sección puede tener la suya, pero todas tienen que encajar en la de Parque Tenis Club, que se define en la home.
- **Le falta vida.** No hay transiciones ni momentos visuales (el campeón no se destaca, las tablas aparecen de golpe).
- **La Liga se diseñó solo para invierno.** Ahora la sección tiene invierno y verano, y cada una necesita referencias a su estación sin dejar de parecer la misma liga. Hoy una edición de verano activa se vería con nieve y logo de invierno (§2, hallazgo crítico).
- *(Se suman más problemas en el ida y vuelta de cada maqueta.)*

### Para quién

1. **Socios y jugadores** que consultan resultados, tablas, cuadros y ranking — **mayormente desde el celular**.
2. **Gente nueva** que llega a la home (conocer el club, contactar por WhatsApp).
3. **Organizadores** usando los paneles admin (prioridad baja en este refactor).

### Cómo sabemos que terminó

La validación estética es **del humano**, no del agente. Cada fase termina cuando:

1. El humano aprobó la maqueta y después aprobó la implementación en el navegador.
2. Se cumplen los chequeos objetivos de §6 (celular de 375 px, modo claro/oscuro, contraste, movimiento reducido, lint/build/tests).

### Fuera de alcance

- **Los logos** (PTC, LI, LV, CDP): se usan los PNG tal cual; no se redibujan, recolorean ni vectorizan.
- **Cambios funcionales**: ni reglas deportivas, ni cálculos, ni datos (§5).

---

## 2. Relevamiento de lo que hay hoy

Estado al 2026-09-27, después de mergear el PR #5. Relevado leyendo el código.

### Stack visual

| Pieza | Estado |
|---|---|
| Next.js / React | 16.2.9 / 19.2.4 |
| Tailwind | **v4**, sin `tailwind.config.*`: toda la configuración vive en `@theme` dentro de `app/globals.css` |
| shadcn/ui | `style: default`, `baseColor: zinc`. Instalados: badge, button, card, checkbox, input, label, select, separator, table, tabs |
| Iconos | `lucide-react` |
| Animación | **Ninguna librería.** Solo `@keyframes` en CSS + un `IntersectionObserver` a mano (`MmReveal`) |
| Modo oscuro | **No hay infraestructura** (ni `next-themes`, ni clase `.dark`, ni tokens oscuros). Las clases `dark:` de `ui/input`, `ui/select` y `ui/checkbox` son restos de shadcn y no hacen nada |
| Fuentes | Geist (texto y títulos) y Playfair Display (solo Mid Master), ambas en `app/layout.tsx` |
| Tests de UI | **No hay.** Vitest corre en `environment: node` y los ~26 tests son de lógica pura. Un refactor visual que no toque `lib/` no rompe tests |

### Identidades visuales que conviven hoy

| Identidad | Dónde se usa | Tokens (`app/globals.css`) |
|---|---|---|
| General verde + naranja | Home, Circuito, Interparque, Liga | `brand` #2d8653, `accent` #f47c2b, grises neutros |
| Invierno (azul) | Liga (encabezado de la edición activa) | `winter` #4d90c4 + `decorations/snowfall.tsx`. **No hay token de verano** |
| Mid Master (negro + dorado) | `/circuito-del-parque/especiales/*` | `mm-*` (fondo #0d0f0d, dorado #c9a84c), serif Playfair |
| Interparque (flyers) | `/interparque` | tokens generales + estética de los flyers (ADR-006) |

Los colores de los logos **no coinciden** con los tokens: el anillo del logo PTC es un verde más oliva (~#4e7a3d) que `brand` #2d8653, y los logos LI/LV no tienen nada de azul.

### Hallazgos que cambian el alcance

1. **La Liga no distingue invierno de verano.** `Tournament.season` es el año (número). `LigaHeader` (`components/liga/liga-header.tsx`) está fijo en invierno: título "Temporada de invierno", logo LI, `<Snowfall />` y fondo `bg-winter` sin condición. Las ediciones finalizadas usan `TournamentHeader`, que es genérico. La única distinción hoy es `name.includes("verano")` en `SeasonCard.tsx` y en `lib/tournament/formatTournamentTitle.ts`.
2. **El cuadro del Circuito es una lista vertical por ronda** (`circuito/BracketView` + `lib/circuito/bracketDisplay.ts`): no hay árbol ni columnas, y **no se destaca al campeón**.
3. **`mid-master/KnockoutBracket` es horizontal pero de tamaño fijo** (semis + final). `liga/PlayoffBracket` es una lista vertical con colores `amber-*` fijos.
4. **Colores fijos fuera de los tokens**: `liga/StandingsTable`, `liga/ResultCard`, `liga/PlayoffBracket`, `liga/CategoryTabs`, `liga/SeasonCard` (`text-gray-*`, `bg-white`, `text-green-600`, `text-red-500`, `amber-*`). `MidMasterHero` tiene un `radial-gradient` con `rgba` en `style`. Todo eso se rompe con el modo oscuro.
5. **Los layouts de sección están triplicados**: `ligas-invierno-verano`, `circuito-del-parque` e `interparque` tienen el mismo `layout.tsx` (header + footer). Los tres layouts de panel están vacíos y cada página arma su propio header.
6. **Los assets necesitan limpieza**: `fondo3.jpeg` es en realidad un PNG de 2151×2478; hay archivos con espacios en el nombre (`cancha horizontal.jpeg`, `torneos y competencia.jpeg`, `REGLAMENTO LIGA DE VERANO_INVIERNO.docx.pdf`); los sponsors de Mid Master no siguen el patrón `-clean.png`; `public/images/mid-master/` está vacía.

### Assets disponibles

| Archivo | Qué es |
|---|---|
| `images/LOGO.png` (1890²) | Logo PTC: anillo verde "PARQUE TENIS CLUB · QUILMES", círculo naranja tipo cancha, monograma PTC blanco |
| `images/logoligadeinvierno.png` (1080²) | "LI": pierna naranja + pierna verde, mini cancha al centro |
| `images/logoligaverano.png` (1080²) | "VL": V verde, L naranja (misma paleta que LI) |
| `images/logopngcdp.png` (1080²) | Circuito del Parque: cancha de polvo naranja en perspectiva, bordes y letras "CDP" negras |
| `images/fondo3.jpeg`, `fondo-liga.jpeg` (1600×900), `fondo-entrenamiento.jpeg`, `cancha horizontal.jpeg` (1280×720), `escuelatenis.jpeg`, `torneos y competencia.jpeg`, `torneosCDP.jpeg` (720×450) | Fotos de fondo; varias de baja resolución para usarse a pantalla completa |
| `images/sponsors/*`, `images/sponsorsMM/*` | Logos de sponsors |

### Pantallas públicas

| Área | Ruta | Componentes principales | Qué se busca |
|---|---|---|---|
| Home | `/` | `site-header`, `hero`, `activities`, `winter-league`, `CircuitoPromo`, `InterparquePromo`, `location-contact`, `site-footer`, `whatsapp-fab` | Donde las identidades de cada sección se apaciguan dentro de la estética del home. **Decisión importantísima**, basada en el logo PTC, sus colores y las fotos del club. |
| Liga — selector | `/ligas-invierno-verano` | `SeasonSelector`, `SeasonCards` | Identidad Liga; invierno y verano conviven con referencias a su estación. Colores de los logos LI/LV. |
| Liga — edición | `/ligas-invierno-verano/[season]` | `LigaHeader`, `TournamentHeader`, `CategoryTabs`, `liga-board`, `ClosedSeasonView`, `ComingSoonView`, `ChampionBanner`, `PodiumBanner`, `sponsors-banner` | Cada edición bien marcada como invierno o verano, en los tres estados (activa, cerrada, próxima). |
| Liga — categoría | `.../[season]/categorias/[slug]` | `StandingsTable`, `FixtureList`, `ResultCard`, `SeriesDetail`, `CourtMatchDetail`, `PlayoffBracket`, `TeamCard`, `PhotoGallery` | Todas las categorías iguales. |
| Liga — equipo | `.../[season]/equipos/[catSlug]/[teamSlug]` | `team-detail`, `TeamSchedule` | Todos los equipos iguales. |
| Liga — reglamento | `/ligas-invierno-verano/reglamento` | `liga-reglamento` | Apariencia firme y clara. |
| Circuito — landing | `/circuito-del-parque` | `EditionCard` | Estética del logo CDP: cancha naranja, bordes y letras negras. **Formal y seria** (es una competencia), con referencias a la competencia. |
| Circuito — torneo | `/circuito-del-parque/torneos/[edition]` | lista de categorías | Diferenciar single y dobles dentro de la estética del Circuito. |
| Circuito — categoría | `.../torneos/[edition]/[categoria]` | `BracketView`, `RepechajeView` | **Cuadro horizontal** (§4.5) con referencias visuales del Circuito; campeón destacado. |
| Circuito — ranking | `/circuito-del-parque/ranking` | `CategoryFilterPills`, `RankingByTournamentTable` | Tabla por torneo (scroll horizontal, primera columna fija). |
| Circuito — Final Master | `/circuito-del-parque/final-master` | `CategoryFilterPills`, `RankingTable` | **Estética parecida a Mid Master** → se hace en la Fase 4 junto con los especiales. |
| Mid Master — edición | `/circuito-del-parque/especiales/[edition]` | `MidMasterHero`, `CategoryGrid`, `MmReveal`, `MmSponsorsBanner` | Identidad propia negro + dorado. |
| Mid Master — categoría | `.../especiales/[edition]/categorias/[slug]` | `ZoneSection`, `ZoneStandingsTable`, `ZoneFixture`, `KnockoutBracket`, `MatchCard` | Mantiene la identidad propia. |
| Interparque | `/interparque` | `interparque/StandingsTable`, `interparque/MatchesList` | Diseño de arranque; se mejora con propuestas al humano. |

Las rutas viejas sin `[season]` y `/mid-master/*` son redirects: no entran en el refactor.

### Paneles admin (no enlazados públicamente)

Nota general: que se vean más agradables y menos "rústicos de IA", pero **no es la prioridad**.

| Panel | Rutas | Componentes principales |
|---|---|---|
| Liga | `/panel-liga` (+ equipos, jugadores, fixture, resultados, reprogramaciones) | `team-manager`, `fixture-manager`, `result-loader`, `playoff-manager`, `photo-manager`, `close-tournament-button` |
| Circuito | `/panel-circuito/mensual/*` | `CreateEditionForm`, `ParticipantsPanel`, `PlayerCombobox`, `circuito/MatchesList` |
| Mid Master | `/panel-circuito`, `/panel-circuito/categorias/[slug]` | `mid-master/ZoneAdmin`, `KnockoutAdmin`, `MatchForm` |
| Interparque | `/panel-interparque` | `interparque/MatchForm`, `NewMatchForm`, `PlayerSelect` |
| Logins | `/panel-*/login` | — |

### Código muerto a borrar

- `components/layout/Footer.tsx` y `components/layout/Navbar.tsx`: nadie los importa.
- `content/site.ts`: solo aporta el título y la descripción SEO en `app/layout.tsx`, con datos de ejemplo viejos → pasar el SEO a `lib/site.ts` y borrar el archivo.
- `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`: ejemplos de create-next-app.
- `--animate-bob` y `hourglass-flip` (`globals.css`): se usan en `ComingSoonView` y en `final-master/page.tsx`. **No son código muerto**; se reemplazan cuando se rediseñen esas pantallas.
- `MmReveal` y `.mm-reveal-target` se reemplazan por el `Reveal` genérico de la Fase 1A.

---

## 3. Sistema visual

Lo que sigue es la **arquitectura** y un **punto de partida** para las maquetas. Los valores finales (hex, fuentes) los elige el humano en la maqueta de la Fase 1.

### 3.1 Referencias

| Referencia | Qué tomar |
|---|---|
| elpradotenisclub.com.ar | Lo moderno: hero de foto a pantalla completa con overlay oscuro y titular grande en mayúsculas, WhatsApp como CTA repetido, galería y sponsors como bloques propios. |
| cordobalawntenis.com.ar | Casi todo. **Paleta sobria** (blanco, negro y un solo color de marca, el dorado) con mucho aire; titulares en mayúsculas sostenidas; **escudos/íconos propios por área** (competición, social, verano, profesorado) en vez de íconos genéricos; carruseles de fotos cuadradas con foto + nombre + logro; **línea de tiempo** con hitos; navegación con anclas dentro de cada página; fotos de acción y aéreas que muestran la escala del club; footer con panel fotográfico. |
| Por buscar | Diseños nuevos y recursos que hagan más fresca la experiencia: se juntan en la maqueta de la Fase 1 (ej. marcadores tipo scoreboard para resultados, cuadros de torneos de tenis profesionales como referencia para el cuadro horizontal). |

Qué **tomar de Córdoba Lawn** para cada sección (propuestas para las maquetas):

- **Home**: hero de foto aérea o de acción + titular corto; bloque "el club en números" (canchas, socios, años); una tarjeta por actividad con su logo como "escudo" (Liga, Circuito, Interparque, Escuela), igual que sus escuelas.
- **Liga / Circuito**: línea de tiempo de ediciones (campeones por año), como su "Sin Límites".
- **Galerías**: carrusel de fotos cuadradas con nombre + logro para campeones y podios.

**Anti-patrones "hecho con IA"** (chequear en cada maqueta):

- Degradés violeta/azul, glassmorphism en todos lados, brillos, emojis como íconos.
- Grillas de cards idénticas con ícono + título + párrafo ("bento" genérico).
- Todo centrado, todo `rounded-2xl` con sombra suave, grises `zinc` por defecto.
- Titulares vacíos ("Vive la experiencia…"). Los textos se dicen como los diría el club.
- Señales que marca la skill `frontend-design`: fondo crema cerca de #F4F1EA con acento terracota; etiquetas en MAYÚSCULAS espaciadas sobre cada título; textos unidos con "·"; flechas "→" al final de links y botones; una sola palabra del título en otro color; numeración 01/02/03 si el contenido no es una secuencia; animación de entrada en cada sección.
- **Audacia en un solo lugar**: cada pantalla tiene un elemento memorable (en la home, el tablero del hero) y el resto queda sobrio.

**Lenguaje visual propio** (lo que reemplaza lo genérico): líneas de cancha como estructura (divisores, marcos, encabezados de tabla), textura/color de polvo de ladrillo, el amarillo de la pelota como detalle mínimo, números con aspecto de marcador (anchos fijos, tabulares), fotos reales del club.

### 3.2 Arquitectura de color (tokens)

**Tres capas** en `app/globals.css`:

1. **Primitivos** (paleta cruda del club, sacada de los logos): verdes, naranjas/polvo de ladrillo, neutros cálidos, azul hielo, amarillo sol, negro/dorado.
2. **Semánticos** (lo que usan los componentes): `background`, `surface`, `foreground`, `muted`, `border`, `primary`, `accent`, `ring`, más los **estados de resultado**: `win` (verde), `loss` (rojo), `pending` (amarillo), `walkover` (gris/neutro). Tienen valor en claro y en oscuro.
3. **De sección** (`--section-*`): cada sub-identidad los pisa dentro de su contenedor. Los componentes compartidos usan `bg-section`, `text-section-accent`, etc., y toman el color de la sección donde estén sin recibir props.

Implementación con Tailwind v4:

```css
@custom-variant dark (&:where(.dark, .dark *));

:root { --background: …; --win: …; --section: var(--primary); --section-accent: var(--accent); }
.dark { --background: …; … }

[data-identity="liga-invierno"] { --section: …; --section-accent: <azul hielo>; }
[data-identity="liga-verano"]   { --section: …; --section-accent: <amarillo sol>; }
[data-identity="circuito"]      { --section: <polvo de ladrillo>; --section-accent: <negro>; }
[data-identity="especiales"]    { /* negro + dorado, siempre oscuro */ }
[data-identity="interparque"]   { … }

@theme inline { --color-background: var(--background); --color-section: var(--section); … }
```

- El atributo `data-identity` lo pone el `layout.tsx` de cada sección, así que ninguna página lo repite. La Liga lo decide por edición con el helper de estación (§4, Fase 3).
- Los tokens `mm-*` se migran a `[data-identity="especiales"]` en la Fase 4. Hasta entonces conviven sin cambios.
- `winter` se reemplaza por `liga-invierno`.
- **Dos tonos de acento**: `accent` (el naranja del logo, para franjas y decoración) y `accent-strong` (más oscuro, para botones con texto blanco y links). El naranja del logo con texto blanco da 3,4–3,8 de contraste y no llega a AA (auditoría de la maqueta F1).
- **Regla de la fase**: un componente tocado no puede quedar con `gray-*`, `white`, `amber-*`, hex ni `rgba` sueltos. Se verifica con un grep en el checklist (§6).

Punto de partida para la maqueta (a ajustar):

| Rol | Valor actual | Dirección propuesta |
|---|---|---|
| Principal | `brand` #2d8653 | **Tablero** #1C3A2A (verde de tablero de tenis) + verde del logo #4E7A3D, con escala 50–950 |
| Acento | `accent` #f47c2b | **Polvo** #D4622A para franjas; **polvo fuerte** #AF5122 para botones y links (contraste AA); **pelota** #D4E04A solo como punto de saque |
| Fondo | #ffffff / `surface` #f9fafb | **Cal** #F4F6F2 (blanco levemente verdoso, como las líneas de la cancha; se descartó el hueso #F4F1EA por ser una señal de diseño generado) y superficies blancas; en oscuro, verde casi negro #0E1A13 |
| Texto | #111827 / #6b7280 | Neutros cálidos (no `zinc`) |
| Ganó / perdió / pendiente / WO | no hay tokens | Verde / rojo / amarillo / gris, con contraste AA en claro y oscuro |
| Invierno | `winter` #4d90c4 | Azul hielo como acento de sección |
| Verano | no existe | Amarillo sol como acento de sección |
| Circuito | tokens generales | Naranja polvo + negro (logo CDP) |
| Especiales | `mm-*` | Negro + dorado (se mantiene, se ajusta) |

### 3.3 Tipografía

**Con la dirección A: Barlow Condensed (títulos y marcadores, en mayúsculas) + Barlow (texto).** Es una sola familia, y es la pareja que UI UX Pro Max recomienda para deporte y competencia. Reemplaza a Geist. Las mayúsculas se usan solo en títulos y en el tablero, nunca en etiquetas.

Opciones evaluadas en la maqueta F1:

La maqueta de la Fase 1 muestra **tres parejas aplicadas a la misma pantalla** (hero de la home + tabla de posiciones + tarjeta de partido), para comparar en contexto:

| Opción | Títulos | Texto | Carácter |
|---|---|---|---|
| A — Deportiva | Barlow Condensed (mayúsculas, 600–800) | Geist o Inter | Marcador, energía, competencia |
| B — Contemporánea | Archivo, con Archivo Expanded en titulares | Archivo | Moderna y sobria, estilo El Prado |
| C — Club clásico | Una serif editorial (ej. Fraunces) | Geist | Tradición e institución, estilo Córdoba Lawn |

- **Números de resultados**: siempre `tabular-nums`, en Barlow Condensed (sin mono).
- **Mid Master**: se decide si sigue con Playfair o si toma la serif de la opción C, para que Especiales y la base compartan familia.
- Escala: `h1` con `clamp()` (≈ 36→64 px), `h2` ≈ 28→40, `h3` ≈ 20→24, texto 16 px, notas 14 px. Todo con `next/font` (sin CLS).

### 3.4 Modo oscuro

- `next-themes` con `attribute="class"`, `defaultTheme="system"`, `enableSystem`; `suppressHydrationWarning` en `<html>`.
- Botón en `site-header` (sol/luna/sistema), también en el menú del celular.
- Las fotos llevan un overlay más denso en oscuro; los logos PNG se prueban sobre fondo oscuro (si alguno no se lee, se le da un fondo claro redondeado: el logo no se toca).
- **Especiales** fuerza oscuro con `class="dark"` en su layout, sin importar la preferencia.
- **Paneles**: fuera del proveedor de tema (quedan en claro).

### 3.5 Movimiento

Criterio de Emil Kowalski (skills `animate` y `review-animations`): **la herramienta más barata que funcione** y, antes que nada, si algo tiene que animarse o no.

| Necesidad | Herramienta |
|---|---|
| Hover, presión, color, cambios de estado con una clase | Transición CSS |
| Entrada al montar, sin JS | `@starting-style` |
| Movimiento predeterminado que no debe trabarse mientras carga la página | Animación CSS |
| Layout compartido, salidas, springs | `motion` (`motion/react`, `LazyMotion` + `domAnimation`), en componentes cliente chicos y con el `transform` completo, no con `x`/`y` |

Tokens en `globals.css` (no se inventan otras curvas):

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* entradas y salidas */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* movimiento en pantalla */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* menú del celular */
```

Qué se anima (aprobado en la maqueta F1):

| Momento | Propósito | Cómo |
|---|---|---|
| Tablero del hero de la home | Único momento orquestado de la página | Animación CSS, `clip-path` de arriba hacia abajo, 360 ms `--ease-out`, 60 ms entre números, una sola vez |
| Presión de botones y links con forma de botón | Respuesta | `:active { transform: scale(0.97) }`, 160 ms `--ease-out`; hover solo en `@media (hover: hover) and (pointer: fine)` |
| Indicador del filtro de categoría | Indicar el estado | Copia recortada con `clip-path`, 250 ms `--ease-in-out` |
| Serie de la Liga que abre sus 3 canchas | Indicar el estado | Transición de alto + opacidad, 200 ms, interrumpible |
| Menú del celular | Continuidad espacial | Entra y sale por el mismo lado, 250 ms `--ease-drawer` |
| Campeón (cuadro, edición cerrada) | Celebración: momento raro | `motion`, spring `{ duration: 0.5, bounce: 0.2 }`, la primera vez que entra en pantalla |
| Nieve / luz de verano | Identidad de estación | Animación CSS decorativa, `aria-hidden`; se apaga con "reducir movimiento" |

Qué **no** se anima: entradas de secciones al scrollear en pantallas de uso diario (tablas, fixture, ranking); filas de tablas en cascada (son datos que se leen); elevación de tarjetas al pasar el mouse; contadores; parallax.

- **Reducir movimiento** = menos y más suave, no cero: se quitan desplazamientos y se dejan fundidos cortos. `MotionConfig reducedMotion="user"` para `motion`.
- `MmReveal` se reemplaza por una entrada con `@starting-style` o por nada, según la pantalla.
- **Límites**: UI ≤ 300 ms; nunca `transition: all`, `scale(0)` ni `ease-in`; solo `transform`, `opacity` y `clip-path`.

### 3.6 Componentes compartidos

Viven en `components/shared/`. Toman el color de la sección desde `--section-*`. Reciben datos ya calculados: cualquier cálculo sigue en `lib/` (regla de `CLAUDE.md`). Los adaptadores de los tipos de cada torneo al formato del componente son mapeos de presentación, sin reglas deportivas.

| Componente | Hoy existe como | Versión común |
|---|---|---|
| `StandingsTable` | `liga/StandingsTable`, `interparque/StandingsTable`, `mid-master/ZoneStandingsTable`, `circuito/RankingTable`, `circuito/RankingByTournamentTable` | Tabla con definición de columnas (`columns: {key, label, align, emphasis}[]`), primera columna fija con scroll horizontal, fila resaltada (clasificados / top N), números tabulares, posición destacada. Cada sección solo define sus columnas. |
| `MatchCard` | `liga/ResultCard`, `mid-master/MatchCard`, filas de `interparque/MatchesList`, filas de `BracketView` | Dos lados (jugador/equipo), marcador por sets estilo scoreboard, ganador resaltado, estado (jugado / programado / pendiente / WO) con los tokens de resultado. Variante `compact` para el cuadro y `expandable` para la serie de la Liga (3 canchas). |
| `Bracket` | `liga/PlayoffBracket`, `mid-master/KnockoutBracket`, `circuito/BracketView` | Cuadro horizontal genérico de N rondas (§4.5). Recibe `BracketRound[] = { label, matches: BracketMatch[] }[]`. |
| `CategoryFilter` | `liga/CategoryTabs` (por ruta), `circuito/CategoryFilterPills` (por query) | Un solo componente visual con `hrefFor(slug)`; el modo (ruta o query) lo decide quien lo usa. Indicador animado, sticky debajo del header, scroll horizontal en el celular. |
| `SectionHero` | `hero`, `liga/TournamentHeader`, `liga/liga-header`, `mid-master/MidMasterHero` | Encabezado con variantes `home` (foto a pantalla completa), `section` (logo + título + bajada + decoración de la sección) y `compact` (páginas internas). |
| `EmptyState` | textos sueltos en cada página | Ícono de la sección + mensaje + acción opcional ("todavía no hay resultados", "el cuadro se publica cuando…"). |
| `ChampionCard` | `ChampionBanner`, `PodiumBanner` (Liga); nada en el Circuito | Campeón destacado (y podio opcional), reutilizado al final del cuadro y en ediciones cerradas. |
| `ResultBadge` / `Score` | clases sueltas | Marcador y estado con los tokens `win/loss/pending/walkover`. |

### 3.7 Celular

- Ancho de referencia: **375 px**. Sin scroll horizontal de página: solo dentro de tablas y cuadros.
- Tablas anchas: scroll horizontal con la primera columna fija (patrón de `RankingByTournamentTable`, que se generaliza en `StandingsTable`).
- Áreas táctiles ≥ 44 px; los filtros de categoría deslizan horizontalmente.
- Cuadros de 16 y 32: ver §4.5.

---

## 4. Proceso y fases

### 4.1 Cómo se trabaja cada fase

**Skills por parte del trabajo:**

| Parte | Skill | Para qué |
|---|---|---|
| Dirección visual de cada maqueta | `frontend-design` | Evitar las señales de diseño generado; un solo elemento audaz por pantalla |
| Paleta, tipografía, patrones de UX | UI UX Pro Max (`ui-ux-pro-max`) | Sistema de diseño por tipo de producto y reglas de UX puntuales |
| Qué animar y cómo | Emil Kowalski: `find-animation-opportunities`, `animate`, `review-animations` | Decidir si algo se anima, con qué herramienta, curva y duración |
| Auditoría de cada propuesta y de cada PR | `web-design-guidelines` (Vercel) | Accesibilidad, foco, formularios, animación, tipografía, contenido |

**Hook:** `.claude/settings.local.json` tiene un hook `PostToolUse` sobre `Write|Edit`. Cuando se toca un archivo visual (`components/**/*.tsx`, `app/**/*.tsx`, `app/**/*.css` o una maqueta `.dc.html`, excluyendo `app/actions`, `lib` y tests) le recuerda al agente auditar con `web-design-guidelines` antes de mostrar o dar por terminada la propuesta. `.claude/` está en el `.gitignore`, así que el hook vive en la máquina de desarrollo.

**Sub-identidades:** en la maqueta F1 son una muestra. Cada una se diseña en profundidad en la fase de su sección (Circuito en F2, Liga en F3, Especiales e Interparque en F4).

1. **Maqueta** — HTML autocontenido con 2–3 variantes y datos reales (copiados de producción o del mock). Se publica como página privada para verla en el celular y se guarda en `product/refactor-visual/maquetas/fase-N/`.
2. **Revisión y auditoría** — antes de mostrarla, la maqueta pasa por las skills de criterio (`frontend-design` y UI UX Pro Max para la dirección visual, las de Emil Kowalski para el movimiento; se leen de sus repositorios porque no están instaladas) y después se audita con la skill `web-design-guidelines` (`.claude/skills/`, guías de interfaz de Vercel) + un chequeo de contraste AA de los pares de color. Se corrige lo que aplica a una maqueta; lo que es de implementación queda en el checklist §6.
3. **Ida y vuelta** — el humano elige y corrige. Las decisiones se anotan en §8 de este archivo.
4. **Capturas aprobadas** en `product/refactor-visual/aprobado/fase-N/` (escritorio + 375 px, claro + oscuro).
5. **Implementación** en una rama `feat/visual-fN-<tema>` desde `refactor-visual`.
6. **Revisión en el navegador** (local o preview de Vercel) contra las capturas aprobadas + checklist §6. La skill `web-design-guidelines` se corre también sobre los componentes del PR.
7. **Sub-PR contra `refactor-visual`** con capturas antes/después. Merge solo con aprobación del humano. Si `main` avanza (fixes funcionales), se trae a `refactor-visual` con un merge antes del siguiente sub-PR.

Las capturas del estado actual (antes de cada fase) van en `product/refactor-visual/actual/`.

### 4.2 Fase 1 — Base + Home (dos PRs)

**Maqueta F1** (la más importante del refactor): dirección de la home con **2–3 direcciones completas** (paleta + tipografía A/B/C + hero), y para la elegida una hoja de estilo que muestre los tokens, los estados de resultado, la tabla, la tarjeta de partido, el filtro de categorías, el header/footer y la misma pantalla en claro y oscuro. Incluye una **muestra de cada sub-identidad** (una tira por sección) para validar que todas conviven con la home antes de programar nada.

**PR 1A — Infraestructura** (`feat/visual-f1a-base`)

- Tokens de tres capas en `globals.css` (§3.2), con `@custom-variant dark` y los estados de resultado.
- Fuentes nuevas en `app/layout.tsx` con `next/font`.
- `next-themes`: `components/theme-provider.tsx` en el root layout y `components/theme-toggle.tsx` en el header.
- Tokens de movimiento (§3.5) y clases CSS de presión y tablero; `motion` solo para el campeón y el indicador del filtro si la versión CSS no alcanza; `MotionConfig reducedMotion="user"`.
- ~~`components/shared/`~~ **Cambio al implementar (2026-09-27):** los componentes compartidos se construyen en la fase de su primer uso (`StandingsTable`, `CategoryFilter`, `MatchCard` y `Bracket` en la Fase 2; `ChampionCard` y `SectionHero` en la 2 y la 3), con la maqueta de esa sección. Hacerlos en el 1A dejaba código sin uso, que §5 prohíbe.
- Layout de sección compartido: los tres `layout.tsx` idénticos pasan a usar un solo `components/layout/section-shell.tsx` (header + footer + `data-identity`).
- `site-header` y `site-footer` rediseñados: logo, navegación, CTA WhatsApp, botón de tema, menú del celular animado. **Sin links a `/panel-*` y sin teléfonos.**
- Limpieza: borrar `components/layout/Footer.tsx`, `Navbar.tsx`, los SVG de ejemplo de `public/`, `content/site.ts` (SEO a `lib/site.ts`); renombrar assets con espacios y `fondo3.jpeg` → `.png` (actualizando las referencias). El PDF del reglamento **no** se renombra: su link probablemente circula por WhatsApp.
- Las pantallas existentes **no se rediseñan acá**: solo se reemplazan los colores fijos por tokens semánticos donde haga falta para que nada se rompa en oscuro. Si una pantalla no llega a verse bien en oscuro hasta su fase, queda anotado en el PR.

*Terminado*: tokens y fuentes de la maqueta aplicados; header y footer aprobados en escritorio y 375 px, claro y oscuro; componentes compartidos con una página de muestra solo para desarrollo (`app/dev/ui/page.tsx`, que no se construye en producción: `notFound()` si `NODE_ENV === "production"`); código muerto borrado; checklist §6.

**PR 1B — Home** (`feat/visual-f1b-home`)

- `hero` → `SectionHero variant="home"` con fotos nuevas (carrusel liviano si hay 3+ fotos buenas, si no, foto fija).
- Una tarjeta por actividad (Liga, Circuito, Interparque, clases/escuela) con el logo de cada una como "escudo" y un toque de su sub-identidad: reemplaza a `activities`, `winter-league`, `CircuitoPromo`, `InterparquePromo`. **`winter-league` deja de ser solo invierno**: muestra la edición de Liga activa (o la próxima) con su estación.
- Opcionales, según la maqueta: bloque "el club en números", galería, sponsors, línea de tiempo de campeones.
- `location-contact` y `whatsapp-fab` rediseñados.
- Tablero **"En juego"** en el hero, con lo que se está jugando en cada competencia: Liga (edición y fecha actual), Circuito (torneo del mes y cantidad de categorías) e Interparque (jugadores compitiendo y partidos jugados). Cada fila lleva a su sección. Datos reales del servidor, con su animación de entrada (§3.5); el resto de la home sin animaciones de entrada.
  - Si alguno de esos números no se puede leer con las funciones que ya existen en `lib/data/`, hace falta una función de solo lectura nueva: es una excepción a "`lib/` no se toca" que se consulta con el humano antes de programarla.
- Tarjeta de la Liga con una cancha de fondo y los logos LI y LV en cada mitad, "enfrentados" como rivales. Circuito e Interparque mantienen su cancha propia.

*Terminado*: home aprobada por el humano; en 375 px el CTA de WhatsApp está visible sin scrollear; LCP con la foto del hero optimizada (`next/image`, `priority`, `sizes`); checklist §6.

### 4.3 Fase 2 — Circuito del Parque (`feat/visual-f2-circuito`)

**Maqueta F2**: landing, torneo y **cuadro horizontal de 8, 16 y 32** jugadores + zona de 4–7, en escritorio y 375 px; dos o tres propuestas para diferenciar single y dobles; tarjeta de campeón.

- Sub-identidad `circuito` (polvo naranja + negro, formal); el logo CDP como pieza central.
- Landing (`EditionCard`): ediciones mensuales con estado (en juego / finalizada / próxima) y su campeón si terminó.
- Torneo: categorías separadas en **Single** y **Dobles** (ícono de una o dos figuras, o encabezado de grupo; se define en la maqueta).
- Categoría: `Bracket` compartido (§4.5) reemplaza a `BracketView`; el repechaje se muestra debajo con el mismo componente; en formatos de zona 4–7, `StandingsTable` para la zona + `Bracket` solo para semis y final; `ChampionCard` al final del cuadro.
- Ranking: `StandingsTable` compartida con columnas por torneo (reemplaza `RankingByTournamentTable` y `RankingTable`) + `CategoryFilter`.
- **Final Master pasa a la Fase 4** (va con la estética de Especiales).

*Terminado*: cuadros de 8/16/32 legibles en escritorio y 375 px, como los cuadros de eliminación simple habituales; zona + semis/final correcto; campeón con referencia visual fuerte; aprobación del humano; checklist §6.

### 4.4 Fase 3 — Liga Invierno/Verano (`feat/visual-f3-liga`)

**Maqueta F3**: selector con una edición de invierno y una de verano lado a lado; edición activa de invierno y de verano; edición cerrada (campeón/podio) y próxima; categoría; equipo; reglamento.

- **Helper de estación** `components/liga/season-theme.ts`: `getSeasonTheme(tournament) → "invierno" | "verano" | "neutro"`, leyendo el prefijo del slug (`liga-invierno-*`, `liga-verano-*`), con el nombre como respaldo (misma convención que `formatTournamentTitle`). Devuelve el `data-identity`, el logo, el título y la decoración. Si no reconoce el slug → aspecto neutro de la Liga (nunca invierno por defecto). Es presentación, no una regla deportiva.
- `LigaHeader` + `TournamentHeader` → un solo `SectionHero variant="section"` que toma la estación del helper: logo LI o LV, título "Temporada de invierno/verano", `Snowfall` o `SunGlow`. Así se corrige que una edición de verano activa se vea con nieve.
- Selector (`SeasonSelector`, `SeasonCard`): tarjetas con el acento de su estación sobre la base verde/naranja; sin `name.includes("verano")` en el componente (usa el helper).
- Edición: `ClosedSeasonView` con `ChampionCard`/podio; `ComingSoonView` rediseñado (reemplaza la animación `hourglass`); `sponsors-banner` con marquee que respeta "reducir movimiento".
- Categoría: `StandingsTable` compartida, `MatchCard variant="expandable"` para la serie (3 canchas), `Bracket` para playoffs (reemplaza `PlayoffBracket` y sus `amber-*`), `TeamCard`, `PhotoGallery` como carrusel de fotos cuadradas.
- Equipo y reglamento: reglamento con índice por anclas, secciones numeradas y tipografía firme.

*Terminado*: las dos estaciones bien marcadas y a la vez claramente la misma liga; ninguna pantalla de la Liga queda fija en invierno; aprobación del humano; checklist §6.

**Decisiones de la maqueta F3 (aprobadas 2026-09-27)** — maqueta con 2 opciones en `product/refactor-visual/maquetas/fase-3/` (`Opcion1-*.dc.html` / `Opcion2-*.dc.html`), artifact https://claude.ai/artifact/4A5Kt4DgwWqBgjCqdt1dND:

- **Dirección elegida: Opción 2 ("Línea de cancha")** para todas las pantallas — fondo claro, líneas de cancha como estructura, clima (nieve/luz) contenido en una banda para no saturar, selector en dos columnas con línea de tiempo, serie en diálogo (hoja desde abajo en celular).
- **Excepción — Reglamento y Edición cerrada**: usar la *disposición* de la Opción 1 (reglamento con índice lateral fijo; edición cerrada como tarjeta de podio por categoría) pero manteniendo el lenguaje visual de la Opción 2 (fondo claro, tipografía, tokens).
- **Nieve/luz de estación: loop continuo**, no la animación "se asienta y termina" que había propuesto la maqueta. Sigue respetando "reducir movimiento"; falta confirmar si necesita un control de pausa visible (WCAG 2.2.2 aplica a movimiento automático de más de 5 s que no puede detenerse) — evaluarlo al programar.
- **Playoffs Mixto B (5 equipos)**, resuelve el gap que dejaba `lib/playoffs/generateProvisionalBracket.ts` (formato `five_team`): 1°, 2° y 3° tienen bye; cuartos = 4° vs 5°; semifinal 1 = 1° vs 2°; semifinal 2 = 3° vs ganador de (4° vs 5°). Documentado como regla canónica en `product/reglas-liga-invierno.md` §Playoffs.
- **Galería de fotos**: se pospone a una fase posterior (no hay fotos de verano todavía); no maquetar por ahora.
- **Sponsors**: pasan a ser **editables por edición desde `/panel-liga`** (logo y nombre de marca). El carrusel de la vista activa muestra únicamente los sponsors del torneo correspondiente. OQ-LI-01 resuelta por el club: relación con `tournaments` en Supabase.

### 4.5 El cuadro horizontal (`components/shared/bracket/`)

Es la pieza técnica más compleja; se construye en la Fase 2 y se reutiliza en la Liga (playoffs) y en Mid Master.

- **Layout**: CSS grid con una columna por ronda. Cada partido ocupa `2^r` filas de la grilla, así los partidos de cada ronda quedan centrados entre los dos que los alimentan. Las líneas que conectan rondas son bordes de pseudo-elementos (sin SVG ni cálculos en JS): funcionan en server components y con cualquier tamaño.
- **Partido**: `MatchCard variant="compact"` de altura fija (dos renglones: jugador + sets), ganador en negrita con el color de la sección, perdedor apagado, bye/WO indicados.
- **Final**: la última columna termina en `ChampionCard` (nombre grande, trofeo, `Celebrate` la primera vez que entra en pantalla).
- **Encabezados**: nombre de la ronda arriba de cada columna ("Octavos", "Cuartos", "Semifinal", "Final"), sticky al hacer scroll vertical.
- **16 jugadores** (4 rondas): en escritorio entra completo. En 375 px, scroll horizontal con *snap* por ronda, mostrando una ronda y media para que se note que sigue.
- **32 jugadores** (5 rondas): en escritorio, scroll horizontal. En el celular, además de las columnas con snap, **selector de ronda** arriba (chips) que lleva a esa columna. Se evalúa en la maqueta si en el celular conviene mostrar solo la ronda elegida + la siguiente.
- **Zona 4–7**: `StandingsTable` + fixture de la zona; el `Bracket` solo con semis y final.
- **Adaptadores** (mapeo de presentación, sin reglas): `fromCircuitoSections(BracketSection[])`, `fromLigaPlayoffs(ProvisionalBracket, …)`, `fromMmKnockout(MmKnockout)`. El orden de los partidos dentro de cada ronda lo mantiene el adaptador tal como viene de `lib/`. Si falta un dato para ubicar un partido (ej. qué partido alimenta a cuál), **no se infiere**: se muestra la ronda como lista y se anota en `open-questions.md`.
- **Accesibilidad**: cada ronda es una lista (`<ol>`) con encabezado; el ganador se indica con texto además del color.

### 4.6 Fase 4 — Especiales (Mid Master + Final Master) e Interparque (`feat/visual-f4-especiales-interparque`)

**Maqueta F4**: edición y categoría de Mid Master, Final Master, e Interparque con 2–3 propuestas (partiendo de los flyers, ADR-006).

- Sub-identidad `especiales`: migrar `mm-*` a `[data-identity="especiales"]`, siempre oscuro; tipografía según §3.3.
- `MidMasterHero` → `SectionHero` en su variante de Especiales (el `radial-gradient` con `rgba` pasa a tokens); `MmReveal` → `Reveal`; `ZoneStandingsTable` → `StandingsTable`; `MatchCard` compartido; `KnockoutBracket` → `Bracket`; sponsors con marquee común.
- **Final Master** (`/circuito-del-parque/final-master`) con la estética de Especiales: clasificados provisorios (top 8) por categoría con `StandingsTable` + `CategoryFilter`, "próximamente" rediseñado (reemplaza `animate-bob`).
- Interparque: `StandingsTable` compartida, partidos agrupados por fecha con `MatchCard`, reglas en bloque claro; sub-identidad a definir en la maqueta.

*Terminado*: Mid Master y Final Master se reconocen como la misma familia "Especiales" y a la vez del club; Interparque con diseño definitivo aprobado; checklist §6.

**Decisiones de la maqueta F4 (aprobadas 2026-09-28)** — maqueta con 2 opciones en `product/refactor-visual/maquetas/fase-4/` (`Opcion1-*.dc.html` / `Opcion2-*.dc.html`), artifact https://claude.ai/artifact/VRjwBiRQw9xTf5bdhE3oJw:

- **Mid Master: Opción 1 ("Trofeo")** — negro + dorado grabado, Playfair Display acotado a nombres propios (evento, categoría, campeón), el resto en Barlow Condensed/Barlow tabular. Líneas de cancha doradas como estructura; índice de categorías en filas (no cards); cuadro con semis a los lados y final al centro; sponsors en marquee infinito con botón "Pausar" (se mantiene el marquee que pedía el plan original, no la grilla fija que había propuesto la Opción 2).
- **Final Master: layout de Opción 2 + piel de Opción 1** — se mantiene el contenido/estructura que propuso la Opción 2 (estado "próximamente" sin el hourglass genérico, clasificados top 8 por categoría, selector agrupado de categorías) pero renderizado con el lenguaje visual de la Opción 1 (Playfair en nombres propios, líneas de cancha, dorado grabado) para que se reconozca como la misma familia "Especiales" que Mid Master. **Al implementar**: no existe un `.dc.html` con esta combinación exacta — se arma directo en código combinando `Opcion2-FinalMaster.dc.html` (estructura) con los tokens/tipografía de `Opcion1-*` (piel).
- **Interparque: Opción 2 ("Domingos")** — hero-calendario de las 8 fechas de la temporada (jugadas en amarillo pelota, próxima marcada); tabla de posiciones con 8 puntos mostrando qué domingos jugó cada uno (no es obligatorio jugar todas); partidos elegidos por fecha con botones. Sigue el tema del sistema (claro/oscuro), no fuerza oscuro como Especiales. Tokens nuevos: `--ip-ink`, `--ip-soft`, `--ip-line`, `--on-ball`, `--on-ball-muted` (el amarillo pelota nunca es texto sobre fondo claro).
- **Tipografía de Especiales**: Playfair Display se mantiene, acotada a nombres propios — decisión ligada a elegir Mid Master = Opción 1.
- **Auditoría**: `web-design-guidelines` + contraste AA corridos antes de mostrar la maqueta. Hallazgo pendiente de decidir al implementar: `--border-strong` en modo claro da 2,89:1 (por debajo de 3:1 para bordes de controles); la maqueta propone `#7b8a80` (3,34:1) — toca un token global de `app/globals.css`, evaluar impacto en las demás secciones.
- **Gaps para `open-questions.md`**: fecha de la Final Master sin definir (fixture real); fechas de Mid Master 2026 sin definir (la maqueta usó julio como ejemplo); no hay flyers reales de Interparque en el repo para validar la sub-identidad contra ellos; niveles de Interparque por categoría (ya es OQ-IP-03 abierta).
- No existe `components/shared/`: como en F2 y F3, los componentes de Especiales e Interparque quedan en sus propios módulos (`components/mid-master/*`, `components/interparque/*`).

**Ajustes post-revisión del PR #14 (2026-09-28)**:
- El calendario de fechas del hero (`SeasonHero`) marca "Jugada" cuando la fecha **ya pasó por calendario**, no cuando hay un partido `completed` cargado ese día — así una fecha lluviosa sin partido registrado no queda mostrando "Próxima" para siempre. Cambio acotado a `buildSeasonCalendar` en `components/interparque/seasonCalendar.ts`; no afecta la tabla de posiciones ni el hero, que solo consumen el campo `status` resultante.
- "Partidos jugados" ya NO se agrupa por "Fecha 1/2/3" con botones (esa división se mantiene solo en el hero-calendario y en la tabla de posiciones): pasa a ser una lista plana del más nuevo al más viejo, paginada de a 8 con "Anterior"/"Siguiente" (`?pagina=` en la URL, sin JS de cliente). Se borró `groupCompletedMatchesByDate`/`DateGroup` de `seasonCalendar.ts` por quedar sin uso.

### 4.7 Fase 5 — Paneles admin (`feat/visual-f5-paneles`)

Sin rediseño: orden y usabilidad. Maqueta solo del shell.

- `components/admin/admin-shell.tsx`: header común (nombre del panel, links entre las secciones del panel, cerrar sesión) en los tres `app/panel-*/layout.tsx` (hoy vacíos); se borran los headers armados a mano en cada página.
- Formularios y tablas con tokens semánticos (sin `gray-*`); estados vacío/cargando/error con `EmptyState`; mensajes de confirmación consistentes.
- Logins con la misma tarjeta.
- En claro siempre (fuera del proveedor de tema).

*Terminado*: se encuentra todo desde el header del panel; ninguna pantalla del panel rompió su flujo (se prueba cargar un resultado en cada panel); checklist §6.

### 4.8 Resumen de fases

| Fase | PR | Maqueta | Depende de |
|---|---|---|---|
| 1A Base | tokens, fuentes, tema, motion, compartidos, header/footer, limpieza | F1 (dirección general) | — |
| 1B Home | home completa | F1 | 1A |
| 2 Circuito | landing, torneo, cuadro horizontal, ranking | F2 | 1A |
| 3 Liga | selector, ediciones por estación, categoría, equipo, reglamento | F3 | 1A, `Bracket` de F2 |
| 4 Especiales + Interparque | Mid Master, Final Master, Interparque | F4 | 1A, `Bracket` de F2 |
| 5 Paneles | shell común y orden | F5 (solo shell) | 1A |

Las maquetas de F2–F4 se pueden adelantar mientras se programa la fase anterior.

---

## 5. Reglas del refactor

- **Cero cambios funcionales.** Un bug de lógica que aparezca va en un PR aparte.
- **`lib/` no se toca**: solo cambian componentes, estilos, páginas, layouts y assets. Excepción ya prevista: mover el SEO de `content/site.ts` a `lib/site.ts` (datos de presentación, no lógica).
- **No se infieren reglas deportivas** al mostrar datos (ej. orden del cuadro, desempates): si falta un dato, se muestra lo que hay y se anota en `open-questions.md`.
- **Cada PR se revisa en el navegador** contra las capturas aprobadas.
- **Se borra el código muerto** que se encuentre.
- Respetar `CLAUDE.md`: los paneles no se enlazan desde vistas públicas y no se muestran teléfonos.
- Los logos no se modifican.

---

## 6. Checklist de cada PR

```
[ ] maqueta aprobada y capturas en product/refactor-visual/aprobado/fase-N/
[ ] capturas antes/después en el PR: 1280 px y 375 px, claro y oscuro
[ ] sin scroll horizontal de página en 375 px
[ ] contraste AA en texto y estados de resultado, en claro y oscuro
[ ] con "reducir movimiento" activado no hay animaciones de entrada ni nieve/marquee
[ ] skill web-design-guidelines sobre los archivos tocados, sin hallazgos pendientes
[ ] foco visible (focus-visible) y hover en todo lo interactivo; skip link en el layout
[ ] color-scheme y <meta name="theme-color"> acordes al tema; env(safe-area-inset-*) en el hero
[ ] títulos con text-wrap: balance; números con tabular-nums; fechas con Intl.DateTimeFormat
[ ] grep en los archivos tocados: sin gray-*, bg-white, amber-*, hex ni rgba sueltos
[ ] grep: ningún href a /panel-* fuera de app/panel-* y components/admin
[ ] no se muestran teléfonos en vistas públicas
[ ] sin cambios en lib/ (salvo la excepción de §5)
[ ] npm run lint · npm run build · npm test pasan
[ ] informar archivos modificados y qué queda pendiente
```

---

## 7. Fotos a conseguir

Horizontales, idealmente ≥ 2400 px de ancho (el hero se ve a pantalla completa en escritorio), sin caras de menores sin autorización.

| Uso | Fotos |
|---|---|
| Hero de la home | 3–5 fotos de impacto: aérea del club, acción en cancha, atardecer/luces |
| Tarjetas de actividades | 1 por actividad: Liga (dobles), Circuito (single en competencia), Interparque (alumnos), escuela/clases |
| Liga | 1 de invierno (abrigo, luz fría) y 1 de verano (sol) para los encabezados de estación; fotos de campeones por edición |
| Circuito | Campeones por edición/categoría (formato cuadrado) |
| Mid Master / Final Master | 2–3 fotos del evento (entrega de premios, finalistas) para `public/images/mid-master/` |
| Institucional | Canchas, quincho/instalaciones, grupo de socios |
| Sponsors | Logos en PNG con fondo transparente (completar los de Mid Master) |

---

## 8. Decisiones abiertas

Se cierran en la maqueta de cada fase y se anotan acá con la fecha.

- [x] ¿Una identidad única o sub-identidades? → **Sub-identidades sobre una base común** (2026-09-27; se revisa en la maqueta F1).
- [x] ¿Modo oscuro? → **Sí, sistema + botón; Especiales siempre oscuro; paneles en claro** (2026-09-27).
- [x] ¿Animaciones? → **Sutiles con Motion** (2026-09-27).
- [x] ¿Cómo se marca la estación de la Liga? → **Helper que lee el slug, sin cambios de datos** (2026-09-27).
- [x] Dirección de la home → **A "Marcador", versión refinada** (2026-09-27; falta la aprobación final de la versión refinada).
- [x] Tipografía → **Barlow Condensed + Barlow** (2026-09-27). Queda abierto si Mid Master sigue con Playfair.
- [ ] Valores finales de la paleta (verde y naranja del logo, acentos de estación). → Maqueta F1.
- [ ] ¿La home lleva carrusel en el hero o foto fija? → Maqueta F1, según las fotos que lleguen.
- [x] Single y dobles en el Circuito → **dos columnas con ícono (una o dos raquetas) en escritorio; selector Single | Dobles en celular** (2026-09-27, maqueta F2).
- [x] Cuadros en el celular → **vista por ronda** (botones de ronda; cada partido dice a dónde pasa el ganador) para todos los tamaños; en escritorio, cuadro horizontal (2026-09-27).
- [x] Landing del Circuito → **calendario de la temporada**: Grand Slam en polvo fuerte con líneas de cancha, jugados en polvo suave, próximos con línea punteada; meses sin torneo cargado dicen "A confirmar" (2026-09-27).
- [x] Lógica nueva del Circuito (árbol del cuadro, ronda en juego, campeón por categoría) → **funciones puras en `lib/circuito/` con tests**, excepción aprobada (2026-09-27).
- [x] Sub-identidad de Interparque → **Opción 2 "Domingos"** (hero-calendario de las 8 fechas de temporada, tokens `--ip-*`) (2026-09-28, maqueta F4).
