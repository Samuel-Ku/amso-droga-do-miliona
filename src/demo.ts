import { CampaignController } from "./CampaignController";
import { demoConfig } from "./demo-config";

const host = document.querySelector<HTMLElement>("#amso-campaign-root");
if (host === null) throw new Error("campaign_root_missing");

const controller = new CampaignController(host, demoConfig);

if (import.meta.hot) {
  import.meta.hot.dispose(() => controller.destroy());
}
