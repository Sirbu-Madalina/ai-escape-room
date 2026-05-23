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

const cloneJson = (value) => JSON.parse(JSON.stringify(value));

let lastCrosswordPuzzleIndex = -1;

const crosswordLayout = [
  { id: "word-1", number: 1, direction: "across", row: 0, col: 0 },
  { id: "word-2", number: 2, direction: "across", row: 2, col: 0 },
  { id: "word-3", number: 3, direction: "across", row: 4, col: 0 },
  { id: "word-4", number: 4, direction: "across", row: 6, col: 0 },
  { id: "word-5", number: 5, direction: "across", row: 8, col: 0 },
];

const prefillIndexesForWord = (word) => {
  if (word.length <= 2) {
    return [0];
  }

  return [0, Math.min(word.length - 1, 2)];
};

export const createCrosswordFromWords = ({ title, riddle, hint, explanation, words }) => {
  const entries = words.map((word, index) => ({
    ...crosswordLayout[index],
    clue: word.clue,
    answer: word.answer.toLowerCase(),
    prefilledIndexes: prefillIndexesForWord(word.answer),
  }));

  return {
    title,
    riddle,
    hint,
    explanation,
    kind: "crossword",
    entries,
    answer: entries.map((entry) => entry.answer).join(" "),
    inputPlaceholder: "Complete the crossword grid",
  };
};

const crosswordPuzzleBank = [
  {
    title: "Happy Signals",
    riddle: "Solve five cheerful everyday words. Each clue points to one clear answer.",
    hint: "Start with the filled letters, then solve the short words first.",
    explanation: "The completed words are SMILE, SUN, COCOA, MUSIC, and ECHO.",
    words: [
      { answer: "smile", clue: "What your face does when you are happy." },
      { answer: "sun", clue: "The bright star we see in the daytime sky." },
      { answer: "cocoa", clue: "Hot chocolate drink made from cocoa powder." },
      { answer: "music", clue: "Songs and sounds you listen to." },
      { answer: "echo", clue: "A sound that bounces back and repeats." },
    ],
  },
  {
    title: "Kitchen Clues",
    riddle: "Solve five kitchen words. These are things you can eat, drink, or use.",
    hint: "Think about breakfast, drinks, and simple kitchen objects.",
    explanation: "The completed words are TOAST, MILK, SPOON, APPLE, and CAKE.",
    words: [
      { answer: "toast", clue: "Bread that is browned and crisp." },
      { answer: "milk", clue: "White drink often poured on cereal." },
      { answer: "spoon", clue: "Tool used to eat soup." },
      { answer: "apple", clue: "Round fruit often red or green." },
      { answer: "cake", clue: "Sweet dessert served at birthdays." },
    ],
  },
  {
    title: "Animal Track",
    riddle: "Solve five animal words. Each clue describes one animal clearly.",
    hint: "Listen for the animal sounds in the clues.",
    explanation: "The completed words are TIGER, DUCK, HORSE, BEE, and FROG.",
    words: [
      { answer: "tiger", clue: "Striped big cat." },
      { answer: "duck", clue: "Bird that says quack." },
      { answer: "horse", clue: "Animal people ride." },
      { answer: "bee", clue: "Small insect that makes honey." },
      { answer: "frog", clue: "Green animal that jumps and says ribbit." },
    ],
  },
  {
    title: "School Bag",
    riddle: "Solve five school words. These are common things from a classroom.",
    hint: "Picture a desk, a notebook, and the start of a school day.",
    explanation: "The completed words are PENCIL, DESK, BOOK, BELL, and PAPER.",
    words: [
      { answer: "pencil", clue: "You write with it, then erase mistakes." },
      { answer: "desk", clue: "Table where a student works." },
      { answer: "book", clue: "You read this. It has pages." },
      { answer: "bell", clue: "Sound that can start or end class." },
      { answer: "paper", clue: "Thin sheet you write on." },
    ],
  },
  {
    title: "Weather Watch",
    riddle: "Solve five weather words. Look outside in your imagination.",
    hint: "The clues move from warm sky to stormy sky.",
    explanation: "The completed words are CLOUD, RAIN, WIND, SNOW, and STORM.",
    words: [
      { answer: "cloud", clue: "White or gray shape floating in the sky." },
      { answer: "rain", clue: "Water drops falling from clouds." },
      { answer: "wind", clue: "Moving air you can feel." },
      { answer: "snow", clue: "Cold white flakes from the sky." },
      { answer: "storm", clue: "Bad weather with strong wind or thunder." },
    ],
  },
  {
    title: "Game Night",
    riddle: "Solve five words from games and play.",
    hint: "Think about board games, cards, and winning.",
    explanation: "The completed words are DICE, CARD, TOKEN, SCORE, and LEVEL.",
    words: [
      { answer: "dice", clue: "Small cubes you roll in a game." },
      { answer: "card", clue: "Flat game piece with a suit or number." },
      { answer: "token", clue: "Small piece that marks your place in a game." },
      { answer: "score", clue: "Number that shows how many points you have." },
      { answer: "level", clue: "Stage or section in a video game." },
    ],
  },
  {
    title: "Tiny Tech",
    riddle: "Solve five friendly tech words. No deep computer knowledge needed.",
    hint: "These are words most people know from phones or computers.",
    explanation: "The completed words are PHONE, MOUSE, LOGIN, EMAIL, and ROBOT.",
    words: [
      { answer: "phone", clue: "Device used to call or text someone." },
      { answer: "mouse", clue: "Computer tool you move with your hand." },
      { answer: "login", clue: "Action of entering an account." },
      { answer: "email", clue: "Digital letter sent online." },
      { answer: "robot", clue: "Machine that can do tasks automatically." },
    ],
  },
  {
    title: "Adventure Pack",
    riddle: "Solve five adventure words. Imagine you are going on a little quest.",
    hint: "Think of what you carry, follow, find, and open.",
    explanation: "The completed words are MAP, TORCH, TRAIL, CHEST, and KEY.",
    words: [
      { answer: "map", clue: "Picture that shows where places are." },
      { answer: "torch", clue: "Light you carry in a dark cave." },
      { answer: "trail", clue: "Path you follow through nature." },
      { answer: "chest", clue: "Box that may hold treasure." },
      { answer: "key", clue: "Small object used to open a lock." },
    ],
  },
];

