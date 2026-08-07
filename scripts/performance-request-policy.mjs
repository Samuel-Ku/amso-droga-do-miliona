const EXPECTED_CAMPAIGN_ASSETS = new Set([
  "/assets/milion-runner/boot-watchdog.js",
  "/assets/milion-runner/brand/million-neutral-compact.svg",
  "/assets/milion-runner/brand/million-neutral-main.svg",
  "/assets/milion-runner/brand/mz-compact-lockup-v1.avif",
  "/assets/milion-runner/brand/mz-main-lockup-v1.avif",
  "/assets/milion-runner/courier/A.webp",
  "/assets/milion-runner/courier/courier-crouch-sheet.webp",
  "/assets/milion-runner/courier/courier-jump-sheet.webp",
  "/assets/milion-runner/courier/courier-run-sheet.webp",
  "/assets/milion-runner/obstacles/box-stack.webp",
  "/assets/milion-runner/obstacles/overhead-conveyor.webp",
  "/assets/milion-runner/obstacles/overhead-door.webp",
  "/assets/milion-runner/obstacles/overhead.webp",
  "/assets/milion-runner/obstacles/pallet.webp",
  "/assets/milion-runner/obstacles/trolley.webp",
  "/assets/milion-runner/orders/order-atlas.webp",
  "/assets/milion-runner/powerups/powerup-atlas.webp",
  "/assets/milion-runner/worlds/world-01-first-mile-v2.webp",
  "/assets/milion-runner/worlds/world-02-order-process-v2.webp",
  "/assets/milion-runner/worlds/world-03-quality-service-v2.webp",
  "/assets/milion-runner/worlds/world-04-client-paths-v2.webp",
  "/assets/milion-runner/worlds/world-05-scale-logistics-v2.webp",
  "/assets/milion-runner/worlds/world-06-million-approach-v2.webp",
  "/assets/milion-runner/worlds/world-07-million-finale-v2.webp"
]);

export function headersForPerformanceRequest(requestUrl, targetUrl, headers, bypassSecret) {
  const nextHeaders = { ...headers };
  delete nextHeaders["x-vercel-protection-bypass"];
  if (bypassSecret && requestUrl.origin === targetUrl.origin) {
    nextHeaders["x-vercel-protection-bypass"] = bypassSecret;
  }
  return nextHeaders;
}

export function isExpectedPerformanceRequest(requestUrl, targetUrl) {
  if (!(requestUrl.protocol === "http:" || requestUrl.protocol === "https:")) return true;
  if (requestUrl.origin !== targetUrl.origin) return false;
  if (requestUrl.pathname === targetUrl.pathname) return true;
  if (/^\/assets\/index-[A-Za-z0-9_-]+\.(?:js|css)$/u.test(requestUrl.pathname)) return true;
  return EXPECTED_CAMPAIGN_ASSETS.has(requestUrl.pathname);
}
