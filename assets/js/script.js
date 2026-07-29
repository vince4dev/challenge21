/* ==================================================================
  CONFIGURATION
================================================================== */
const CONFIG = {
  winningCombinations: [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"], // Lines
    ["1", "4", "7"],
    ["2", "5", "8"],
    ["3", "6", "9"], // Columns
    ["1", "5", "9"],
    ["3", "5", "7"], // Diagonals
  ],
  images: {
    x: {
      filled: "./assets/images/icon-x.svg",
      outline: "../images/icon-x-outline.svg",
    },
    o: {
      filled: "./assets/images/icon-o.svg",
      outline: "../images/icon-o-outline.svg",
    },
  },
  colors: {
    x: "#31c4bf",
    o: "#f2b036",
    tie: "#A8BFC9",
  },
};

/* ==================================================================
  STATE
================================================================== */
let gameState = {
  currentPlayer: "x", // 'x' or 'o'
  board: {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null,
  },
  scores: { x: 0, o: 0, ties: 0 },
  typeGame: "players", // 'players' or 'cpu'
  cpuSymbol: "o",
  playerSymbol: "x",
  cpuPlaying: false,
};

/* ==================================================================
  DOM ELEMENTS
================================================================== */
const DOM = {
  players: {
    x: document.getElementById("player-x"),
    o: document.getElementById("player-o"),
  },
  sections: {
    menu: document.getElementById("section-menu"),
    start: document.getElementById("section-start"),
    messages: document.getElementById("section-messages"),
  },
  buttons: {
    cpu: document.getElementById("btn-cpu"),
    player: document.getElementById("btn-player"),
    restart: document.getElementById("btn-restart"),
  },
  cells: document.querySelectorAll(".cell"),
  radios: document.querySelectorAll('input[name="player"]'),
  turnIcons: {
    x: document.getElementById("turn-ico-x"),
    o: document.getElementById("turn-ico-o"),
  },
  overlay: document.getElementById("overlay"),
  message: {
    txt: document.getElementById("message-txt"),
    ico: document.getElementById("message-ico"),
    status: document.getElementById("message-status"),
    cancel_restart: document.getElementById("cancel-restart-wrapper"),
    quit_round: document.getElementById("quit-round-wrapper"),
    cancel: document.getElementById("message-btn-cancel"),
    restart: document.getElementById("message-btn-restart"),
    quit: document.getElementById("message-btn-quit"),
    round: document.getElementById("message-btn-round"),
  },
  scores: {
    x: {
      txt: document.getElementById("score-x-txt"),
      val: document.getElementById("score-x-val"),
    },
    o: {
      txt: document.getElementById("score-o-txt"),
      val: document.getElementById("score-o-val"),
    },
    ties: document.getElementById("score-ties-val"),
  },
};

/* ==================================================================
  GAME LOGIC
================================================================== */
function initScore() {
  gameState.scores = { x: 0, o: 0, ties: 0 };
  DOM.scores.x.val.innerText = 0;
  DOM.scores.o.val.innerText = 0;
  DOM.scores.ties.innerText = 0;
}

function initBoard() {
  gameState.board = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null,
  };
  DOM.cells.forEach((cell) => {
    cell.style.backgroundImage = "";
    cell.classList.remove("cell__win", "cell__win-x", "cell__win-o");
    cell.style.pointerEvents = "auto";
  });
  updateUI();
}

function checkWin(moves, symbol) {
  const movesSet = new Set(moves);
  return CONFIG.winningCombinations.find((combo) =>
    combo.every((cell) => movesSet.has(cell)),
  );
}

// Disable the pointer
function disabledPointer() {
  DOM.cells.forEach((c) => {
    c.style.pointerEvents = "none";
  });
}

// Updates the score and displays the end message
function handleTurnEnd(winner = null) {
  DOM.overlay.classList.add("active");
  if (winner) {
    gameState.scores[winner]++;
    const scoreKey = winner === "x" ? "x" : "o";
    DOM.scores[scoreKey].val.innerText = gameState.scores[scoreKey];
    setTimeout(() => showMessage("win", winner), 3000);
  } else {
    gameState.scores.ties++;
    DOM.scores.ties.innerText = gameState.scores.ties;
    setTimeout(() => showMessage("tie"), 1000);
  }
}

