// Chess Board Representation
let board = [];
let selectedSquare = null;
let validMoves = [];
let moveHistory = [];
let capturedPieces = { white: [], black: [] };
let gameOver = false;
let currentTurn = 'white'; // white starts
let lastMove = null;
let computerRating = 1600; // Default rating

// Piece values for AI evaluation
const pieceValues = {
  'P': 1,
  'N': 3,
  'B': 3,
  'R': 5,
  'Q': 9,
  'K': 0,
  'p': 1,
  'n': 3,
  'b': 3,
  'r': 5,
  'q': 9,
  'k': 0
};

// Rating difficulty configuration
const ratingConfig = {
  800: { name: 'Beginner', moveRandomness: 0.95, depth: 1, blunderChance: 0.7 },
  1200: { name: 'Intermediate', moveRandomness: 0.6, depth: 2, blunderChance: 0.4 },
  1600: { name: 'Advanced', moveRandomness: 0.3, depth: 3, blunderChance: 0.15 },
  2000: { name: 'Master', moveRandomness: 0.1, depth: 4, blunderChance: 0.05 },
  2400: { name: 'Grandmaster', moveRandomness: 0.02, depth: 5, blunderChance: 0.01 }
};

// Initialize the board with standard chess starting position
function initializeBoard() {
  board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ];
  capturedPieces = { white: [], black: [] };
  moveHistory = [];
  selectedSquare = null;
  validMoves = [];
  gameOver = false;
  currentTurn = 'white';
  lastMove = null;
}

// Get piece unicode symbols
function getPieceSymbol(piece) {
  const symbols = {
    'K': '♔',
    'Q': '♕',
    'R': '♖',
    'B': '♗',
    'N': '♘',
    'P': '♙',
    'k': '♚',
    'q': '♛',
    'r': '♜',
    'b': '♝',
    'n': '♞',
    'p': '♟'
  };
  return symbols[piece] || '';
}

// Create and render the chess board
function renderBoard() {
  const boardElement = document.getElementById('chessBoard');
  boardElement.innerHTML = '';
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      const isLight = (row + col) % 2 === 0;
      square.className = `square ${isLight ? 'light' : 'dark'}`;
      square.id = `square-${row}-${col}`;
      
      const piece = board[row][col];
      if (piece) {
        const pieceElement = document.createElement('div');
        pieceElement.className = 'piece';
        pieceElement.textContent = getPieceSymbol(piece);
        square.appendChild(pieceElement);
      }
      
      // Check if square is selected
      if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
        square.classList.add('selected');
      }
      
      // Check if square has valid move
      if (validMoves.some(m => m.row === row && m.col === col)) {
        const move = validMoves.find(m => m.row === row && m.col === col);
        if (move.isCapture) {
          square.classList.add('valid-capture');
        } else {
          square.classList.add('valid-move');
        }
      }
      
      // Check if king is in check
      if (piece && piece.toLowerCase() === 'k') {
        if (isKingInCheck(row, col, piece.toUpperCase() === piece ? 'white' : 'black')) {
          square.classList.add('check');
        }
      }
      
      square.addEventListener('click', () => handleSquareClick(row, col));
      boardElement.appendChild(square);
    }
  }
}

// Handle square click
function handleSquareClick(row, col) {
  if (gameOver) return;
  if (currentTurn !== 'white') return; // Only player can move
  
  const piece = board[row][col];
  
  // If a piece is selected
  if (selectedSquare) {
    const isValidMove = validMoves.some(m => m.row === row && m.col === col);
    
    if (isValidMove) {
      // Make the move
      movePiece(selectedSquare.row, selectedSquare.col, row, col);
      selectedSquare = null;
      validMoves = [];
      renderBoard();
      updateGameStatus();
      checkGameEnd();
      
      // Computer makes a move after a short delay
      setTimeout(() => {
        if (!gameOver && currentTurn === 'black') {
          computerMove();
          checkGameEnd();
        }
      }, 500);
    } else if (piece && isPlayerPiece(piece)) {
      // Select a different piece
      selectedSquare = { row, col };
      validMoves = getValidMoves(row, col);
      renderBoard();
    } else {
      // Deselect
      selectedSquare = null;
      validMoves = [];
      renderBoard();
    }
  } else {
    // Select a piece
    if (piece && isPlayerPiece(piece)) {
      selectedSquare = { row, col };
      validMoves = getValidMoves(row, col);
      renderBoard();
    }
  }
}

// Check if piece belongs to player (white)
function isPlayerPiece(piece) {
  return piece === piece.toUpperCase();
}

