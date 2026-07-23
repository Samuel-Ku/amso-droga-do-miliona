import {
  PLAYER_NAME_DISALLOWED_MESSAGE,
  PLAYER_NAME_TOO_LONG_MESSAGE,
  validatePlayerName
} from "../moderation/player-name-policy";

export interface NamePromptResult {
  name: string;
  /** true when the player dismissed without entering a name. */
  skipped: boolean;
}

/**
 * Small modal that asks for a display name exactly once per need.
 * Resolves with the sanitized name or skipped=true.
 */
export class NamePrompt {
  private readonly overlay: HTMLElement;
  private resolver: ((result: NamePromptResult) => void) | null = null;

  public constructor(host: HTMLElement) {
    this.overlay = document.createElement("div");
    this.overlay.className = "amso-name-prompt";
    this.overlay.hidden = true;
    this.overlay.innerHTML = `
      <div class="amso-name-prompt__card" role="dialog" aria-modal="true" aria-labelledby="amso-name-prompt-title">
        <p class="amso-name-prompt__eyebrow">Tablica rekordów</p>
        <h2 class="amso-name-prompt__title" id="amso-name-prompt-title">Jak wpisać Cię na listę?</h2>
        <p class="amso-name-prompt__lead">Podaj imię lub nick — pojawisz się w tablicy rekordów. Zapytamy tylko raz.</p>
        <form class="amso-name-prompt__form" data-campaign-name-form>
          <input
            class="amso-name-prompt__input"
            type="text"
            autocomplete="off"
            aria-label="Imię lub nick"
            aria-describedby="amso-name-prompt-help amso-name-prompt-error"
            data-campaign-name-input
            placeholder="np. Kurier_12"
          />
          <p class="amso-name-prompt__help" id="amso-name-prompt-help">Maksymalnie 14 znaków: litery, cyfry, spacja, myślnik lub podkreślenie.</p>
          <p class="amso-name-prompt__error" id="amso-name-prompt-error" data-campaign-name-error hidden role="alert"></p>
          <div class="amso-name-prompt__actions">
            <button type="button" class="amso-campaign__button amso-campaign__button--secondary" data-campaign-name-skip>Teraz nie</button>
            <button type="submit" class="amso-campaign__button amso-campaign__button--primary" data-campaign-name-submit>Zapisz</button>
          </div>
        </form>
      </div>`;
    host.appendChild(this.overlay);

    const form = this.overlay.querySelector<HTMLFormElement>("[data-campaign-name-form]")!;
    const input = this.overlay.querySelector<HTMLInputElement>("[data-campaign-name-input]")!;
    const error = this.overlay.querySelector<HTMLElement>("[data-campaign-name-error]")!;
    const skip = this.overlay.querySelector<HTMLButtonElement>("[data-campaign-name-skip]")!;

    const showValidation = (): ReturnType<typeof validatePlayerName> => {
      const result = validatePlayerName(input.value);
      if (result.valid || input.value.length === 0) {
        error.textContent = "";
        error.hidden = true;
        return result;
      }
      error.textContent = result.reason === "too_long"
        ? PLAYER_NAME_TOO_LONG_MESSAGE
        : PLAYER_NAME_DISALLOWED_MESSAGE;
      error.hidden = false;
      return result;
    };

    input.addEventListener("input", showValidation);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const result = showValidation();
      if (!result.valid) {
        if (input.value.length === 0) {
          error.textContent = PLAYER_NAME_DISALLOWED_MESSAGE;
          error.hidden = false;
        }
        input.focus();
        return;
      }
      this.resolve({ name: result.name, skipped: false });
    });
    skip.addEventListener("click", () => this.resolve({ name: "", skipped: true }));
  }

  public ask(prefill = ""): Promise<NamePromptResult> {
    const input = this.overlay.querySelector<HTMLInputElement>("[data-campaign-name-input]")!;
    const error = this.overlay.querySelector<HTMLElement>("[data-campaign-name-error]")!;
    input.value = prefill;
    error.hidden = true;
    this.overlay.hidden = false;
    input.focus();
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  public close(): void {
    this.overlay.hidden = true;
  }

  private resolve(result: NamePromptResult): void {
    this.overlay.hidden = true;
    const r = this.resolver;
    this.resolver = null;
    r?.(result);
  }
}
