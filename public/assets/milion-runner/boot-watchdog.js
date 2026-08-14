(() => {
  document.documentElement.dataset.campaignScripting = "enabled";
  let bootFailed = false;
  const locale = (document.documentElement.lang || "").toLowerCase().split("-")[0];
  const copy = {
    pl: ["Trasa chwilowo niedostępna", "Nie udało się uruchomić gry."],
    de: ["Die Strecke ist vorübergehend nicht verfügbar", "Das Spiel konnte nicht gestartet werden."],
    en: ["The route is temporarily unavailable", "The game could not be started."],
    es: ["La ruta no está disponible temporalmente", "No se pudo iniciar el juego."],
    cs: ["Trasa je dočasně nedostupná", "Hru se nepodařilo spustit."],
    it: ["Il percorso non è temporaneamente disponibile", "Non è stato possibile avviare il gioco."],
    fr: ["Le parcours est temporairement indisponible", "Le jeu n’a pas pu démarrer."],
    uk: ["Маршрут тимчасово недоступний", "Не вдалося запустити гру."]
  }[locale] || ["The route is temporarily unavailable", "The game could not be started."];

  const applyBootError = () => {
    const boot = document.querySelector("[data-campaign-boot]");
    if (!(boot instanceof HTMLElement)) return false;

    boot.dataset.campaignBootState = "error";
    const eyebrow = boot.querySelector(".amso-million-runner-2026-boot__eyebrow");
    const status = boot.querySelector(".amso-million-runner-2026-boot__status");
    if (eyebrow) eyebrow.textContent = copy[0];
    if (status) status.textContent = copy[1];
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
