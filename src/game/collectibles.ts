import { GAMEPLAY } from "./constants";
import type { CollectibleClass, OrderVisualType } from "../shared/types";

export function collectibleClassForVisual(orderVisualType: OrderVisualType): CollectibleClass {
  return orderVisualType === "parcel" ? "parcel" : "equipment";
}
export function collectibleScore(collectibleClass: CollectibleClass): number {
  return collectibleClass === "equipment"
    ? GAMEPLAY.equipmentScore
    : GAMEPLAY.packageScore;
}
