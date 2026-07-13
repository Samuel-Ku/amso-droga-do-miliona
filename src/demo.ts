import { demoConfig } from "./demo-config";
import { mountCampaign } from "./index";

const host = document.querySelector<HTMLElement>("#amso-campaign-root");
if (host === null) throw new Error("campaign_root_missing");

const campaign = mountCampaign(demoConfig, host);

if (import.meta.hot) {
  import.meta.hot.dispose(() => campaign.destroy());
}
