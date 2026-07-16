import { BACKGROUND, BOSS, GROUND_Y, WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import type {
  BossModel,
  ObstacleModel,
  PackageModel,
  RenderScene,
  RunnerModel
} from "./types";
import type { PackageType, PowerUpKind } from "../shared/types";
import type { StoryObstacleTransformation } from "./story-effects";
import {
  COURIER_PALETTE,
  DEFAULT_COURIER_BRAND_ARTWORK,
  type CourierBrandArtwork
} from "./courier-brand";
import {
  WORLD_ROUTE_ACCENT_WIDTH,
  WORLD_ROUTE_BASE_COLOR,
  WORLD_ROUTE_BASE_OFFSET_Y,
  WORLD_ROUTE_BASE_WIDTH,
  WORLD_ROUTE_GRADIENT_STOPS,
  WORLD_ROUTE_Y
} from "../visuals/world-route";

const COLORS = {
  ink: "#171717",
  inkSoft: "#44413d",
  red: "#f04f45",
  redDark: "#eb32a4",
  orange: "#f47100",
  wall: "#faf7f0",
  wallShade: "#e4ded5",
  floor: "#d8d2c8",
  floorDark: "#aaa39a",
  white: "#ffffff",
  cardboard: "#c8a27b",
  cardboardLight: "#dfbd98",
  blue: "#eb32a4"
} as const;

const INTEGER_FORMATTER = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });

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
  color = "#eb32a4"
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
  context.lineWidth = 4;
  context.strokeRect(x + 112, y + 10, 48, 104);
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
  drawCheckMark(context, x + 177, y - 13, 32, "#eb32a4");
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

  context.fillStyle = "#f47100";
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
  context.lineWidth = 4;
  context.strokeRect(x + 280, y + 24, 47, 146);
  context.fillStyle = COLORS.cardboard;
  context.fillRect(x + 287, y + 104, 33, 27);
  context.fillStyle = COLORS.orange;
  context.fillRect(x + 287, y + 138, 33, 24);
  context.restore();
}

function drawMillionVignette(
  context: CanvasRenderingContext2D,
  scene: Readonly<RenderScene>
): void {
  const finale = scene.storyObjectives?.epoch5.millionThreshold;
  const completed = finale?.completed === true || scene.storyPhase === "finale" ||
    scene.storyPhase === "completed";
  const counter = finale?.counterValue ?? (completed ? 1_000_000 : 999_970);
  context.save();
  const frame = completed
    ? context.createLinearGradient(560, 0, 914, 0)
    : COLORS.inkSoft;
  if (completed && typeof frame !== "string") {
    frame.addColorStop(0, "#f47100");
    frame.addColorStop(0.52, "#f04f45");
    frame.addColorStop(1, "#eb32a4");
  }
  fillRoundedRectangle(context, 565, 74, 348, 112, 18, COLORS.white);
  context.strokeStyle = frame;
  context.lineWidth = 8;
  roundedRectangle(context, 565, 74, 348, 112, 18);
  context.stroke();
  context.fillStyle = frame;
  context.font = "950 44px ui-monospace, monospace";
  context.textAlign = "center";
  context.fillText(INTEGER_FORMATTER.format(counter), 739, 133);
  context.fillStyle = COLORS.inkSoft;
  context.font = "850 16px system-ui, sans-serif";
  context.fillText("ZAMÓWIEŃ", 739, 163);

  for (let index = 0; index < (completed ? 8 : 4); index += 1) {
    const x = 579 + index * 43;
    const y = 223 + (index % 2) * 39;
    context.fillStyle = index % 3 === 0 ? COLORS.red : COLORS.cardboard;
    context.fillRect(x, y, 34, 29);
    context.fillStyle = COLORS.white;
    context.fillRect(x + 6, y + 9, 22, 7);
  }
  if (completed) {
    context.strokeStyle = frame;
    context.lineWidth = 9;
    context.beginPath();
    context.moveTo(530, 318);
    context.lineTo(913, 318);
    context.stroke();
    drawCheckMark(context, 838, 250, 45, "#eb32a4");
  }
  context.restore();
}

