"use client";

import { useState } from "react";
import { PantryItem, Category, CATEGORIES } from "@/types";
import { getStockLevel, getExpiryLabel } from "@/lib/stockLogic";
import { getStepForUnit } from "@/lib/units";
import { usePantryStore } from "@/store/usePantryStore";
import { useFocusTrap } from "@/lib/useFocusTrap";
import StockBar from "./StockBar";
import QuantityAdjuster from "./QuantityAdjuster";

interface ItemDetailSheetProps {
  item: PantryItem;
  onClose: () => void;
}

export default function ItemDetailSheet({
  item,
  onClose,
}: ItemDetailSheetProps) {
  const { updateItem, deleteItem } = usePantryStore();
  const [quantity, setQuantity] = useState(item.quantity);
  const [category, setCategory] = useState<Category>(item.category);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const { containerRef, handleKeyDown } = useFocusTrap(onClose);
  const stock = getStockLevel({ ...item, quantity });
  const expiryLabel = item.expiryDate ? getExpiryLabel(item.expiryDate) : null;
  const hasChanges = quantity !== item.quantity || category !== item.category;

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    await updateItem(item.id, { quantity, category });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    await deleteItem(item.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} details`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="relative w-full max-w-[480px] bg-bg rounded-t-[var(--radius-xl)] shadow-[var(--shadow-sheet)] animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-bg-tertiary rounded-full" />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <span className="text-4xl">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-text-primary truncate">
                {item.name}
              </h2>
              {item.brand && (
                <p className="text-xs text-text-tertiary">{item.brand}</p>
              )}
              <p className="text-xs text-text-tertiary mt-0.5">
                Last used{" "}
                {item.lastUsed.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            {expiryLabel && (
              <span className="text-xs font-medium text-stock-critical bg-stock-critical-bg px-2 py-1 rounded-[var(--radius-sm)] shrink-0">
                {expiryLabel}
              </span>
            )}
          </div>

          {/* Stock bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-text-secondary">
                Stock Level
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: stock.color }}
              >
                {stock.label} — {Math.round(stock.percentage * 100)}%
              </span>
            </div>
            <StockBar stock={stock} />
          </div>

          {/* Quantity adjuster */}
          <div className="mb-5">
            <label className="text-xs font-medium text-text-secondary block mb-2">
              Quantity
            </label>
            <div className="flex justify-center">
              <QuantityAdjuster
                value={quantity}
                onChange={setQuantity}
                step={getStepForUnit(item.unit)}
                unit={item.unit}
              />
            </div>
          </div>

          {/* Category dropdown */}
          <div className="mb-6">
            <label className="text-xs font-medium text-text-secondary block mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full h-10 px-3 bg-bg-secondary border border-border rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-[var(--radius-md)] hover:bg-primary-light active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            {showDeleteConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-10 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-md)] hover:bg-bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 h-10 text-sm font-medium text-stock-critical border border-stock-critical rounded-[var(--radius-md)] hover:bg-stock-critical-bg transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full h-10 text-sm font-medium text-stock-critical hover:bg-stock-critical-bg rounded-[var(--radius-md)] transition-colors"
              >
                Delete Item
              </button>
            )}
          </div>
        </div>

        {/* Safe area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
