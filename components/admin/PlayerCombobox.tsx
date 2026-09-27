"use client"

import { useId, useMemo, useState } from "react"
import { X } from "lucide-react"
import { searchPlayers } from "@/lib/players/searchPlayers"

export interface ComboboxPlayer {
  id: string
  displayName: string
}

interface Props {
  players: ComboboxPlayer[]
  onChange: (playerId: string) => void // "" = sin selección
  placeholder: string
  excludeIds?: string[] // ya inscriptos o elegidos en el otro campo
}

// Autocompletar de jugadores: se escribe parte del nombre o apellido y
// sugiere los que coinciden (lib/players/searchPlayers.ts). Para vaciarlo
// desde afuera (ej. después de agregar), el padre le cambia la `key`.
export function PlayerCombobox({ players, onChange, placeholder, excludeIds = [] }: Props) {
  const listId = useId()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<ComboboxPlayer | null>(null)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)

  const suggestions = useMemo(() => {
    const excluded = new Set(excludeIds)
    return searchPlayers(
      players.filter((p) => !excluded.has(p.id)),
      query,
    )
  }, [players, excludeIds, query])

  function choose(player: ComboboxPlayer) {
    setSelected(player)
    setQuery(player.displayName)
    setOpen(false)
    onChange(player.id)
  }

  function clear() {
    setSelected(null)
    setQuery("")
    onChange("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlighted((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && open && suggestions[highlighted]) {
      e.preventDefault()
      choose(suggestions[highlighted])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const showList = open && !selected && query.trim() !== ""

  return (
    <div className="relative min-w-[10rem] flex-1">
      <input
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value)
          setHighlighted(0)
          setOpen(true)
          // Editar el texto después de elegir descarta la selección.
          if (selected) {
            setSelected(null)
            onChange("")
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm shadow-sm"
      />
      {query && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          title="Borrar"
          aria-label="Borrar"
        >
          <X className="size-3.5" />
        </button>
      )}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-sm shadow-md"
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-1.5 text-muted-foreground">Sin coincidencias</li>
          ) : (
            suggestions.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={i === highlighted}
                // mousedown (no click) para elegir antes de que el blur cierre la lista
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(p)
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={`cursor-pointer px-3 py-1.5 ${i === highlighted ? "bg-muted text-foreground" : "text-foreground"}`}
              >
                {p.displayName}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
