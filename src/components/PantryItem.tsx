"use client";

import { PantryItem as PantryItemType, StockInfo } from "@/types";
import { getStockLevel, getExpiryLabel } from "@/lib/stockLogic";
import StockBar from "./StockBar";

interface PantryItemProps {
  item: PantryItemType;
  onClick: (item: PantryItemType) => void;
  index?: number;
}

const STOCK_BADGE_STYLES: Record<string, string> = {
  critical: "bg-stock-critical-bg text-stock-critical",
  low: "bg-stock-low-bg text-stock-low",
  medium: "bg-stock-medium-bg text-stock-medium",
  good: "bg-stock-good-bg text-stock-good",
};

export default function PantryItemRow({ item, onClick, index = 0 }: PantryItemProps) {
  const stock: StockInfo = getStockLevel(item);
  const expiryLabel = item.expiryDate ? getExpiryLabel(item.expiryDate) : null;

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-[var(--radius-md)] hover:bg-bg-secondary active:bg-bg-tertiary transition-colors text-left animate-list-item"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      {/* Emoji */}
      <span className="text-2xl w-9 text-center shrink-0">{item.emoji}</span>

      {/* Name + stock bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {item.name}
          </span>
          {expiryLabel && (
            <span className="text-[10px] font-medium text-stock-critical bg-stock-critical-bg px-1.5 py-0.5 rounded-[var(--radius-sm)] shrink-0">
              {expiryLabel}
            </span>
          )}
        </div>
        <StockBar stock={stock} className="mt-1.5" />
      </div>

      {/* Quantity + badge */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs text-text-secondary tabular-nums">
          {item.quantity} {item.unit}
        </span>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-sm)] ${STOCK_BADGE_STYLES[stock.level]}`}
        >
          {stock.label}
        </span>
      </div>
    </button>
  );
}
