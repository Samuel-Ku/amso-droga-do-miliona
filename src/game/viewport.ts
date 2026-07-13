import { CANVAS_LIMITS } from "./constants";

export interface CanvasBufferSize {
  width: number;
  height: number;
  dpr: number;
}

export function calculateCanvasBuffer(
  cssWidth: number,
  cssHeight: number,
  requestedDpr: number,
  maxPixels = CANVAS_LIMITS.maxPixels,
  maxDimension = CANVAS_LIMITS.maxDimension
): CanvasBufferSize {
  const width = Math.max(1, Number.isFinite(cssWidth) ? cssWidth : 1);
  const height = Math.max(1, Number.isFinite(cssHeight) ? cssHeight : 1);
  const dpr = Math.max(
    1,
    Math.min(CANVAS_LIMITS.maxDpr, Number.isFinite(requestedDpr) ? requestedDpr : 1)
  );
  const pixelScale = Math.min(
    dpr,
    Math.sqrt(Math.max(1, maxPixels) / (width * height)),
    Math.max(1, maxDimension) / width,
    Math.max(1, maxDimension) / height
  );

  const bufferWidth = Math.max(1, Math.floor(width * pixelScale));
  const bufferHeight = Math.max(1, Math.floor(height * pixelScale));
  return {
    width: bufferWidth,
    height: bufferHeight,
    dpr: Math.min(bufferWidth / width, bufferHeight / height)
  };
}
