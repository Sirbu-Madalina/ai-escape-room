const baseSudokuSolution = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

const shuffle = (items) => {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
};

const cloneGrid = (grid) => grid.map((row) => [...row]);

const remapDigits = (grid) => {
  const digits = shuffle([1, 2, 3, 4]);
  const mapping = new Map([
    [1, digits[0]],
    [2, digits[1]],
    [3, digits[2]],
    [4, digits[3]],
  ]);

  return grid.map((row) => row.map((cell) => mapping.get(cell)));
};

const reorderRows = (grid, order) => order.map((rowIndex) => [...grid[rowIndex]]);

const reorderColumns = (grid, order) => grid.map((row) => order.map((columnIndex) => row[columnIndex]));

// Generates a Sudoku puzzle with code by shuffling a valid 4x4 grid.
export const createSudokuPuzzle = () => {
  const rowOrder = [...shuffle([0, 1]), ...shuffle([2, 3])];
  const columnOrder = [...shuffle([0, 1]), ...shuffle([2, 3])];
  const reorderedRows = reorderRows(baseSudokuSolution, rowOrder);
  const reorderedGrid = reorderColumns(reorderedRows, columnOrder);
  const randomizedSolution = remapDigits(reorderedGrid);
  const givens = cloneGrid(randomizedSolution);
  const removableCells = shuffle([
    [0, 1],
    [1, 0],
    [1, 3],
    [2, 2],
    [3, 1],
    [0, 3],
    [2, 0],
    [3, 2],
  ]);

  const cellsToHide = removableCells.slice(0, 6);

  for (const [rowIndex, columnIndex] of cellsToHide) {
    givens[rowIndex][columnIndex] = 0;
  }

  return {
    title: "Vault Matrix 4x4",
    riddle: "Fill the 4x4 vault grid so every row and every column contains the numbers 1 to 4 exactly once.",
    hint: "Start with any row or column that already has three visible numbers.",
    explanation: "A valid grid uses 1, 2, 3, and 4 exactly once in every row and every column.",
    kind: "sudoku",
    givens,
    solution: randomizedSolution,
  };
};
