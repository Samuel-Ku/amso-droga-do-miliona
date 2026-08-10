import routeData from "./world-route-data.json";

export const WORLD_ROUTE_Y = routeData.y;
export const WORLD_ROUTE_BASE_OFFSET_Y = routeData.baseOffsetY;
export const WORLD_ROUTE_BASE_WIDTH = routeData.baseWidth;
export const WORLD_ROUTE_ACCENT_WIDTH = routeData.accentWidth;
export const WORLD_ROUTE_BASE_COLOR = routeData.baseColor;
export const WORLD_ROUTE_GRADIENT_STOPS = routeData.gradientStops;

/**
 * One code-owned route shared by every generated story plate. Gameplay draws
 * the same geometry on canvas, so the courier never changes ground level when
 * the world or presentation mode changes.
 */
export const WORLD_ROUTE_SVG = `
  <svg class="amso-million-runner-2026-world-visual__route" viewBox="0 0 ${routeData.width} ${routeData.height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <linearGradient id="amso-million-runner-2026-world-route-gradient" x1="0" x2="1">
        ${WORLD_ROUTE_GRADIENT_STOPS.map(({ offset, color }) => `<stop offset="${offset}" stop-color="${color}" />`).join("\n        ")}
      </linearGradient>
    </defs>
    <path d="M-12 ${WORLD_ROUTE_Y + WORLD_ROUTE_BASE_OFFSET_Y}H${routeData.width + 12}" stroke="${WORLD_ROUTE_BASE_COLOR}" stroke-width="${WORLD_ROUTE_BASE_WIDTH}" stroke-linecap="round" />
    <path d="M-12 ${WORLD_ROUTE_Y}H${routeData.width + 12}" stroke="url(#amso-million-runner-2026-world-route-gradient)" stroke-width="${WORLD_ROUTE_ACCENT_WIDTH}" stroke-linecap="round" />
  </svg>
`;
