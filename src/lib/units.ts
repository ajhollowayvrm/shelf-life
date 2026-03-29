import { DEFAULT_UNITS } from "@/types";

export function getAllUnits(customUnits: string[]): string[] {
  return [...DEFAULT_UNITS, ...customUnits];
}

export function getStepForUnit(unit: string): number {
  switch (unit) {
    case "pieces":
    case "bottle":
    case "bag":
    case "box":
    case "can":
    case "jar":
    case "pack":
      return 1;
    case "cups":
    case "lbs":
    case "oz":
    case "gallons":
    case "liters":
      return 0.5;
    default:
      return 1;
  }
}
