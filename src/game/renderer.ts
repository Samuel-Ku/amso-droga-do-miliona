import { BACKGROUND, BOSS, GROUND_Y, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import type {
  BossModel,
  ObstacleModel,
  PackageModel,
  RenderScene,
  RunnerModel
} from "./types";
import type { PackageType, PowerUpKind } from "../shared/types";

const COLORS = {
  ink: "#17313b",
  inkSoft: "#36515b",
  red: "#e30613",
  redDark: "#b60510",
  orange: "#f4a124",
  wall: "#eaf1f3",
  wallShade: "#d9e4e7",
  floor: "#cbd5d8",
  floorDark: "#aab8bc",
  white: "#ffffff",
  cardboard: "#c98d4f",
  cardboardLight: "#e1ad6d",
  blue: "#4e91ad"
} as const;

interface BackgroundTheme {
  wall: string;
  band: string;
  beam: string;
  beamShade: string;
  window: string;
  windowFrame: string;
  floor: string;
  floorDark: string;
  shelfFrame: string;
  shelfBoard: string;
  shelfPost: string;
  accentA: string;
  accentB: string;
  accentC: string;
  accentWarm: string;
  accentCool: string;
}

const BACKGROUND_THEMES: readonly BackgroundTheme[] = [
  {
    wall: "#eaf1f3",
    band: "#dbe7ea",
    beam: "#8ca0a6",
    beamShade: "#b7c6ca",
    window: "#c3dfe8",
    windowFrame: "#91b9c7",
    floor: "#cbd5d8",
    floorDark: "#aab8bc",
    shelfFrame: "#81959b",
    shelfBoard: "#70868d",
    shelfPost: "#9aabb0",
    accentA: "#536a73",
    accentB: "#b9c7ca",
    accentC: "#a7b8bd",
    accentWarm: "#df6b3b",
    accentCool: "#7da1b0"
  },
  {
    wall: "#e3eef4",
    band: "#cfe4ee",
    beam: "#7fa6b8",
    beamShade: "#aacbdb",
    window: "#bfe6f2",
    windowFrame: "#79b3c6",
    floor: "#c2d4da",
    floorDark: "#9db9c1",
    shelfFrame: "#7d97a0",
    shelfBoard: "#6c8a93",
    shelfPost: "#93b3bd",
    accentA: "#3f6273",
    accentB: "#a9d3e0",
    accentC: "#8fc1cf",
    accentWarm: "#3aa6c2",
    accentCool: "#5fb6cf"
  },
  {
    wall: "#2b3a47",
    band: "#22303b",
    beam: "#3c5160",
    beamShade: "#56707f",
    window: "#284a5c",
    windowFrame: "#5fa8c4",
    floor: "#243440",
    floorDark: "#16212b",
    shelfFrame: "#3a4f5b",
    shelfBoard: "#2f424d",
    shelfPost: "#48636f",
    accentA: "#7fd3e8",
    accentB: "#3a5867",
    accentC: "#ffd23f",
    accentWarm: "#ffb454",
    accentCool: "#6fd0e6"
  },
  {
    wall: "#f4ece1",
    band: "#ecdcc6",
    beam: "#c79a5e",
    beamShade: "#e3bd87",
    window: "#f6e2bf",
    windowFrame: "#c8923f",
    floor: "#e3d3bf",
    floorDark: "#c4ad8e",
    shelfFrame: "#b08a55",
    shelfBoard: "#9a7743",
    shelfPost: "#c6a06a",
    accentA: "#8a5a23",
    accentB: "#e9c98e",
    accentC: "#d8b273",
    accentWarm: "#e30613",
    accentCool: "#5a8aa0"
  },
  {
    wall: "#e8f1e3",
    band: "#d7e8cd",
    beam: "#8aa877",
    beamShade: "#b3cba2",
    window: "#cfe8c4",
    windowFrame: "#6f9c57",
    floor: "#cdd9c4",
    floorDark: "#a9b99c",
    shelfFrame: "#83a06d",
    shelfBoard: "#6f8c59",
    shelfPost: "#9bb585",
    accentA: "#3f5e2c",
    accentB: "#b6d4a4",
    accentC: "#a3c48c",
    accentWarm: "#e08a2b",
    accentCool: "#4e9b6e"
  }
];

function selectBackgroundTheme(distancePixels: number, zonePixels: number): BackgroundTheme {
  const index = Math.floor(Math.max(0, distancePixels) / zonePixels) % BACKGROUND_THEMES.length;
  return BACKGROUND_THEMES[index] ?? BACKGROUND_THEMES[0]!;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function roundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function fillRoundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: string
): void {
  roundedRectangle(context, x, y, width, height, radius);
  context.fillStyle = color;
  context.fill();
}

function drawBackgroundShelf(
  context: CanvasRenderingContext2D,
  x: number,
  variant: number,
  theme: Readonly<BackgroundTheme>
): void {
  context.fillStyle = theme.shelfFrame;
  context.fillRect(x, 190, 8, 181);
  context.fillRect(x + 178, 190, 8, 181);
  for (const y of [196, 273, 350]) {
    context.fillStyle = theme.shelfBoard;
    context.fillRect(x - 4, y, 194, 7);
    context.fillStyle = theme.shelfPost;
    context.fillRect(x, y + 7, 186, 3);
  }

  const accent = variant % 3;
  context.fillStyle = accent === 0 ? theme.accentB : theme.accentC;
  context.fillRect(x + 17, 218, 49, 39);
  context.fillStyle = theme.accentA;
  context.fillRect(x + 23, 223, 37, 25);
  context.fillStyle = "#c5d1d4";
  context.fillRect(x + 79, 226, 32, 31);
  context.fillStyle = accent === 2 ? theme.accentWarm : theme.accentCool;
  context.fillRect(x + 121, 218, 42, 39);

  context.fillStyle = COLORS.cardboard;
  context.fillRect(x + 14, 294, 54, 47);
  context.fillStyle = COLORS.cardboardLight;
  context.fillRect(x + 18, 297, 46, 7);
  context.fillStyle = "#c7d2d4";
  context.fillRect(x + 78, 303, 38, 38);
  context.fillStyle = COLORS.red;
  context.fillRect(x + 129, 314, 37, 27);
}

function drawWarehouse(
  context: CanvasRenderingContext2D,
  distancePixels: number,
  elapsedSeconds: number,
  reducedMotion: boolean,
  theme: Readonly<BackgroundTheme>
): void {
  context.fillStyle = theme.wall;
  context.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);

  context.fillStyle = theme.band;
  context.fillRect(0, 0, WORLD_WIDTH, 72);
  context.fillStyle = COLORS.ink;
  context.fillRect(0, 65, WORLD_WIDTH, 9);

  const beamOffset = -positiveModulo(distancePixels * 0.05, 240);
  for (let x = beamOffset - 40; x < WORLD_WIDTH + 80; x += 240) {
    context.fillStyle = theme.beam;
    context.fillRect(x, 73, 9, 117);
    context.fillStyle = theme.beamShade;
    context.fillRect(x + 9, 73, 4, 117);
  }

  const windowOffset = -positiveModulo(distancePixels * 0.09, 310);
  for (let x = windowOffset; x < WORLD_WIDTH + 180; x += 310) {
    context.fillStyle = theme.window;
    context.fillRect(x + 32, 96, 170, 66);
    context.fillStyle = theme.windowFrame;
    context.fillRect(x + 36, 100, 162, 6);
    context.fillRect(x + 112, 100, 5, 58);
    context.fillStyle = "rgba(255,255,255,0.62)";
    context.fillRect(x + 47, 111, 38, 5);
  }

  const shelfOffset = -positiveModulo(distancePixels * 0.18, 224);
  let shelfIndex = Math.floor((distancePixels * 0.18) / 224);
  for (let x = shelfOffset - 224; x < WORLD_WIDTH + 224; x += 224) {
    drawBackgroundShelf(context, x, shelfIndex, theme);
    shelfIndex += 1;
  }

  context.fillStyle = "rgba(23,49,59,0.08)";
  context.fillRect(0, 376, WORLD_WIDTH, 56);

  context.fillStyle = theme.floor;
  context.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);
  context.fillStyle = theme.floorDark;
  context.fillRect(0, GROUND_Y, WORLD_WIDTH, 7);
  context.fillStyle = "rgba(23,49,59,0.22)";
  context.fillRect(0, GROUND_Y + 70, WORLD_WIDTH, 3);

  const seamOffset = -positiveModulo(distancePixels, 124);
  for (let x = seamOffset; x < WORLD_WIDTH + 124; x += 124) {
    context.fillStyle = "rgba(54,81,91,0.16)";
    context.fillRect(x, GROUND_Y + 8, 3, WORLD_HEIGHT - GROUND_Y - 8);
  }

  const stripeOffset = -positiveModulo(distancePixels * 1.05, 72);
  for (let x = stripeOffset - 72; x < WORLD_WIDTH + 72; x += 72) {
    context.save();
    context.beginPath();
    context.rect(x, GROUND_Y + 12, 40, 7);
    context.clip();
    context.translate(x, GROUND_Y + 12);
    context.rotate(-0.42);
    context.fillStyle = "rgba(244,161,36,0.5)";
    context.fillRect(-12, -15, 16, 45);
    context.restore();
  }

  context.fillStyle = "#ffffff";
  for (let x = 120; x < WORLD_WIDTH; x += 320) {
    const glow = reducedMotion ? 0.86 : 0.82 + Math.sin(elapsedSeconds * 1.7 + x) * 0.04;
    context.globalAlpha = glow;
    context.fillRect(x, 31, 112, 10);
    context.fillStyle = "rgba(255,255,255,0.22)";
    context.beginPath();
    context.moveTo(x + 12, 41);
    context.lineTo(x + 100, 41);
    context.lineTo(x + 126, 111);
    context.lineTo(x - 14, 111);
    context.closePath();
    context.fill();
    context.fillStyle = "#ffffff";
  }
  context.globalAlpha = 1;

  fillRoundedRectangle(context, 28, 92, 92, 42, 5, COLORS.white);
  context.fillStyle = COLORS.red;
  context.font = "800 22px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("AMSO", 74, 113);
  context.textAlign = "start";
  context.textBaseline = "alphabetic";
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function drawCheckMark(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color = "#1f9d55"
): void {
  context.strokeStyle = color;
  context.lineWidth = Math.max(2, size * 0.16);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(x, y + size * 0.48);
  context.lineTo(x + size * 0.34, y + size * 0.82);
  context.lineTo(x + size, y);
  context.stroke();
  context.lineCap = "butt";
  context.lineJoin = "miter";
}

