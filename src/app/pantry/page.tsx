"use client";

import { useState, useMemo, useEffect } from "react";
import { usePantryStore } from "@/store/usePantryStore";
import { Category, PantryItem } from "@/types";
import { getStockLevel } from "@/lib/stockLogic";
import { onForegroundMessage } from "@/lib/fcm";
import SearchBar from "@/components/SearchBar";
import CategoryPicker from "@/components/CategoryPicker";
import PantryItemRow from "@/components/PantryItem";
import ItemDetailSheet from "@/components/ItemDetailSheet";
import AddItemModal from "@/components/AddItemModal";
import NotificationBanner from "@/components/NotificationBanner";
import Toast from "@/components/Toast";

const STOCK_SORT_ORDER = { critical: 0, low: 1, medium: 2, good: 3 };

export default function PantryPage() {
  const { pantryItems, isLoading } = usePantryStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Listen for foreground push notifications
  useEffect(() => {
    const unsub = onForegroundMessage((_title, body) => {
      setToast(body);
    });
    return () => unsub();
  }, []);

  const filteredItems = useMemo(() => {
    let items = pantryItems;

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }

    if (category !== "All") {
      items = items.filter((i) => i.category === category);
    }

    // Sort by stock level (lowest first)
    return [...items].sort((a, b) => {
      const aLevel = getStockLevel(a).level;
      const bLevel = getStockLevel(b).level;
      return STOCK_SORT_ORDER[aLevel] - STOCK_SORT_ORDER[bLevel];
    });
  }, [pantryItems, search, category]);

  return (
    <main className="flex-1 flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Pantry</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-full text-lg font-bold hover:bg-primary-light transition-colors"
          aria-label="Add item"
        >
          +
        </button>
      </div>

      {/* Notification permission banner */}
      <NotificationBanner />

      {/* Search */}
      <div className="px-4 pb-2">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* Category filters */}
      <div className="pb-3">
        <CategoryPicker selected={category} onSelect={setCategory} />
      </div>

      {/* Item list */}
      <div className="flex-1 px-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {pantryItems.length === 0 ? (
              <>
                <span className="text-5xl mb-4">🫙</span>
                <p className="text-text-secondary text-sm">
                  Your pantry is empty! Tap{" "}
                  <span className="font-semibold">+</span> or scan a barcode to
                  add your first item.
                </p>
              </>
            ) : (
              <>
                <span className="text-4xl mb-3">🔍</span>
                <p className="text-text-secondary text-sm">
                  No items match your search.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredItems.map((item, i) => (
              <PantryItemRow
                key={item.id}
                item={item}
                index={i}
                onClick={setSelectedItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail sheet */}
      {selectedItem && (
        <ItemDetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddItemModal onClose={() => setShowAddModal(false)} />
      )}

      {/* Toast for push notifications */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </main>
  );
}
