// Gameboard module: stores board state
const Gameboard = (() => {
  let board = ["", "", "", "", "", "", "", "", ""];

  const getBoard = () => board.slice();

  const setMarker = (index, marker) => {
    if (index < 0 || index > 8) return false;
    if (board[index] !== "") return false;
    board[index] = marker;
    return true;
  };

  const resetBoard = () => {
    board = ["", "", "", "", "", "", "", "", ""];
  };

  return { getBoard, setMarker, resetBoard };
})();

const Player = (name, marker) => ({ name, marker });

// GameController: handles turns and win/tie detection
const GameController = (() => {
  let player1 = Player("Player 1", "X");
  let player2 = Player("Player 2", "O");
  let currentPlayer = player1;
  let gameOver = false;
  let winningCombo = null;

  const winCombos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  const init = (p1Name, p2Name) => {
    player1 = Player(p1Name || "Player 1", "X");
    player2 = Player(p2Name || "Player 2", "O");
    currentPlayer = player1;
    gameOver = false;
    winningCombo = null;
    Gameboard.resetBoard();
  };

  const checkWinner = (board) => {
    for (const combo of winCombos) {
      const [a,b,c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return combo;
      }
    }
    return null;
  };

  const playRound = (index) => {
    if (gameOver) return { valid: false };

    const placed = Gameboard.setMarker(index, currentPlayer.marker);
    if (!placed) return { valid: false };

    const board = Gameboard.getBoard();
    const combo = checkWinner(board);
    if (combo) {
      gameOver = true;
      winningCombo = combo;
      return { valid: true, winner: currentPlayer, combo };
    }

    const tie = board.every(cell => cell !== "");
    if (tie) {
      gameOver = true;
      return { valid: true, tie: true };
    }

    // switch player
    currentPlayer = currentPlayer === player1 ? player2 : player1;
    return { valid: true, next: currentPlayer };
  };

  const resetGame = () => {
    Gameboard.resetBoard();
    gameOver = false;
    winningCombo = null;
    currentPlayer = player1;
  };

  const getCurrentPlayer = () => currentPlayer;
  const isGameOver = () => gameOver;
  const getWinningCombo = () => winningCombo;

  return { init, playRound, resetGame, getCurrentPlayer, isGameOver, getWinningCombo };
})();

// UI wiring
const formSection = document.querySelector('.form-section');
const form = document.getElementById('game-form');
const startButton = document.getElementById('start-button');
const gameSection = document.querySelector('.game-section');
const boardEl = document.querySelector('.board');
const cells = Array.from(document.querySelectorAll('.cell'));
const resultEl = document.querySelector('.result');
const turnEl = document.querySelector('.turn');
const restartButton = document.getElementById('restart-button');

// assign data-index to cells
cells.forEach((cell, i) => cell.dataset.index = i);

function updateTurnDisplay() {
  const p = GameController.getCurrentPlayer();
  turnEl.textContent = `Turn: ${p.marker} (${p.name})`;
}

function clearBoardUI() {
  cells.forEach(c => {
    c.textContent = '';
    c.classList.remove('x','o','win');
    c.removeAttribute('aria-disabled');
  });
  resultEl.textContent = '';
}

function highlightWinningCombo(combo) {
  if (!combo) return;
  combo.forEach(i => {
    const c = cells[i];
    if (c) c.classList.add('win');
  });
}

function handleCellClick(e) {
  const idx = Number(e.currentTarget.dataset.index);
  const before = GameController.playRound(idx);
  if (!before.valid) return; // ignore invalid

  // render this cell
  const mark = Gameboard.getBoard()[idx];
  const cell = cells[idx];
  cell.textContent = mark;
  cell.classList.add(mark === 'X' ? 'x' : 'o');

  if (before.winner) {
    resultEl.textContent = `${before.winner.name} (${before.winner.marker}) wins!`;
    highlightWinningCombo(before.combo);
    return;
  }

  if (before.tie) {
    resultEl.textContent = `It's a draw!`;
    return;
  }

  // next turn
  updateTurnDisplay();
}

function enableBoard() {
  cells.forEach(c => c.addEventListener('click', handleCellClick));
}

function disableBoard() {
  cells.forEach(c => c.removeEventListener('click', handleCellClick));
}

startButton.addEventListener('click', (ev) => {
  ev.preventDefault();
  const p1 = document.getElementById('player1').value.trim() || 'Player 1';
  const p2 = document.getElementById('player2').value.trim() || 'Player 2';

  GameController.init(p1, p2);
  formSection.style.display = 'none';
  gameSection.style.display = '';
  clearBoardUI();
  updateTurnDisplay();
  enableBoard();
});

restartButton.addEventListener('click', () => {
  GameController.resetGame();
  clearBoardUI();
  updateTurnDisplay();
  enableBoard();
});

// allow clicking cells only after start; safety: hide board clicks before start
disableBoard();
