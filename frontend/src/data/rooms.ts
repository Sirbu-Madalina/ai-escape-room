export type PuzzleType = "ai-riddle" | "sudoku" | "logic-board";

export type Room = {
  id: number;
  title: string;
  subtitle: string;
  theme: string;
  difficulty: string;
  themeClass: string;
  unlocked: boolean;
  puzzleType: PuzzleType;
  timeLimitSeconds: number;
};

export const initialRooms: Room[] = [
  {
    id: 1,
    title: "Room 1",
    subtitle: "AI Escape Room - Cyber Lab",
    theme: "cyber lab",
    difficulty: "easy",
    themeClass: "cyan",
    unlocked: true,
    puzzleType: "ai-riddle",
    timeLimitSeconds: 120,
  },
  {
    id: 2,
    title: "Room 2",
    subtitle: "AI Escape Room - Vault Core",
    theme: "digital vault",
    difficulty: "medium",
    themeClass: "gold",
    unlocked: false,
    puzzleType: "sudoku",
    timeLimitSeconds: 150,
  },
  {
    id: 3,
    title: "Room 3",
    subtitle: "AI Escape Room - Neon Grid",
    theme: "neon grid",
    difficulty: "hard",
    themeClass: "pink",
    unlocked: false,
    puzzleType: "logic-board",
    timeLimitSeconds: 180,
  },
];
