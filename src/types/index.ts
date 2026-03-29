export type Category =
  | "Produce"
  | "Dairy"
  | "Proteins"
  | "Grains"
  | "Baking"
  | "Oils & Vinegars"
  | "Condiments"
  | "Canned"
  | "Spices"
  | "Frozen"
  | "Beverages"
  | "Snacks"
  | "Household"
  | "Other";

export const CATEGORIES: Category[] = [
  "Produce",
  "Dairy",
  "Proteins",
  "Grains",
  "Baking",
  "Oils & Vinegars",
  "Condiments",
  "Canned",
  "Spices",
  "Frozen",
  "Beverages",
  "Snacks",
  "Household",
  "Other",
];

export const DEFAULT_UNITS = [
  "pieces",
  "cups",
  "lbs",
  "oz",
  "gallons",
  "liters",
  "bottle",
  "bag",
  "box",
  "can",
  "jar",
  "pack",
  "loaf",
  "bunch",
  "dozen",
] as const;

export interface PantryItem {
  id: string;
  name: string;
  category: Category;
  emoji: string;
  quantity: number;
  maxQuantity: number;
  unit: string;
  customUnit?: string;
  barcode?: string;
  brand?: string;
  imageUrl?: string;
  expiryDate?: Date;
  lowStockThreshold: number;
  autoAddToShoppingList: boolean;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  source: "auto" | "manual";
  pantryItemId?: string;
  checked: boolean;
  quantity?: number;
  unit?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type StockLevel = "critical" | "low" | "medium" | "good";

export interface StockInfo {
  level: StockLevel;
  percentage: number;
  color: string;
  label: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  members: Record<string, HouseholdMember>;
  createdAt: Date;
}

export interface HouseholdMember {
  displayName: string;
  email: string;
  photoURL?: string;
  joinedAt: Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  householdId?: string;
}

export interface UserSettings {
  defaultCategories: Category[];
  customUnits: string[];
  lowStockNotifications: boolean;
  expiryNotifications: boolean;
  notificationTime: string;
  theme: "light" | "dark" | "system";
}

export interface ProductLookupResult {
  found: boolean;
  name: string;
  brand?: string;
  category?: Category;
  size?: string;
  imageUrl?: string;
  barcode: string;
}

export interface ClaudeVisionResult {
  name: string;
  brand?: string;
  category: Category;
  suggestedUnit: string;
  emoji: string;
}
