import { describe, it, expect } from "vitest"
import { fetchAllRows } from "../fetchAll"

function fakeTable(total: number) {
  const rows = Array.from({ length: total }, (_, i) => ({ id: i }))
  const calls: Array<[number, number]> = []
  const fetchPage = async (from: number, to: number) => {
    calls.push([from, to])
    return { data: rows.slice(from, to + 1), error: null }
  }
  return { rows, calls, fetchPage }
}

describe("fetchAllRows", () => {
  it("junta todas las páginas cuando la tabla supera el tope", async () => {
    const t = fakeTable(2350)
    const { data, error } = await fetchAllRows<{ id: number }>(t.fetchPage, 1000)
    expect(error).toBeNull()
    expect(data).toHaveLength(2350)
    expect(data![2349]).toEqual({ id: 2349 })
    expect(t.calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]])
  })

  it("con un múltiplo exacto del tamaño de página pide una página más y termina", async () => {
    const t = fakeTable(2000)
    const { data } = await fetchAllRows<{ id: number }>(t.fetchPage, 1000)
    expect(data).toHaveLength(2000)
    expect(t.calls).toHaveLength(3)
  })

  it("una sola página (tabla chica) hace una sola consulta", async () => {
    const t = fakeTable(5)
    const { data } = await fetchAllRows<{ id: number }>(t.fetchPage, 1000)
    expect(data).toHaveLength(5)
    expect(t.calls).toHaveLength(1)
  })

  it("tabla vacía devuelve []", async () => {
    const t = fakeTable(0)
    expect((await fetchAllRows(t.fetchPage)).data).toEqual([])
  })

  it("propaga el error de cualquier página sin devolver datos parciales", async () => {
    let n = 0
    const { data, error } = await fetchAllRows(async () => {
      n++
      return n === 1
        ? { data: Array.from({ length: 1000 }, () => ({})), error: null }
        : { data: null, error: { message: "boom" } }
    }, 1000)
    expect(data).toBeNull()
    expect(error?.message).toBe("boom")
  })
})
