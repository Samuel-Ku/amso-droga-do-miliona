import { CAMPAIGN_TRANSLATIONS } from "./catalogs";
import type { RunnerConfig, StorySceneConfig } from "../shared/types";

export const CAMPAIGN_LOCALES = ["pl", "de", "en", "es", "cs", "it", "fr", "uk"] as const;
export type CampaignLocale = (typeof CAMPAIGN_LOCALES)[number];

const LOCALE_FORMATS: Readonly<Record<CampaignLocale, string>> = Object.freeze({
  pl: "pl-PL",
  de: "de-DE",
  en: "en-GB",
  es: "es-ES",
  cs: "cs-CZ",
  it: "it-IT",
  fr: "fr-FR",
  uk: "uk-UA"
});

const SUPPORTED = new Set<string>(CAMPAIGN_LOCALES);

export interface ResolvedCampaignLocale {
  locale: CampaignLocale;
  fallback: boolean;
}

export interface CampaignI18n {
  readonly locale: CampaignLocale;
  readonly intlLocale: string;
  formatInteger(value: number): string;
  formatOrders(value: number): string;
  formatMetres(value: number): string;
  translate(source: string): string;
}

export interface PseudoCampaignI18n extends CampaignI18n {
  readonly qaPseudo: true;
}

export function resolveCampaignLocale(
  lang: string | null | undefined,
  warn: (code: string, value: string) => void = (code, value) => console.warn(code, value)
): ResolvedCampaignLocale {
  const normalized = typeof lang === "string" ? lang.trim().toLowerCase() : "";
  const base = normalized.split("-")[0] ?? "";
  if (SUPPORTED.has(base)) {
    return { locale: base as CampaignLocale, fallback: false };
  }
  warn("campaign_locale_fallback", typeof lang === "string" ? lang : "");
  return { locale: "en", fallback: true };
}

export function createCampaignI18n(locale: CampaignLocale): CampaignI18n {
  const intlLocale = LOCALE_FORMATS[locale];
  const formatter = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 });
  const pluralRules = new Intl.PluralRules(intlLocale);
  const translations = CAMPAIGN_TRANSLATIONS[locale];
  const orderForms: Readonly<Record<CampaignLocale, Readonly<Record<Intl.LDMLPluralRule, string>>>> = {
    pl: { zero: "zamówień", one: "zamówienie", two: "zamówienia", few: "zamówienia", many: "zamówień", other: "zamówienia" },
    de: { zero: "Bestellungen", one: "Bestellung", two: "Bestellungen", few: "Bestellungen", many: "Bestellungen", other: "Bestellungen" },
    en: { zero: "orders", one: "order", two: "orders", few: "orders", many: "orders", other: "orders" },
    es: { zero: "pedidos", one: "pedido", two: "pedidos", few: "pedidos", many: "pedidos", other: "pedidos" },
    cs: { zero: "objednávek", one: "objednávka", two: "objednávky", few: "objednávky", many: "objednávek", other: "objednávky" },
    it: { zero: "ordini", one: "ordine", two: "ordini", few: "ordini", many: "ordini", other: "ordini" },
    fr: { zero: "commande", one: "commande", two: "commandes", few: "commandes", many: "commandes", other: "commandes" },
    uk: { zero: "замовлень", one: "замовлення", two: "замовлення", few: "замовлення", many: "замовлень", other: "замовлення" }
  };
  const metreForms: Readonly<Record<CampaignLocale, readonly [one: string, other: string]>> = {
    pl: ["metr", "metrów"],
    de: ["Meter", "Meter"],
    en: ["metre", "metres"],
    es: ["metro", "metros"],
    cs: ["metr", "metrů"],
    it: ["metro", "metri"],
    fr: ["mètre", "mètres"],
    uk: ["метр", "метрів"]
  };
  const finiteInteger = (value: number): number =>
    Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return Object.freeze({
    locale,
    intlLocale,
    formatInteger(value: number): string {
      return formatter.format(finiteInteger(value));
    },
    formatOrders(value: number): string {
      const finite = finiteInteger(value);
      return `${formatter.format(finite)} ${orderForms[locale][pluralRules.select(finite)]}`;
    },
    formatMetres(value: number): string {
      const finite = finiteInteger(value);
      const forms = metreForms[locale];
      return `${formatter.format(finite)} ${pluralRules.select(finite) === "one" ? forms[0] : forms[1]}`;
    },
    translate(source: string): string {
      return translations[source] ?? source;
    }
  });
}

