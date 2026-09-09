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
    <div className="bg-white border-b border-border sticky top-16 z-40">
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
                  "whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-t transition-colors",
                  active
                    ? "text-brand border-b-2 border-brand bg-brand-light"
                    : "text-gray-600 hover:text-brand hover:bg-gray-50"
                )}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
