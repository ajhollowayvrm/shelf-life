"use client";

import { Category, CATEGORIES } from "@/types";

interface CategoryPickerProps {
  selected: Category | "All";
  onSelect: (category: Category | "All") => void;
}

const CATEGORY_EMOJIS: Record<Category, string> = {
  Produce: "🥬",
  Dairy: "🧀",
  Proteins: "🥩",
  Grains: "🌾",
  Baking: "🧁",
  "Oils & Vinegars": "🫒",
  Condiments: "🥫",
  Canned: "🥫",
  Spices: "🧂",
  Frozen: "🧊",
  Beverages: "☕",
  Snacks: "🍿",
  Household: "🧹",
  Other: "📦",
};

export default function CategoryPicker({
  selected,
  onSelect,
}: CategoryPickerProps) {
  const all = ["All", ...CATEGORIES] as const;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
      {all.map((cat) => {
        const isActive = selected === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat as Category | "All")}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-pill)] text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              isActive
                ? "bg-primary text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {cat !== "All" && (
              <span className="text-sm">{CATEGORY_EMOJIS[cat as Category]}</span>
            )}
            {cat}
          </button>
        );
      })}
    </div>
  );
}

export { CATEGORY_EMOJIS };
