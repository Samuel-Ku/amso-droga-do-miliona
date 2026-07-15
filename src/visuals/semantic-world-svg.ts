/** Concrete, code-owned story art used both as the fallback and semantic layer. */
export const SEMANTIC_WORLD_SVG = `
  <svg class="amso-world-visual__semantic" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <linearGradient id="amso-route-gradient" x1="0" x2="1">
        <stop offset="0" stop-color="#f47100" />
        <stop offset="0.52" stop-color="#f04f45" />
        <stop offset="1" stop-color="#eb32a4" />
      </linearGradient>
      <pattern id="amso-paper-dots" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#171717" opacity=".07" />
      </pattern>
      <filter id="amso-soft-shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="7" dy="8" stdDeviation="0" flood-color="#171717" flood-opacity=".16" />
      </filter>
    </defs>

    <g class="amso-world-visual__semantic-base">
      <rect width="960" height="540" fill="#faf7f0" />
      <rect width="960" height="540" fill="url(#amso-paper-dots)" />

      <g data-world-fallback="first-mile" data-editorial-scene="first-package" hidden>
        <g data-editorial-layer="small-shop">
          <path d="M44 94h302v274H44z" fill="#fff" stroke="#171717" stroke-width="8" />
          <path d="M44 94h302L322 53H69z" fill="#f47100" stroke="#171717" stroke-width="8" />
          <path d="M77 132h113v92H77zm141 0h91v92h-91z" fill="#f7e5d8" stroke="#171717" stroke-width="6" />
          <path d="M112 255h165v113H112z" fill="#eee9df" stroke="#171717" stroke-width="7" />
        </g>
        <g data-editorial-layer="apartment-warehouse">
          <path d="M370 96h545v272H370z" fill="#fff" stroke="#171717" stroke-width="8" />
          <path d="M404 137h481M404 211h481M404 285h481" stroke="#171717" stroke-width="7" />
          <path d="M515 137v194m158-194v194m158-194v194" stroke="#171717" stroke-width="7" />
          <g fill="#c98f57" stroke="#171717" stroke-width="4">
            <path d="M423 151h72v48h-72zm111 151h61v52h-61zm158-151h71v48h-71zm158 76h53v55h-53" />
          </g>
        </g>
        <g data-editorial-layer="anonymous-team">
          <circle cx="477" cy="292" r="23" fill="#f1bd91" stroke="#171717" stroke-width="6" />
          <path d="M435 371v-37c0-28 18-46 42-46s42 18 42 46v37" fill="#f04f45" stroke="#171717" stroke-width="7" />
          <circle cx="798" cy="292" r="23" fill="#f1bd91" stroke="#171717" stroke-width="6" />
          <path d="M756 371v-37c0-28 18-46 42-46s42 18 42 46v37" fill="#eb32a4" stroke="#171717" stroke-width="7" />
        </g>
        <g data-editorial-layer="hand-packed-package" filter="url(#amso-soft-shadow)">
          <path d="M551 284h190v116H551z" fill="#c98f57" stroke="#171717" stroke-width="8" />
          <path d="M646 284v116M551 314h190" stroke="#171717" stroke-width="6" />
          <path d="M619 284h54v116h-54" fill="#fff" stroke="#171717" stroke-width="5" />
          <rect x="628" y="352" width="36" height="10" rx="3" fill="url(#amso-route-gradient)" />
          <path d="M523 322c34-17 57-18 83-8M767 319c-29-16-50-17-79-7" fill="none" stroke="#f1bd91" stroke-width="17" stroke-linecap="round" />
        </g>
      </g>

      <g data-world-fallback="order-process" hidden>
        <path d="M37 78h886v300H37z" fill="#fff" stroke="#171717" stroke-width="8" />
        <g data-editorial-layer="receiving-dock">
          <path d="M64 122h185v221H64z" fill="#f3eee6" stroke="#171717" stroke-width="6" />
          <path d="M84 265h67v58H84zm77-33h70v91h-70" fill="#c98f57" stroke="#171717" stroke-width="5" />
          <path d="M77 144h158v60H77z" fill="#d9e8eb" stroke="#171717" stroke-width="5" />
        </g>
        <g data-editorial-layer="inspection-bench">
          <path d="M274 122h190v221H274z" fill="#f3eee6" stroke="#171717" stroke-width="6" />
          <path d="M299 284h142v22H299zm17-94h111l-10 73H306z" fill="#292929" stroke="#171717" stroke-width="5" />
          <path d="M328 204h87l-7 47h-87z" fill="#d9e8eb" />
        </g>
        <g data-editorial-layer="packing-table">
          <path d="M489 122h190v221H489z" fill="#f3eee6" stroke="#171717" stroke-width="6" />
          <path d="M513 279h142v24H513z" fill="#292929" />
          <path d="M542 217h84v62h-84z" fill="#c98f57" stroke="#171717" stroke-width="5" />
          <path d="M584 217v62" stroke="#171717" stroke-width="5" />
          <rect x="566" y="242" width="36" height="12" fill="#fff" stroke="#171717" stroke-width="3" />
        </g>
        <g data-editorial-layer="dispatch-door">
          <path d="M704 122h190v221H704z" fill="#f3eee6" stroke="#171717" stroke-width="6" />
          <path d="M743 151h112v172H743z" fill="#d9e8eb" stroke="#171717" stroke-width="7" />
          <path d="M755 175h88M755 209h88M755 243h88M755 277h88" stroke="#171717" stroke-width="5" />
          <path d="M687 319h64v24h-64" fill="#c98f57" stroke="#171717" stroke-width="4" />
        </g>
        <path d="M84 351h764" stroke="#171717" stroke-width="20" />
        <path d="M84 351h764" stroke="url(#amso-route-gradient)" stroke-width="7" />
      </g>

      <g data-world-fallback="quality-service" hidden>
        <g data-editorial-layer="quality-technician">
          <circle cx="158" cy="210" r="25" fill="#f1bd91" stroke="#171717" stroke-width="6" />
          <path d="M112 342v-72c0-36 20-61 46-61s46 25 46 61v72" fill="#f04f45" stroke="#171717" stroke-width="7" />
          <path d="M204 263l77 35" stroke="#f1bd91" stroke-width="18" stroke-linecap="round" />
        </g>
        <g data-editorial-layer="inspection-bench">
          <path d="M247 311h310v35H247z" fill="#292929" />
          <path d="M284 346v39m235-39v39" stroke="#292929" stroke-width="18" />
        </g>
        <g data-editorial-layer="same-laptop">
          <path d="M318 183h175l-16 119H302z" fill="#292929" stroke="#171717" stroke-width="7" />
          <path d="M334 201h141l-11 83H320z" fill="#d9e8eb" />
          <path d="M284 302h230l34 24H250z" fill="#444" stroke="#171717" stroke-width="6" />
        </g>
        <g data-editorial-layer="shipping-box">
          <path d="M651 236h192v122H651z" fill="#c98f57" stroke="#171717" stroke-width="7" />
          <path d="M747 236v122M651 266h192" stroke="#171717" stroke-width="5" />
          <rect x="716" y="299" width="62" height="27" rx="4" fill="#fff" stroke="#171717" stroke-width="4" />
          <path d="M733 313l10 9 19-22" fill="none" stroke="url(#amso-route-gradient)" stroke-width="6" stroke-linecap="round" />
        </g>
      </g>

      <g data-world-fallback="client-paths" hidden>
        <g data-editorial-layer="same-client">
          <circle cx="190" cy="219" r="28" fill="#f1bd91" stroke="#171717" stroke-width="7" />
          <path d="M142 385v-91c0-45 21-76 48-76s48 31 48 76v91" fill="#f04f45" stroke="#171717" stroke-width="8" />
        </g>
        <g data-editorial-layer="first-laptop">
          <path d="M270 315h245v28H270z" fill="#292929" />
          <path d="M318 211h151l-13 100H305z" fill="#292929" stroke="#171717" stroke-width="6" />
          <path d="M333 227h119l-9 68H324z" fill="#d9e8eb" />
        </g>
        <g data-editorial-layer="expanded-office">
          <path d="M562 115h344v259H562z" fill="#fff" stroke="#171717" stroke-width="7" />
          <path d="M595 281h126v23H595zm151 0h126v23H746" fill="#292929" />
          <path d="M619 201h81l-8 61h-81zm151 0h81l-8 61h-81" fill="#d9e8eb" stroke="#171717" stroke-width="5" />
          <circle cx="657" cy="164" r="20" fill="#f1bd91" stroke="#171717" stroke-width="5" />
          <circle cx="808" cy="164" r="20" fill="#f1bd91" stroke="#171717" stroke-width="5" />
          <path d="M625 202v-17c0-23 14-38 32-38s32 15 32 38v17M776 202v-17c0-23 14-38 32-38s32 15 32 38v17" fill="#eb32a4" stroke="#171717" stroke-width="6" />
        </g>
      </g>

      <g data-world-fallback="scale-logistics" hidden>
        <g data-editorial-layer="pkin-silhouette">
          <path d="M88 352h150V180h28v-55h24v55h28v172h62v34H88z" fill="#292929" />
          <path d="M151 212h118M151 252h118M151 292h118" stroke="#faf7f0" stroke-width="8" />
        </g>
        <g data-editorial-layer="phone-tower">
          <g fill="#f47100" stroke="#171717" stroke-width="3">
            <rect x="401" y="83" width="34" height="58" rx="6" /><rect x="401" y="145" width="34" height="58" rx="6" />
            <rect x="401" y="207" width="34" height="58" rx="6" /><rect x="401" y="269" width="34" height="58" rx="6" />
            <rect x="401" y="331" width="34" height="58" rx="6" />
          </g>
          <path d="M449 83v306M449 83h23M449 389h23" stroke="url(#amso-route-gradient)" stroke-width="7" />
        </g>
        <g data-editorial-layer="warehouse-team">
          <path d="M518 266h392v86H518z" fill="#eee9df" stroke="#171717" stroke-width="7" />
          <path d="M544 325h340" stroke="#171717" stroke-width="21" />
          <path d="M544 325h340" stroke="url(#amso-route-gradient)" stroke-width="7" />
          <path d="M581 277h58v44h-58zm97 260h63v61h-63zm101 17h61v44h-61" fill="#c98f57" stroke="#171717" stroke-width="4" />
          <circle cx="568" cy="205" r="22" fill="#f1bd91" stroke="#171717" stroke-width="5" />
          <path d="M533 275v-35c0-31 15-51 35-51s35 20 35 51v35" fill="#f04f45" stroke="#171717" stroke-width="6" />
        </g>
      </g>

      <g data-world-fallback="million-approach" hidden>
        <g data-editorial-layer="last-thirty-packages">
          <path d="M55 292h57v47H55zm72-54h57v47h-57zm72 54h57v47h-57zm72-54h57v47h-57zm72 54h57v47h-57" fill="#c98f57" stroke="#171717" stroke-width="4" />
          <path d="M72 315h19m72-54h19m72 54h19m72-54h19m72 54h19" stroke="url(#amso-route-gradient)" stroke-width="6" />
        </g>
        <path d="M42 374h876" stroke="#171717" stroke-width="24" />
      </g>

      <g data-world-fallback="million-finale" hidden>
        <g data-editorial-layer="millionth-package" filter="url(#amso-soft-shadow)">
          <path d="M332 269h296v151H332z" fill="#c98f57" stroke="#171717" stroke-width="9" />
          <path d="M480 269v151M332 308h296" stroke="#171717" stroke-width="7" />
          <rect x="434" y="340" width="92" height="42" rx="6" fill="#fff" stroke="#171717" stroke-width="5" />
          <rect x="447" y="366" width="66" height="8" rx="4" fill="url(#amso-route-gradient)" />
        </g>
        <g data-editorial-layer="amso-team">
          <circle cx="188" cy="301" r="24" fill="#f1bd91" stroke="#171717" stroke-width="6" />
          <path d="M145 417v-72c0-34 18-56 43-56s43 22 43 56v72" fill="#f04f45" stroke="#171717" stroke-width="7" />
          <circle cx="768" cy="301" r="24" fill="#f1bd91" stroke="#171717" stroke-width="6" />
          <path d="M725 417v-72c0-34 18-56 43-56s43 22 43 56v72" fill="#eb32a4" stroke="#171717" stroke-width="7" />
        </g>
        <g data-editorial-layer="challenge-shield">
          <path d="M836 188l50 17v46c0 44-20 75-50 92-30-17-50-48-50-92v-46z" fill="#fff" stroke="#171717" stroke-width="7" />
          <path d="M815 252l16 17 30-39" fill="none" stroke="url(#amso-route-gradient)" stroke-width="9" stroke-linecap="round" />
        </g>
      </g>

      <path class="amso-world-visual__track" d="M0 446h960" stroke="#171717" stroke-width="29" />
      <path class="amso-world-visual__track-accent" d="M0 439h960" stroke="url(#amso-route-gradient)" stroke-width="9" />
    </g>

    <g class="amso-world-visual__state" data-state-overlay="intro.ready" hidden>
      <g data-editorial-layer="first-parcel-preview"><path d="M108 291h105v69H108z" fill="#c98f57" stroke="#171717" stroke-width="6" /><path d="M160 291v69" stroke="#171717" stroke-width="5" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="intro.beginning" hidden>
      <g data-editorial-layer="small-stock"><path d="M94 278h66v48H94zm76-36h70v84h-70zm80 12h63v72h-63" fill="#c98f57" stroke="#171717" stroke-width="5" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="intro.promise" hidden>
      <g data-editorial-layer="sealed-first-parcel"><path d="M552 284h190v116H552z" fill="#c98f57" stroke="#171717" stroke-width="8" /><path d="M647 284v116" stroke="#171717" stroke-width="6" /><rect x="626" y="349" width="42" height="14" fill="#fff" stroke="#171717" stroke-width="3" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_1.challenge" hidden>
      <g data-editorial-layer="package-backlog"><path d="M333 268h78v62h-78zm88-50h88v112h-88zm98 27h74v85h-74" fill="#c98f57" stroke="#171717" stroke-width="5" /><path d="M616 292h97v38h-97" fill="#f47100" stroke="#171717" stroke-width="5" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_1.resolve" hidden>
      <g data-editorial-layer="ordered-workstations"><path d="M64 122h185v221H64zm210 0h190v221H274zm215 0h190v221H489zm215 0h190v221H704" fill="#fff" stroke="#171717" stroke-width="6" /><path d="M84 305h145m65 0h150m65 0h150m65 0h150" stroke="url(#amso-route-gradient)" stroke-width="7" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_2.setup" hidden>
      <g data-editorial-layer="laptop-powered-on"><path d="M318 183h175l-16 119H302z" fill="#292929" stroke="#171717" stroke-width="7" /><path d="M334 201h141l-11 83H320z" fill="#d9e8eb" /><circle cx="397" cy="243" r="17" fill="#f47100" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_2.resolve" hidden>
      <g data-editorial-layer="checked-laptop"><path d="M318 183h175l-16 119H302z" fill="#292929" stroke="#171717" stroke-width="7" /><path d="M334 201h141l-11 83H320z" fill="#d9e8eb" /><path d="M361 244l20 20 43-54" fill="none" stroke="url(#amso-route-gradient)" stroke-width="11" stroke-linecap="round" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_3.people" hidden>
      <g data-editorial-layer="same-client"><circle cx="190" cy="219" r="28" fill="#f1bd91" stroke="#171717" stroke-width="7" /><path d="M142 385v-91c0-45 21-76 48-76s48 31 48 76v91" fill="#f04f45" stroke="#171717" stroke-width="8" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_3.designer" hidden>
      <g data-editorial-layer="first-laptop"><path d="M318 211h151l-13 100H305z" fill="#292929" stroke="#171717" stroke-width="6" /><path d="M333 227h119l-9 68H324z" fill="#d9e8eb" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_3.business" hidden>
      <g data-editorial-layer="growing-workplace"><path d="M562 115h344v259H562z" fill="#fff" stroke="#171717" stroke-width="7" /><path d="M595 281h126v23H595zm151 0h126v23H746" fill="#292929" /><path d="M619 201h81l-8 61h-81zm151 0h81l-8 61h-81" fill="#d9e8eb" stroke="#171717" stroke-width="5" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_3.b2b" hidden>
      <g data-editorial-layer="equipped-team"><circle cx="657" cy="164" r="20" fill="#f1bd91" stroke="#171717" stroke-width="5" /><circle cx="808" cy="164" r="20" fill="#f1bd91" stroke="#171717" stroke-width="5" /><path d="M619 201h81l-8 61h-81zm151 0h81l-8 61h-81" fill="#d9e8eb" stroke="#171717" stroke-width="5" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_4.scale" hidden>
      <g data-editorial-layer="annual-phone-pallets"><path d="M545 257h72v54h-72zm85 0h72v54h-72zm85 0h72v54h-72zm85 0h72v54h-72" fill="#c98f57" stroke="#171717" stroke-width="4" /><path d="M530 320h360" stroke="#171717" stroke-width="18" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_4.numbers" hidden>
      <g data-editorial-layer="pkin-silhouette"><path d="M88 352h150V180h28v-55h24v55h28v172h62v34H88z" fill="#292929" /></g>
      <g data-editorial-layer="phone-tower"><rect x="401" y="83" width="34" height="306" rx="6" fill="#f47100" stroke="#171717" stroke-width="5" /><path d="M449 83v306" stroke="url(#amso-route-gradient)" stroke-width="7" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_4.resolve" hidden>
      <g data-editorial-layer="completed-dispatch"><path d="M570 216h104v107H570zm119 0h104v107H689zm119 0h104v107H808" fill="#fff" stroke="#171717" stroke-width="6" /><path d="M588 287h306" stroke="url(#amso-route-gradient)" stroke-width="8" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_5.approach" hidden>
      <g data-world-counter-plate transform="translate(493 126)"><rect width="340" height="132" rx="20" fill="#faf7f0" stroke="#171717" stroke-width="8" /><rect x="10" y="10" width="320" height="112" rx="13" fill="none" stroke="url(#amso-route-gradient)" stroke-width="5" /><text data-world-counter x="170" y="86" text-anchor="middle" fill="#171717" font-family="ui-monospace,monospace" font-size="54" font-weight="950">999 970</text></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="epoch_5.wave" hidden>
      <g data-world-counter-plate transform="translate(493 126)"><rect width="340" height="132" rx="20" fill="#faf7f0" stroke="#171717" stroke-width="8" /><rect x="10" y="10" width="320" height="112" rx="13" fill="none" stroke="url(#amso-route-gradient)" stroke-width="5" /><text data-world-counter x="170" y="86" text-anchor="middle" fill="#171717" font-family="ui-monospace,monospace" font-size="54" font-weight="950">999 999</text></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="final.moments" hidden>
      <g data-editorial-layer="millionth-package"><path d="M332 269h296v151H332z" fill="#c98f57" stroke="#171717" stroke-width="9" /><path d="M480 269v151" stroke="#171717" stroke-width="7" /><rect x="434" y="340" width="92" height="42" rx="6" fill="#fff" stroke="#171717" stroke-width="5" /></g>
    </g>
    <g class="amso-world-visual__state" data-state-overlay="final.thanks" hidden>
      <g data-editorial-layer="challenge-shield"><path d="M724 162l72 24v67c0 63-29 108-72 132-43-24-72-69-72-132v-67z" fill="#fff" stroke="#171717" stroke-width="8" /><path d="M694 255l23 24 43-56" fill="none" stroke="url(#amso-route-gradient)" stroke-width="11" stroke-linecap="round" /></g>
    </g>
  </svg>
`;