// Get valid moves for a piece
function getValidMoves(row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  
  const moves = [];
  const isWhite = piece === piece.toUpperCase();
  const pieceLower = piece.toLowerCase();
  
  if (pieceLower === 'p') {
    moves.push(...getPawnMoves(row, col, isWhite));
  } else if (pieceLower === 'n') {
    moves.push(...getKnightMoves(row, col, isWhite));
  } else if (pieceLower === 'b') {
    moves.push(...getBishopMoves(row, col, isWhite));
  } else if (pieceLower === 'r') {
    moves.push(...getRookMoves(row, col, isWhite));
  } else if (pieceLower === 'q') {
    moves.push(...getQueenMoves(row, col, isWhite));
  } else if (pieceLower === 'k') {
    moves.push(...getKingMoves(row, col, isWhite));
  }
  
  return moves;
}

// Pawn moves
function getPawnMoves(row, col, isWhite) {
  const moves = [];
  const direction = isWhite ? -1 : 1;
  const startRow = isWhite ? 6 : 1;
  
  // Forward move
  const nextRow = row + direction;
  if (nextRow >= 0 && nextRow < 8 && !board[nextRow][col]) {
    moves.push({ row: nextRow, col, isCapture: false });
    
    // Double move from start
    if (row === startRow && !board[row + 2 * direction][col]) {
      moves.push({ row: row + 2 * direction, col, isCapture: false });
    }
  }
  
  // Capture moves
  for (let dCol of [-1, 1]) {
    const newCol = col + dCol;
    if (nextRow >= 0 && nextRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[nextRow][newCol];
      if (target && isWhite !== (target === target.toUpperCase())) {
        moves.push({ row: nextRow, col: newCol, isCapture: true });
      }
    }
  }
  
  return moves;
}

// Knight moves
function getKnightMoves(row, col, isWhite) {
  const moves = [];
  const knightMoves = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1]
  ];
  
  for (let [dRow, dCol] of knightMoves) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target || isWhite !== (target === target.toUpperCase())) {
        moves.push({ row: newRow, col: newCol, isCapture: !!target });
      }
    }
  }
  
  return moves;
}

// Bishop moves
function getBishopMoves(row, col, isWhite) {
  const moves = [];
  const directions = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1]
  ];
  
  for (let [dRow, dCol] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
      
      const target = board[newRow][newCol];
      if (!target) {
        moves.push({ row: newRow, col: newCol, isCapture: false });
      } else {
        if (isWhite !== (target === target.toUpperCase())) {
          moves.push({ row: newRow, col: newCol, isCapture: true });
        }
        break;
      }
    }
  }
  
  return moves;
}

// Rook moves
function getRookMoves(row, col, isWhite) {
  const moves = [];
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];
  
  for (let [dRow, dCol] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
      
      const target = board[newRow][newCol];
      if (!target) {
        moves.push({ row: newRow, col: newCol, isCapture: false });
      } else {
        if (isWhite !== (target === target.toUpperCase())) {
          moves.push({ row: newRow, col: newCol, isCapture: true });
        }
        break;
      }
    }
  }
  
  return moves;
}

// Queen moves
function getQueenMoves(row, col, isWhite) {
  return [...getBishopMoves(row, col, isWhite), ...getRookMoves(row, col, isWhite)];
}

// King moves
function getKingMoves(row, col, isWhite) {
  const moves = [];
  for (let dRow = -1; dRow <= 1; dRow++) {
    for (let dCol = -1; dCol <= 1; dCol++) {
      if (dRow === 0 && dCol === 0) continue;
      const newRow = row + dRow;
      const newCol = col + dCol;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = board[newRow][newCol];
        if (!target || isWhite !== (target === target.toUpperCase())) {
          moves.push({ row: newRow, col: newCol, isCapture: !!target });
        }
      }
    }
  }
  
  return moves;
}

// Move piece
function movePiece(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  const target = board[toRow][toCol];
  
  // Capture piece
  if (target) {
    if (target === target.toUpperCase()) {
      capturedPieces.black.push(target);
    } else {
      capturedPieces.white.push(target);
    }
  }
  
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = null;
  
  // Record move
  const fromSquare = String.fromCharCode(97 + fromCol) + (8 - fromRow);
  const toSquare = String.fromCharCode(97 + toCol) + (8 - toRow);
  const moveNotation = `${piece}${target ? 'x' : ''}${toSquare}`;
  moveHistory.push(moveNotation);
  
  lastMove = { fromRow, fromCol, toRow, toCol };
  currentTurn = currentTurn === 'white' ? 'black' : 'white';
  updateCapturedPieces();
}

// Change computer rating
function changeComputerRating() {
  const ratingSelect = document.getElementById('computerRating');
  computerRating = parseInt(ratingSelect.value);
  console.log(`Computer difficulty changed to ${computerRating} (${ratingConfig[computerRating].name})`);
}

