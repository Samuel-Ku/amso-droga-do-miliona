import { demoConfig } from "./demo-config";
import { mountCampaign } from "./index";
import { parseQaBootConfig, QaBootConfigError } from "./qa/boot-config";
import { campaignI18nFromDocument, localizeElementTree } from "./localization";
import {
  applyVercelCampaignLocale,
  persistVercelCampaignLocale,
  safeVercelLocaleStorage,
  vercelCampaignLocaleFromUrl,
  vercelLocaleSelectionUrl
} from "./localization/vercel-locale";

const host = document.querySelector<HTMLElement>("#amso-million-runner-2026-root");
if (host === null) throw new Error("campaign_root_missing");

let campaign: ReturnType<typeof mountCampaign> | null = null;

const isVercelProfile = host.dataset.campaignKeyboardProfile === "vercel";
const localeStorage = safeVercelLocaleStorage(window);
if (isVercelProfile) {
  const requestedLocale = vercelCampaignLocaleFromUrl(window.location.href);
  applyVercelCampaignLocale(document, navigator, localeStorage, requestedLocale);
}

declare global {
  interface Window {
    AMSOMillionRunnerQA?: ReturnType<typeof mountCampaign>;
  }
}

try {
  const boot = parseQaBootConfig(new URL(window.location.href));
  const onLanguageChange = (locale: Parameters<typeof persistVercelCampaignLocale>[0]): void => {
    persistVercelCampaignLocale(locale, localeStorage);
    window.location.assign(vercelLocaleSelectionUrl(window.location.href, locale));
  };
  campaign = mountCampaign(demoConfig, host, {
    ...(boot.kind === "performance" ? { qa: boot.config } : {}),
    ...(isVercelProfile ? { onLanguageChange } : {})
  });
  if (boot.kind === "performance") {
    window.AMSOMillionRunnerQA = campaign;
  } else {
    delete window.AMSOMillionRunnerQA;
  }
} catch (error: unknown) {
  console.error("AMSO campaign bootstrap failed", error);
  host.innerHTML = `
    <section
      class="amso-million-runner-2026-boot"
      data-campaign-boot
      data-campaign-boot-state="error"
      role="alert"
    >
      <div class="amso-million-runner-2026-boot__card">
        <p class="amso-million-runner-2026-boot__eyebrow">Trasa chwilowo niedostępna</p>
        <h1>Droga do Miliona</h1>
        <p class="amso-million-runner-2026-boot__status">${error instanceof QaBootConfigError
          ? "QA configuration error. Scenario was not started."
          : "Nie udało się uruchomić gry."}</p>
        <p class="amso-million-runner-2026-boot__help">
          Odśwież stronę albo otwórz ją w innej przeglądarce.
          <a class="amso-million-runner-2026-boot__retry" href="">Odśwież stronę</a>
        </p>
        <div class="amso-million-runner-2026-boot__accent" aria-hidden="true"></div>
      </div>
    </section>
  `;
  localizeElementTree(host, campaignI18nFromDocument(document));
}

if (import.meta.hot && campaign !== null) {
  import.meta.hot.dispose(() => {
    campaign?.destroy();
    delete window.AMSOMillionRunnerQA;
  });
}
