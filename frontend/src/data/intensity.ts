export type IntensityLevel = "simple" | "medium" | "hard";

export type IntensityOption = {
  id: IntensityLevel;
  label: string;
  description: string;
  lives: number;
  timeMultiplier: number;
  aiDifficulty: "easy" | "medium" | "hard";
};

export const intensityOptions: IntensityOption[] = [
  {
    id: "simple",
    label: "Simple",
    description: "More time and 4 lives.",
    lives: 4,
    timeMultiplier: 1.25,
    aiDifficulty: "easy",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Balanced timers and 3 lives.",
    lives: 3,
    timeMultiplier: 1,
    aiDifficulty: "medium",
  },
  {
    id: "hard",
    label: "Hard",
    description: "Less time and 2 lives.",
    lives: 2,
    timeMultiplier: 0.8,
    aiDifficulty: "hard",
  },
];

export const DEFAULT_INTENSITY: IntensityLevel = "medium";

export const getIntensityOption = (intensity: IntensityLevel) => {
  return intensityOptions.find((option) => option.id === intensity) ?? intensityOptions[1];
};
