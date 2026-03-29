import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "./firebase";
import {
  PantryItem,
  ShoppingListItem,
  Household,
  HouseholdMember,
  UserProfile,
} from "@/types";

// --- Helpers ---

function householdPantryRef(householdId: string) {
  return collection(getDb(), "households", householdId, "pantryItems");
}

function householdShoppingRef(householdId: string) {
  return collection(getDb(), "households", householdId, "shoppingList");
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

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// --- User Profile ---

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const ref = doc(getDb(), "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { uid: userId, ...snap.data() } as UserProfile;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const ref = doc(getDb(), "users", profile.uid);
  await setDoc(ref, {
    displayName: profile.displayName,
    email: profile.email,
    photoURL: profile.photoURL ?? null,
    householdId: profile.householdId ?? null,
  }, { merge: true });
}

// --- Household ---

export async function createHousehold(
  userId: string,
  name: string,
  member: HouseholdMember
): Promise<string> {
  const inviteCode = generateInviteCode();
  const householdRef = await addDoc(collection(getDb(), "households"), {
    name,
    inviteCode,
    createdBy: userId,
    members: { [userId]: { ...member, joinedAt: Timestamp.now() } },
    createdAt: Timestamp.now(),
  });

  // Update user profile with household ID
  await saveUserProfile({
    uid: userId,
    displayName: member.displayName,
    email: member.email,
    photoURL: member.photoURL,
    householdId: householdRef.id,
  });

  return householdRef.id;
}

export async function joinHousehold(
  inviteCode: string,
  userId: string,
  member: HouseholdMember
): Promise<string | null> {
  // Find household by invite code
  const q = query(
    collection(getDb(), "households"),
    where("inviteCode", "==", inviteCode.toUpperCase())
  );
  const snap = await getDocs(q);

  if (snap.empty) return null;

  const householdDoc = snap.docs[0];
  const householdId = householdDoc.id;

  // Add member
  await updateDoc(doc(getDb(), "households", householdId), {
    [`members.${userId}`]: { ...member, joinedAt: Timestamp.now() },
  });

  // Update user profile
  await saveUserProfile({
    uid: userId,
    displayName: member.displayName,
    email: member.email,
    photoURL: member.photoURL,
    householdId,
  });

  return householdId;
}

export async function getHousehold(householdId: string): Promise<Household | null> {
  const ref = doc(getDb(), "households", householdId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: householdId,
    ...data,
    createdAt: toDate(data.createdAt as Timestamp) ?? new Date(),
    members: data.members ?? {},
  } as Household;
}

export function subscribeHousehold(
  householdId: string,
  onData: (household: Household) => void
): Unsubscribe {
  const ref = doc(getDb(), "households", householdId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    onData({
      id: householdId,
      ...data,
      createdAt: toDate(data.createdAt as Timestamp) ?? new Date(),
      members: data.members ?? {},
    } as Household);
  });
}

// --- Pantry CRUD (now under household) ---

export async function addPantryItem(
  householdId: string,
  item: Omit<PantryItem, "id" | "createdAt" | "updatedAt">
) {
  const data = toFirestoreItem({
    ...item,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const docRef = await addDoc(householdPantryRef(householdId), data);
  return docRef.id;
}

export async function updatePantryItem(
  householdId: string,
  itemId: string,
  updates: Partial<PantryItem>
) {
  const ref = doc(getDb(), "households", householdId, "pantryItems", itemId);
  await updateDoc(ref, toFirestoreItem(updates));
}

export async function deletePantryItem(householdId: string, itemId: string) {
  const ref = doc(getDb(), "households", householdId, "pantryItems", itemId);
  await deleteDoc(ref);
}

export function subscribePantryItems(
  householdId: string,
  onData: (items: PantryItem[]) => void
): Unsubscribe {
  const q = query(householdPantryRef(householdId), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) =>
      fromFirestoreItem(d.id, d.data() as Record<string, unknown>)
    );
    onData(items);
  });
}

// --- Shopping List CRUD (now under household) ---

export async function addShoppingItem(
  householdId: string,
  item: Omit<ShoppingListItem, "id" | "createdAt" | "updatedAt">
) {
  const data = {
    ...item,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const docRef = await addDoc(householdShoppingRef(householdId), data);
  return docRef.id;
}

export async function updateShoppingItem(
  householdId: string,
  itemId: string,
  updates: Partial<ShoppingListItem>
) {
  const ref = doc(getDb(), "households", householdId, "shoppingList", itemId);
  await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() });
}

export async function deleteShoppingItem(householdId: string, itemId: string) {
  const ref = doc(getDb(), "households", householdId, "shoppingList", itemId);
  await deleteDoc(ref);
}

export function subscribeShoppingItems(
  householdId: string,
  onData: (items: ShoppingListItem[]) => void
): Unsubscribe {
  const q = query(householdShoppingRef(householdId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) =>
      fromFirestoreShoppingItem(d.id, d.data() as Record<string, unknown>)
    );
    onData(items);
  });
}
