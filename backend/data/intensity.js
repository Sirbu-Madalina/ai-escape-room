export const DEFAULT_INTENSITY = "medium";

export const intensityOptions = [
  {
    id: "simple",
    lives: 4,
    timeMultiplier: 1.25,
    timeLimitSeconds: 20 * 60,
    aiDifficulty: "easy",
  },
  {
    id: "medium",
    lives: 3,
    timeMultiplier: 1,
    timeLimitSeconds: 15 * 60,
    aiDifficulty: "medium",
  },
  {
    id: "hard",
    lives: 2,
    timeMultiplier: 0.8,
    timeLimitSeconds: 10 * 60,
    aiDifficulty: "hard",
  },
];

export const getIntensityOption = (intensity = DEFAULT_INTENSITY) => {
  return intensityOptions.find((option) => option.id === intensity) ?? intensityOptions[1];
};

export const normalizeIntensity = (intensity) => getIntensityOption(intensity).id;