// Handles the click on a cell
function handleCellClick(e) {
  const cellSelected = e.target;
  const cellId = cellSelected.dataset.cell;

  // If the cell is already selected or if the game is paused
  if (
    gameState.board[cellId] !== null ||
    DOM.overlay.classList.contains("active")
  ) {
    return;
  }

  // Si c'est le tour de la CPU et qu'elle joue, on bloque
  if (gameState.cpuPlaying) {
    return;
  }

  // Status update
  gameState.board[cellId] = gameState.currentPlayer;

  // Visual update
  cellSelected.style.backgroundImage = `url("${CONFIG.images[gameState.currentPlayer].filled}")`;
  cellSelected.style.backgroundPosition = "center";
  cellSelected.style.backgroundRepeat = "no-repeat";
  cellSelected.style.pointerEvents = "none"; // Prevents clicking again

  // Victory check
  const currentMoves = Object.entries(gameState.board)
    .filter(([key, val]) => val === gameState.currentPlayer)
    .map(([key, val]) => key);

  const winningCombo = checkWin(currentMoves, gameState.currentPlayer);

  if (winningCombo) {
    disabledPointer(); // Disable the pointer

    // Victory !
    highlightWinningCells(winningCombo, gameState.currentPlayer);
    handleTurnEnd(gameState.currentPlayer);
  } else if (Object.values(gameState.board).every((val) => val !== null)) {
    // Round tied
    handleTurnEnd(null);
  } else {
    // Change of turn
    gameState.currentPlayer = gameState.currentPlayer === "x" ? "o" : "x";
    updateUI();

    // If in CPU mode and it's its turn
    if (
      gameState.typeGame === "cpu" &&
      gameState.currentPlayer === gameState.cpuSymbol
    ) {
      gameState.cpuPlaying = true;
      updateUI();
      setTimeout(makeCPUMove, 600);
    }
  }
}

// CPU GAME
function makeCPUMove() {
  const availableCells = Object.entries(gameState.board)
    .filter(([key, val]) => val === null)
    .map(([key, val]) => key);

  if (availableCells.length === 0) return;

  // Random Choice
  const randomIndex = Math.floor(Math.random() * availableCells.length);
  const cellId = availableCells[randomIndex];

  // Apply
  gameState.board[cellId] = gameState.currentPlayer;
  const cell = document.querySelector(`[data-cell="${cellId}"]`);
  cell.style.backgroundImage = `url("${CONFIG.images[gameState.currentPlayer].filled}")`;
  cell.style.backgroundPosition = "center";
  cell.style.backgroundRepeat = "no-repeat";
  cell.style.pointerEvents = "none";

  // Vérification victoire CPU
  const currentMoves = Object.entries(gameState.board)
    .filter(([key, val]) => val === gameState.cpuSymbol)
    .map(([key, val]) => key);

  const winningCombo = checkWin(currentMoves, gameState.cpuSymbol);

  if (winningCombo) {
    disabledPointer(); // Disable the pointer
    highlightWinningCells(winningCombo, gameState.currentPlayer);
    handleTurnEnd(gameState.cpuSymbol);
  } else if (Object.values(gameState.board).every((val) => val !== null)) {
    handleTurnEnd(null);
  } else {
    // Retour au joueur
    gameState.currentPlayer = gameState.playerSymbol;
    gameState.cpuPlaying = false;
    updateUI();
  }
}

// Function to highlight winning squares
function highlightWinningCells(combo, winner) {
  combo.forEach((cellId) => {
    const cell = [...DOM.cells].find((c) => c.dataset.cell === cellId);
    if (cell) {
      cell.classList.add("cell__win", `cell__win-${winner}`);
    }
  });
}
/* ==================================================================
  FUNCTIONS UI
================================================================== */
// Updates the player icon (turn)
function updateUI() {
  const isX = gameState.currentPlayer === "x";

  // Icon Player
  DOM.turnIcons.x.style.display = isX ? "block" : "none";
  DOM.turnIcons.o.style.display = isX ? "none" : "block";

  // Hover Image
  const imgPath = isX ? CONFIG.images.x.outline : CONFIG.images.o.outline;
  document.documentElement.style.setProperty(
    "--hover-img",
    `url("${imgPath}")`,
  );
}

// Updates the score labels (P1/P2 vs. YOU/CPU)
function updateScoreLabels() {
  if (gameState.typeGame === "cpu") {
    DOM.scores[gameState.playerSymbol].txt.innerHTML = "(YOU)";
    DOM.scores[gameState.cpuSymbol].txt.innerHTML = "(CPU)";
  } else {
    DOM.scores.x.txt.innerHTML =
      gameState.playerSymbol === "x" ? "(P1)" : "(P2)";
    DOM.scores.o.txt.innerHTML =
      gameState.playerSymbol === "o" ? "(P1)" : "(P2)";
  }
}

