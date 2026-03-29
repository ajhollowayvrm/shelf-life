import { PantryItem, StockInfo } from "@/types";

export function getStockLevel(item: PantryItem): StockInfo {
  const pct = item.maxQuantity > 0 ? item.quantity / item.maxQuantity : 0;

  if (pct <= 0.15)
    return { level: "critical", percentage: pct, color: "#E53935", label: "Out" };
  if (pct <= 0.35)
    return { level: "low", percentage: pct, color: "#F4811A", label: "Low" };
  if (pct <= 0.7)
    return { level: "medium", percentage: pct, color: "#7CB342", label: "OK" };
  return { level: "good", percentage: pct, color: "#2E7D32", label: "Stocked" };
}

export function isExpiringSoon(date: Date): boolean {
  const diff = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 7 && diff > 0;
}

export function isExpired(date: Date): boolean {
  return date < new Date();
}

export function getExpiryLabel(date: Date): string | null {
  if (isExpired(date)) return "Expired";
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 1) return "Expires today";
  if (days <= 7) return `Expires in ${days}d`;
  return null;
}