export const createFallbackCrosswordPuzzle = () => {
  let nextIndex = Math.floor(Math.random() * crosswordPuzzleBank.length);

  if (crosswordPuzzleBank.length > 1 && nextIndex === lastCrosswordPuzzleIndex) {
    nextIndex = (nextIndex + 1) % crosswordPuzzleBank.length;
  }

  lastCrosswordPuzzleIndex = nextIndex;
  return createCrosswordFromWords(crosswordPuzzleBank[nextIndex]);
};

const shuffleItems = (items) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

const fallbackEmailInvestigationPuzzles = [
  {
    title: "Project Ghostlight",
    riddle: "Search the company inbox, connect the suspicious notes, and recover the override code.",
    hint: "Each useful email gives a piece and tells you where it belongs: start, middle, or end.",
    explanation: "The finance memo gives GL. The facilities email gives 7 and says it belongs in the middle. The security email gives N and says the shift marker closes the code. The final override code is GL7N.",
    kind: "email-investigation",
    employeeProfile: {
      name: "Dr. Evelyn Cross",
      role: "Neural Systems Director",
      detailLabel: "Assigned lab",
      detailValue: "Lab 7",
      notes: "Owns the Ghostlight prototype and approves temporary access rotations.",
    },
    clues: [
      { label: "Potential clue", value: "GL", discovered: true },
      { label: "Potential clue", value: "7", discovered: true },
      { label: "Potential clue", value: "N", discovered: false },
      { label: "Placement rule", value: "start + middle + final signature", discovered: false },
    ],
    emails: [
      {
        id: "email-1",
        from: "security@mindlock.local",
        to: "ops@mindlock.local",
        subject: "Temporary override rotation",
        preview: "Night shift signs temporary override codes.",
        body: "After the access check is complete, add the night-shift signature at the end. Night shift signs with N.",
        time: "10:42 AM",
        priority: "clue",
        clueSummary: "Potential clue: N",
        attachmentName: "Override_Rotation.txt",
        tags: ["override", "shift", "format"],
      },
      {
        id: "email-2",
        from: "finance@mindlock.local",
        to: "research@mindlock.local",
        subject: "Ghostlight billing code",
        preview: "Use GL for all Ghostlight prototype purchases.",
        body: "Please stop writing out the full Ghostlight codename on requisitions. The approved project prefix for Ghostlight is GL. Project prefixes always open emergency override codes.",
        time: "9:15 AM",
        priority: "clue",
        clueSummary: "Potential clue: GL",
        attachmentName: "Project_Codes.csv",
        tags: ["ghostlight", "prefix", "finance"],
      },
      {
        id: "email-3",
        from: "facilities@mindlock.local",
        to: "dr.cross@mindlock.local",
        subject: "Lab access move",
        preview: "Ghostlight equipment has been moved to Lab 7.",
        body: "The Ghostlight prototype is now assigned to Lab 7. After the project prefix, type the lab number before the final shift signature.",
        time: "Yesterday",
        priority: "clue",
        clueSummary: "Potential clue: 7",
        attachmentName: "Lab_Assignments.pdf",
        tags: ["lab", "ghostlight", "profile"],
      },
      {
        id: "email-4",
        from: "cafeteria@mindlock.local",
        to: "all@mindlock.local",
        subject: "Friday menu",
        preview: "Soup rotation and late-night coffee restock.",
        body: "Friday menu: lentil soup, noodles, and emergency coffee restock after 20:00.",
        time: "Yesterday",
        priority: "normal",
        clueSummary: "No useful clue.",
        attachmentName: "",
        tags: ["noise"],
      },
      {
        id: "email-5",
        from: "unknown@external.local",
        to: "security@mindlock.local",
        subject: "Keep it quiet",
        preview: "Do not leave the complete override in one message.",
        body: "Good. Split the pieces across boring threads. One message should reveal a piece, another should reveal where that piece belongs.",
        time: "May 9",
        priority: "danger",
        clueSummary: "The answer needs multiple email threads.",
        attachmentName: "",
        tags: ["suspicious", "split", "override"],
      },
    ],
    answer: "gl7n",
    inputPlaceholder: "Enter override code",
  },
  {
    title: "Archive Blackout",
    riddle: "Search the inbox for the emergency archive code before the corrupted lock expires.",
    hint: "Look for emails that say where a piece is typed: opening, middle, or final signature.",
    explanation: "The compliance memo gives AR and says the prefix starts the code. The response desk gives 418 and says the ticket sits in the middle. The approval note gives V and says it closes the code. The final override code is AR418V.",
    kind: "email-investigation",
    employeeProfile: {
      name: "Mira Vale",
      role: "Compliance Response Lead",
      detailLabel: "Current incident",
      detailValue: "Ticket 418",
      notes: "Approves archive resets only after the response desk confirms the active ticket.",
    },
    clues: [
      { label: "Potential clue", value: "AR", discovered: true },
      { label: "Potential clue", value: "418", discovered: true },
      { label: "Potential clue", value: "V", discovered: false },
      { label: "Placement rule", value: "opening + middle ticket + final approval", discovered: false },
    ],
    emails: [
      {
        id: "email-1",
        from: "compliance@mindlock.local",
        to: "archive@mindlock.local",
        subject: "Reset prefix reminder",
        preview: "Use AR for emergency archive reset tickets.",
        body: "For emergency archive resets, the approved department prefix is AR. Type the department prefix first, before any ticket number.",
        time: "8:31 AM",
        priority: "clue",
        clueSummary: "Potential clue: AR",
        attachmentName: "Prefix_Table.csv",
        tags: ["prefix", "archive", "reset"],
      },
      {
        id: "email-2",
        from: "response@mindlock.local",
        to: "mira.vale@mindlock.local",
        subject: "Blackout ticket assigned",
        preview: "The archive blackout is tracked as ticket 418.",
        body: "The corrupted archive blackout is now assigned to ticket 418. After the department prefix, type the ticket number in the middle slot.",
        time: "9:02 AM",
        priority: "clue",
        clueSummary: "Potential clue: 418",
        attachmentName: "Incident_418.pdf",
        tags: ["incident", "ticket", "blackout"],
      },
      {
        id: "email-3",
        from: "mira.vale@mindlock.local",
        to: "security@mindlock.local",
        subject: "Approval marker",
        preview: "Use my surname initial on this one.",
        body: "I approved the archive reset. After the ticket check, add my surname initial as the final signature. My surname initial is V.",
        time: "9:49 AM",
        priority: "clue",
        clueSummary: "Potential clue: V",
        attachmentName: "",
        tags: ["approval", "initial", "vale"],
      },
      {
        id: "email-4",
        from: "canteen@mindlock.local",
        to: "all@mindlock.local",
        subject: "Coffee machine offline",
        preview: "The west kitchen machine needs maintenance.",
        body: "The west kitchen coffee machine is offline until the filter is replaced. Use the east kitchen until lunch.",
        time: "Yesterday",
        priority: "normal",
        clueSummary: "No useful clue.",
        attachmentName: "",
        tags: ["noise"],
      },
      {
        id: "email-5",
        from: "unknown@external.local",
        to: "archive@mindlock.local",
        subject: "Do not write it together",
        preview: "Split the prefix, ticket, and approval marker.",
        body: "Keep the prefix, incident number, and approval marker in different threads. Hide both the pieces and their positions.",
        time: "May 12",
        priority: "danger",
        clueSummary: "The answer is assembled from separate threads.",
        attachmentName: "",
        tags: ["suspicious", "split", "reset"],
      },
    ],
    answer: "ar418v",
    inputPlaceholder: "Enter archive code",
  },
  {
    title: "Server Room Handoff",
    riddle: "Search the handoff emails and recover the temporary server access code.",
    hint: "Each clue tells you both the code piece and where to type it.",
    explanation: "The infrastructure email gives NX and says server fragments open temporary codes. The facilities note gives 5 and says the floor digit sits in the middle. The backup message gives D and says the window marker closes the code. The final access code is NX5D.",
    kind: "email-investigation",
    employeeProfile: {
      name: "Jon Ivers",
      role: "Infrastructure Coordinator",
      detailLabel: "Rack location",
      detailValue: "Floor 5",
      notes: "Coordinates rack moves and backup windows for neural compute servers.",
    },
    clues: [
      { label: "Potential clue", value: "NX", discovered: true },
      { label: "Potential clue", value: "5", discovered: true },
      { label: "Potential clue", value: "D", discovered: false },
      { label: "Placement rule", value: "server first + floor middle + window last", discovered: false },
    ],
    emails: [
      {
        id: "email-1",
        from: "infra@mindlock.local",
        to: "jon.ivers@mindlock.local",
        subject: "Nexora node labels",
        preview: "Nexora compute nodes use NX in temporary codes.",
        body: "For the handoff, remember that Nexora compute nodes use the server fragment NX. Type the server fragment first.",
        time: "7:58 AM",
        priority: "clue",
        clueSummary: "Potential clue: NX",
        attachmentName: "Node_Label_Map.csv",
        tags: ["server", "fragment", "nexora"],
      },
      {
        id: "email-2",
        from: "facilities@mindlock.local",
        to: "infra@mindlock.local",
        subject: "Rack move complete",
        preview: "The Nexora rack is now on floor 5.",
        body: "The Nexora rack has been moved from floor 3 to floor 5. After the server fragment, type the floor digit in the middle.",
        time: "8:27 AM",
        priority: "clue",
        clueSummary: "Potential clue: 5",
        attachmentName: "Rack_Move.pdf",
        tags: ["rack", "floor", "nexora"],
      },
      {
        id: "email-3",
        from: "backup@mindlock.local",
        to: "ops@mindlock.local",
        subject: "Approved backup window",
        preview: "Dawn window should be marked with D.",
        body: "Tonight's server handoff uses the Dawn backup window. After the rack check, add the backup-window signature at the end. Dawn signs with D.",
        time: "9:06 AM",
        priority: "clue",
        clueSummary: "Potential clue: D",
        attachmentName: "Backup_Windows.txt",
        tags: ["backup", "window", "marker"],
      },
      {
        id: "email-4",
        from: "wellness@mindlock.local",
        to: "all@mindlock.local",
        subject: "Quiet room schedule",
        preview: "Meditation room bookings restart Monday.",
        body: "The quiet room schedule has been updated. Please book in advance and keep devices on silent.",
        time: "Yesterday",
        priority: "normal",
        clueSummary: "No useful clue.",
        attachmentName: "",
        tags: ["noise"],
      },
      {
        id: "email-5",
        from: "unknown@external.local",
        to: "ops@mindlock.local",
        subject: "Keep the handoff messy",
        preview: "Old floor notes will slow them down.",
        body: "Leave the old floor note in circulation. If they do not find the rack move, their temporary code will fail.",
        time: "May 13",
        priority: "danger",
        clueSummary: "The latest floor note matters.",
        attachmentName: "",
        tags: ["suspicious", "floor", "handoff"],
      },
    ],
    answer: "nx5d",
    inputPlaceholder: "Enter server code",
  },
  {
    title: "Prototype Transfer",
    riddle: "Search the inbox to reconstruct the temporary transfer approval code.",
    hint: "The emails hide the code pieces and give simple placement rules.",
    explanation: "The lab note gives AU and says prototype prefixes start transfer codes. The logistics update gives 62 and says the crate number sits in the middle. The courier memo gives R and says the courier marker closes the code. The final transfer code is AU62R.",
    kind: "email-investigation",
    employeeProfile: {
      name: "Dr. Salma Rook",
      role: "Prototype Custodian",
      detailLabel: "Assigned crate",
      detailValue: "Crate 62",
      notes: "Controls prototype transfer approvals and courier handoff markers.",
    },
    clues: [
      { label: "Potential clue", value: "AU", discovered: true },
      { label: "Potential clue", value: "62", discovered: true },
      { label: "Potential clue", value: "R", discovered: false },
      { label: "Placement rule", value: "prototype first + crate middle + courier last", discovered: false },
    ],
    emails: [
      {
        id: "email-1",
        from: "lab-admin@mindlock.local",
        to: "salma.rook@mindlock.local",
        subject: "Aurora shorthand",
        preview: "Use AU on all temporary Aurora transfers.",
        body: "For temporary transfer approvals, Aurora should be shortened to AU. Type the prototype prefix first.",
        time: "11:04 AM",
        priority: "clue",
        clueSummary: "Potential clue: AU",
        attachmentName: "Prototype_Codes.csv",
        tags: ["prototype", "prefix", "aurora"],
      },
      {
        id: "email-2",
        from: "logistics@mindlock.local",
        to: "lab-admin@mindlock.local",
        subject: "Transfer crate assigned",
        preview: "Aurora is packed in crate 62.",
        body: "Aurora transfer materials are now packed in crate 62. After the prototype prefix, type the crate number in the middle.",
        time: "11:38 AM",
        priority: "clue",
        clueSummary: "Potential clue: 62",
        attachmentName: "Crate_Assignment.pdf",
        tags: ["crate", "aurora", "transfer"],
      },
      {
        id: "email-3",
        from: "courier@mindlock.local",
        to: "security@mindlock.local",
        subject: "Courier marker",
        preview: "Raven handoff uses R.",
        body: "The approved courier route is Raven. After the crate is confirmed, add the courier signature at the end. Raven signs with R.",
        time: "12:02 PM",
        priority: "clue",
        clueSummary: "Potential clue: R",
        attachmentName: "Courier_Routes.txt",
        tags: ["courier", "marker", "raven"],
      },
      {
        id: "email-4",
        from: "events@mindlock.local",
        to: "all@mindlock.local",
        subject: "Atrium lights test",
        preview: "Short lighting test at 14:00.",
        body: "Facilities will test the atrium lights at 14:00. Expect brief flickering near reception.",
        time: "Yesterday",
        priority: "normal",
        clueSummary: "No useful clue.",
        attachmentName: "",
        tags: ["noise"],
      },
      {
        id: "email-5",
        from: "unknown@external.local",
        to: "logistics@mindlock.local",
        subject: "Old crate note",
        preview: "Let them find the wrong crate first.",
        body: "Leave the crate 26 staging note where it is. The real transfer crate is only in the logistics update.",
        time: "May 14",
        priority: "danger",
        clueSummary: "Use the newest crate assignment.",
        attachmentName: "",
        tags: ["suspicious", "crate", "misdirection"],
      },
    ],
    answer: "au62r",
    inputPlaceholder: "Enter transfer code",
  },
];

