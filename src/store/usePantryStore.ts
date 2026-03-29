"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PantryItem, ShoppingListItem, Household, UserProfile } from "@/types";
import { getStockLevel } from "@/lib/stockLogic";
import {
  waitForAuth,
  signInWithGoogle,
  signOut as firebaseSignOut,
  onAuthChange,
} from "@/lib/firebase";
import {
  subscribePantryItems,
  subscribeShoppingItems,
  subscribeHousehold,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  getUserProfile,
  saveUserProfile,
  createHousehold,
  joinHousehold,
  getHousehold,
} from "@/lib/firestore";
import type { Unsubscribe } from "firebase/firestore";
import type { User } from "firebase/auth";

type AuthState = "loading" | "signed-out" | "no-household" | "ready";

interface PantryStore {
  // Auth & household state
  authState: AuthState;
  user: UserProfile | null;
  household: Household | null;
  householdId: string | null;

  // Data
  pantryItems: PantryItem[];
  shoppingList: ShoppingListItem[];
  isLoading: boolean;
  customUnits: string[];

  // Auth actions
  init: () => Promise<void>;
  cleanup: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;

  // Household actions
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<boolean>;

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

let authUnsub: (() => void) | null = null;
let pantryUnsub: Unsubscribe | null = null;
let shoppingUnsub: Unsubscribe | null = null;
let householdUnsub: Unsubscribe | null = null;

function cleanupSubscriptions() {
  pantryUnsub?.();
  shoppingUnsub?.();
  householdUnsub?.();
  pantryUnsub = null;
  shoppingUnsub = null;
  householdUnsub = null;
}

export const usePantryStore = create<PantryStore>()(
  persist(
    (set, get) => ({
      authState: "loading",
      user: null,
      household: null,
      householdId: null,
      pantryItems: [],
      shoppingList: [],
      isLoading: true,
      customUnits: [],

      init: async () => {
        // Check if already signed in
        const firebaseUser = await waitForAuth();

        if (firebaseUser) {
          await handleSignedIn(firebaseUser, set, get);
        } else {
          set({ authState: "signed-out", isLoading: false });
        }

        // Listen for auth changes (e.g. sign out from another tab)
        authUnsub = onAuthChange(async (firebaseUser) => {
          if (firebaseUser) {
            await handleSignedIn(firebaseUser, set, get);
          } else {
            cleanupSubscriptions();
            set({
              authState: "signed-out",
              user: null,
              household: null,
              householdId: null,
              pantryItems: [],
              shoppingList: [],
              isLoading: false,
            });
          }
        });
      },

      cleanup: () => {
        authUnsub?.();
        authUnsub = null;
        cleanupSubscriptions();
      },

      signIn: async () => {
        const firebaseUser = await signInWithGoogle();
        await handleSignedIn(firebaseUser, set, get);
      },

      signOut: async () => {
        cleanupSubscriptions();
        await firebaseSignOut();
        set({
          authState: "signed-out",
          user: null,
          household: null,
          householdId: null,
          pantryItems: [],
          shoppingList: [],
        });
      },

      createHousehold: async (name: string) => {
        const { user } = get();
        if (!user) return;

        const householdId = await createHousehold(user.uid, name, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          joinedAt: new Date(),
        });

        set({ householdId });
        await startDataSubscriptions(householdId, set, get);

        const household = await getHousehold(householdId);
        set({ household, authState: "ready" });
      },

      joinHousehold: async (inviteCode: string) => {
        const { user } = get();
        if (!user) return false;

        const householdId = await joinHousehold(inviteCode, user.uid, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          joinedAt: new Date(),
        });

        if (!householdId) return false;

        set({ householdId });
        await startDataSubscriptions(householdId, set, get);

        const household = await getHousehold(householdId);
        set({ household, authState: "ready" });
        return true;
      },

      addItem: async (item) => {
        const { householdId } = get();
        if (!householdId) return;
        await addPantryItem(householdId, item);
      },

      updateItem: async (id, updates) => {
        const { householdId } = get();
        if (!householdId) return;
        await updatePantryItem(householdId, id, updates);

        const updatedItem = get().pantryItems.find((i) => i.id === id);
        if (updatedItem) {
          await checkLowStock(get, { ...updatedItem, ...updates } as PantryItem);
        }
      },

      deleteItem: async (id) => {
        const { householdId, shoppingList } = get();
        if (!householdId) return;
        await deletePantryItem(householdId, id);

        const autoItem = shoppingList.find(
          (s) => s.pantryItemId === id && s.source === "auto"
        );
        if (autoItem) {
          await deleteShoppingItem(householdId, autoItem.id);
        }
      },

      updateQuantity: async (id, newQuantity) => {
        const { householdId, pantryItems } = get();
        if (!householdId) return;

        const item = pantryItems.find((i) => i.id === id);
        if (!item) return;

        await updatePantryItem(householdId, id, {
          quantity: newQuantity,
          lastUsed: new Date(),
        });

        await checkLowStock(get, { ...item, quantity: newQuantity });
      },

      addToShoppingList: async (item) => {
        const { householdId } = get();
        if (!householdId) return;
        await addShoppingItem(householdId, item);
      },

      toggleShoppingItem: async (id, checked) => {
        const { householdId } = get();
        if (!householdId) return;
        await updateShoppingItem(householdId, id, { checked });
      },

      removeShoppingItem: async (id) => {
        const { householdId } = get();
        if (!householdId) return;
        await deleteShoppingItem(householdId, id);
      },

      clearCheckedItems: async () => {
        const { householdId, shoppingList } = get();
        if (!householdId) return;
        const checked = shoppingList.filter((i) => i.checked);
        await Promise.all(checked.map((i) => deleteShoppingItem(householdId, i.id)));
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
        householdId: state.householdId,
      }),
    }
  )
);

