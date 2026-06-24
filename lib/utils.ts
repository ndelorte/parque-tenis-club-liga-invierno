import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  if (!iso) return ""
  const date = new Date(iso + "T00:00:00")
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  })
}
