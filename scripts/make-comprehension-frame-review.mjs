import { readFileSync, writeFileSync } from "node:fs";

const rows = readFileSync("qa/final-frame-matrix-v6.csv", "utf8")
  .trim().split("\n").slice(1).map((row) => row.split(";"));
const productionConfig = JSON.parse(
  readFileSync("public/assets/milion-runner/runner-config.json", "utf8")
);
const route = JSON.parse(readFileSync("src/visuals/world-route-data.json", "utf8"));
const worldByBeat = {
  "story.first_package:game-purpose": "first-mile",
  "story.first_package:first-hand-packed": "first-mile",
  "story.order_backlog:backlog-challenge": "order-process",
  "story.quality_promise:quality-process": "quality-service",
  "client.business_growth:new-business": "client-paths",
  "client.business_growth:three-hundred": "client-paths",
  "client.business_growth:one-year": "client-paths",
  "client.business_growth:hundred-thousand": "client-paths",
  "story.matching_result:many-plans": "client-paths",
  "story.scale:phone-tower": "scale-logistics",
  "story.million_approach:counter-source": "million-approach",
  "challenge.million_wave:two-goals": "million-approach",
  "story.million_finale:million-celebration": "million-finale",
  "story.challenge_handoff:rules-change": "million-finale"
};
const resources = productionConfig.assets.bundles.flatMap(({ resources }) => resources);
const worldAssets = Object.fromEntries(
  [...new Set(Object.values(worldByBeat))].map((worldId) => {
    const resource = resources.find(({ id }) => id === `world-${worldId}-v2`);
    if (!resource) throw new Error(`Missing production world asset for ${worldId}`);
    return [worldId, resource.source.split("/").at(-1)];
  })
);
const routeStops = route.gradientStops
  .map(({ offset, color }) => `<stop offset="${offset}" stop-color="${color}"/>`)
  .join("");
const routeSvg = `<svg viewBox="0 0 ${route.width} ${route.height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="route" x1="0" x2="1">${routeStops}</linearGradient></defs><path d="M-12 ${route.y + route.baseOffsetY}H${route.width + 12}" stroke="${route.baseColor}" stroke-width="${route.baseWidth}" stroke-linecap="round"/><path d="M-12 ${route.y}H${route.width + 12}" stroke="url(#route)" stroke-width="${route.accentWidth}" stroke-linecap="round"/></svg>`;
const frames = rows.map(([frameId, sceneId, pageId, viewport, width, height]) => {
  const worldId = worldByBeat[`${sceneId}:${pageId}`];
  if (!worldId) throw new Error(`Missing frame world for ${sceneId}:${pageId}`);
  return { frameId, viewport, width: Number(width), height: Number(height), worldId };
});

const html = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Test kadrów v6</title><style>
*{box-sizing:border-box}body{margin:0;background:#ebe7df;color:#171717;font:700 16px Arial,sans-serif;display:grid;min-height:100vh;place-items:center}.review{width:100%;padding:20px}.meta,.controls{display:flex;gap:12px;justify-content:center;align-items:center;margin:12px auto}.stage{position:relative;margin:auto;background:#faf7f0;overflow:hidden;border:4px solid #171717}.stage.mobile{width:min(390px,100%)}.stage.desktop{width:min(960px,100%)}.stage img,.stage svg{position:absolute;inset:0;display:block;width:100%;height:100%}.stage img{object-fit:contain;opacity:.8}button{border:3px solid #171717;border-radius:999px;background:#fff;padding:10px 18px;font:inherit}button.primary{background:linear-gradient(90deg,#f47100,#eb32a4)}
</style></head><body><main class="review"><div class="meta"><strong id="frame-id"></strong><span id="viewport"></span></div><div class="stage" id="stage"><img id="world" alt="">${routeSvg}</div><div class="controls"><button id="previous">Poprzedni</button><button class="primary" id="next">Następny</button></div></main><script>
const frames=${JSON.stringify(frames)};const worlds=${JSON.stringify(worldAssets)};let index=0;const stage=document.querySelector('#stage');const image=document.querySelector('#world');function show(){const frame=frames[index];stage.className='stage '+frame.viewport;stage.style.aspectRatio=frame.width+'/'+frame.height;image.src='../public/assets/milion-runner/worlds/'+worlds[frame.worldId];document.querySelector('#frame-id').textContent=frame.frameId;document.querySelector('#viewport').textContent=frame.width+' × '+frame.height+' px'}document.querySelector('#previous').onclick=()=>{index=(index+frames.length-1)%frames.length;show()};document.querySelector('#next').onclick=()=>{index=(index+1)%frames.length;show()};document.addEventListener('keydown',event=>{if(event.key==='ArrowRight')document.querySelector('#next').click();if(event.key==='ArrowLeft')document.querySelector('#previous').click()});show();
</script></body></html>`;

writeFileSync("qa/test-kadrow-v6.html", html);
console.log(`comprehension frame review: qa/test-kadrow-v6.html; ${frames.length} wariantów`);