// Check if a side has any legal moves
function hasLegalMoves(isWhite) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && (isWhite === (piece === piece.toUpperCase()))) {
        const moves = getValidMoves(row, col);
        if (moves.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

// Check game end conditions (checkmate, stalemate)
function checkGameEnd() {
  const kingPos = findKing(currentTurn === 'white' ? 'white' : 'black');
  if (!kingPos) return;
  
  const inCheck = isKingInCheck(kingPos.row, kingPos.col, currentTurn);
  const hasLegal = hasLegalMoves(currentTurn === 'white');
  
  if (!hasLegal) {
    gameOver = true;
    if (inCheck) {
      // Checkmate
      const loser = currentTurn;
      const winner = loser === 'white' ? 'Computer (Black)' : 'You (White)';
      document.getElementById('gameStatus').textContent = `Checkmate! ${winner} Wins!`;
    } else {
      // Stalemate
      document.getElementById('gameStatus').textContent = 'Stalemate! Draw!';
    }
  }
}

// Computer move with difficulty based on rating
function computerMove() {
  const config = ratingConfig[computerRating];
  const allMoves = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece === piece.toLowerCase()) { // Black piece
        const moves = getValidMoves(row, col);
        for (let move of moves) {
          allMoves.push({ fromRow: row, fromCol: col, ...move });
        }
      }
    }
  }
  
  if (allMoves.length === 0) {
    gameOver = true;
    const kingPos = findKing('black');
    if (isKingInCheck(kingPos.row, kingPos.col, 'black')) {
      document.getElementById('gameStatus').textContent = 'Checkmate! You Win!';
    } else {
      document.getElementById('gameStatus').textContent = 'Stalemate! Draw!';
    }
    return;
  }
  
  // Check if should blunder (make a bad move intentionally based on rating)
  if (Math.random() < config.blunderChance) {
    // Make a random terrible move
    const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    movePiece(randomMove.fromRow, randomMove.fromCol, randomMove.row, randomMove.col);
    renderBoard();
    updateGameStatus();
    return;
  }
  
  // Evaluate moves based on rating
  let bestMove = allMoves[0];
  let bestScore = -Infinity;
  
  for (let move of allMoves) {
    let score = 0;
    
    // Capture evaluation - more important for higher ratings
    const target = board[move.row][move.col];
    if (target) {
      score += pieceValues[target] * (10 + (computerRating / 100));
    }
    
    // Piece safety - higher ratings care more about this
    const piece = board[move.fromRow][move.fromCol];
    score -= pieceValues[piece] * (0.5 + (computerRating / 4000));
    
    // Centrality bonus - higher ratings prefer central control
    const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
    score += (7 - centerDistance) * (0.3 + (computerRating / 8000));
    
    // Piece development - higher ratings develop pieces earlier
    if (move.fromRow === 1 && computerRating > 1200) {
      score += 2;
    }
    
    // Add some randomness based on rating
    const randomFactor = (Math.random() - 0.5) * config.moveRandomness * 10;
    score += randomFactor;
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  movePiece(bestMove.fromRow, bestMove.fromCol, bestMove.row, bestMove.col);
  renderBoard();
  updateGameStatus();
}

// Find king position
function findKing(color) {
  const king = color === 'white' ? 'K' : 'k';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === king) {
        return { row, col };
      }
    }
  }
  return null;
}

// Check if king is in check
function isKingInCheck(kingRow, kingCol, color) {
  const isWhite = color === 'white';
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && isWhite !== (piece === piece.toUpperCase())) {
        const moves = getValidMoves(row, col);
        if (moves.some(m => m.row === kingRow && m.col === kingCol)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Update captured pieces display
function updateCapturedPieces() {
  const capturedWhiteElement = document.getElementById('capturedWhite');
  const capturedBlackElement = document.getElementById('capturedBlack');
  
  capturedWhiteElement.textContent = capturedPieces.black.map(p => getPieceSymbol(p)).join(' ');
  capturedBlackElement.textContent = capturedPieces.white.map(p => getPieceSymbol(p)).join(' ');
}

// Update game status
function updateGameStatus() {
  const moveCountElement = document.getElementById('moveCount');
  const gameStatusElement = document.getElementById('gameStatus');
  
  moveCountElement.textContent = moveHistory.length;
  
  if (!gameOver) {
    if (currentTurn === 'white') {
      gameStatusElement.textContent = 'Your Turn';
    } else {
      gameStatusElement.textContent = `Computer (${ratingConfig[computerRating].name}) Thinking...`;
    }
  }
  
  // Update move history
  const movesListElement = document.getElementById('movesList');
  movesListElement.innerHTML = moveHistory.map(move =>
    `<div class="move-item">${move}</div>`
  ).join('');
}

// Reset game
function resetGame() {
  initializeBoard();
  renderBoard();
  updateGameStatus();
  updateCapturedPieces();
}

// Undo move
function undoMove() {
  if (moveHistory.length === 0) return;
  
  // This is a simplified undo - for a full implementation, you'd store board states
  resetGame();
}

// Resign game
function resignGame() {
  if (confirm('Are you sure you want to resign?')) {
    gameOver = true;
    document.getElementById('gameStatus').textContent = `You Resigned. Computer (${ratingConfig[computerRating].name}) Wins!`;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeBoard();
  renderBoard();
  updateGameStatus();
  updateCapturedPieces();
});