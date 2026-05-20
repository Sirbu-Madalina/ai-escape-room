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