function drawChallengeVignette(
  context: CanvasRenderingContext2D,
  scene: Readonly<RenderScene>,
  theme: Readonly<BackgroundTheme>
): void {
  const offset = scene.reducedMotion ? 0 : -positiveModulo(scene.distancePixels * 0.12, 220);
  context.save();
  context.globalAlpha = 0.78;
  context.fillStyle = "rgba(23,23,23,0.08)";
  context.fillRect(0, 300, WORLD_WIDTH, 92);
  context.fillStyle = COLORS.ink;
  context.fillRect(0, 352, WORLD_WIDTH, 10);
  context.fillStyle = theme.accentCool;
  context.fillRect(0, 362, WORLD_WIDTH, 5);
  for (let x = offset - 70; x < WORLD_WIDTH + 120; x += 220) {
    context.fillStyle = COLORS.cardboard;
    context.fillRect(x + 82, 316, 42, 35);
    context.fillStyle = COLORS.white;
    context.fillRect(x + 90, 326, 26, 8);
    context.fillStyle = COLORS.orange;
    context.beginPath();
    context.arc(x + 48, 357, 9, 0, Math.PI * 2);
    context.fill();
    drawCheckMark(context, x + 150, 320, 28);
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
  context.fillStyle = COLORS.ink;
  context.fillRect(224, GROUND_Y - 46, WORLD_WIDTH - 224, 8);
  context.fillStyle = theme.accentCool;
  context.fillRect(224, GROUND_Y - 34, WORLD_WIDTH - 224, 5);
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
  transformation: Readonly<StoryObstacleTransformation>,
  reducedMotion: boolean
): void {
  if (!transformation.active) return;
  const obstacle = transformation;
  const lift = reducedMotion ? 0 : transformation.progress * 14;
  context.save();
  context.globalAlpha = 0.9 - transformation.progress * 0.24;
  context.translate(0, -lift);
  if (transformation.motif === "process-zones") {
    const zoneWidth = Math.max(18, obstacle.width / 3);
    for (let zone = 0; zone < 3; zone += 1) {
      fillRoundedRectangle(
        context,
        obstacle.x + zone * zoneWidth,
        obstacle.y + 8,
        zoneWidth - 4,
        Math.max(18, obstacle.height - 12),
        4,
        zone % 2 === 0 ? COLORS.white : "#fff0f8"
      );
    }
  } else if (transformation.motif === "quality-mark") {
    context.fillStyle = "rgba(255,240,248,0.94)";
    context.beginPath();
    context.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 26, 0, Math.PI * 2);
    context.fill();
    drawCheckMark(context, obstacle.x + obstacle.width / 2 - 14, obstacle.y + obstacle.height / 2 - 12, 28);
  } else if (transformation.motif === "matched-order") {
    fillRoundedRectangle(
      context,
      obstacle.x + obstacle.width / 2 - 26,
      GROUND_Y - 58,
      52,
      42,
      5,
      COLORS.cardboard
    );
    context.fillStyle = COLORS.white;
    context.fillRect(obstacle.x + obstacle.width / 2 - 18, GROUND_Y - 44, 36, 13);
    drawCheckMark(context, obstacle.x + obstacle.width / 2 - 8, GROUND_Y - 43, 16);
  } else if (obstacle.obstacleKind === "overhead") {
    context.strokeStyle = "#eb32a4";
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
  gwarancja_48: "#eb32a4",
  audyt_jakosci: "#f04f45",
  drugie_zycie: "#f47100"
};

const POWER_UP_PACKAGE_COPY: Readonly<Record<PowerUpKind, readonly [string, string]>> = {
  gwarancja_48: ["OCHRONA", "48 M"],
  audyt_jakosci: ["AUDYT", "TRASY"],
  drugie_zycie: ["2×", "PUNKTY"]
};

const PACKAGE_TYPE_ACCENT: Readonly<Record<PackageType, string>> = {
  notebook: "#f04f45",
  telefon: "#f47100",
  pc: "#44413d",
  lcd: "#eb32a4"
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

  if (parcel.storyOrder === true) {
    const orderLabel: Readonly<Record<PackageType, string>> = {
      pc: "PC",
      notebook: "NB",
      lcd: "LCD",
      telefon: "TEL"
    };
    context.save();
    context.shadowColor = parcel.kind === "golden"
      ? "rgba(255,210,63,0.72)"
      : "rgba(78,145,173,0.62)";
    context.shadowBlur = scene.reducedMotion ? 6 : 10;
    fillRoundedRectangle(
      context,
      x - 3,
      y - 3,
      size + 6,
      size + 6,
      7,
      parcel.kind === "golden" ? "#ffd23f" : COLORS.white
    );
    context.shadowBlur = 0;
    context.fillStyle = PACKAGE_TYPE_ACCENT[parcel.packageType];
    context.font = "900 10px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(orderLabel[parcel.packageType], x + size / 2, y + size / 2 + 1);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.restore();
    return;
  }

  if (parcel.kind === "golden") {
    context.save();
    context.shadowColor = "rgba(240, 79, 69, 0.55)";
    context.shadowBlur = scene.reducedMotion ? 7 : 11 + Math.sin(scene.elapsedSeconds * 5) * 3;
    fillRoundedRectangle(context, x - 2, y - 2, size + 4, size + 4, 6, COLORS.orange);
    context.shadowBlur = 0;
    context.fillStyle = COLORS.redDark;
    context.fillRect(x + size / 2, y, size / 2, size);
    context.strokeStyle = COLORS.ink;
    context.lineWidth = 2;
    context.strokeRect(x, y, size, size);
    context.fillStyle = COLORS.white;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "950 6.5px system-ui, sans-serif";
    context.fillText("BONUS", x + size / 2, y + 11);
    context.font = "850 6px system-ui, sans-serif";
    context.fillText("+350 pkt", x + size / 2, y + 20);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.restore();
    return;
  }

  if (parcel.kind !== "standard") {
    const color = POWER_UP_COLORS[parcel.kind as PowerUpKind] ?? COLORS.red;
    const copy = POWER_UP_PACKAGE_COPY[parcel.kind as PowerUpKind];
    if (!copy) return;
    context.save();
    context.shadowColor = color;
    context.shadowBlur = scene.reducedMotion ? 7 : 12 + Math.sin(scene.elapsedSeconds * 5) * 3;
    fillRoundedRectangle(context, x - 2, y - 2, size + 4, size + 4, 5, COLORS.white);
    context.shadowBlur = 0;
    context.strokeStyle = COLORS.ink;
    context.lineWidth = 2;
    context.strokeRect(x, y, size, size);
    context.fillStyle = color;
    context.fillRect(x + 3, y + 3, size - 6, 6);
    context.fillStyle = COLORS.ink;
    context.font = "950 5.8px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(copy[0], x + size / 2, y + 15);
    context.font = "850 6px system-ui, sans-serif";
    context.fillText(copy[1], x + size / 2, y + 23);
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
  const color = boss.phase === "reward" ? "#eb32a4" : COLORS.red;
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
  context.fillStyle = boss.phase === "reward" ? "#f04f45" : "#ffec8a";
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
  drawSemanticObstacleDetail(context, obstacle);
}

const SEMANTIC_OBSTACLE_LABELS: Readonly<Record<string, string>> = {
  "parcel-arc": "PACZKA",
  "box-stack": "ZATOR",
  "scanner-gate": "SKAN",
  "dispatch-pair": "WYSYŁKA",
  "shelf-beam": "REGAŁ",
  "loaded-pallet": "PALETA",
  "warehouse-curtain": "STREFA",
  "parcel-trolley": "WÓZEK",
  "equipment-crate": "SPRZĘT",
  "low-conveyor": "TAŚMA",
  "device-pallet": "LAPTOP",
  "checked-device": "SPRAWDZONY",
  "first-laptop": "LAPTOP",
  "growing-team": "ZESPÓŁ",
  "established-office": "BIURO",
  intake: "PRZYJĘCIE",
  routing: "REALIZACJA",
  dispatch: "WYSYŁKA",
  single: "1 RUCH",
  doublet: "2 RUCHY",
  "three-action": "3 RUCHY",
  "long-arc": "DŁUGI ŁUK",
  "low-line": "NISKO",
  "tempo-change": "ZMIANA TEMPA",
  mastery: "FINAŁ",
  "recovery-route": "ODZYSKAJ"
};

/** Adds a concrete object/process cue while the proven hitbox remains unchanged. */
function drawSemanticObstacleDetail(
  context: CanvasRenderingContext2D,
  obstacle: Readonly<ObstacleModel>
): void {
  const variant = obstacle.semanticVariant;
  const label = variant ? SEMANTIC_OBSTACLE_LABELS[variant] : undefined;
  if (!variant || !label) return;
  const width = Math.max(48, Math.min(76, obstacle.width - 8));
  const height = 21;
  const x = obstacle.x + (obstacle.width - width) / 2;
  const y = obstacle.y + Math.max(4, Math.min(obstacle.height - height - 3, 8));
  context.save();
  fillRoundedRectangle(context, x, y, width, height, 5, "rgba(255,255,255,0.94)");
  context.strokeStyle = COLORS.ink;
  context.lineWidth = 1.5;
  roundedRectangle(context, x, y, width, height, 5);
  context.stroke();

  const iconX = x + 10;
  const iconY = y + 10.5;
  context.strokeStyle = COLORS.red;
  context.fillStyle = COLORS.orange;
  context.lineWidth = 2;
  if (["first-laptop", "device-pallet", "checked-device", "equipment-crate"].includes(variant)) {
    context.strokeRect(iconX - 6, iconY - 6, 12, 9);
    context.beginPath();
    context.moveTo(iconX - 8, iconY + 5);
    context.lineTo(iconX + 8, iconY + 5);
    context.stroke();
  } else if (variant === "growing-team") {
    for (const offset of [-4, 4]) {
      context.beginPath();
      context.arc(iconX + offset, iconY - 4, 3, 0, Math.PI * 2);
      context.fill();
    }
    context.fillRect(iconX - 9, iconY + 1, 18, 6);
  } else if (variant === "established-office") {
    context.strokeRect(iconX - 7, iconY - 7, 14, 14);
    context.fillRect(iconX - 4, iconY - 4, 3, 3);
    context.fillRect(iconX + 2, iconY - 4, 3, 3);
    context.fillRect(iconX - 1, iconY + 2, 4, 5);
  } else if (variant === "dispatch") {
    context.strokeRect(iconX - 8, iconY - 4, 10, 8);
    context.strokeRect(iconX + 2, iconY - 1, 6, 5);
    for (const wheel of [-4, 5]) {
      context.beginPath();
      context.arc(iconX + wheel, iconY + 6, 2, 0, Math.PI * 2);
      context.fill();
    }
  } else {
    context.fillRect(iconX - 6, iconY - 5, 12, 10);
    context.beginPath();
    context.moveTo(iconX, iconY - 9);
    context.lineTo(iconX, iconY + 9);
    context.moveTo(iconX - 4, iconY + 5);
    context.lineTo(iconX, iconY + 9);
    context.lineTo(iconX + 4, iconY + 5);
    context.stroke();
  }

  context.fillStyle = COLORS.ink;
  context.font = "900 6.5px system-ui, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(label, x + 21, y + height / 2 + 0.5, width - 24);
  context.restore();
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

function drawWarrantyShield(
  context: CanvasRenderingContext2D,
  runner: Readonly<RunnerModel>,
  scene: Readonly<RenderScene>
): void {
  if (!scene.activePowerUps.includes("gwarancja_48")) return;
  const pulse = scene.reducedMotion ? 0 : Math.sin(scene.elapsedSeconds * 4.2) * 2;
  const padding = 10 + pulse;
  const x = runner.x - padding;
  const y = runner.y - padding;
  const width = runner.width + padding * 2;
  const height = runner.height + padding * 2;
  context.save();
  context.globalAlpha = (scene.recoverySeconds ?? 0) > 0 ? 0.5 : 0.9;
  context.strokeStyle = COLORS.redDark;
  context.lineWidth = 4;
  context.setLineDash(scene.reducedMotion ? [] : [10, 5]);
  context.beginPath();
  context.roundRect(x, y, width, height, 18);
  context.stroke();
  context.restore();
}

function drawCrouchingCourier(
  context: CanvasRenderingContext2D,
  runner: Readonly<RunnerModel>,
  brandArtwork: CourierBrandArtwork
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

  context.strokeStyle = COURIER_PALETTE.capAndShirt;
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(x + 15, y + 36);
  context.lineTo(x + 7, y + 54);
  context.moveTo(x + 45, y + 36);
  context.lineTo(x + 53, y + 52);
  context.stroke();

  fillRoundedRectangle(context, x + 13, y + 32, 36, 30, 7, COURIER_PALETTE.capAndShirt);
  context.fillStyle = COURIER_PALETTE.belt;
  context.fillRect(x + 13, y + 50, 36, 7);
  brandArtwork.drawMark(context, { x: x + 23, y: y + 38, width: 16, height: 11 });

  fillRoundedRectangle(context, x + 4, y + 34, 12, 24, 3, COURIER_PALETTE.scanner);
  context.fillStyle = COURIER_PALETTE.scannerScreen;
  context.fillRect(x + 7, y + 38, 6, 11);

  context.fillStyle = "#f0bf94";
  context.beginPath();
  context.arc(x + 33, y + 23, 13, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#7b492d";
  context.fillRect(x + 42, y + 22, 5, 4);
  context.fillStyle = COLORS.ink;
  context.fillRect(x + 37, y + 19, 3, 3);

  context.fillStyle = COURIER_PALETTE.capAndShirt;
  context.fillRect(x + 17, y + 8, 30, 9);
  context.fillRect(x + 13, y + 14, 34, 5);
  context.fillStyle = COLORS.white;
  context.fillRect(x + 25, y + 11, 13, 3);
  context.lineCap = "butt";
}

function drawCourier(
  context: CanvasRenderingContext2D,
  runner: Readonly<RunnerModel>,
  scene: Readonly<RenderScene>,
  brandArtwork: CourierBrandArtwork
): void {
  if (runner.crouching) {
    drawCrouchingCourier(context, runner, brandArtwork);
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

  context.strokeStyle = COURIER_PALETTE.capAndShirt;
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(x + 17, y + 35);
  context.lineTo(x + 8 - stride * 7, y + 52);
  context.moveTo(x + 44, y + 35);
  context.lineTo(x + 52 + stride * 7, y + 50);
  context.stroke();

  fillRoundedRectangle(context, x + 14, y + 27, 35, 36, 7, COURIER_PALETTE.capAndShirt);
  context.fillStyle = COURIER_PALETTE.belt;
  context.fillRect(x + 14, y + 49, 35, 8);
  brandArtwork.drawMark(context, { x: x + 23, y: y + 34, width: 18, height: 13 });

  fillRoundedRectangle(context, x + 5, y + 30, 12, 27, 3, COURIER_PALETTE.scanner);
  context.fillStyle = COURIER_PALETTE.scannerScreen;
  context.fillRect(x + 8, y + 35, 6, 12);

  context.fillStyle = "#f0bf94";
  context.beginPath();
  context.arc(x + 32, y + 17, 14, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#7b492d";
  context.fillRect(x + 42, y + 16, 5, 4);
  context.fillStyle = COLORS.ink;
  context.fillRect(x + 37, y + 13, 3, 3);

  context.fillStyle = COURIER_PALETTE.capAndShirt;
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

/**
 * The generated world plate is framed independently of the fixed 960×540
 * gameplay viewport. This foreground route gives the runner, parcels and
 * obstacles one explicit shared ground line at every stage aspect ratio.
 */
function drawGameplayRoute(context: CanvasRenderingContext2D): void {
  context.save();
  context.lineCap = "round";
  context.strokeStyle = WORLD_ROUTE_BASE_COLOR;
  context.lineWidth = WORLD_ROUTE_BASE_WIDTH;
  context.beginPath();
  context.moveTo(-12, WORLD_ROUTE_Y + WORLD_ROUTE_BASE_OFFSET_Y);
  context.lineTo(WORLD_WIDTH + 12, WORLD_ROUTE_Y + WORLD_ROUTE_BASE_OFFSET_Y);
  context.stroke();

  const routeGradient = context.createLinearGradient(0, 0, WORLD_WIDTH, 0);
  for (const { offset, color } of WORLD_ROUTE_GRADIENT_STOPS) {
    routeGradient.addColorStop(offset, color);
  }
  context.strokeStyle = routeGradient;
  context.lineWidth = WORLD_ROUTE_ACCENT_WIDTH;
  context.beginPath();
  context.moveTo(-12, WORLD_ROUTE_Y);
  context.lineTo(WORLD_WIDTH + 12, WORLD_ROUTE_Y);
  context.stroke();
  context.restore();
}

function drawMilestoneParticles(
  context: CanvasRenderingContext2D,
  scene: Readonly<RenderScene>
): void {
  const celebration = scene.milestoneCelebration;
  if (celebration === null || celebration === undefined || scene.reducedMotion) return;
  const progress = Math.max(0, Math.min(1, celebration.progress));
  const motion = progress * (1 + Math.min(3, celebration.intensity) * 0.12);
  const alpha = Math.sin(progress * Math.PI) * 0.72;
  const particleCount = Math.min(42, 10 + celebration.intensity * 5);
  context.save();
  context.globalAlpha = alpha;
  const gradient = context.createLinearGradient(0, 0, WORLD_WIDTH, 0);
  for (const { offset, color } of WORLD_ROUTE_GRADIENT_STOPS) {
    gradient.addColorStop(offset, color);
  }

  if (celebration.kind === "confetti") {
    for (let index = 0; index < particleCount; index += 1) {
      const x = positiveModulo(index * 137 + celebration.threshold, WORLD_WIDTH);
      const y = positiveModulo(index * 71 + motion * 440, WORLD_HEIGHT - 90);
      context.fillStyle = index % 3 === 0 ? COLORS.orange : index % 3 === 1 ? COLORS.red : COLORS.redDark;
      context.save();
      context.translate(x, y);
      context.rotate(motion * 5 + index);
      context.fillRect(-5, -2, 10, 4);
      context.restore();
    }
  } else if (celebration.kind === "pulse") {
    context.strokeStyle = gradient;
    for (let ring = 0; ring < Math.min(5, celebration.intensity + 2); ring += 1) {
      context.globalAlpha = alpha * (1 - ring * 0.12);
      context.lineWidth = 7 - ring;
      context.beginPath();
      context.arc(WORLD_WIDTH / 2, 245, 55 + (motion + ring * 0.25) * 105, 0, Math.PI * 2);
      context.stroke();
    }
  } else if (celebration.kind === "ribbons") {
    context.strokeStyle = gradient;
    context.lineWidth = 8;
    for (let ribbon = 0; ribbon < Math.min(7, celebration.intensity + 3); ribbon += 1) {
      const offset = ribbon * 36;
      context.beginPath();
      context.moveTo(-40, 100 + offset);
      context.bezierCurveTo(
        190 + motion * 80,
        20 + offset,
        650 - motion * 80,
        390 - offset * 0.3,
        WORLD_WIDTH + 40,
        80 + offset
      );
      context.stroke();
    }
  } else if (celebration.kind === "package-rain") {
    for (let index = 0; index < particleCount; index += 1) {
      const x = positiveModulo(index * 113 + celebration.threshold, WORLD_WIDTH);
      const y = positiveModulo(index * 83 + motion * 520, WORLD_HEIGHT + 70) - 70;
      context.fillStyle = COLORS.cardboard;
      context.fillRect(x, y, 18, 15);
      context.fillStyle = index % 2 === 0 ? COLORS.orange : COLORS.redDark;
      context.fillRect(x + 7, y, 4, 15);
    }
  } else {
    context.strokeStyle = gradient;
    context.lineWidth = 10 + Math.min(8, celebration.intensity * 2);
    context.beginPath();
    context.moveTo(-20, WORLD_ROUTE_Y);
    for (let x = 0; x <= WORLD_WIDTH + 20; x += 24) {
      const wave = Math.sin(x / 62 - motion * Math.PI * 4) * (10 + celebration.intensity * 3);
      context.lineTo(x, WORLD_ROUTE_Y + wave);
    }
    context.stroke();
  }
  context.restore();
}

export class WarehouseRenderer {
  public constructor(
    private readonly brandArtwork: CourierBrandArtwork = DEFAULT_COURIER_BRAND_ARTWORK
  ) {}

  render(
    context: CanvasRenderingContext2D,
    pixelWidth: number,
    pixelHeight: number,
    scene: Readonly<RenderScene>
  ): void {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    const externalWorldVisual = scene.worldVisual !== undefined;
    if (externalWorldVisual) {
      context.clearRect(0, 0, pixelWidth, pixelHeight);
    } else {
      context.fillStyle = COLORS.ink;
      context.fillRect(0, 0, pixelWidth, pixelHeight);
    }

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

    if (!externalWorldVisual) {
      drawWarehouse(
        context,
        scene.distancePixels,
        scene.elapsedSeconds,
        scene.reducedMotion,
        theme
      );
      drawNarrativeVignette(context, scene, theme);
    } else {
      drawGameplayRoute(context);
    }
    drawTrustCorridor(context, scene, theme);
    drawMilestoneParticles(context, scene);
    drawForkliftBoss(
      context,
      scene.boss,
      scene.elapsedSeconds,
      scene.reducedMotion
    );
    for (const parcel of scene.packages) drawParcel(context, parcel, scene);
    for (const obstacle of scene.obstacles) {
      drawObstacle(context, obstacle);
    }
    for (const transformation of scene.obstacleTransformations ?? []) {
      drawTransformedObstacle(context, transformation, scene.reducedMotion);
    }
    drawCourier(context, scene.runner, scene, this.brandArtwork);
    drawWarrantyShield(context, scene.runner, scene);

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

    context.restore();
  }
}
