export type ProductScreen = "title" | "opening-briefing" | "main-game";

export type ProductScreenIntent =
  "start-new-game" | "finish-opening" | "skip-opening" | "return-to-title";

export function transitionProductScreen(
  screen: ProductScreen,
  intent: ProductScreenIntent,
): ProductScreen {
  if (intent === "return-to-title") return "title";
  if (screen === "title" && intent === "start-new-game") {
    return "opening-briefing";
  }
  if (
    screen === "opening-briefing" &&
    (intent === "finish-opening" || intent === "skip-opening")
  ) {
    return "main-game";
  }
  return screen;
}
