import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { PantryItem, ShoppingListItem } from "@/types";

// --- Helpers ---

function userPantryRef(userId: string) {
  return collection(getDb(), "users", userId, "pantryItems");
}

function userShoppingRef(userId: string) {
  return collection(getDb(), "users", userId, "shoppingList");
}

function toDate(val: Timestamp | Date | undefined): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Timestamp) return val.toDate();
  return val;
}

function toFirestoreItem(item: Partial<PantryItem>) {
  const data: Record<string, unknown> = { ...item };
  delete data.id;
  if (item.expiryDate) data.expiryDate = Timestamp.fromDate(item.expiryDate);
  if (item.lastUsed) data.lastUsed = Timestamp.fromDate(item.lastUsed);
  if (item.createdAt) data.createdAt = Timestamp.fromDate(item.createdAt);
  data.updatedAt = Timestamp.now();
  return data;
}

function fromFirestoreItem(id: string, data: Record<string, unknown>): PantryItem {
  return {
    ...data,
    id,
    expiryDate: toDate(data.expiryDate as Timestamp | undefined),
    lastUsed: toDate(data.lastUsed as Timestamp) ?? new Date(),
    createdAt: toDate(data.createdAt as Timestamp) ?? new Date(),
    updatedAt: toDate(data.updatedAt as Timestamp) ?? new Date(),
  } as PantryItem;
}

function fromFirestoreShoppingItem(
  id: string,
  data: Record<string, unknown>
): ShoppingListItem {
  return {
    ...data,
    id,
    createdAt: toDate(data.createdAt as Timestamp) ?? new Date(),
    updatedAt: toDate(data.updatedAt as Timestamp) ?? new Date(),
  } as ShoppingListItem;
}

// --- Pantry CRUD ---

export async function addPantryItem(
  userId: string,
  item: Omit<PantryItem, "id" | "createdAt" | "updatedAt">
) {
  const data = toFirestoreItem({
    ...item,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const docRef = await addDoc(userPantryRef(userId), data);
  return docRef.id;
}

export async function updatePantryItem(
  userId: string,
  itemId: string,
  updates: Partial<PantryItem>
) {
  const ref = doc(getDb(), "users", userId, "pantryItems", itemId);
  await updateDoc(ref, toFirestoreItem(updates));
}

export async function deletePantryItem(userId: string, itemId: string) {
  const ref = doc(getDb(), "users", userId, "pantryItems", itemId);
  await deleteDoc(ref);
}

export function subscribePantryItems(
  userId: string,
  onData: (items: PantryItem[]) => void
): Unsubscribe {
  const q = query(userPantryRef(userId), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) =>
      fromFirestoreItem(d.id, d.data() as Record<string, unknown>)
    );
    onData(items);
  });
}

// --- Shopping List CRUD ---

export async function addShoppingItem(
  userId: string,
  item: Omit<ShoppingListItem, "id" | "createdAt" | "updatedAt">
) {
  const data = {
    ...item,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const docRef = await addDoc(userShoppingRef(userId), data);
  return docRef.id;
}

export async function updateShoppingItem(
  userId: string,
  itemId: string,
  updates: Partial<ShoppingListItem>
) {
  const ref = doc(getDb(), "users", userId, "shoppingList", itemId);
  await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() });
}

export async function deleteShoppingItem(userId: string, itemId: string) {
  const ref = doc(getDb(), "users", userId, "shoppingList", itemId);
  await deleteDoc(ref);
}

export function subscribeShoppingItems(
  userId: string,
  onData: (items: ShoppingListItem[]) => void
): Unsubscribe {
  const q = query(userShoppingRef(userId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) =>
      fromFirestoreShoppingItem(d.id, d.data() as Record<string, unknown>)
    );
    onData(items);
  });
}
