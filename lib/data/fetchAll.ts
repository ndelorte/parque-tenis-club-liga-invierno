// PostgREST corta cada respuesta en 1000 filas (db-max-rows) sin avisar:
// una lectura sin paginar "funciona" hasta que la tabla cruza ese tope y
// después devuelve de menos, sin error. Este helper trae todas las páginas.

export const DB_PAGE_SIZE = 1000

interface PageResult {
  data: readonly unknown[] | null
  error: { message: string } | null
}

// `fetchPage(from, to)` tiene que devolver la consulta con `.order(...)` por una
// columna única (sin orden estable las páginas se pisan) y `.range(from, to)`.
export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult>,
  pageSize: number = DB_PAGE_SIZE,
): Promise<{ data: T[] | null; error: { message: string } | null }> {
  const all: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1)
    if (error) return { data: null, error }
    if (!data) return { data: null, error: { message: "Respuesta vacía" } }
    all.push(...(data as T[]))
    if (data.length < pageSize) return { data: all, error: null }
  }
}
