export type TextPuzzle = {
  title: string;
  riddle: string;
  answer: string;
  hint: string;
  explanation: string;
  inputPlaceholder: string;
  kind: "text";
};

export type LogicBoardOption = {
  id: string;
  label: string;
  description: string;
};

export type CrosswordEntry = {
  id: string;
  number: number;
  direction: "across" | "down";
  clue: string;
  answer: string;
  row: number;
  col: number;
  prefilledIndexes: number[];
};

export type CrosswordPuzzle = {
  title: string;
  riddle: string;
  hint: string;
  explanation: string;
  kind: "crossword";
  generatedBy?: "ai" | "fallback";
  entries: CrosswordEntry[];
  answer: string;
  inputPlaceholder: string;
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

export type CorruptedDocument = {
  id: string;
  title: string;
  classification: string;
  corruptedText: string;
  hiddenClue: string;
  clueLabel: string;
};

export type CorruptedDocumentsPuzzle = {
  title: string;
  riddle: string;
  hint: string;
  explanation: string;
  kind: "corrupted-documents";
  documents: CorruptedDocument[];
  answer: string;
  inputPlaceholder: string;
};

export type ResearchEmail = {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  priority: "normal" | "clue" | "danger";
  clueSummary: string;
  attachmentName: string;
  tags: string[];
};

export type EmployeeProfile = {
  name: string;
  role: string;
  detailLabel?: string;
  detailValue?: string;
  birthday?: string;
  notes: string;
};

export type InvestigationClue = {
  label: string;
  value: string;
  discovered: boolean;
};

export type EmailInvestigationPuzzle = {
  title: string;
  riddle: string;
  hint: string;
  explanation: string;
  kind: "email-investigation";
  employeeProfile: EmployeeProfile;
  emails: ResearchEmail[];
  clues?: InvestigationClue[];
  answer: string;
  inputPlaceholder: string;
};
