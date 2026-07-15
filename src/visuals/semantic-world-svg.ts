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

    <g data-world-fallback="first-mile" data-editorial-scene="first-package" hidden>
      <g data-editorial-layer="small-shop">
        <path d="M34 74h332v292H34z" fill="#fff" stroke="#171717" stroke-width="8" />
        <path d="M34 74h332l-21-41H59z" fill="url(#amso-route-gradient)" stroke="#171717" stroke-width="8" />
        <path d="M70 112h125v105H70zm158 0h101v105H228z" fill="#faf7f0" stroke="#171717" stroke-width="7" />
        <path d="M95 137h75v55H95zm158 0h51v55h-51z" fill="#ffd8c2" />
      </g>
      <g data-editorial-layer="apartment-warehouse">
        <path d="M390 94h525v274H390z" fill="#fff" stroke="#171717" stroke-width="8" />
        <path d="M425 128v194m154-194v194m154-194v194m154-194v194" stroke="#171717" stroke-width="8" />
        <path d="M425 176h462M425 248h462M425 320h462" stroke="#171717" stroke-width="7" />
        <g fill="#f3b278" stroke="#171717" stroke-width="4">
          <path d="M442 137h57v32h-57zm67 0h52v32h-52zm86 0h62v32h-62zm72 0h48v32h-48zm83 0h56v32h-56" />
          <path d="M445 190h74v50h-74zm94 202h59v38h-59zm81-11h72v49h-72zm93 5h55v44h-55" />
        </g>
      </g>
      <g data-editorial-layer="anonymous-team">
        <circle cx="474" cy="292" r="24" fill="#f04f45" stroke="#171717" stroke-width="7" />
        <path d="M431 369v-35c0-30 19-48 43-48s43 18 43 48v35" fill="#eb32a4" stroke="#171717" stroke-width="8" />
        <circle cx="792" cy="288" r="24" fill="#f47100" stroke="#171717" stroke-width="7" />
        <path d="M749 369v-35c0-30 19-48 43-48s43 18 43 48v35" fill="#f04f45" stroke="#171717" stroke-width="8" />
      </g>
      <g data-editorial-layer="hand-packed-package" filter="url(#amso-soft-shadow)">
        <path d="M531 286h194v112H531z" fill="#c98f57" stroke="#171717" stroke-width="8" />
        <path d="M628 286v112M531 312h194" stroke="#171717" stroke-width="6" />
        <path d="M603 287h50v111h-50" fill="#fff" stroke="#171717" stroke-width="5" />
        <path d="M610 365h36" stroke="url(#amso-route-gradient)" stroke-width="8" stroke-linecap="round" />
        <path d="M505 319c31-19 54-21 82-9M751 315c-26-17-48-18-74-7" fill="none" stroke="#f3b278" stroke-width="18" stroke-linecap="round" />
      </g>
    </g>

    <g data-world-fallback="order-process" hidden>
      <path d="M38 72h884v294H38z" fill="#fff" stroke="#191919" stroke-width="8" />
      <path d="M64 118h188v205H64zm221 0h188v205H285zm221 0h188v205H506zm221 0h169v205H727z" fill="#faf7f0" stroke="#191919" stroke-width="6" />
      <g fill="#c8a27b" stroke="#191919" stroke-width="4">
        <path d="M81 274h58v43H81zm67-31h72v74h-72zm157 45h66v29h-66zm75-63h71v92h-71zm147 24h59v68h-59zm68-41h74v109h-74zm153 55h55v54h-55zm64-38h62v92h-62" />
      </g>
      <path d="M72 345h816" stroke="url(#amso-route-gradient)" stroke-width="10" />
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
      <path d="M331 282h102V132h41" fill="none" stroke="url(#amso-route-gradient)" stroke-width="8" />
    </g>

    <g data-world-fallback="client-paths" hidden>
      <path d="M57 303h235v21H57zm333 16h237v21H390zm273-16h240v21H663" fill="#191919" />
      <g fill="#191919">
        <path d="M91 212h126v83H91zm337 11h151v88H428zm270-2h168v74H698" />
      </g>
      <g fill="#faf7f0" stroke="#191919" stroke-width="5">
        <path d="M115 163h88l-9 57h-89zM458 161h91l-8 58h-92zM728 165h104l-9 57H718z" />
      </g>
      <path d="M0 405h960" fill="none" stroke="url(#amso-route-gradient)" stroke-width="12" />
      <path d="M151 405v-62m316 62v-60m313 60v-62" fill="none" stroke="url(#amso-route-gradient)" stroke-width="7" />
    </g>

    <g data-world-fallback="scale-logistics" hidden>
      <path d="M369 48h520v24H369zm0 91h520v24H369zm0 91h520v24H369" fill="#191919" />
      <g fill="#c8a27b" stroke="#191919" stroke-width="4">
        <path d="M392 86h56v42h-56zm72 0h63v42h-63zm80 0h58v42h-58zm74 0h69v42h-69zm83 0h61v42h-61zm75 0h77v42h-77" />
        <path d="M402 177h68v42h-68zm86 0h53v42h-53zm71 0h72v42h-72zm87 0h61v42h-61zm77 0h54v42h-54zm70 0h53v42h-53" />
      </g>
      <path d="M249 304h691" fill="none" stroke="#191919" stroke-width="51" />
      <path d="M249 304h691" fill="none" stroke="url(#amso-route-gradient)" stroke-width="12" />
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
        <path d="M0 133h439" />
        <path d="M0 217h439" />
        <path d="M0 301h439" />
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
      <g fill="#c8a27b" stroke="#191919" stroke-width="5">
        <path d="M358 274h74v58h-74zm84-47h83v105h-83zm94 24h69v81h-69" />
      </g>
      <g fill="#fff" stroke="#191919" stroke-width="3"><path d="M372 289h45v24h-45zm458-90h48v28h-48" /></g>
      <path d="M630 315h123v14H630" fill="#f47100" stroke="#191919" stroke-width="4" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_1.resolve" hidden>
      <g fill="#fff" stroke="#191919" stroke-width="5">
        <path d="M300 150h135v145H300zm145 0h135v145H445zm145 0h135v145H590zm145 0h135v145H735" />
      </g>
      <g fill="#191919" font-family="system-ui,sans-serif" font-size="12" font-weight="900" text-anchor="middle">
        <text x="367" y="176">PRZYJĘCIE</text><text x="512" y="176">KONTROLA</text><text x="657" y="176">PAKOWANIE</text><text x="802" y="176">WYSYŁKA</text>
      </g>
      <path d="M321 267h527" stroke="url(#amso-route-gradient)" stroke-width="8" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_2.setup" hidden>
      <g fill="#fff" stroke="#191919" stroke-width="5"><path d="M486 116h34v34h-34zm0 55h34v34h-34zm0 55h34v34h-34" /></g>
      <g fill="#c8a27b" stroke="#191919" stroke-width="5"><path d="M568 225h78v55h-78zm94 0h78v55h-78" /></g>
      <path d="M575 249h64m94 0h-64" stroke="url(#amso-route-gradient)" stroke-width="6" />
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
      <path d="M78 292h202v18H78" fill="#191919" />
      <path d="M126 185h112l-10 74H116z" fill="#fff" stroke="#191919" stroke-width="6" />
      <path d="M142 202h80l-6 40h-80z" fill="url(#amso-route-gradient)" opacity=".72" />
      <g fill="#fff" stroke="#191919" stroke-width="4"><path d="M61 111h56v45H61zm67 0h56v45h-56zm67 0h56v45h-56" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_3.business" hidden>
      <path d="M414 298h208v18H414" fill="#191919" />
      <path d="M461 197h112l-10 74H451z" fill="#fff" stroke="#191919" stroke-width="6" />
      <path d="M477 214h80l-6 40h-80z" fill="#f47100" opacity=".76" />
      <g fill="#c8a27b" stroke="#191919" stroke-width="4"><path d="M416 114h62v44h-62zm72 0h62v44h-62zm72 0h62v44h-62" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_3.b2b" hidden>
      <g fill="#fff" stroke="#191919" stroke-width="5"><path d="M674 105h190v104H674zM674 227h190v104H674z" /></g>
      <g fill="#191919"><path d="M700 139h62v45h-62zm76 0h62v45h-62zm0 122h62v45h-62zm-76 0h62v45h-62" /></g>
      <path d="M693 93h152m-152 122h152" stroke="url(#amso-route-gradient)" stroke-width="8" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_4.scale" hidden>
      <g fill="#fff" stroke="#191919" stroke-width="5"><path d="M559 83h288v125H559zM559 224h288v125H559z" /></g>
      <g fill="#c8a27b" stroke="#191919" stroke-width="3"><path d="M579 108h48v38h-48zm58 0h48v38h-48zm58 0h48v38h-48zm58 0h48v38h-48M579 252h48v38h-48zm58 0h48v38h-48zm58 0h48v38h-48zm58 0h48v38h-48" /></g>
      <path d="M579 171h245m-245 144h245" stroke="url(#amso-route-gradient)" stroke-width="8" />
      <g fill="#191919" font-family="system-ui,sans-serif" font-size="14" font-weight="800">
        <text x="86" y="98">ROCZNIE DO NOWYCH UŻYTKOWNIKÓW</text>
        <text x="86" y="134">41 tys. PC</text><text x="86" y="165">76 tys. notebooków</text>
        <text x="86" y="196">40 tys. monitorów</text><text x="86" y="227">28 tys. telefonów</text>
      </g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_4.numbers" hidden>
      <path d="M74 329h65V142h18v-38h18v38h18v187z" fill="#191919" />
      <g fill="#f47100" stroke="#191919" stroke-width="2"><path d="M236 314h18V288h-18zm0-30h18v-26h-18zm0-30h18v-26h-18zm0-30h18v-26h-18zm0-30h18v-26h-18zm0-30h18v-26h-18" /></g>
      <path d="M72 352h210" stroke="url(#amso-route-gradient)" stroke-width="8" />
      <g fill="#fff" stroke="#191919" stroke-width="5"><path d="M300 263h94l35-31h85l-21 31h69l31 19-31 19H300z" /></g>
      <g fill="#c8a27b" stroke="#191919" stroke-width="3"><path d="M620 255h44v35h-44zm53 0h44v35h-44zm53 0h44v35h-44zm53 0h44v35h-44zm53 0h44v35h-44" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_4.resolve" hidden>
      <g fill="#fff" stroke="#191919" stroke-width="5"><path d="M610 216h91v105h-91zm105 0h91v105h-91zm105 0h91v105h-91" /></g>
      <path d="M623 292h275" stroke="url(#amso-route-gradient)" stroke-width="9" />
      <g fill="#c8a27b" stroke="#191919" stroke-width="3"><path d="M633 251h39v35h-39zM738 251h39v35h-39zM843 251h39v35h-39z" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_5.approach" hidden>
      <g data-world-counter-plate transform="translate(504 145)">
        <rect width="300" height="108" rx="18" fill="#faf7f0" stroke="#191919" stroke-width="7" />
        <rect x="9" y="9" width="282" height="90" rx="12" fill="none" stroke="url(#amso-route-gradient)" stroke-width="5" />
        <text data-world-counter x="150" y="72" text-anchor="middle" fill="#191919" font-family="ui-monospace,monospace" font-size="52" font-weight="950">999 970</text>
      </g>
      <path d="M385 283h62" stroke="url(#amso-route-gradient)" stroke-width="12" />
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_5.wave" hidden>
      <g data-world-counter-plate transform="translate(504 145)">
        <rect width="300" height="108" rx="18" fill="#faf7f0" stroke="#191919" stroke-width="7" />
        <rect x="9" y="9" width="282" height="90" rx="12" fill="none" stroke="url(#amso-route-gradient)" stroke-width="5" />
        <text data-world-counter x="150" y="72" text-anchor="middle" fill="#191919" font-family="ui-monospace,monospace" font-size="52" font-weight="950">999 999</text>
      </g>
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
