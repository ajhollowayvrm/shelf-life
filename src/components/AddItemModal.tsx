"use client";

import { useState } from "react";
import { Category, CATEGORIES, DEFAULT_UNITS } from "@/types";
import { usePantryStore } from "@/store/usePantryStore";
import { useFocusTrap } from "@/lib/useFocusTrap";

interface AddItemModalProps {
  onClose: () => void;
  prefill?: {
    name?: string;
    category?: Category;
    emoji?: string;
    unit?: string;
    brand?: string;
    barcode?: string;
  };
}

export default function AddItemModal({ onClose, prefill }: AddItemModalProps) {
  const { addItem, customUnits, addCustomUnit } = usePantryStore();
  const { containerRef, handleKeyDown } = useFocusTrap(onClose);

  const [name, setName] = useState(prefill?.name ?? "");
  const [category, setCategory] = useState<Category>(prefill?.category ?? "Other");
  const [emoji, setEmoji] = useState(prefill?.emoji ?? "📦");
  const [unit, setUnit] = useState(prefill?.unit ?? "pieces");
  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [newCustomUnit, setNewCustomUnit] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [maxQuantity, setMaxQuantity] = useState<number>(5);
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);

  const allUnits = [...DEFAULT_UNITS, ...customUnits];

  const handleUnitChange = (value: string) => {
    if (value === "__custom__") {
      setShowCustomUnit(true);
    } else {
      setUnit(value);
      setShowCustomUnit(false);
    }
  };

  const handleAddCustomUnit = () => {
    const trimmed = newCustomUnit.trim().toLowerCase();
    if (!trimmed) return;
    addCustomUnit(trimmed);
    setUnit(trimmed);
    setNewCustomUnit("");
    setShowCustomUnit(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    await addItem({
      name: name.trim(),
      category,
      emoji,
      quantity,
      maxQuantity,
      unit,
      barcode: prefill?.barcode,
      brand: prefill?.brand,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      lowStockThreshold: 0.25,
      autoAddToShoppingList: true,
      lastUsed: new Date(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Add item"
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
      <div className="relative w-full max-w-[480px] bg-bg rounded-t-[var(--radius-xl)] shadow-[var(--shadow-sheet)] animate-slide-up max-h-[85dvh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-bg rounded-t-[var(--radius-xl)] z-10">
          <div className="w-10 h-1 bg-bg-tertiary rounded-full" />
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">
            Add Item
          </h2>

          {/* Name */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-secondary block mb-1.5">
              Item Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-12 h-10 text-center text-xl bg-bg-secondary border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-accent"
                aria-label="Item emoji"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Whole Milk"
                required
                autoFocus
                className="flex-1 h-10 px-3 bg-bg-secondary border border-border rounded-[var(--radius-md)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-secondary block mb-1.5">
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

          {/* Unit */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-secondary block mb-1.5">
              Unit
            </label>
            <select
              value={showCustomUnit ? "__custom__" : unit}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-full h-10 px-3 bg-bg-secondary border border-border rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              {allUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
              <option value="__custom__">Custom...</option>
            </select>
            {showCustomUnit && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newCustomUnit}
                  onChange={(e) => setNewCustomUnit(e.target.value)}
                  placeholder="Custom unit name"
                  autoFocus
                  className="flex-1 h-9 px-3 bg-bg-secondary border border-border rounded-[var(--radius-md)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={handleAddCustomUnit}
                  disabled={!newCustomUnit.trim()}
                  className="px-4 h-9 bg-accent text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Quantities — side by side */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1.5">
                Current Qty
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={quantity}
                onChange={(e) => setQuantity(+e.target.value)}
                className="w-full h-10 px-3 bg-bg-secondary border border-border rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1.5">
                Full Stock Qty
              </label>
              <input
                type="number"
                min={1}
                step={0.5}
                value={maxQuantity}
                onChange={(e) => setMaxQuantity(+e.target.value)}
                className="w-full h-10 px-3 bg-bg-secondary border border-border rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Expiry */}
          <div className="mb-6">
            <label className="text-xs font-medium text-text-secondary block mb-1.5">
              Expiry Date (optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full h-10 px-3 bg-bg-secondary border border-border rounded-[var(--radius-md)] text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-[var(--radius-md)] hover:bg-primary-light active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Adding..." : "Add to Pantry"}
          </button>
        </form>

        {/* Safe area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