export const createFallbackEmailInvestigationPuzzle = () => {
  const puzzle = cloneJson(
    fallbackEmailInvestigationPuzzles[
      Math.floor(Math.random() * fallbackEmailInvestigationPuzzles.length)
    ],
  );

  puzzle.emails = shuffleItems(puzzle.emails).map((email, index) => ({
    ...email,
    id: `email-${index + 1}`,
  }));

  puzzle.generatedBy = "fallback";

  return puzzle;
};

export const createFallbackCorruptedDocumentsPuzzle = () => {
  return {
    title: "Repair The Lock Command",
    riddle: "Three damaged files hide one word each. Repair the corrupted line in every file, then type the recovered command.",
    hint: "Read the task line first. It tells you exactly how to repair the damaged word.",
    explanation: "The missing-letters file repairs _NLOCK into UNLOCK. The hidden-word file contains RED as the only full uppercase word. The symbol-cleaning file repairs D@@O##O!!R into DOOR. The restored command is UNLOCK RED DOOR.",
    kind: "corrupted-documents",
    documents: [
      {
        id: "doc-1",
        title: "Door_Control.tmp",
        classification: "DAMAGED / 42%",
        puzzleType: "missing-letters",
        corruptedText: "OBJECTIVE: Restore the action token.\nCORRUPTED LINE: Door control rejected token _NLOCK during the night reset.\nTRACE: One character was erased from the token.",
        clue: "Repair the damaged token by restoring the missing letter.",
        hiddenClue: "UNLOCK",
        clueLabel: "Word 1",
        orderHint: "This word starts the command.",
      },
      {
        id: "doc-2",
        title: "Staff_Memo.redacted",
        classification: "DAMAGED / 35%",
        puzzleType: "hidden-word",
        corruptedText: "OBJECTIVE: Extract the routing word.\nCORRUPTED LINE: Archive memo says route the RED access card through security before midnight.\nTRACE: Ignore normal text. One uppercase word survived.",
        clue: "Find the complete uppercase word hidden in the sentence.",
        hiddenClue: "RED",
        clueLabel: "Word 2",
        orderHint: "This word belongs in the middle.",
      },
      {
        id: "doc-3",
        title: "Vault_Index.glitch",
        classification: "DAMAGED / 28%",
        puzzleType: "remove-symbols",
        corruptedText: "OBJECTIVE: Clean the target token.\nCORRUPTED LINE: Final target reads D@@O##O!!R after the archive surge.\nTRACE: Noise symbols were injected between real letters.",
        clue: "Remove the noise symbols and keep the letters in order.",
        hiddenClue: "DOOR",
        clueLabel: "Word 3",
        orderHint: "This word closes the command.",
      },
    ],
    answer: "unlock red door",
    inputPlaceholder: "Enter recovered phrase",
  };
};
