export const GAME_INTRODUCTION_COPY_REF = "game-introduction" as const;

export const GAME_INSTRUCTION_COPY = Object.freeze({
  landingGoal:
    "Pomóż kurierowi realizować zamówienia, zbierając paczki i urządzenia podczas biegu przez kolejne etapy historii AMSO aż do zamówienia nr 1 000 000.",
  mobileLandingGoal:
    "Pomóż kurierowi realizować zamówienia, zbierając paczki i urządzenia podczas biegu przez historię AMSO aż do zamówienia nr 1 000 000.",
  introTitle: "Poznaj drogę AMSO do miliona zamówień.",
  introGoal:
    "Pomóż kurierowi realizować zamówienia, zbierając paczki i urządzenia. Bieg prowadzi przez kolejne etapy rozwoju AMSO aż do zamówienia nr 1 000 000.",
  modeDifference:
    "Historia prowadzi przez jubileuszowe etapy AMSO. Tryb Wyzwania to niekończący się bieg po jak najlepszy wynik.",
  storySafety:
    "Gdy pojawia się karta historii, trasa jest bezpieczna — nie musisz wtedy omijać przeszkód ani zbierać przedmiotów.",
  jump: "Skok: Spacja lub W. Na urządzeniu mobilnym dotknij ekranu.",
  slide: "Ślizg: S. Na urządzeniu mobilnym przesuń palcem w dół.",
  controls:
    "Skok: Spacja lub W; na telefonie dotknij ekranu. Ślizg: S; na telefonie przesuń palcem w dół.",
  ordersAndCombo:
    "Zbieraj paczki i urządzenia, realizuj zamówienia i buduj SERIĘ ×N kolejnymi czystymi akcjami.",
  introCta: "Rozpocznij historię",
  hudOrdersLabel: "Zamówienia",
  compactControls: "Skok: Spacja/W/tap · Ślizg: S/swipe w dół"
} as const);

export const GAME_INTRODUCTION_COPY = Object.freeze({
  title: GAME_INSTRUCTION_COPY.introTitle,
  body: Object.freeze([
    GAME_INSTRUCTION_COPY.introGoal,
    GAME_INSTRUCTION_COPY.jump,
    GAME_INSTRUCTION_COPY.slide
  ]),
  continueLabel: GAME_INSTRUCTION_COPY.introCta
});

export const GAME_INSTRUCTION_COPY_BY_REF = Object.freeze({
  [GAME_INTRODUCTION_COPY_REF]: GAME_INTRODUCTION_COPY
});

export const GAME_INSTRUCTION_PAGE_ID_BY_REF = Object.freeze({
  [GAME_INTRODUCTION_COPY_REF]: "game-purpose"
} as const);

export type GameInstructionCopyRef = keyof typeof GAME_INSTRUCTION_COPY_BY_REF;

export function isGameInstructionCopyRef(value: unknown): value is GameInstructionCopyRef {
  return typeof value === "string" &&
    Object.hasOwn(GAME_INSTRUCTION_COPY_BY_REF, value);
}
