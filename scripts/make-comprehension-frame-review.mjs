import { readFileSync, writeFileSync } from "node:fs";

const svgSource = readFileSync("src/visuals/semantic-world-svg.ts", "utf8");
const svg = svgSource.match(/export const SEMANTIC_WORLD_SVG = `([\s\S]*?)`;\s*$/u)?.[1];
if (!svg) throw new Error("Could not extract the semantic world SVG.");

const rows = readFileSync("qa/final-frame-matrix-v6.csv", "utf8")
  .trim().split("\n").slice(1).map((row) => row.split(";"));
const stateByBeat = {
  "story.first_package:game-purpose": ["first-mile", "intro.ready"],
  "story.first_package:first-hand-packed": ["first-mile", "intro.promise"],
  "story.order_backlog:backlog-challenge": ["order-process", "epoch_1.challenge"],
  "story.quality_promise:quality-process": ["quality-service", "epoch_2.resolve"],
  "client.business_growth:new-business": ["client-paths", "epoch_3.start"],
  "client.business_growth:three-hundred": ["client-paths", "epoch_3.laptop"],
  "client.business_growth:one-year": ["client-paths", "epoch_3.business"],
  "client.business_growth:hundred-thousand": ["client-paths", "epoch_3.business"],
  "story.matching_result:many-plans": ["client-paths", "epoch_3.b2b"],
  "story.scale:phone-tower": ["scale-logistics", "epoch_4.numbers"],
  "story.million_approach:counter-source": ["million-approach", "epoch_5.approach"],
  "challenge.million_wave:two-goals": ["million-approach", "epoch_5.wave"],
  "story.million_finale:million-celebration": ["million-finale", "final.moments"],
  "story.challenge_handoff:rules-change": ["million-finale", "final.thanks"]
};
const frames = rows.map(([frameId, sceneId, pageId, viewport, width, height]) => {
  const state = stateByBeat[`${sceneId}:${pageId}`];
  if (!state) throw new Error(`Missing frame state for ${sceneId}:${pageId}`);
  return { frameId, viewport, width: Number(width), height: Number(height), worldId: state[0], stateId: state[1] };
});

const html = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Test kadrów v6</title><style>
*{box-sizing:border-box}body{margin:0;background:#ebe7df;color:#171717;font:700 16px Arial,sans-serif;display:grid;min-height:100vh;place-items:center}.review{width:100%;padding:20px}.meta,.controls{display:flex;gap:12px;justify-content:center;align-items:center;margin:12px auto}.stage{margin:auto;max-width:960px;aspect-ratio:16/9;background:#faf7f0;overflow:hidden;border:4px solid #171717}.stage.mobile{width:390px;max-width:100%}.stage.desktop{width:960px}.stage svg{display:block;width:100%;height:100%}.stage [data-editorial-layer],.stage .amso-world-visual__state{animation:reveal 1.5s cubic-bezier(.18,.75,.2,1) both;transform-box:fill-box;transform-origin:center bottom}@keyframes reveal{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}button{border:3px solid #171717;border-radius:999px;background:#fff;padding:10px 18px;font:inherit}button.primary{background:linear-gradient(90deg,#f47100,#eb32a4)}@media(prefers-reduced-motion:reduce){.stage [data-editorial-layer],.stage .amso-world-visual__state{animation:none}}
</style></head><body><main class="review"><div class="meta"><strong id="frame-id"></strong><span id="viewport"></span></div><div class="stage" id="stage">${svg}</div><div class="controls"><button id="previous">Poprzedni</button><button class="primary" id="next">Następny</button></div></main><script>
const frames=${JSON.stringify(frames)};let index=0;const stage=document.querySelector('#stage');function show(){const frame=frames[index];stage.className='stage '+frame.viewport;document.querySelector('#frame-id').textContent=frame.frameId;document.querySelector('#viewport').textContent=frame.viewport==='mobile'?'390 px':'desktop';stage.querySelectorAll('[data-world-fallback]').forEach(node=>node.toggleAttribute('hidden',node.dataset.worldFallback!==frame.worldId));stage.querySelectorAll('[data-state-overlay]').forEach(node=>node.toggleAttribute('hidden',node.dataset.stateOverlay!==frame.stateId));stage.querySelectorAll('.amso-world-visual__state').forEach(node=>{node.style.animation='none';void node.getBoundingClientRect();node.style.animation=''})}document.querySelector('#previous').onclick=()=>{index=(index+frames.length-1)%frames.length;show()};document.querySelector('#next').onclick=()=>{index=(index+1)%frames.length;show()};document.addEventListener('keydown',event=>{if(event.key==='ArrowRight')document.querySelector('#next').click();if(event.key==='ArrowLeft')document.querySelector('#previous').click()});show();
</script></body></html>`;

writeFileSync("qa/test-kadrow-v6.html", html);
console.log(`comprehension frame review: qa/test-kadrow-v6.html; ${frames.length} wariantów`);