// --- Internal helpers ---

async function handleSignedIn(
  firebaseUser: User,
  set: (s: Partial<PantryStore>) => void,
  get: () => PantryStore
) {
  const profile: UserProfile = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName ?? "User",
    email: firebaseUser.email ?? "",
    photoURL: firebaseUser.photoURL ?? undefined,
  };

  // Check if user has a profile with a household
  const existingProfile = await getUserProfile(firebaseUser.uid);
  if (existingProfile?.householdId) {
    profile.householdId = existingProfile.householdId;
    set({ user: profile, householdId: existingProfile.householdId });

    const household = await getHousehold(existingProfile.householdId);
    set({ household, authState: "ready" });

    await startDataSubscriptions(existingProfile.householdId, set, get);
  } else {
    await saveUserProfile(profile);
    set({ user: profile, authState: "no-household", isLoading: false });
  }
}

async function startDataSubscriptions(
  householdId: string,
  set: (s: Partial<PantryStore>) => void,
  _get: () => PantryStore
) {
  cleanupSubscriptions();

  pantryUnsub = subscribePantryItems(householdId, (items) => {
    set({ pantryItems: items, isLoading: false });
  });

  shoppingUnsub = subscribeShoppingItems(householdId, (items) => {
    set({ shoppingList: items });
  });

  householdUnsub = subscribeHousehold(householdId, (household) => {
    set({ household });
  });
}

async function checkLowStock(
  get: () => PantryStore,
  item: PantryItem
) {
  const { householdId, shoppingList } = get();
  if (!householdId) return;

  const stock = getStockLevel(item);
  const existingAutoItem = shoppingList.find(
    (s) => s.pantryItemId === item.id && s.source === "auto"
  );

  if (
    (stock.level === "critical" || stock.level === "low") &&
    item.autoAddToShoppingList
  ) {
    if (!existingAutoItem) {
      await addShoppingItem(householdId, {
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
      await deleteShoppingItem(householdId, existingAutoItem.id);
    }
  }
}
