/**
 * Code-owned semantic fallback and state accents.
 *
 * Generated plates provide finish and atmosphere; these concrete vectors keep
 * the story legible when an image is late or unavailable and make all eighteen
 * cards visually distinct without putting generated text into artwork.
 */
export const SEMANTIC_WORLD_SVG = `
  <svg class="amso-world-visual__semantic" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <linearGradient id="amso-route-gradient" x1="0" x2="1">
        <stop offset="0" stop-color="#f47100" />
        <stop offset="0.52" stop-color="#f04f45" />
        <stop offset="1" stop-color="#eb32a4" />
      </linearGradient>
      <pattern id="amso-paper-dots" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#171717" opacity=".08" />
      </pattern>
      <filter id="amso-soft-shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="7" dy="8" stdDeviation="0" flood-color="#171717" flood-opacity=".18" />
      </filter>
    </defs>
    <g class="amso-world-visual__semantic-base">
    <rect width="960" height="540" fill="#faf7f0" />
    <rect width="960" height="540" fill="url(#amso-paper-dots)" />

    <g data-world-fallback="first-mile" hidden>
      <path d="M0 91h324v21H0zm42 58h260v18H42zm-6 63h286v18H36" fill="#191919" />
      <path d="M61 55h82v36H61zm101 12h99v24h-99zm-79 94h61v48H83zm93 12h96v36h-96" fill="#c8a27b" stroke="#191919" stroke-width="5" />
      <path d="M112 286h298v83H112z" fill="#c8a27b" stroke="#191919" stroke-width="7" filter="url(#amso-soft-shadow)" />
      <path d="M256 262h118l-15 59H244z" fill="#191919" stroke="#191919" stroke-width="6" />
      <path d="M265 272h97l-10 38h-96z" fill="#424242" />
      <rect x="144" y="310" width="91" height="38" rx="5" fill="#fff" stroke="#191919" stroke-width="4" />
      <rect x="154" y="337" width="71" height="6" rx="3" fill="url(#amso-route-gradient)" />
    </g>

    <g data-world-fallback="cable-route" hidden>
      <path d="M0 105h240v20H0zm720 0h240v20H720M48 56h139v49H48m731-56h131v56H779" fill="#c8a27b" stroke="#191919" stroke-width="6" />
      <g fill="none" stroke="#191919" stroke-width="12" stroke-linecap="round">
        <path d="M274 131c50 42-23 79 46 114s-27 95 52 118" />
        <path d="M336 80c-16 92 87 60 39 145s77 72 35 139" />
        <path d="M408 67c-52 95 82 105 22 173s73 56 35 129" />
        <path d="M478 64v88c0 60 71 41 71 108v111" />
      </g>
      <path d="M602 72v281m33-281v281m33-281v281" fill="none" stroke="#191919" stroke-width="8" />
      <path d="M602 87h66M602 152h66M602 217h66M602 282h66M602 347h66" stroke="#faf7f0" stroke-width="4" />
    </g>

    <g data-world-fallback="quality-service" hidden>
      <path d="M56 337h774v35H56z" fill="#191919" />
      <path d="M92 243h230v92H92z" fill="#2d2d2d" stroke="#191919" stroke-width="7" />
      <path d="M148 186h153l-16 91H132z" fill="#191919" />
      <path d="M159 199h127l-10 63H146z" fill="#4a4a4a" />
      <path d="M448 74h306v243H448z" fill="#fff" stroke="#191919" stroke-width="8" />
      <g fill="none" stroke="#191919" stroke-width="5">
        <path d="M486 119h34v34h-34zm0 52h34v34h-34zm0 52h34v34h-34" />
        <path d="M546 136h157M546 188h157M546 240h157" />
      </g>
      <path d="M345 257c54-38 67-75 93-126" fill="none" stroke="url(#amso-route-gradient)" stroke-width="8" />
    </g>

    <g data-world-fallback="client-paths" hidden>
      <path d="M57 303h235v21H57zm333 16h237v21H390zm663-16h240v21H663" fill="#191919" />
      <g fill="#191919">
        <path d="M91 212h126v83H91zm337 11h151v88H428zm270-2h168v74H698" />
      </g>
      <g fill="#faf7f0" stroke="#191919" stroke-width="5">
        <path d="M115 163h88l-9 57h-89zM458 161h91l-8 58h-92zM728 165h104l-9 57H718z" />
      </g>
      <path d="M0 405c136 0 91-62 215-62 126 0 113 60 251 60 134 0 117-58 244-58s113 60 250 60" fill="none" stroke="url(#amso-route-gradient)" stroke-width="12" />
      <path d="M467 402V282m0 63L151 343m316 2l313-2" fill="none" stroke="url(#amso-route-gradient)" stroke-width="7" />
    </g>

    <g data-world-fallback="scale-logistics" hidden>
      <path d="M369 48h520v24H369zm0 91h520v24H369zm0 91h520v24H369" fill="#191919" />
      <g fill="#c8a27b" stroke="#191919" stroke-width="4">
        <path d="M392 86h56v42h-56zm72 0h63v42h-63zm80 0h58v42h-58zm74 0h69v42h-69zm83 0h61v42h-61zm75 0h77v42h-77" />
        <path d="M402 177h68v42h-68zm86 0h53v42h-53zm71 0h72v42h-72zm87 0h61v42h-61zm77 0h54v42h-54zm70 0h53v42h-53" />
      </g>
      <path d="M249 304h590c44 0 58 66 102 66" fill="none" stroke="#191919" stroke-width="51" />
      <path d="M249 304h590c44 0 58 66 102 66" fill="none" stroke="url(#amso-route-gradient)" stroke-width="12" />
      <g fill="#c8a27b" stroke="#191919" stroke-width="5">
        <path d="M335 274h61v51h-61zm150 0h70v51h-70zm170 0h63v51h-63" />
      </g>
      <path d="M112 145h62v158h-62zm78 45h62v113h-62" fill="#191919" />
    </g>

    <g data-world-fallback="million-approach" hidden>
      <path d="M441 93h420v232H441z" fill="#242424" stroke="#191919" stroke-width="9" />
      <g fill="#faf7f0" stroke="#191919" stroke-width="7">
        <path d="M473 135h52v120h-52zm62 0h52v120h-52zm62 0h52v120h-52zm62 0h52v120h-52zm62 0h52v120h-52zm62 0h52v120h-52" />
      </g>
      <g fill="none" stroke="url(#amso-route-gradient)" stroke-width="9">
        <path d="M0 133h172c74 0 87 50 173 50h94" />
        <path d="M0 217h153c93 0 96 23 192 23h94" />
        <path d="M0 301h161c87 0 101-4 184-4h94" />
      </g>
      <g fill="#c8a27b" stroke="#191919" stroke-width="4">
        <path d="M76 106h55v43H76zm78 89h55v43h-55zm91 79h55v43h-55zm89-15h55v43h-55" />
      </g>
    </g>

    <g data-world-fallback="million-finale" hidden>
      <path d="M0 91h324v21H0zm42 58h260v18H42" fill="#191919" />
      <path d="M61 55h82v36H61zm101 12h99v24h-99" fill="#c8a27b" stroke="#191919" stroke-width="5" />
      <path d="M112 286h298v83H112z" fill="#c8a27b" stroke="#191919" stroke-width="7" filter="url(#amso-soft-shadow)" />
      <rect x="144" y="310" width="91" height="38" rx="5" fill="#fff" stroke="#191919" stroke-width="4" />
      <rect x="154" y="337" width="71" height="6" rx="3" fill="url(#amso-route-gradient)" />
      <path d="M256 262h118l-15 59H244z" fill="#191919" stroke="#191919" stroke-width="6" />
      <path d="M265 272h97l-10 38h-96z" fill="#4a4a4a" />
      <path d="M235 348c138 0 154 77 294 77h431" fill="none" stroke="url(#amso-route-gradient)" stroke-width="13" />
    </g>

    <path class="amso-world-visual__track" d="M0 446h960" stroke="#191919" stroke-width="29" />
    <path class="amso-world-visual__track-accent" d="M0 439h960" stroke="url(#amso-route-gradient)" stroke-width="9" />
    </g>

    <g class="amso-world-visual__state" data-state-overlay="intro.ready" hidden>
      <path d="M176 286l76 50" stroke="url(#amso-route-gradient)" stroke-width="15" />
      <circle cx="174" cy="285" r="14" fill="#f47100" stroke="#191919" stroke-width="5" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="intro.beginning" hidden>
      <path d="M38 242h286M38 259h286" stroke="#191919" stroke-width="7" />
      <path d="M61 232h47v27H61zm68 0h67v27h-67zm88 0h72v27h-72" fill="#c8a27b" stroke="#191919" stroke-width="4" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="intro.promise" hidden>
      <path d="M286 284c76 0 92 123 207 123h467" fill="none" stroke="url(#amso-route-gradient)" stroke-width="11" />
      <circle cx="286" cy="284" r="18" fill="#faf7f0" stroke="#191919" stroke-width="6" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_1.challenge" hidden>
      <path d="M426 166c-90 47 108 64-14 128 147 41-35 89 100 111" fill="none" stroke="#191919" stroke-width="14" />
      <path d="M405 169c128 44-57 81 102 132-99 51 31 68-68 105" fill="none" stroke="#444" stroke-width="10" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_1.resolve" hidden>
      <path d="M343 188h337M343 222h337M343 256h337" fill="none" stroke="#191919" stroke-width="11" />
      <path d="M354 188h102M498 222h169M354 256h209" stroke="url(#amso-route-gradient)" stroke-width="5" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_2.setup" hidden>
      <g fill="#fff" stroke="#191919" stroke-width="5"><path d="M491 116h34v34h-34zm0 55h34v34h-34zm0 55h34v34h-34" /></g>
      <path d="M596 116l17 31h-34zM596 174l17 31h-34z" fill="#f47100" stroke="#191919" stroke-width="4" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_2.resolve" hidden>
      <g fill="none" stroke="url(#amso-route-gradient)" stroke-width="7"><path d="M489 129l10 11 25-29M489 184l10 11 25-29M489 239l10 11 25-29" /></g>
      <rect x="350" y="277" width="205" height="56" rx="9" fill="#fff" stroke="url(#amso-route-gradient)" stroke-width="7" />
      <text x="452" y="312" text-anchor="middle" fill="#191919" font-family="system-ui,sans-serif" font-size="22" font-weight="900">SPRAWDZONY</text>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_3.people" hidden>
      <circle cx="469" cy="344" r="18" fill="#fff" stroke="#191919" stroke-width="6" />
      <path d="M469 344L155 344m314 0l311-2m-311 2V260" stroke="url(#amso-route-gradient)" stroke-width="8" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_3.designer" hidden>
      <path d="M74 260l117-80 20 28-117 80z" fill="#f47100" stroke="#191919" stroke-width="5" />
      <path d="M93 276l-27 18 12-31z" fill="#191919" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_3.business" hidden>
      <text x="515" y="126" text-anchor="middle" fill="#191919" font-family="system-ui,sans-serif" font-size="27" font-weight="900">300 zł → 300 000 zł</text>
      <path d="M430 156h171" stroke="url(#amso-route-gradient)" stroke-width="8" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_3.b2b" hidden>
      <text x="765" y="132" text-anchor="middle" fill="#191919" font-family="system-ui,sans-serif" font-size="27" font-weight="900">10% → 7 LAT</text>
      <g fill="#fff" stroke="#191919" stroke-width="4"><circle cx="686" cy="170" r="10"/><circle cx="713" cy="170" r="10"/><circle cx="740" cy="170" r="10"/><circle cx="767" cy="170" r="10"/><circle cx="794" cy="170" r="10"/><circle cx="821" cy="170" r="10"/><circle cx="848" cy="170" r="10"/></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_4.scale" hidden>
      <text x="691" y="104" text-anchor="middle" fill="#191919" font-family="system-ui,sans-serif" font-size="34" font-weight="950">3 000 m²</text>
      <path d="M562 118h258" stroke="url(#amso-route-gradient)" stroke-width="9" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_4.numbers" hidden>
      <text x="173" y="108" text-anchor="middle" fill="#191919" font-family="system-ui,sans-serif" font-size="27" font-weight="900">240 m › PKiN</text>
      <text x="196" y="354" text-anchor="middle" fill="#191919" font-family="system-ui,sans-serif" font-size="25" font-weight="900">400 000 kg ≈ 5 × 737</text>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_4.resolve" hidden>
      <path d="M670 302c67 0 73 78 153 78" fill="none" stroke="url(#amso-route-gradient)" stroke-width="10" />
      <path d="M833 347c-24 0-43 19-43 43 0 33 43 67 43 67s43-34 43-67c0-24-19-43-43-43zm0 29a14 14 0 110 28 14 14 0 010-28z" fill="#eb32a4" stroke="#191919" stroke-width="5" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_5.approach" hidden>
      <text data-world-counter x="654" y="219" text-anchor="middle" fill="#191919" font-family="ui-monospace,monospace" font-size="57" font-weight="950">999 970</text>
      <path d="M385 283h62" stroke="url(#amso-route-gradient)" stroke-width="12" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_5.wave" hidden>
      <text data-world-counter x="654" y="219" text-anchor="middle" fill="#191919" font-family="ui-monospace,monospace" font-size="57" font-weight="950">999 999</text>
      <path d="M461 287c86 57 302 48 399-6" fill="none" stroke="url(#amso-route-gradient)" stroke-width="12" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="final.moments" hidden>
      <rect x="145" y="307" width="93" height="43" rx="6" fill="#fff" stroke="#191919" stroke-width="5" />
      <rect x="155" y="338" width="72" height="7" rx="3" fill="url(#amso-route-gradient)" />
      <path d="M132 282l116 72" stroke="url(#amso-route-gradient)" stroke-width="13" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="final.thanks" hidden>
      <path d="M226 414c143 0 158 26 303 26h405" fill="none" stroke="url(#amso-route-gradient)" stroke-width="15" />
      <path d="M910 412l34 28-34 28" fill="none" stroke="#191919" stroke-width="9" />
    </g>
  </svg>
`;