function vignetteDrift(scene: Readonly<RenderScene>, amplitude: number): number {
  if (scene.reducedMotion) return 0;
  return Math.sin(scene.elapsedSeconds * 0.34 + scene.distancePixels * 0.0008) * amplitude;
}

function drawSmallWarehouseVignette(
  context: CanvasRenderingContext2D,
  scene: Readonly<RenderScene>,
  theme: Readonly<BackgroundTheme>
): void {
  const x = 666 + vignetteDrift(scene, 11);
  const y = 213;
  context.save();
  context.globalAlpha = 0.88;

  context.fillStyle = "rgba(255,255,255,0.72)";
  context.fillRect(x - 18, y - 17, 246, 151);
  context.strokeStyle = theme.shelfFrame;
  context.lineWidth = 6;
  context.strokeRect(x, y, 92, 112);
  for (const shelfY of [y + 35, y + 72]) {
    context.beginPath();
    context.moveTo(x, shelfY);
    context.lineTo(x + 92, shelfY);
    context.stroke();
  }
  context.fillStyle = COLORS.cardboard;
  context.fillRect(x + 9, y + 10, 31, 20);
  context.fillRect(x + 49, y + 44, 32, 22);
  context.fillStyle = COLORS.red;
  context.fillRect(x + 48, y + 81, 35, 22);

  context.strokeStyle = COLORS.inkSoft;
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(x + 119, y + 12);
  context.bezierCurveTo(x + 101, y + 37, x + 154, y + 35, x + 132, y + 60);
  context.bezierCurveTo(x + 110, y + 82, x + 169, y + 88, x + 143, y + 112);
  context.stroke();
  context.strokeStyle = COLORS.orange;
  context.lineWidth = 3;
  for (let index = 0; index < 3; index += 1) {
    context.beginPath();
    context.moveTo(x + 167, y + 23 + index * 21);
    context.lineTo(x + 219, y + 23 + index * 21);
    context.stroke();
  }
  context.fillStyle = COLORS.orange;
  context.fillRect(x + 184, y + 89, 19, 20);
  context.beginPath();
  context.arc(x + 204, y + 97, 7, -Math.PI / 2, Math.PI / 2);
  context.strokeStyle = COLORS.orange;
  context.lineWidth = 3;
  context.stroke();
  context.restore();
}

function drawServiceVignette(
  context: CanvasRenderingContext2D,
  scene: Readonly<RenderScene>,
  theme: Readonly<BackgroundTheme>
): void {
  const x = 650 + vignetteDrift(scene, 12);
  const y = 247;
  context.save();
  context.globalAlpha = 0.9;
  context.fillStyle = "rgba(255,255,255,0.74)";
  context.fillRect(x - 18, y - 65, 270, 168);
  context.fillStyle = theme.shelfFrame;
  context.fillRect(x, y + 48, 226, 12);
  context.fillRect(x + 15, y + 60, 9, 44);
  context.fillRect(x + 202, y + 60, 9, 44);

  context.fillStyle = COLORS.inkSoft;
  context.fillRect(x + 43, y - 24, 105, 68);
  context.fillStyle = theme.window;
  context.fillRect(x + 50, y - 17, 91, 54);
  context.fillStyle = "rgba(255,255,255,0.62)";
  context.fillRect(x + 60, y - 8, 38, 5);
  context.fillStyle = COLORS.ink;
  context.beginPath();
  context.moveTo(x + 31, y + 46);
  context.lineTo(x + 161, y + 46);
  context.lineTo(x + 178, y + 55);
  context.lineTo(x + 18, y + 55);
  context.closePath();
  context.fill();

  context.strokeStyle = theme.accentCool;
  context.lineWidth = 5;
  context.beginPath();
  context.arc(x + 195, y - 7, 28, 0, Math.PI * 2);
  context.stroke();
  drawCheckMark(context, x + 177, y - 13, 32, "#1f9d55");
  context.fillStyle = COLORS.orange;
  context.fillRect(x + 188, y + 43, 15, 7);
  context.fillRect(x + 208, y + 35, 7, 15);
  context.restore();
}

