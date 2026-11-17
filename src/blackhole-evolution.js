export const BLACK_HOLE_EVOLUTION_INTERVAL_SECONDS = 210;
export const BLACK_HOLE_EVOLUTION_MAX_STAGE = 8;

export function getBlackHoleEvolution(elapsedSeconds) {
  const elapsed = Number.isFinite(Number(elapsedSeconds)) ? Math.max(0, Number(elapsedSeconds)) : 0;
  const stage = Math.min(BLACK_HOLE_EVOLUTION_MAX_STAGE, Math.floor(elapsed / BLACK_HOLE_EVOLUTION_INTERVAL_SECONDS));
  const progress = stage / BLACK_HOLE_EVOLUTION_MAX_STAGE;
  return {
    stage,
    level: stage + 1,
    nextEvolutionIn: stage >= BLACK_HOLE_EVOLUTION_MAX_STAGE
      ? 0
      : BLACK_HOLE_EVOLUTION_INTERVAL_SECONDS - (elapsed % BLACK_HOLE_EVOLUTION_INTERVAL_SECONDS),
    growth: 1 + stage * 0.035,
    speedFactor: Math.max(0.48, 1 - stage * 0.065),
    energy: Math.min(1, 0.25 + progress * 0.7),
    intensity: Math.min(1, 0.3 + progress * 0.68)
  };
}
