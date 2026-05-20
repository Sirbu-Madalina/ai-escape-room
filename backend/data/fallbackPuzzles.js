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

export const createFallbackEmailInvestigationPuzzle = () => {
  return {
    title: "Research Emails",
    riddle: "Search the company inbox, open suspicious messages, and recover the override code.",
    hint: "Look for where nobody checks twice, then connect Dr. Hayes to the code format.",
    explanation: "The archive email says the override code is hidden where nobody checks twice. Searching Hayes reveals his employee profile and birthday. The code is his birthday written as MMDD.",
    kind: "email-investigation",
    employeeProfile: {
      name: "Dr. Marion Hayes",
      role: "Director of Neural Research",
      birthday: "July 14",
      notes: "Known for reusing dates in personal access codes.",
    },
    emails: [
      {
        id: "email-1",
        from: "security@mindlock.local",
        to: "research-team@mindlock.local",
        subject: "Nightly archive sweep",
        preview: "The override code is stored where nobody checks twice.",
        body: "The override code is stored where nobody checks twice. If anyone asks, the archive mirrors are boring enough to stay invisible.",
        tags: ["archive", "override", "security"],
      },
      {
        id: "email-2",
        from: "lena.ortiz@mindlock.local",
        to: "ops@mindlock.local",
        subject: "Hayes profile reminder",
        preview: "Dr. Hayes still uses his birthday for everything.",
        body: "Please remind Dr. Hayes that reusing personal dates is not a security practice. His profile still lists July 14, and he still uses his birthday for everything.",
        tags: ["hayes", "profile", "birthday"],
      },
      {
        id: "email-3",
        from: "archive-bot@mindlock.local",
        to: "security@mindlock.local",
        subject: "Mirror copy confirmed",
        preview: "A second copy was placed in the employee profile index.",
        body: "Mirror copy confirmed. The employee profile index has a second copy of the access note, filed under Hayes. Nobody checks profile mirrors twice.",
        tags: ["mirror", "profile", "index"],
      },
      {
        id: "email-4",
        from: "cafeteria@mindlock.local",
        to: "all@mindlock.local",
        subject: "Friday menu",
        preview: "Soup rotation and late-night coffee restock.",
        body: "Friday menu: lentil soup, noodles, and emergency coffee restock after 20:00.",
        tags: ["noise"],
      },
    ],
    answer: "0714",
    inputPlaceholder: "Enter override code",
  };
};
