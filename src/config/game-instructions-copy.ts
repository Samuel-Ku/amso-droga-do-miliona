export const GAME_INTRODUCTION_COPY_REF = "game-introduction" as const;

export const GAME_INSTRUCTION_COPY = Object.freeze({
  landingGoal:
    "Pomóż kurierowi realizować zamówienia, zbierając paczki i urządzenia podczas biegu przez kolejne etapy historii AMSO aż do zamówienia nr 1 000 000.",
  introTitle: "Poznaj drogę AMSO do miliona zamówień.",
  introGoal:
    "Pomóż kurierowi realizować zamówienia, zbierając paczki i urządzenia. Bieg prowadzi przez kolejne etapy rozwoju AMSO aż do zamówienia nr 1 000 000.",
  storySafety:
    "Historia i bieg przeplatają się. Gdy pojawia się karta historii, trasa jest bezpieczna. Nie musisz wtedy omijać przeszkód ani zbierać przedmiotów.",
  jump: "Skok: Spacja, W lub ↑. Na urządzeniu mobilnym dotknij ekranu.",
  slide: "Ślizg: S lub ↓. Na urządzeniu mobilnym przesuń palcem w dół.",
  ordersAndCombo:
    "Zbieraj paczki i urządzenia, aby realizować kolejne zamówienia. Bonus zawsze pokazuje swoje działanie, a kolejne czyste akcje zwiększają SERIĘ ×N.",
  introCta: "Rozpocznij historię",
  hudOrdersLabel: "Zamówienia",
  compactControls: "Skok: Spacja/W/↑/tap · Ślizg: S/↓/swipe ↓"
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
