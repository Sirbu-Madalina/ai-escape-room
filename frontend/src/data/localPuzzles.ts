export type TextPuzzle = {
  title: string;
  riddle: string;
  answer: string;
  hint: string;
  explanation: string;
  inputPlaceholder: string;
  kind: "text";
};

export type SudokuPuzzle = {
  title: string;
  riddle: string;
  hint: string;
  explanation: string;
  kind: "sudoku";
  givens: number[][];
  solution: number[][];
};

export type LogicBoardOption = {
  id: string;
  label: string;
  description: string;
};

export type LogicBoardPuzzle = {
  title: string;
  riddle: string;
  hint: string;
  explanation: string;
  kind: "logic-board";
  statements: string[];
  options: LogicBoardOption[];
  answer: string;
};
