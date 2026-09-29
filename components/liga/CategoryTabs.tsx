"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { categoryHref } from "@/lib/tournament/seasonRoutes";
import type { Category } from "@/lib/tournament/types";

interface CategoryTabsProps {
  categories: Category[];
  seasonSlug: string;
}

export function CategoryTabs({ categories, seasonSlug }: CategoryTabsProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Categorías de la liga" className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex overflow-x-auto gap-1 py-1 no-scrollbar">
          {categories.map((cat) => {
            const href = categoryHref(seasonSlug, cat.slug);
            const active = pathname === href;
            return (
              <Link
                key={cat.id}
                href={href}
                className={cn(
                  "inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
