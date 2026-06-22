import path from "node:path"
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer"

const LOGO_PATH = path.join(process.cwd(), "public", "images", "logoligadeinvierno.png")

// ─── Layout calculator ────────────────────────────────────────────────────────

// A4 portrait: 842pt. paddingTop 30 + paddingBottom 30 = 782pt usable.
// Empirically derived: fixed sections consume ~532pt, leaving 250pt for
// player rows + obs box. A 15pt buffer guards against react-pdf micro-rounding.
// Overflow threshold with default row height (20pt): N=9 exactly fills the page.
function computeLayout(playerCount: number): {
  playerPaddingV: number
  playerFontSize: number
  orderBoxSize: number
  obsBoxHeight: number
} {
  // All values empirically calibrated against react-pdf A4 rendering.
  // FIXED ≈ 540pt (header + info + roster titles/headers + results + obs-title + sigs + footer).
  // Available = 782 - 540 = 242pt for player rows + obs box.
  // rowH values measured via binary search on the dev server.
  const AVAILABLE = 242

  let playerPaddingV: number
  let playerFontSize: number
  let orderBoxSize: number
  let rowH: number   // empirical row height for this tier
  let obsMax: number // max safe obs for this tier (at worst-case N)

  if (playerCount <= 8) {
    // Comfortable: original default settings
    playerPaddingV = 5; playerFontSize = 8.5; orderBoxSize = 13
    rowH = 21;  obsMax = 70
  } else if (playerCount <= 10) {
    // Slightly tighter
    playerPaddingV = 3; playerFontSize = 8; orderBoxSize = 13
    rowH = 17;  obsMax = 60
  } else if (playerCount <= 14) {
    // Compact
    playerPaddingV = 2; playerFontSize = 8; orderBoxSize = 11
    rowH = 14.5; obsMax = 35
  } else if (playerCount <= 18) {
    // Very compact
    playerPaddingV = 1; playerFontSize = 7.5; orderBoxSize = 10
    rowH = 12;  obsMax = 25
  } else {
    // Maximum density (19-20): no vertical padding
    playerPaddingV = 0; playerFontSize = 7.5; orderBoxSize = 10
    rowH = 10.5; obsMax = 25
  }

  const obsBoxHeight = Math.max(15, Math.min(obsMax, AVAILABLE - playerCount * rowH))

  return { playerPaddingV, playerFontSize, orderBoxSize, obsBoxHeight }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchSheetData {
  category: string
  round: string
  date: string
  time: string
  homeTeam: string
  awayTeam: string
  homePlayers: string[]
  awayPlayers: string[]
  homeCaptain?: string
  awayCaptain?: string
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const GREEN = "#15803d"
const BORDER = "#d1d5db"
const BG_LIGHT = "#f9fafb"
const TEXT = "#111827"
const MUTED = "#6b7280"
const WHITE = "#ffffff"

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: TEXT,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 36,
    backgroundColor: WHITE,
  },

  // Header
  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "column" },
  headerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 17,
    color: WHITE,
    letterSpacing: 1,
  },
  headerClub: { fontSize: 9, color: "#bbf7d0", marginTop: 2 },
  headerLogo: {
    height: 38,
    objectFit: "contain",
  },

  // Section title
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: GREEN,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    borderBottomWidth: 1,
    borderBottomColor: GREEN,
    paddingBottom: 3,
    marginBottom: 7,
  },

  // Match info
  infoSection: { marginBottom: 14 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  infoItem: { width: "50%", flexDirection: "row", marginBottom: 4 },
  infoLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: MUTED,
    width: 62,
    textTransform: "uppercase",
  },
  infoValue: { fontSize: 9, color: TEXT, flex: 1 },
  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  teamName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: TEXT,
    flex: 1,
  },
  vsText: { fontSize: 10, color: MUTED, marginHorizontal: 10 },

  // Roster
  rosterSection: { marginBottom: 14 },
  rosterCols: { flexDirection: "row", gap: 10 },
  rosterCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
  },
  rosterColHeader: {
    backgroundColor: GREEN,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
  },
  playerRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  playerNum: { width: 16, fontSize: 8, color: MUTED },
  playerName: { flex: 1, fontSize: 8.5, color: TEXT },
  playerOrderBox: {
    borderWidth: 1,
    borderColor: BORDER,
    marginLeft: 6,
    alignSelf: "center",
  },
  rosterEmpty: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 8,
    color: MUTED,
    fontStyle: "italic",
  },

  // Results table
  resultsSection: { marginBottom: 14 },
  table: { borderWidth: 1, borderColor: BORDER },
  tableHead: {
    flexDirection: "row",
    backgroundColor: BG_LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableSubHead: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 26,
  },
  thLabel: {
    width: 52,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: "center",
  },
  thGroup: {
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    alignItems: "center",
  },
  thGroupLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: GREEN,
    paddingVertical: 2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  thGroupRow: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  thSub: {
    flex: 1,
    fontSize: 7,
    color: MUTED,
    textAlign: "center",
    paddingVertical: 2,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  thSubLast: {
    flex: 1,
    fontSize: 7,
    color: MUTED,
    textAlign: "center",
    paddingVertical: 2,
  },
  thWO: {
    width: 30,
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: "center",
  },
  thWinner: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textAlign: "center",
  },
  tdLabel: {
    width: 52,
    paddingHorizontal: 6,
    paddingVertical: 5,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  tdCell: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 5,
    fontSize: 8,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  tdWO: {
    width: 30,
    paddingHorizontal: 4,
    paddingVertical: 5,
    fontSize: 8,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  tdWinner: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 5,
    fontSize: 8,
    textAlign: "center",
  },

  // Observations
  obsSection: { marginBottom: 14 },
  obsBox: {
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: 70,
    padding: 8,
  },
  obsPlaceholder: { fontSize: 8, color: "#e5e7eb" },

  // Signatures
  sigRow: { flexDirection: "row", gap: 12 },
  sigBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 8,
    minHeight: 72,
  },
  sigLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  sigTeam: { fontFamily: "Helvetica-Bold", fontSize: 9, color: TEXT, marginBottom: 24 },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 4,
    paddingTop: 3,
  },
  sigLineLabel: { fontSize: 7, color: MUTED },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 10,
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: MUTED },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateAR(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}-${m}-${y}`
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

function MatchSheetDocument({ data }: { data: MatchSheetData }) {
  const courts = [
    { label: "Cancha 1" },
    { label: "Cancha 2" },
    { label: "Cancha 3" },
  ]

  const dateDisplay = data.date ? formatDateAR(data.date) : "—"
  const timeDisplay = data.time ? `${data.time} hs` : "—"

  const playerCount = Math.max(data.homePlayers.length, data.awayPlayers.length)
  const { playerPaddingV, playerFontSize, orderBoxSize, obsBoxHeight } = computeLayout(playerCount)

  return (
    <Document
      title={`Planilla — ${data.homeTeam} vs ${data.awayTeam}`}
      author="Parque Tenis Club"
      creator="Sistema de Liga de Invierno"
    >
      <Page size="A4" orientation="portrait" style={s.page}>
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>LIGA DE INVIERNO</Text>
            <Text style={s.headerClub}>Parque Tenis Club</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={LOGO_PATH} style={s.headerLogo} />
        </View>

        {/* ── DATOS DEL PARTIDO ── */}
        <View style={s.infoSection}>
          <Text style={s.sectionTitle}>Datos del partido</Text>
          <View style={s.infoGrid}>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Categoría</Text>
              <Text style={s.infoValue}>{data.category || "—"}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Instancia</Text>
              <Text style={s.infoValue}>{data.round || "—"}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Fecha</Text>
              <Text style={s.infoValue}>{dateDisplay}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Horario</Text>
              <Text style={s.infoValue}>{timeDisplay}</Text>
            </View>
          </View>
          <View style={s.vsRow}>
            <Text style={s.teamName}>{data.homeTeam}</Text>
            <Text style={s.vsText}>vs</Text>
            <Text style={[s.teamName, { textAlign: "right" }]}>{data.awayTeam}</Text>
          </View>
        </View>

        {/* ── LISTA DE BUENA FE ── */}
        <View style={s.rosterSection}>
          <Text style={s.sectionTitle}>Lista de buena fe</Text>
          <View style={s.rosterCols}>
            {/* Local */}
            <View style={s.rosterCol}>
              <Text style={s.rosterColHeader}>LOCAL — {data.homeTeam}</Text>
              {data.homePlayers.length === 0 ? (
                <Text style={s.rosterEmpty}>Sin jugadores registrados</Text>
              ) : (
                data.homePlayers.map((name, i) => (
                  <View key={i} style={[s.playerRow, { paddingVertical: playerPaddingV }]}>
                    <Text style={[s.playerNum, { fontSize: playerFontSize }]}>{i + 1}.</Text>
                    <Text style={[s.playerName, { fontSize: playerFontSize }]}>{name}</Text>
                    <View style={[s.playerOrderBox, { width: orderBoxSize, height: orderBoxSize }]} />
                  </View>
                ))
              )}
            </View>

            {/* Visitante */}
            <View style={s.rosterCol}>
              <Text style={s.rosterColHeader}>VISITANTE — {data.awayTeam}</Text>
              {data.awayPlayers.length === 0 ? (
                <Text style={s.rosterEmpty}>Sin jugadores registrados</Text>
              ) : (
                data.awayPlayers.map((name, i) => (
                  <View key={i} style={[s.playerRow, { paddingVertical: playerPaddingV }]}>
                    <Text style={[s.playerNum, { fontSize: playerFontSize }]}>{i + 1}.</Text>
                    <Text style={[s.playerName, { fontSize: playerFontSize }]}>{name}</Text>
                    <View style={[s.playerOrderBox, { width: orderBoxSize, height: orderBoxSize }]} />
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* ── RESULTADOS ── */}
        <View style={s.resultsSection}>
          <Text style={s.sectionTitle}>Resultados</Text>
          <View style={s.table}>
            {/* Header row 1: group labels */}
            <View style={s.tableHead}>
              <Text style={s.thLabel}>Cancha</Text>
              <View style={s.thGroup}>
                <Text style={s.thGroupLabel}>SET 1</Text>
                <View style={s.thGroupRow}>
                  <Text style={s.thSub}>Local</Text>
                  <Text style={s.thSubLast}>Visit.</Text>
                </View>
              </View>
              <View style={s.thGroup}>
                <Text style={s.thGroupLabel}>SET 2</Text>
                <View style={s.thGroupRow}>
                  <Text style={s.thSub}>Local</Text>
                  <Text style={s.thSubLast}>Visit.</Text>
                </View>
              </View>
              <View style={s.thGroup}>
                <Text style={s.thGroupLabel}>SET 3</Text>
                <View style={s.thGroupRow}>
                  <Text style={s.thSub}>Local</Text>
                  <Text style={s.thSubLast}>Visit.</Text>
                </View>
              </View>
              <Text style={s.thWO}>W.O.</Text>
              <Text style={s.thWinner}>Ganador</Text>
            </View>

            {/* Data rows */}
            {courts.map((c, i) => (
              <View key={i} style={[s.tableRow, i === courts.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                <Text style={s.tdLabel}>{c.label}</Text>
                {/* S1 L */ }<Text style={s.tdCell}> </Text>
                {/* S1 V */ }<Text style={s.tdCell}> </Text>
                {/* S2 L */ }<Text style={s.tdCell}> </Text>
                {/* S2 V */ }<Text style={s.tdCell}> </Text>
                {/* S3 L */ }<Text style={s.tdCell}> </Text>
                {/* S3 V */ }<Text style={s.tdCell}> </Text>
                <Text style={s.tdWO}> </Text>
                <Text style={s.tdWinner}> </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── OBSERVACIONES ── */}
        <View style={s.obsSection}>
          <Text style={s.sectionTitle}>Observaciones</Text>
          <View style={[s.obsBox, { minHeight: obsBoxHeight }]}>
            <Text style={s.obsPlaceholder}> </Text>
          </View>
        </View>

        {/* ── FIRMAS ── */}
        <View>
          <Text style={s.sectionTitle}>Firmas</Text>
          <View style={s.sigRow}>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>Capitán — Local</Text>
              <Text style={s.sigTeam}>{data.homeTeam}</Text>
              <View style={s.sigLine}>
                <Text style={s.sigLineLabel}>Aclaración y firma</Text>
              </View>
            </View>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>Capitán — Visitante</Text>
              <Text style={s.sigTeam}>{data.awayTeam}</Text>
              <View style={s.sigLine}>
                <Text style={s.sigLineLabel}>Aclaración y firma</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>Parque Tenis Club — Liga de Invierno 2026</Text>
          <Text style={s.footerText}>Documento generado automáticamente. No válido sin firmas.</Text>
        </View>
      </Page>
    </Document>
  )
}

// ─── Export ──────────────────────────────────────────────────────────────────

export async function generateMatchSheetPdf(data: MatchSheetData): Promise<Buffer> {
  return renderToBuffer(<MatchSheetDocument data={data} />)
}

