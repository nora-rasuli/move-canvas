export function coachTestHarnessEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.MOVE_CANVAS_E2E === "1";
}
