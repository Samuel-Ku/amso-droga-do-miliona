import { demoConfig } from "./demo-config";
import { mountCampaign } from "./index";

const host = document.querySelector<HTMLElement>("#amso-campaign-root");
if (host === null) throw new Error("campaign_root_missing");

let campaign: ReturnType<typeof mountCampaign> | null = null;

declare global {
  interface Window {
    AMSOMillionRunnerQA?: ReturnType<typeof mountCampaign>;
  }
}

try {
  campaign = mountCampaign(demoConfig, host);
  window.AMSOMillionRunnerQA = campaign;
} catch (error: unknown) {
  console.error("AMSO campaign bootstrap failed", error);
  host.innerHTML = `
    <section
      class="amso-campaign-boot"
      data-campaign-boot
      data-campaign-boot-state="error"
      role="alert"
    >
      <div class="amso-campaign-boot__card">
        <p class="amso-campaign-boot__eyebrow">Trasa chwilowo niedostępna</p>
        <h1>Droga do Miliona</h1>
        <p class="amso-campaign-boot__status">Nie udało się uruchomić gry.</p>
        <p class="amso-campaign-boot__help">
          Odśwież stronę albo otwórz ją w innej przeglądarce.
          <a class="amso-campaign-boot__retry" href="">Odśwież stronę</a>
        </p>
        <div class="amso-campaign-boot__accent" aria-hidden="true"></div>
      </div>
    </section>
  `;
}

if (import.meta.hot && campaign !== null) {
  import.meta.hot.dispose(() => {
    campaign?.destroy();
    delete window.AMSOMillionRunnerQA;
  });
}
