/** Pure policy: observations in, public keyboard commands out. */
export function nextFullStoryDriverCommand(observation, state) {
  const JUMP_OBSTACLE_TRIGGER_X = 250;
  const JUMP_PACKAGE_TRIGGER_X = 300;
  const SLIDE_TRIGGER_X = 350;
  if ((observation.authoredWave?.attemptsOnCurrentWave ?? 1) > 1) {
    return { type: "fail", reason: "authored-wave-retry" };
  }
  if (state.slideToken &&
      (observation.actionToken !== state.slideToken || observation.target === null)) {
    return { type: "slide-end", token: state.slideToken };
  }
  if (!observation.controlsEnabled || observation.actionToken === null ||
      observation.action === null || observation.target === null) return null;
  if (observation.action === "jump") {
    const threshold = observation.target.kind === "package"
      ? JUMP_PACKAGE_TRIGGER_X
      : JUMP_OBSTACLE_TRIGGER_X;
    const parcelArcReady = observation.target.kind !== "package" ||
      (observation.authoredWave?.ordersCollectedOnCurrentWave ?? 0) >= 1;
    if (parcelArcReady && observation.target.x <= threshold && observation.runner.grounded &&
        state.actedToken !== observation.actionToken) {
      return { type: "jump", token: observation.actionToken };
    }
    return null;
  }
  if (observation.action === "slide" && observation.target.x <= SLIDE_TRIGGER_X &&
      state.slideToken !== observation.actionToken) {
    return { type: "slide-start", token: observation.actionToken };
  }
  return null;
}