const PSEUDO_MAP: Readonly<Record<string, string>> = Object.freeze({
  a: "á", c: "ç", e: "ë", i: "ï", l: "ľ", n: "ñ", o: "ô", s: "š", u: "ü", y: "ý",
  A: "Á", C: "Ç", E: "Ë", I: "Ï", L: "Ľ", N: "Ñ", O: "Ô", S: "Š", U: "Ü", Y: "Ý"
});

function pseudoText(source: string): string {
  const expanded = Array.from(source, (character) => PSEUDO_MAP[character] ?? character).join("");
  const padding = " ~".repeat(Math.max(1, Math.ceil(source.length * 0.18)));
  return `［${expanded}${padding}］`;
}

/** Non-public QA locale for clipping and hardcoded-copy detection. */
export function createPseudoCampaignI18n(): PseudoCampaignI18n {
  const base = createCampaignI18n("en");
  return Object.freeze({
    ...base,
    qaPseudo: true as const,
    translate: pseudoText
  });
}

export function campaignI18nFromDocument(documentReference: Document = document): CampaignI18n {
  return createCampaignI18n(resolveCampaignLocale(documentReference.documentElement.lang).locale);
}

export function localizeElementTree(root: ParentNode, i18n: CampaignI18n): void {
  const owner = root instanceof Document ? root : root.ownerDocument;
  if (!owner) return;
  const walker = owner.createTreeWalker(root, 4);
  let node = walker.nextNode();
  while (node) {
    const value = node.nodeValue ?? "";
    const leading = value.match(/^\s*/u)?.[0] ?? "";
    const trailing = value.match(/\s*$/u)?.[0] ?? "";
    const content = value.slice(leading.length, value.length - trailing.length);
    if (content.length > 0) {
      const translated = i18n.translate(content);
      if (translated !== content) node.nodeValue = `${leading}${translated}${trailing}`;
    }
    node = walker.nextNode();
  }
  root.querySelectorAll?.<HTMLElement>("[aria-label], [placeholder], [title]").forEach((element) => {
    for (const attribute of ["aria-label", "placeholder", "title"] as const) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, i18n.translate(value));
    }
  });
}

export { LOCALE_FORMATS };

function localizeScene(scene: StorySceneConfig, i18n: CampaignI18n): StorySceneConfig {
  return {
    ...scene,
    eyebrow: i18n.translate(scene.eyebrow),
    title: i18n.translate(scene.title),
    body: scene.body.map((line) => i18n.translate(line)),
    continueLabel: i18n.translate(scene.continueLabel),
    steps: scene.steps?.map((step) => ({
      ...step,
      ...(step.title === undefined ? {} : { title: i18n.translate(step.title) }),
      body: step.body.map((line) => i18n.translate(line)),
      continueLabel: i18n.translate(step.continueLabel),
      ...(step.fact === undefined ? {} : { fact: i18n.translate(step.fact) }),
      ...(step.action === undefined ? {} : { action: i18n.translate(step.action) }),
      ...(step.finalFrame === undefined ? {} : { finalFrame: i18n.translate(step.finalFrame) })
    }))
  };
}

export function localizeRunnerConfig(config: RunnerConfig, i18n: CampaignI18n): RunnerConfig {
  return {
    ...config,
    claim: i18n.translate(config.claim),
    cta: {
      ...config.cta,
      label: i18n.translate(config.cta.label),
      campaignLabel: i18n.translate(config.cta.campaignLabel),
      challengeLabel: i18n.translate(config.cta.challengeLabel)
    },
    facts: config.facts.map((fact) => ({ ...fact, text: i18n.translate(fact.text) })),
    ui: config.ui === undefined
      ? undefined
      : Object.fromEntries(Object.entries(config.ui).map(([key, value]) => [key, i18n.translate(value)])),
    story: {
      ...config.story,
      scenes: config.story.scenes.map((scene) => localizeScene(scene, i18n)),
      epochs: config.story.epochs.map((epoch) => ({
        ...epoch,
        name: i18n.translate(epoch.name),
        year: i18n.translate(epoch.year),
        ...(epoch.challengeName === undefined
          ? {}
          : { challengeName: i18n.translate(epoch.challengeName) })
      }))
    },
    narrative: config.narrative === undefined
      ? undefined
      : {
          ...config.narrative,
          facts: config.narrative.facts.map((fact) => ({
            ...fact,
            text: i18n.translate(fact.text)
          })),
          epochs: config.narrative.epochs.map((epoch) => ({
            ...epoch,
            name: i18n.translate(epoch.name),
            year: i18n.translate(epoch.year),
            ...(epoch.challengeName === undefined
              ? {}
              : { challengeName: i18n.translate(epoch.challengeName) }),
            beats: epoch.beats?.map((beat) => ({ ...beat, text: i18n.translate(beat.text) }))
          }))
        }
  };
}
