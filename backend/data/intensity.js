export const DEFAULT_INTENSITY = "medium";

export const intensityOptions = [
  {
    id: "simple",
    lives: 4,
    timeMultiplier: 1.25,
    aiDifficulty: "easy",
  },
  {
    id: "medium",
    lives: 3,
    timeMultiplier: 1,
    aiDifficulty: "medium",
  },
  {
    id: "hard",
    lives: 2,
    timeMultiplier: 0.8,
    aiDifficulty: "hard",
  },
];

export const getIntensityOption = (intensity = DEFAULT_INTENSITY) => {
  return intensityOptions.find((option) => option.id === intensity) ?? intensityOptions[1];
};

export const normalizeIntensity = (intensity) => getIntensityOption(intensity).id;
