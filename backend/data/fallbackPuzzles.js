// Backup puzzle if OpenAI fails for the logic-board room.
export const createFallbackLogicBoardPuzzle = () => {
  return {
    title: "Neon Switchboard",
    riddle: "Three terminals each make one claim about the safe switch. Only one terminal is telling the truth. Choose the truthful terminal.",
    hint: "Test each statement one by one. The correct choice is the one that makes the puzzle consistent.",
    explanation: "Gamma is correct because Alpha and Beta cannot both fit the situation, but Gamma's statement stays consistent with the full set.",
    kind: "logic-board",
    statements: [
      "Terminal Alpha says: 'Beta is the safe switch.'",
      "Terminal Beta says: 'Alpha is lying.'",
      "Terminal Gamma says: 'Beta is not the safe switch.'",
    ],
    options: [
      { id: "alpha", label: "Terminal Alpha", description: "Blue panel on the left wall." },
      { id: "beta", label: "Terminal Beta", description: "Amber panel in the center." },
      { id: "gamma", label: "Terminal Gamma", description: "Pink panel on the right wall." },
    ],
    answer: "gamma",
  };
};
