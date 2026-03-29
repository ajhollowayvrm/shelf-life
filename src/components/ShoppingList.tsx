"use client";

import { ShoppingListItem } from "@/types";
import { usePantryStore } from "@/store/usePantryStore";

interface ShoppingListSectionProps {
  title: string;
  titleColor: string;
  items: ShoppingListItem[];
}

function ShoppingListSection({
  title,
  titleColor,
  items,
}: ShoppingListSectionProps) {
  const { toggleShoppingItem, removeShoppingItem } = usePantryStore();

  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-pill)]"
          style={{ backgroundColor: titleColor + "20", color: titleColor }}
        >
          {title}
        </span>
        <span className="text-[10px] text-text-muted">{items.length} items</span>
      </div>

      <div className="flex flex-col gap-1">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-bg-secondary transition-colors group animate-list-item"
            style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
          >
            {/* Checkbox — 44px touch target wrapping a 20px visual box */}
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
                toggleShoppingItem(item.id, !item.checked);
              }}
              className="w-11 h-11 min-w-[44px] flex items-center justify-center shrink-0 -ml-2"
              aria-label={`Mark ${item.name} as ${item.checked ? "unchecked" : "checked"}`}
              role="checkbox"
              aria-checked={item.checked}
            >
              <span
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  item.checked
                    ? "bg-primary border-primary animate-check-pop"
                    : "border-border"
                }`}
              >
                {item.checked && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </span>
            </button>

            {/* Item info */}
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm transition-colors ${
                  item.checked
                    ? "text-text-muted line-through"
                    : "text-text-primary"
                }`}
              >
                {item.name}
              </span>
              {item.quantity && item.unit && (
                <span className="text-xs text-text-tertiary ml-1.5">
                  {item.quantity} {item.unit}
                </span>
              )}
              {item.notes && (
                <p className="text-xs text-text-tertiary mt-0.5 truncate">
                  {item.notes}
                </p>
              )}
            </div>

            {/* Delete button */}
            <button
              onClick={() => removeShoppingItem(item.id)}
              className="w-8 h-8 min-w-[32px] flex items-center justify-center text-text-muted hover:text-stock-critical sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
              aria-label={`Remove ${item.name}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShoppingListSection;
