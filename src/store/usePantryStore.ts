"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PantryItem, ShoppingListItem } from "@/types";
import { getStockLevel } from "@/lib/stockLogic";
import { ensureAuth } from "@/lib/firebase";
import {
  subscribePantryItems,
  subscribeShoppingItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
} from "@/lib/firestore";
import type { Unsubscribe } from "firebase/firestore";

interface PantryStore {
  // State
  userId: string | null;
  pantryItems: PantryItem[];
  shoppingList: ShoppingListItem[];
  isLoading: boolean;
  customUnits: string[];

  // Auth + sync
  init: () => Promise<void>;
  cleanup: () => void;

  // Pantry CRUD
  addItem: (item: Omit<PantryItem, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateItem: (id: string, updates: Partial<PantryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, newQuantity: number) => Promise<void>;

  // Shopping list
  addToShoppingList: (
    item: Omit<ShoppingListItem, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  toggleShoppingItem: (id: string, checked: boolean) => Promise<void>;
  removeShoppingItem: (id: string) => Promise<void>;
  clearCheckedItems: () => Promise<void>;

  // Custom units
  addCustomUnit: (unit: string) => void;
}

let pantryUnsub: Unsubscribe | null = null;
let shoppingUnsub: Unsubscribe | null = null;

export const usePantryStore = create<PantryStore>()(
  persist(
    (set, get) => ({
      userId: null,
      pantryItems: [],
      shoppingList: [],
      isLoading: true,
      customUnits: [],

      init: async () => {
        const uid = await ensureAuth();
        set({ userId: uid });

        // Subscribe to Firestore real-time updates
        pantryUnsub = subscribePantryItems(uid, (items) => {
          set({ pantryItems: items, isLoading: false });
        });

        shoppingUnsub = subscribeShoppingItems(uid, (items) => {
          set({ shoppingList: items });
        });
      },

      cleanup: () => {
        pantryUnsub?.();
        shoppingUnsub?.();
        pantryUnsub = null;
        shoppingUnsub = null;
      },

      addItem: async (item) => {
        const { userId } = get();
        if (!userId) return;
        await addPantryItem(userId, item);
      },

      updateItem: async (id, updates) => {
        const { userId } = get();
        if (!userId) return;
        await updatePantryItem(userId, id, updates);

        // Check low stock after update
        const updatedItem = get().pantryItems.find((i) => i.id === id);
        if (updatedItem) {
          await checkLowStock(get, { ...updatedItem, ...updates } as PantryItem);
        }
      },

      deleteItem: async (id) => {
        const { userId, shoppingList } = get();
        if (!userId) return;
        await deletePantryItem(userId, id);

        // Remove any auto-generated shopping items linked to this pantry item
        const autoItem = shoppingList.find(
          (s) => s.pantryItemId === id && s.source === "auto"
        );
        if (autoItem) {
          await deleteShoppingItem(userId, autoItem.id);
        }
      },

      updateQuantity: async (id, newQuantity) => {
        const { userId, pantryItems } = get();
        if (!userId) return;

        const item = pantryItems.find((i) => i.id === id);
        if (!item) return;

        await updatePantryItem(userId, id, {
          quantity: newQuantity,
          lastUsed: new Date(),
        });

        await checkLowStock(get, { ...item, quantity: newQuantity });
      },

      addToShoppingList: async (item) => {
        const { userId } = get();
        if (!userId) return;
        await addShoppingItem(userId, item);
      },

      toggleShoppingItem: async (id, checked) => {
        const { userId } = get();
        if (!userId) return;
        await updateShoppingItem(userId, id, { checked });
      },

      removeShoppingItem: async (id) => {
        const { userId } = get();
        if (!userId) return;
        await deleteShoppingItem(userId, id);
      },

      clearCheckedItems: async () => {
        const { userId, shoppingList } = get();
        if (!userId) return;
        const checked = shoppingList.filter((i) => i.checked);
        await Promise.all(checked.map((i) => deleteShoppingItem(userId, i.id)));
      },

      addCustomUnit: (unit) => {
        const { customUnits } = get();
        if (!customUnits.includes(unit)) {
          set({ customUnits: [...customUnits, unit] });
        }
      },
    }),
    {
      name: "shelf-life-store",
      partialize: (state) => ({
        pantryItems: state.pantryItems,
        shoppingList: state.shoppingList,
        customUnits: state.customUnits,
      }),
    }
  )
);

// Low stock auto-detection
async function checkLowStock(
  get: () => PantryStore,
  item: PantryItem
) {
  const { userId, shoppingList } = get();
  if (!userId) return;

  const stock = getStockLevel(item);
  const existingAutoItem = shoppingList.find(
    (s) => s.pantryItemId === item.id && s.source === "auto"
  );

  if (
    (stock.level === "critical" || stock.level === "low") &&
    item.autoAddToShoppingList
  ) {
    if (!existingAutoItem) {
      await addShoppingItem(userId, {
        name: item.name,
        source: "auto",
        pantryItemId: item.id,
        checked: false,
        quantity: Math.max(0, item.maxQuantity - item.quantity),
        unit: item.unit,
      });
    }
  } else if (stock.level === "medium" || stock.level === "good") {
    if (existingAutoItem) {
      await deleteShoppingItem(userId, existingAutoItem.id);
    }
  }
}
