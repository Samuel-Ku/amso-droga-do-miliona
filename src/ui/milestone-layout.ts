export interface LayoutRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface MilestoneLayout {
  readonly message: LayoutRect;
  readonly hud: LayoutRect;
  readonly courierZone: LayoutRect;
  readonly obstacleSpawnZone: LayoutRect;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

/**
 * Deterministic screen-space contract for the reward message.
 * Gameplay occupies the lower half; the message lives in the quiet band
 * between the HUD and all moving actors.
 */
export function milestoneLayoutForViewport(width: number, height: number): MilestoneLayout {
  const safeWidth = Math.max(390, width);
  const safeHeight = Math.max(540, height);
  const mobile = safeWidth < 757;
  const horizontalInset = mobile ? 11 : 20;
  const messageWidth = Math.min(safeWidth - horizontalInset * 2, mobile ? 340 : 560);
  const messageHeight = mobile ? 58 : 72;
  const messageTop = mobile ? 132 : clamp(safeHeight * 0.16, 110, 150);
  return {
    message: {
      x: (safeWidth - messageWidth) / 2,
      y: messageTop,
      width: messageWidth,
      height: messageHeight
    },
    hud: {
      x: horizontalInset,
      y: mobile ? 10 : 20,
      width: safeWidth - horizontalInset * 2,
      height: mobile ? 96 : 82
    },
    courierZone: {
      x: 0,
      y: safeHeight * 0.48,
      width: safeWidth * 0.48,
      height: safeHeight * 0.52
    },
    obstacleSpawnZone: {
      x: safeWidth * 0.7,
      y: safeHeight * 0.42,
      width: safeWidth * 0.3,
      height: safeHeight * 0.58
    }
  };
}

export function layoutRectsOverlap(left: LayoutRect, right: LayoutRect): boolean {
  return left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y;
}