// Displays the victory or draw message.
function showMessage(type, winner = null) {
  const isPlayerWin = winner === gameState.playerSymbol;
  DOM.overlay.classList.add("active");
  DOM.sections.messages.style.display = "block";
  DOM.message.status.style.display = "none";
  DOM.message.cancel_restart.style.display = "none";
  DOM.message.quit_round.style.display = "none";
  DOM.message.ico.style.display = "none";
  DOM.message.txt.style.color = CONFIG.colors.tie;

  if (type === "win") {
    DOM.message.status.style.display = "block";
    DOM.message.ico.src = CONFIG.images[winner].filled;
    DOM.message.ico.style.display = "block";
    DOM.message.txt.innerHTML = "TAKES THE ROUND";
    DOM.message.txt.style.color = CONFIG.colors[winner];
    if (gameState.typeGame === "cpu") {
      DOM.message.status.style.display = "block";
      DOM.message.status.innerHTML = isPlayerWin
        ? "YOU WON!"
        : "OH NO, YOU LOST...";
    } else {
      DOM.message.status.innerHTML = isPlayerWin
        ? "PLAYER 1 WINS!"
        : "PLAYER 2 WINS!";
    }
    DOM.message.quit_round.style.display = "flex";
  } else if (type === "tie") {
    DOM.message.txt.innerHTML = "ROUND TIED";
    DOM.message.txt.style.color = CONFIG.colors.tie;
    DOM.message.quit_round.style.display = "flex";
    DOM.message.round.style.display = "flex";
  }
}

/* ==================================================================
  RESET AND INITIALIZATION FUNCTIONS
================================================================== */
function restart() {
  DOM.message.ico.style.display = "none";
  DOM.message.status.style.display = "none";
  DOM.message.quit_round.style.display = "none";
  DOM.overlay.classList.add("active");
  DOM.sections.messages.style.display = "block";
  DOM.message.txt.innerHTML = "RESTART GAME?";
  DOM.message.cancel_restart.style.display = "flex";
}

function cancel() {
  DOM.overlay.classList.remove("active");
  DOM.sections.messages.style.display = "none";
}

function resetRound() {
  gameState.currentPlayer = "x";
  DOM.overlay.classList.remove("active");
  DOM.sections.messages.style.display = "none";
  initBoard();

  // CPU goes first if it has X
  if (gameState.typeGame === "cpu" && gameState.cpuSymbol === "x") {
    gameState.cpuPlaying = true;
    updateUI();
    setTimeout(makeCPUMove, 600);
  } else {
    gameState.cpuPlaying = false;
  }
}

function quitGame() {
  // Show the Menu
  DOM.sections.messages.style.display = "none";
  DOM.overlay.classList.remove("active");
  DOM.sections.menu.style.display = "grid";
  DOM.sections.start.style.display = "none";

  initScore();
  initBoard();
}

function resetGame() {
  gameState.currentPlayer = "x";
  gameState.cpuPlaying = false;
  // Hide the Menu
  DOM.sections.messages.style.display = "none";
  DOM.overlay.classList.remove("active");
  DOM.sections.menu.style.display = "none";
  DOM.sections.start.style.display = "grid";

  initScore();
  initBoard();

  // CPU goes first if it has X
  if (gameState.typeGame === "cpu" && gameState.cpuSymbol === "x") {
    gameState.cpuPlaying = true;
    updateUI();
    setTimeout(makeCPUMove, 600);
  }
}

/* ==================================================================
  EVENT LISTENERS
================================================================== */
/* ----=== MENU < START > ===------------------------------ */
// RADIOS PICKED PLAYER
DOM.radios.forEach((radio) => {
  gameState.currentPlayer = radio.id;

  radio.addEventListener("change", () => {
    // Remove the `checked` attribute css from all radio buttons.
    DOM.radios.forEach((r) => r.removeAttribute("checked"));

    // Add the `checked` attribute css only to the selected radio button.
    if (radio.checked) {
      radio.setAttribute("checked", "");
      gameState.currentPlayer = radio.id;
    }
  });
});

// BUTTON VS CPU
DOM.buttons.cpu.addEventListener("click", () => {
  gameState.typeGame = "cpu";
  const selectedRadio = [...DOM.radios].find((r) => r.checked);
  gameState.playerSymbol = selectedRadio ? selectedRadio.id : "x";
  gameState.cpuSymbol = gameState.playerSymbol === "x" ? "o" : "x";

  updateScoreLabels();
  resetGame();
});

// BUTTON VS PLAYER
DOM.buttons.player.addEventListener("click", () => {
  gameState.cpuPlaying = false;
  gameState.typeGame = "players";
  const selectedRadio = [...DOM.radios].find((r) => r.checked);
  gameState.playerSymbol = selectedRadio ? selectedRadio.id : "x";
  updateScoreLabels();
  resetGame();
});
/* ----=== MENU < END > ===------------------------------ */

/* ----=== GAME < START > ===------------------------------ */
// Clic sur les cases du plateau
DOM.cells.forEach((cell) => {
  cell.addEventListener("click", handleCellClick);
});
/* ----=== GAME < END > ===------------------------------ */

// Boutons du message de fin de round
DOM.message.round.addEventListener("click", resetRound);
DOM.message.quit.addEventListener("click", quitGame);
DOM.message.cancel.addEventListener("click", cancel);
DOM.message.restart.addEventListener("click", resetGame);

DOM.buttons.restart.addEventListener("click", restart);
