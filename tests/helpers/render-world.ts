import { WarehouseRenderer } from "../../src/game/renderer";
import type { RenderScene } from "../../src/game/types";
import {
  WORLD_ARTWORK_CONTRACT,
  calculateWorldPlateTransform
} from "../../src/visuals/world-plate-transform";

export function renderWorld(
  renderer: WarehouseRenderer,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: Readonly<RenderScene>,
  dpr = 1
): void {
  const geometry = calculateWorldPlateTransform(
    width,
    height,
    WORLD_ARTWORK_CONTRACT
  );
  if (geometry === null) throw new Error("test_world_geometry_invalid");
  renderer.applyGeometry(geometry, { width, height, dpr });
  renderer.render(context, Math.round(width * dpr), Math.round(height * dpr), scene);
}
