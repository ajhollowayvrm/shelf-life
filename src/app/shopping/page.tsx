"use client";

import { useState, useMemo } from "react";
import { usePantryStore } from "@/store/usePantryStore";
import ShoppingListSection from "@/components/ShoppingList";

export default function ShoppingPage() {
  const { shoppingList, addToShoppingList, clearCheckedItems } =
    usePantryStore();
  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);

  const autoItems = useMemo(
    () => shoppingList.filter((i) => i.source === "auto"),
    [shoppingList]
  );
  const manualItems = useMemo(
    () => shoppingList.filter((i) => i.source === "manual"),
    [shoppingList]
  );
  const checkedCount = shoppingList.filter((i) => i.checked).length;

  const handleAddManual = async () => {
    const name = newItemName.trim();
    if (!name) return;
    setAdding(true);
    await addToShoppingList({
      name,
      source: "manual",
      checked: false,
    });
    setNewItemName("");
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddManual();
    }
  };

  return (
    <main className="flex-1 flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Shopping List
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {shoppingList.length === 0
              ? "Nothing to buy"
              : `${shoppingList.length - checkedCount} remaining`}
          </p>
        </div>
        {checkedCount > 0 && (
          <button
            onClick={clearCheckedItems}
            className="text-xs font-medium text-accent hover:underline"
          >
            Clear checked ({checkedCount})
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 px-3">
        {shoppingList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="text-5xl mb-4">🎉</span>
            <p className="text-sm text-text-secondary">
              You&apos;re all stocked up!
            </p>
          </div>
        ) : (
          <>
            <ShoppingListSection
              title="Low Stock"
              titleColor="#F4811A"
              items={autoItems}
            />
            <ShoppingListSection
              title="Manual"
              titleColor="#999999"
              items={manualItems}
            />
          </>
        )}
      </div>

      {/* Add item input */}
      <div className="px-4 pb-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add an item..."
            className="flex-1 h-10 px-3 bg-bg-secondary border border-border rounded-[var(--radius-md)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={handleAddManual}
            disabled={!newItemName.trim() || adding}
            className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-[var(--radius-md)] text-lg font-bold hover:bg-primary-light active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Add item"
          >
            +
          </button>
        </div>
      </div>
    </main>
  );
}
