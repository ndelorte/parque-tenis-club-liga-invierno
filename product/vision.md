# Vision — Parque Tenis Club Web

## Problema que resuelve

Parque Tenis Club no tiene presencia web propia. Los socios y jugadores de la Liga de Invierno no tienen un lugar centralizado para consultar fixture, resultados ni tabla de posiciones. La comunicación hoy depende de grupos de WhatsApp, lo que genera ruido y pérdida de información.

## Solución

Una web real con dos propósitos claros:

1. **Landing institucional**: vitrina digital del club que transmite actividad, convoca nuevos socios y alumnos, y habilita contacto rápido por WhatsApp.
2. **Liga de Invierno**: sección pública con toda la información del torneo organizada y actualizable desde un panel admin privado.

## Usuarios

| Tipo | Necesidad principal |
|------|---------------------|
| Jugador participante | Consultar fixture, tabla y resultados desde el celular |
| Familiar / hincha | Ver resultados y próximas fechas |
| Interesado en el club | Conocer actividades, contactar, cómo llegar |
| Organizador (admin) | Cargar y editar datos del torneo sin depender de un desarrollador |

## Objetivos del MVP

- Landing institucional online con contacto por WhatsApp.
- Sección Liga de Invierno pública con tabla, fixture y resultados en tiempo real.
- Panel admin privado para cargar y editar datos.
- Deploy en Vercel con dominio del club.

## Fuera de alcance del MVP

- Playoffs automáticos.
- Liga de Verano u otros torneos.
- Carga de resultados por capitanes.
- Notificaciones por WhatsApp.
- Fotos o logos por equipo.
- Estadísticas individuales avanzadas.
- App mobile nativa.
- Sistema de reservas de cancha.
- Pagos online.

## Principios de diseño

- **Mobile first**: la mayoría de usuarios entra desde WhatsApp o Instagram en el celular.
- **Estética deportiva moderna**: verde y naranja (colores del logo), fotos reales del club, textos cortos y contundentes.
- **Claridad sobre ornamentación**: en la sección Liga de Invierno, primero la información.
- **Admin invisible**: el panel admin no es referenciado desde ninguna página pública.

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Base de datos | Supabase Postgres |
| Auth | Supabase Auth |
| Deploy | Vercel |
| Forms | React Hook Form + Zod |
| Tests | Vitest o Jest |

## Fuente de verdad

Este PRD es la fuente de verdad del proyecto: `/product/PRD_PARQUE_TENIS_LIGA_INVIERNO.md`.

Si una decisión cambia, primero se actualiza el PRD, luego el código.
