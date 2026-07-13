(() => {
  document.documentElement.dataset.campaignScripting = "enabled";
  let bootFailed = false;

  const applyBootError = () => {
    const boot = document.querySelector("[data-campaign-boot]");
    if (!(boot instanceof HTMLElement)) return false;

    boot.dataset.campaignBootState = "error";
    const eyebrow = boot.querySelector(".amso-campaign-boot__eyebrow");
    const status = boot.querySelector(".amso-campaign-boot__status");
    if (eyebrow) eyebrow.textContent = "Trasa chwilowo niedostępna";
    if (status) status.textContent = "Nie udało się uruchomić gry.";
    return true;
  };

  const showBootError = () => {
    bootFailed = true;
    applyBootError();
  };

  window.addEventListener("error", showBootError, true);
  window.addEventListener("unhandledrejection", showBootError);
  window.addEventListener("securitypolicyviolation", showBootError);
  document.addEventListener("DOMContentLoaded", () => {
    if (bootFailed) applyBootError();
  }, { once: true });
})();