function drawClientsVignette(
  context: CanvasRenderingContext2D,
  scene: Readonly<RenderScene>,
  theme: Readonly<BackgroundTheme>
): void {
  const x = 565 + vignetteDrift(scene, 10);
  const baseY = 338;
  context.save();
  context.globalAlpha = 0.88;
  const progress = clamp01(scene.storyProgress ?? 0.5);

  for (let index = 0; index < 3; index += 1) {
    const panelX = x + index * 119;
    const panelY = baseY - 82 - index * 18;
    context.fillStyle = "rgba(255,255,255,0.76)";
    context.fillRect(panelX, panelY, 101, 91 + index * 18);
    context.fillStyle = theme.accentB;
    context.fillRect(panelX + 10, panelY + 11, 80, 44);
    context.fillStyle = COLORS.inkSoft;
    context.fillRect(panelX + 26, panelY + 34, 45, 28);
    context.fillStyle = theme.window;
    context.fillRect(panelX + 31, panelY + 38, 35, 19);
    context.fillStyle = theme.shelfBoard;
    context.fillRect(panelX + 14, panelY + 65, 72, 5);
    context.fillRect(panelX + 22, panelY + 70, 5, 13 + index * 6);
    context.fillRect(panelX + 73, panelY + 70, 5, 13 + index * 6);
  }

  const glowCount = Math.max(1, Math.ceil(progress * 7));
  context.fillStyle = COLORS.orange;
  for (let index = 0; index < glowCount; index += 1) {
    context.globalAlpha = 0.42 + index * 0.05;
    context.beginPath();
    context.arc(x + 18 + index * 48, baseY - 123 - (index % 3) * 13, 5, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 0.9;

  context.fillStyle = "#e08a2b";
  context.beginPath();
  context.ellipse(x + 316, baseY + 1, 27, 20, 0, 0, Math.PI * 2);
  context.fill();
  context.fillRect(x + 296, baseY + 15, 6, 12);
  context.fillRect(x + 327, baseY + 15, 6, 12);
  context.fillStyle = COLORS.ink;
  context.beginPath();
  context.arc(x + 325, baseY - 3, 3, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(x + 306, baseY - 19);
  context.lineTo(x + 321, baseY - 19);
  context.stroke();
  context.restore();
}

function drawScaleVignette(
  context: CanvasRenderingContext2D,
  scene: Readonly<RenderScene>,
  theme: Readonly<BackgroundTheme>
): void {
  const x = 582 + vignetteDrift(scene, 9);
  const y = 170;
  context.save();
  context.globalAlpha = 0.88;

  for (let rack = 0; rack < 3; rack += 1) {
    const rackX = x + rack * 82;
    context.fillStyle = theme.shelfFrame;
    context.fillRect(rackX, y, 7, 191);
    context.fillRect(rackX + 64, y, 7, 191);
    for (let shelf = 0; shelf < 4; shelf += 1) {
      const shelfY = y + 17 + shelf * 45;
      context.fillRect(rackX, shelfY, 71, 5);
      context.fillStyle = shelf % 2 === 0 ? COLORS.cardboard : theme.accentC;
      context.fillRect(rackX + 10, shelfY - 25, 21, 21);
      context.fillRect(rackX + 38, shelfY - 25, 21, 21);
      context.fillStyle = theme.shelfFrame;
    }
  }

  const conveyorY = y + 201;
  context.fillStyle = COLORS.inkSoft;
  context.fillRect(x - 25, conveyorY, 307, 12);
  context.fillStyle = theme.accentCool;
  for (let index = 0; index < 7; index += 1) {
    context.beginPath();
    context.arc(x - 8 + index * 45, conveyorY + 6, 4, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = COLORS.red;
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(x + 253, conveyorY - 52);
  context.lineTo(x + 253, conveyorY + 3);
  context.lineTo(x + 280, conveyorY + 3);
  context.stroke();
  drawCheckMark(context, x + 258, conveyorY - 39, 21);

  context.strokeStyle = theme.accentCool;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x + 280, y + 24);
  context.bezierCurveTo(x + 315, y + 53, x + 292, y + 102, x + 327, y + 132);
  context.lineTo(x + 305, y + 170);
  context.stroke();
  for (const node of [[x + 280, y + 24], [x + 327, y + 132], [x + 305, y + 170]] as const) {
    context.fillStyle = COLORS.orange;
    context.beginPath();
    context.arc(node[0], node[1], 7, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawStorySymbol(
  context: CanvasRenderingContext2D,
  index: number,
  x: number,
  y: number,
  size: number,
  active: boolean
): void {
  context.save();
  context.globalAlpha = active ? 0.96 : 0.2;
  context.strokeStyle = active ? COLORS.orange : COLORS.inkSoft;
  context.fillStyle = active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.28)";
  context.lineWidth = Math.max(2, size * 0.1);
  context.beginPath();
  context.arc(x, y, size * 0.72, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  const left = x - size * 0.38;
  const top = y - size * 0.38;

  switch (index) {
    case 0:
      context.beginPath();
      context.moveTo(left, top + size * 0.12);
      context.lineTo(x + size * 0.16, top + size * 0.12);
      context.lineTo(x + size * 0.4, y);
      context.lineTo(x + size * 0.16, y + size * 0.3);
      context.lineTo(left, y + size * 0.3);
      context.closePath();
      context.stroke();
      context.beginPath();
      context.arc(left + size * 0.13, y, size * 0.05, 0, Math.PI * 2);
      context.fillStyle = COLORS.red;
      context.fill();
      break;
    case 1:
      drawCheckMark(context, left, top + size * 0.16, size * 0.72, active ? "#1f9d55" : COLORS.inkSoft);
      break;
    case 2:
      context.beginPath();
      context.moveTo(x, top);
      context.lineTo(x + size * 0.34, top + size * 0.16);
      context.lineTo(x + size * 0.27, y + size * 0.3);
      context.lineTo(x, y + size * 0.43);
      context.lineTo(x - size * 0.27, y + size * 0.3);
      context.lineTo(x - size * 0.34, top + size * 0.16);
      context.closePath();
      context.stroke();
      break;
    case 3:
      context.strokeRect(left, top, size * 0.76, size * 0.7);
      context.beginPath();
      context.moveTo(left + size * 0.08, y + size * 0.2);
      context.lineTo(x - size * 0.05, y - size * 0.02);
      context.lineTo(x + size * 0.09, y + size * 0.09);
      context.lineTo(x + size * 0.28, y - size * 0.16);
      context.stroke();
      break;
    case 4:
      roundedRectangle(context, left, top + size * 0.08, size * 0.76, size * 0.55, size * 0.08);
      context.stroke();
      context.fillStyle = COLORS.red;
      context.fillRect(left + size * 0.08, top + size * 0.18, size * 0.16, size * 0.15);
      context.fillStyle = COLORS.inkSoft;
      context.fillRect(left + size * 0.31, top + size * 0.2, size * 0.34, size * 0.07);
      context.fillRect(left + size * 0.31, top + size * 0.34, size * 0.25, size * 0.07);
      break;
    case 5:
      context.beginPath();
      context.arc(x, y, size * 0.34, -Math.PI / 2, Math.PI * 1.5);
      context.stroke();
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x, y - size * 0.34);
      context.arc(x, y, size * 0.34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 0.38);
      context.closePath();
      context.fillStyle = COLORS.orange;
      context.fill();
      break;
    case 6:
      fillRoundedRectangle(context, x - size * 0.22, top, size * 0.44, size * 0.58, size * 0.08, COLORS.inkSoft);
      context.fillStyle = active ? "#46d783" : COLORS.wallShade;
      context.fillRect(x - size * 0.13, top + size * 0.1, size * 0.26, size * 0.16);
      context.strokeStyle = COLORS.inkSoft;
      context.beginPath();
      context.moveTo(x + size * 0.2, y + size * 0.09);
      context.lineTo(x + size * 0.4, y + size * 0.3);
      context.stroke();
      break;
    case 7:
      context.beginPath();
      context.moveTo(left, y + size * 0.2);
      context.bezierCurveTo(x - size * 0.08, top, x + size * 0.08, y + size * 0.35, x + size * 0.38, top + size * 0.12);
      context.stroke();
      for (const node of [[left, y + size * 0.2], [x, y], [x + size * 0.38, top + size * 0.12]] as const) {
        context.beginPath();
        context.arc(node[0], node[1], size * 0.08, 0, Math.PI * 2);
        context.fillStyle = COLORS.red;
        context.fill();
      }
      break;
  }
  context.restore();
}

function drawMillionVignette(
  context: CanvasRenderingContext2D,
  scene: Readonly<RenderScene>
): void {
  const phase = scene.reducedMotion ? 0 : scene.elapsedSeconds * 0.65;
  const collected = Math.max(
    0,
    Math.min(
      8,
      Math.floor(
        scene.storySymbols ??
          (scene.storyPhase === "finale" || scene.storyPhase === "completed" ? 8 : 0)
      )
    )
  );
  context.save();
  context.globalAlpha = 0.82;

  for (let index = 0; index < 14; index += 1) {
    const x = 493 + index * 37;
    const y = 278 - Math.sin(index * 0.62 + phase) * 72;
    const size = 15 + (index % 3) * 3;
    context.save();
    context.translate(x, y);
    context.rotate(scene.reducedMotion ? -0.08 : Math.sin(phase + index) * 0.2);
    context.fillStyle = index % 4 === 0 ? COLORS.red : COLORS.cardboard;
    context.fillRect(-size / 2, -size / 2, size, size);
    context.fillStyle = "rgba(255,255,255,0.76)";
    context.fillRect(-size * 0.3, -size * 0.15, size * 0.6, size * 0.23);
    context.restore();
  }

  const centerX = 741;
  const centerY = 212;
  context.strokeStyle = "rgba(244,161,36,0.52)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(centerX, centerY, 119, 0, Math.PI * 2);
  context.stroke();
  for (let index = 0; index < 8; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 8 + (scene.reducedMotion ? 0 : Math.sin(phase) * 0.025);
    drawStorySymbol(
      context,
      index,
      centerX + Math.cos(angle) * 119,
      centerY + Math.sin(angle) * 119,
      24,
      index < collected
    );
  }

  context.fillStyle = COLORS.cardboard;
  context.beginPath();
  context.moveTo(centerX - 38, centerY - 17);
  context.lineTo(centerX, centerY - 39);
  context.lineTo(centerX + 38, centerY - 17);
  context.lineTo(centerX + 32, centerY + 36);
  context.lineTo(centerX - 32, centerY + 36);
  context.closePath();
  context.fill();
  context.strokeStyle = COLORS.cardboardLight;
  context.lineWidth = 5;
  context.stroke();
  context.restore();
}

function drawChallengeVignette(
  context: CanvasRenderingContext2D,
  scene: Readonly<RenderScene>,
  theme: Readonly<BackgroundTheme>
): void {
  const offset = scene.reducedMotion ? 0 : -positiveModulo(scene.distancePixels * 0.12, 260);
  context.save();
  context.globalAlpha = 0.84;
  context.strokeStyle = theme.accentCool;
  context.lineWidth = 4;
  for (let x = offset - 90; x < WORLD_WIDTH + 120; x += 260) {
    context.beginPath();
    context.moveTo(x, 336);
    context.bezierCurveTo(x + 60, 286, x + 126, 363, x + 208, 305);
    context.stroke();
    for (const node of [[x, 336], [x + 102, 326], [x + 208, 305]] as const) {
      context.fillStyle = COLORS.orange;
      context.beginPath();
      context.arc(node[0], node[1], 7, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = COLORS.cardboard;
    context.fillRect(x + 82, 348, 32, 28);
    context.fillStyle = COLORS.white;
    context.fillRect(x + 89, 357, 18, 7);
    context.strokeStyle = COLORS.red;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(x + 142, 278);
    context.lineTo(x + 142, 373);
    context.lineTo(x + 190, 373);
    context.lineTo(x + 190, 278);
    context.stroke();
    drawCheckMark(context, x + 153, 293, 27);
    context.strokeStyle = theme.accentCool;
    context.lineWidth = 4;
  }
  context.restore();
}

function drawNarrativeVignette(
  context: CanvasRenderingContext2D,
  scene: Readonly<RenderScene>,
  theme: Readonly<BackgroundTheme>
): void {
  if (scene.mode === "challenge") {
    drawChallengeVignette(context, scene, theme);
    return;
  }

  const themeIndex = scene.storyPhase === "finale" || scene.storyPhase === "completed"
    ? 4
    : scene.themeIndex;
  switch (themeIndex) {
    case 0:
      drawSmallWarehouseVignette(context, scene, theme);
      break;
    case 1:
      drawServiceVignette(context, scene, theme);
      break;
    case 2:
      drawClientsVignette(context, scene, theme);
      break;
    case 3:
      drawScaleVignette(context, scene, theme);
      break;
    case 4:
      drawMillionVignette(context, scene);
      break;
  }
}

function drawTrustCorridor(
  context: CanvasRenderingContext2D,
  scene: Readonly<RenderScene>,
  theme: Readonly<BackgroundTheme>
): void {
  if (scene.trustCorridor !== true) return;
  const centerX = scene.runner.x + scene.runner.width / 2;
  const centerY = scene.runner.y + scene.runner.height / 2;
  const pulse = scene.reducedMotion ? 0 : Math.sin(scene.elapsedSeconds * 2.4) * 6;

  context.save();
  for (let layer = 3; layer >= 1; layer -= 1) {
    context.globalAlpha = 0.035 + layer * 0.022;
    context.fillStyle = layer % 2 === 0 ? COLORS.orange : "#fff4c2";
    context.beginPath();
    context.arc(centerX, centerY, 70 + layer * 18 + pulse, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 0.72;
  context.strokeStyle = COLORS.orange;
  context.lineWidth = 4;
  context.beginPath();
  context.arc(centerX, centerY, 106 + pulse, 0, Math.PI * 2);
  context.stroke();

  context.globalAlpha = 0.6;
  context.strokeStyle = theme.accentCool;
  context.lineWidth = 4;
  for (let lane = 0; lane < 3; lane += 1) {
    const y = GROUND_Y - 34 + lane * 12;
    context.beginPath();
    context.moveTo(224, y);
    context.bezierCurveTo(414, y - 12, 655, y + 14, WORLD_WIDTH + 10, y - 4);
    context.stroke();
  }
  for (let index = 0; index < 4; index += 1) {
    const x = 312 + index * 176;
    context.fillStyle = "rgba(255,255,255,0.9)";
    context.beginPath();
    context.arc(x, GROUND_Y - 39 + (index % 2) * 12, 15, 0, Math.PI * 2);
    context.fill();
    drawCheckMark(context, x - 8, GROUND_Y - 47 + (index % 2) * 12, 16);
  }
  context.restore();
}

function drawTransformedObstacle(
  context: CanvasRenderingContext2D,
  obstacle: Readonly<ObstacleModel>
): void {
  if (!obstacle.active) return;
  context.save();
  context.globalAlpha = 0.68;
  if (obstacle.kind === "overhead") {
    context.strokeStyle = "#1f9d55";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(obstacle.x, obstacle.y + obstacle.height);
    context.quadraticCurveTo(
      obstacle.x + obstacle.width / 2,
      obstacle.y - 24,
      obstacle.x + obstacle.width,
      obstacle.y + obstacle.height
    );
    context.stroke();
    drawCheckMark(context, obstacle.x + obstacle.width / 2 - 10, obstacle.y + 8, 20);
  } else {
    context.fillStyle = COLORS.inkSoft;
    context.fillRect(obstacle.x - 12, GROUND_Y - 14, obstacle.width + 24, 8);
    context.fillStyle = COLORS.cardboard;
    context.fillRect(obstacle.x + obstacle.width / 2 - 17, GROUND_Y - 43, 34, 28);
    context.fillStyle = COLORS.white;
    context.fillRect(obstacle.x + obstacle.width / 2 - 10, GROUND_Y - 36, 20, 7);
    drawCheckMark(context, obstacle.x + obstacle.width / 2 - 8, GROUND_Y - 69, 17);
  }
  context.restore();
}

const POWER_UP_COLORS: Readonly<Record<PowerUpKind, string>> = {
  gwarancja_48: "#1f9d55",
  audyt_jakosci: "#3aa6c2",
  drugie_zycie: "#e08a2b"
};

const POWER_UP_GLYPH: Readonly<Record<PowerUpKind, string>> = {
  gwarancja_48: "48",
  audyt_jakosci: "A",
  drugie_zycie: "2x"
};

const PACKAGE_TYPE_ACCENT: Readonly<Record<PackageType, string>> = {
  notebook: "#3aa6c2",
  telefon: "#7b492d",
  pc: "#536a73",
  lcd: "#5a8aa0"
};

function drawParcel(
  context: CanvasRenderingContext2D,
  parcel: Readonly<PackageModel>,
  scene: Readonly<RenderScene>
): void {
  if (!parcel.active) return;
  const bob = scene.reducedMotion
    ? 0
    : Math.sin(scene.elapsedSeconds * 4.4 + parcel.phase) * 3;
  const x = parcel.x;
  const y = parcel.y + bob;
  const size = parcel.size;

  if (parcel.kind === "golden") {
    context.save();
    context.shadowColor = "rgba(255, 210, 63, 0.72)";
    context.shadowBlur = scene.reducedMotion ? 7 : 11 + Math.sin(scene.elapsedSeconds * 5) * 3;
    fillRoundedRectangle(context, x - 2, y - 2, size + 4, size + 4, 6, "#ffd23f");
    context.shadowBlur = 0;
    context.fillStyle = "#ffec8a";
    context.fillRect(x + 3, y + 3, size - 6, 6);
    context.fillStyle = "#d59c00";
    context.fillRect(x + size / 2 - 2, y, 5, size);
    context.fillStyle = COLORS.red;
    context.beginPath();
    const centerX = x + size / 2;
    const centerY = y + size / 2 + 1;
    for (let index = 0; index < 10; index += 1) {
      const radius = index % 2 === 0 ? 8 : 3.5;
      const angle = -Math.PI / 2 + (Math.PI * index) / 5;
      const pointX = centerX + Math.cos(angle) * radius;
      const pointY = centerY + Math.sin(angle) * radius;
      if (index === 0) context.moveTo(pointX, pointY);
      else context.lineTo(pointX, pointY);
    }
    context.closePath();
    context.fill();
    context.restore();
    return;
  }

  if (parcel.kind !== "standard") {
    const color = POWER_UP_COLORS[parcel.kind as PowerUpKind] ?? COLORS.red;
    const glyph = POWER_UP_GLYPH[parcel.kind as PowerUpKind] ?? "★";
    context.save();
    context.shadowColor = color;
    context.shadowBlur = scene.reducedMotion ? 7 : 12 + Math.sin(scene.elapsedSeconds * 5) * 3;
    fillRoundedRectangle(context, x - 2, y - 2, size + 4, size + 4, 8, color);
    context.shadowBlur = 0;
    context.fillStyle = "rgba(255,255,255,0.92)";
    context.font = "800 16px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(glyph, x + size / 2, y + size / 2 + 1);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.restore();
    return;
  }

  const accent = PACKAGE_TYPE_ACCENT[parcel.packageType] ?? COLORS.red;
  context.fillStyle = "rgba(23,49,59,0.14)";
  context.beginPath();
  context.ellipse(x + size / 2, y + size + 7, size * 0.48, 4, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = COLORS.cardboard;
  context.fillRect(x, y, size, size);
  context.fillStyle = COLORS.cardboardLight;
  context.fillRect(x + 3, y + 3, size - 6, 6);
  context.fillStyle = "#9e6938";
  context.fillRect(x + size / 2 - 2, y, 5, size);
  context.fillStyle = COLORS.white;
  context.fillRect(x + 5, y + 13, size - 10, 10);
  context.fillStyle = accent;
  context.fillRect(x + 8, y + 16, size - 16, 4);
}

function drawBossStatus(
  context: CanvasRenderingContext2D,
  boss: Readonly<BossModel>
): void {
  const color = boss.phase === "reward" ? "#1f9d55" : COLORS.red;
  const segmentGap = 6;
  const segmentWidth = 70;
  const totalWidth = boss.attackCount * segmentWidth + (boss.attackCount - 1) * segmentGap;
  const panelX = (WORLD_WIDTH - totalWidth) / 2 - 14;
  const panelWidth = totalWidth + 28;
  const panelY = 108;
  const panelHeight = 28;

  fillRoundedRectangle(context, panelX, panelY, panelWidth, panelHeight, 14, "rgba(13, 35, 44, 0.92)");
  context.strokeStyle = color;
  context.lineWidth = 2;
  roundedRectangle(context, panelX, panelY, panelWidth, panelHeight, 14);
  context.stroke();

  let x = (WORLD_WIDTH - totalWidth) / 2;
  for (let index = 0; index < boss.attackCount; index += 1) {
    const segmentColor =
      index < boss.attacksSurvived ? "#ffd23f" : "rgba(255,255,255,0.2)";
    fillRoundedRectangle(context, x, panelY + 11, segmentWidth, 6, 3, segmentColor);
    x += segmentWidth + segmentGap;
  }
}

function drawForkliftBoss(
  context: CanvasRenderingContext2D,
  boss: Readonly<BossModel>,
  elapsedSeconds: number,
  reducedMotion: boolean
): void {
  if (boss.phase === "inactive" || boss.phase === "pending") return;

  drawBossStatus(context, boss);
  const bob = reducedMotion ? 0 : Math.sin(elapsedSeconds * 5.2) * 2;
  const x = reducedMotion ? WORLD_WIDTH - 160 : boss.x;
  const y = boss.y + bob;

  context.save();
  if (boss.phase === "warning") {
    context.globalAlpha = 0.72;
  } else if (boss.phase === "reward") {
    context.globalAlpha = Math.max(0.35, boss.phaseSecondsRemaining / BOSS.rewardSeconds);
  }

  context.fillStyle = "rgba(23,49,59,0.22)";
  context.beginPath();
  context.ellipse(x + 82, GROUND_Y + 5, 94, 12, 0, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = COLORS.ink;
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(x + 16, y + 18);
  context.lineTo(x + 16, y + 145);
  context.moveTo(x - 6, y + 145);
  context.lineTo(x + 57, y + 145);
  context.stroke();
  context.fillStyle = COLORS.orange;
  context.fillRect(x - 7, y + 148, 78, 9);

  fillRoundedRectangle(context, x + 38, y + 62, 118, 92, 17, COLORS.red);
  fillRoundedRectangle(context, x + 69, y + 26, 70, 64, 14, COLORS.inkSoft);
  context.fillStyle = "#b9dbe6";
  context.fillRect(x + 78, y + 35, 51, 34);
  context.fillStyle = "rgba(255,255,255,0.65)";
  context.fillRect(x + 84, y + 41, 35, 5);

  context.fillStyle = COLORS.orange;
  context.beginPath();
  context.arc(x + 55, y + 53, 8, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = boss.phase === "reward" ? "#46d783" : "#ffec8a";
  context.beginPath();
  context.arc(x + 55, y + 53, 4, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = COLORS.ink;
  for (const wheelX of [x + 64, x + 132]) {
    context.beginPath();
    context.arc(wheelX, y + 154, 19, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#81959b";
    context.beginPath();
    context.arc(wheelX, y + 154, 8, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = COLORS.ink;
  }
  context.restore();
}

function drawBoxStack(context: CanvasRenderingContext2D, obstacle: Readonly<ObstacleModel>): void {
  const { x, y, width, height } = obstacle;
  context.fillStyle = "rgba(23,49,59,0.16)";
  context.fillRect(x - 7, y + height + 4, width + 14, 6);
  context.fillStyle = "#987042";
  context.fillRect(x - 4, y + height - 7, width + 8, 7);
  context.fillStyle = COLORS.cardboard;
  context.fillRect(x, y + 25, width, height - 25);
  context.fillStyle = COLORS.cardboardLight;
  context.fillRect(x + 4, y + 29, width - 8, 7);
  context.fillStyle = "#a86f3e";
  context.fillRect(x + width / 2 - 2, y + 25, 5, height - 25);
  context.fillStyle = "#d59b5a";
  context.fillRect(x + 7, y, width - 13, 28);
  context.fillStyle = "#9f6838";
  context.fillRect(x + 10, y + 4, width - 19, 4);
  context.fillStyle = COLORS.white;
  context.fillRect(x + 7, y + 41, 19, 9);
  context.fillStyle = COLORS.red;
  context.fillRect(x + 10, y + 44, 13, 3);
}

function drawPallet(context: CanvasRenderingContext2D, obstacle: Readonly<ObstacleModel>): void {
  const { x, y, width, height } = obstacle;
  context.fillStyle = "rgba(23,49,59,0.16)";
  context.fillRect(x - 7, y + height + 4, width + 14, 6);
  context.fillStyle = "#79593b";
  context.fillRect(x, y + height - 12, width, 8);
  context.fillRect(x + 7, y + height - 4, 12, 4);
  context.fillRect(x + width - 20, y + height - 4, 12, 4);
  context.fillStyle = "#a9b7bb";
  context.fillRect(x + 6, y, width - 12, height - 14);
  context.fillStyle = "#dbe3e5";
  context.fillRect(x + 11, y + 4, width - 22, 5);
  context.fillStyle = COLORS.blue;
  context.fillRect(x + 17, y + 11, 17, 8);
  context.fillRect(x + 43, y + 11, 17, 8);
  context.strokeStyle = "rgba(255,255,255,0.72)";
  context.lineWidth = 3;
  context.strokeRect(x + 4, y + 1, width - 8, height - 14);
}

function drawTrolley(context: CanvasRenderingContext2D, obstacle: Readonly<ObstacleModel>): void {
  const { x, y, width, height } = obstacle;
  context.fillStyle = "rgba(23,49,59,0.16)";
  context.fillRect(x - 8, y + height + 4, width + 16, 6);
  context.strokeStyle = COLORS.inkSoft;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(x + 12, y + 5);
  context.lineTo(x + 4, y + 5);
  context.lineTo(x + 4, y + height - 8);
  context.stroke();
  fillRoundedRectangle(context, x + 10, y + 14, width - 9, height - 20, 5, COLORS.orange);
  context.fillStyle = "#ffc45e";
  context.fillRect(x + 16, y + 19, width - 21, 6);
  context.fillStyle = COLORS.ink;
  context.beginPath();
  context.arc(x + 19, y + height - 1, 7, 0, Math.PI * 2);
  context.arc(x + width - 13, y + height - 1, 7, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#71858c";
  context.beginPath();
  context.arc(x + 19, y + height - 1, 3, 0, Math.PI * 2);
  context.arc(x + width - 13, y + height - 1, 3, 0, Math.PI * 2);
  context.fill();
}

function drawOverhead(context: CanvasRenderingContext2D, obstacle: Readonly<ObstacleModel>): void {
  const { x, y, width, height } = obstacle;
  context.fillStyle = "rgba(23,49,59,0.16)";
  context.fillRect(x - 7, y - 6, width + 14, 6);
  context.fillStyle = COLORS.ink;
  context.fillRect(x - 8, 0, 10, y + 8);
  context.fillRect(x + width - 2, 0, 10, y + 8);
  fillRoundedRectangle(context, x, y, width, height, 8, COLORS.inkSoft);
  context.fillStyle = COLORS.orange;
  context.fillRect(x + 6, y + 12, width - 12, 7);
  context.fillStyle = "rgba(255,255,255,0.16)";
  context.fillRect(x + 6, y + height - 26, width - 12, 18);
  context.strokeStyle = "rgba(23,49,59,0.5)";
  context.lineWidth = 3;
  context.beginPath();
  for (let stripeX = x + 7; stripeX < x + width - 7; stripeX += 16) {
    context.moveTo(stripeX, y + 24);
    context.lineTo(stripeX + 9, y + 24);
  }
  context.stroke();
}

function drawObstacle(context: CanvasRenderingContext2D, obstacle: Readonly<ObstacleModel>): void {
  if (!obstacle.active) return;
  switch (obstacle.kind) {
    case "box-stack":
      drawBoxStack(context, obstacle);
      break;
    case "pallet":
      drawPallet(context, obstacle);
      break;
    case "trolley":
      drawTrolley(context, obstacle);
      break;
    case "overhead":
      drawOverhead(context, obstacle);
      break;
  }
}

function drawFirstAmsoParcel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1
): void {
  const width = 25 * scale;
  const height = 31 * scale;
  context.save();
  context.fillStyle = "rgba(23,49,59,0.18)";
  context.fillRect(x - 3 * scale, y + 4 * scale, width + 6 * scale, height);
  fillRoundedRectangle(context, x, y, width, height, 3 * scale, COLORS.cardboard);
  context.fillStyle = COLORS.cardboardLight;
  context.fillRect(x + 3 * scale, y + 3 * scale, width - 6 * scale, 5 * scale);
  context.fillStyle = "#9e6938";
  context.fillRect(x + width / 2 - 1.5 * scale, y, 3 * scale, height);
  context.fillStyle = COLORS.white;
  context.fillRect(x + 4 * scale, y + 12 * scale, width - 8 * scale, 10 * scale);
  context.fillStyle = COLORS.red;
  context.fillRect(x + 7 * scale, y + 15 * scale, width - 14 * scale, 2.5 * scale);
  context.fillRect(x + 7 * scale, y + 19 * scale, width - 17 * scale, 2 * scale);
  context.strokeStyle = COLORS.inkSoft;
  context.lineWidth = 2 * scale;
  context.beginPath();
  context.moveTo(x + width - 1 * scale, y + 7 * scale);
  context.lineTo(x + width + 7 * scale, y + 13 * scale);
  context.stroke();
  context.restore();
}

function drawTrustSpark(
  context: CanvasRenderingContext2D,
  runner: Readonly<RunnerModel>,
  scene: Readonly<RenderScene>
): void {
  const combo = Math.max(1, scene.combo ?? 1);
  const recovering = (scene.recoverySeconds ?? 0) > 0;
  const comboGrowth = Math.min(18, Math.sqrt(combo - 1) * 3.4);
  const pulse = scene.reducedMotion ? 0 : Math.sin(scene.elapsedSeconds * 5.1) * 2;
  const radius = 7 + comboGrowth + pulse;
  const x = runner.x - 8;
  const y = runner.y + (runner.crouching ? 53 : 36);
  const alpha = recovering ? 0.28 : 0.82;

  context.save();
  context.globalAlpha = alpha * 0.18;
  context.fillStyle = "#fff4b0";
  context.beginPath();
  context.arc(x, y, radius * 1.9, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = alpha * 0.4;
  context.fillStyle = COLORS.orange;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = alpha;
  context.fillStyle = "#fff7cf";
  context.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * index) / 4;
    const pointRadius = index % 2 === 0 ? radius : radius * 0.34;
    const pointX = x + Math.cos(angle) * pointRadius;
    const pointY = y + Math.sin(angle) * pointRadius;
    if (index === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  }
  context.closePath();
  context.fill();
  context.restore();
}

function drawCrouchingCourier(
  context: CanvasRenderingContext2D,
  runner: Readonly<RunnerModel>
): void {
  const x = runner.x;
  const y = runner.y + 14;

  context.fillStyle = "rgba(23,49,59,0.2)";
  context.beginPath();
  context.ellipse(x + runner.width / 2, GROUND_Y + 3, 30, 6, 0, 0, Math.PI * 2);
  context.fill();

  drawFirstAmsoParcel(context, x - 4, y + 31, 0.92);

  context.strokeStyle = COLORS.ink;
  context.lineWidth = 9;
  context.lineCap = "square";
  context.beginPath();
  context.moveTo(x + 22, y + 60);
  context.lineTo(x + 14, y + 78);
  context.moveTo(x + 40, y + 60);
  context.lineTo(x + 49, y + 78);
  context.stroke();
  context.strokeStyle = COLORS.white;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(x + 11, y + 80);
  context.lineTo(x + 22, y + 80);
  context.moveTo(x + 40, y + 80);
  context.lineTo(x + 52, y + 80);
  context.stroke();

  context.strokeStyle = COLORS.redDark;
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(x + 15, y + 36);
  context.lineTo(x + 7, y + 54);
  context.moveTo(x + 45, y + 36);
  context.lineTo(x + 53, y + 52);
  context.stroke();

  fillRoundedRectangle(context, x + 13, y + 32, 36, 30, 7, COLORS.red);
  context.fillStyle = COLORS.redDark;
  context.fillRect(x + 13, y + 50, 36, 7);
  context.fillStyle = COLORS.white;
  context.fillRect(x + 21, y + 39, 20, 11);
  context.fillStyle = COLORS.red;
  context.fillRect(x + 25, y + 42, 12, 4);

  fillRoundedRectangle(context, x + 4, y + 34, 12, 24, 3, COLORS.inkSoft);
  context.fillStyle = COLORS.orange;
  context.fillRect(x + 7, y + 38, 6, 11);

  context.fillStyle = "#f0bf94";
  context.beginPath();
  context.arc(x + 33, y + 23, 13, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#7b492d";
  context.fillRect(x + 42, y + 22, 5, 4);
  context.fillStyle = COLORS.ink;
  context.fillRect(x + 37, y + 19, 3, 3);

  context.fillStyle = COLORS.red;
  context.fillRect(x + 17, y + 8, 30, 9);
  context.fillRect(x + 13, y + 14, 34, 5);
  context.fillStyle = COLORS.white;
  context.fillRect(x + 25, y + 11, 13, 3);
  context.lineCap = "butt";
}

function drawCourier(
  context: CanvasRenderingContext2D,
  runner: Readonly<RunnerModel>,
  scene: Readonly<RenderScene>
): void {
  if (runner.crouching) {
    drawCrouchingCourier(context, runner);
    return;
  }
  const stride = runner.grounded && !scene.reducedMotion
    ? Math.sin(scene.elapsedSeconds * Math.max(12, scene.speed * 0.075))
    : 0;
  const bob = runner.grounded && !scene.reducedMotion ? Math.abs(stride) * -1.8 : 0;
  const x = runner.x;
  const y = runner.y + bob;

  context.fillStyle = "rgba(23,49,59,0.2)";
  context.beginPath();
  context.ellipse(
    x + runner.width / 2,
    GROUND_Y + 3,
    runner.grounded ? 29 : 19,
    runner.grounded ? 6 : 4,
    0,
    0,
    Math.PI * 2
  );
  context.fill();

  drawFirstAmsoParcel(context, x - 5, y + 26);

  context.strokeStyle = COLORS.ink;
  context.lineWidth = 9;
  context.lineCap = "square";
  context.beginPath();
  if (runner.grounded) {
    context.moveTo(x + 25, y + 58);
    context.lineTo(x + 22 - stride * 8, y + 78);
    context.moveTo(x + 37, y + 58);
    context.lineTo(x + 42 + stride * 8, y + 78);
  } else {
    context.moveTo(x + 25, y + 58);
    context.lineTo(x + 17, y + 71);
    context.lineTo(x + 29, y + 76);
    context.moveTo(x + 37, y + 58);
    context.lineTo(x + 47, y + 67);
    context.lineTo(x + 43, y + 78);
  }
  context.stroke();
  context.strokeStyle = COLORS.white;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(x + 13 - stride * 8, y + 80);
  context.lineTo(x + 25 - stride * 8, y + 80);
  context.moveTo(x + 37 + stride * 8, y + 80);
  context.lineTo(x + 52 + stride * 8, y + 80);
  context.stroke();

  context.strokeStyle = COLORS.redDark;
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(x + 17, y + 35);
  context.lineTo(x + 8 - stride * 7, y + 52);
  context.moveTo(x + 44, y + 35);
  context.lineTo(x + 52 + stride * 7, y + 50);
  context.stroke();

  fillRoundedRectangle(context, x + 14, y + 27, 35, 36, 7, COLORS.red);
  context.fillStyle = COLORS.redDark;
  context.fillRect(x + 14, y + 49, 35, 8);
  context.fillStyle = COLORS.white;
  context.fillRect(x + 22, y + 36, 20, 12);
  context.fillStyle = COLORS.red;
  context.fillRect(x + 26, y + 40, 12, 4);

  fillRoundedRectangle(context, x + 5, y + 30, 12, 27, 3, COLORS.inkSoft);
  context.fillStyle = COLORS.orange;
  context.fillRect(x + 8, y + 35, 6, 12);

  context.fillStyle = "#f0bf94";
  context.beginPath();
  context.arc(x + 32, y + 17, 14, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#7b492d";
  context.fillRect(x + 42, y + 16, 5, 4);
  context.fillStyle = COLORS.ink;
  context.fillRect(x + 37, y + 13, 3, 3);

  context.fillStyle = COLORS.red;
  context.fillRect(x + 17, y + 2, 30, 9);
  context.fillRect(x + 13, y + 9, 34, 5);
  context.fillStyle = COLORS.white;
  context.fillRect(x + 25, y + 5, 13, 3);

  if (scene.impact) {
    context.strokeStyle = COLORS.orange;
    context.lineWidth = 4;
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const centerX = x + runner.width + 5;
      const centerY = y + 38;
      context.beginPath();
      context.moveTo(centerX + Math.cos(angle) * 10, centerY + Math.sin(angle) * 10);
      context.lineTo(centerX + Math.cos(angle) * 20, centerY + Math.sin(angle) * 20);
      context.stroke();
    }
  }
  context.lineCap = "butt";
}

export class WarehouseRenderer {
  render(
    context: CanvasRenderingContext2D,
    pixelWidth: number,
    pixelHeight: number,
    scene: Readonly<RenderScene>
  ): void {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.fillStyle = COLORS.ink;
    context.fillRect(0, 0, pixelWidth, pixelHeight);

    const scale = Math.min(pixelWidth / WORLD_WIDTH, pixelHeight / WORLD_HEIGHT);
    const viewportWidth = WORLD_WIDTH * scale;
    const viewportHeight = WORLD_HEIGHT * scale;
    const offsetX = (pixelWidth - viewportWidth) / 2;
    const offsetY = (pixelHeight - viewportHeight) / 2;

    context.save();
    context.translate(offsetX, offsetY);
    context.scale(scale, scale);
    context.beginPath();
    context.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    context.clip();
    context.imageSmoothingEnabled = false;

    const theme = scene.mode === "challenge"
      ? BACKGROUND_THEMES[1]!
      : scene.themeIndex >= 0 && scene.themeIndex < BACKGROUND_THEMES.length
        ? BACKGROUND_THEMES[scene.themeIndex]!
        : selectBackgroundTheme(scene.distancePixels, BACKGROUND.zonePixels);

    drawWarehouse(
      context,
      scene.distancePixels,
      scene.elapsedSeconds,
      scene.reducedMotion,
      theme
    );
    drawNarrativeVignette(context, scene, theme);
    drawTrustCorridor(context, scene, theme);
    drawForkliftBoss(
      context,
      scene.boss,
      scene.elapsedSeconds,
      scene.reducedMotion
    );
    for (const parcel of scene.packages) drawParcel(context, parcel, scene);
    for (const obstacle of scene.obstacles) {
      if (scene.trustCorridor === true) drawTransformedObstacle(context, obstacle);
      else drawObstacle(context, obstacle);
    }
    drawCourier(context, scene.runner, scene);
    drawTrustSpark(context, scene.runner, scene);

    if (scene.cutscene) {
      context.fillStyle = "rgba(17,39,48,0.86)";
      context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      context.fillStyle = "rgba(255,255,255,0.65)";
      context.font = "700 22px system-ui, sans-serif";
      context.textAlign = "center";
      context.fillText(scene.cutscene.subtitle, WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 12);
      context.fillStyle = "#ffffff";
      context.font = "800 46px system-ui, sans-serif";
      context.fillText(scene.cutscene.title, WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 28);
      context.textAlign = "start";
    } else if (scene.state === "paused") {
      context.fillStyle = "rgba(17,39,48,0.22)";
      context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      fillRoundedRectangle(context, WORLD_WIDTH / 2 - 31, WORLD_HEIGHT / 2 - 31, 62, 62, 12, "rgba(255,255,255,0.9)");
      context.fillStyle = COLORS.ink;
      context.fillRect(WORLD_WIDTH / 2 - 13, WORLD_HEIGHT / 2 - 14, 9, 28);
      context.fillRect(WORLD_WIDTH / 2 + 5, WORLD_HEIGHT / 2 - 14, 9, 28);
    } else if (scene.state === "game_over") {
      context.fillStyle = "rgba(227,6,19,0.08)";
      context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    if (scene.activePowerUps.length > 0 && !scene.cutscene) {
      let badgeX = WORLD_WIDTH - 24;
      for (const powerUp of scene.activePowerUps) {
        const color = POWER_UP_COLORS[powerUp] ?? COLORS.red;
        fillRoundedRectangle(context, badgeX - 34, 18, 30, 22, 6, color);
        context.fillStyle = "rgba(255,255,255,0.95)";
        context.font = "800 12px system-ui, sans-serif";
        context.textAlign = "center";
        context.fillText(POWER_UP_GLYPH[powerUp] ?? "★", badgeX - 19, 33);
        context.textAlign = "start";
        badgeX -= 40;
      }
    }
    context.restore();
  }
}
