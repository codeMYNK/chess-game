const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const turnIndicator = document.getElementById("turnIndicator");
const playerRoleDiv = document.getElementById("playerRole"); // New: Player role display

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece && sourceSquare) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  updateTurnIndicator();
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };

  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♙", // White Pawn
    r: "♖", // White Rook
    n: "♘", // White Knight
    b: "♗", // White Bishop
    k: "♔", // White King
    q: "♕", // White Queen
    P: "♟", // Black Pawn
    R: "♜", // Black Rook
    N: "♞", // Black Knight
    B: "♝", // Black Bishop
    K: "♚", // Black King
    Q: "♛", // Black Queen
  };
  return unicodePieces[piece.type] || "";
};

const updateTurnIndicator = () => {
  const turn = chess.turn();
  turnIndicator.innerText = turn === 'w' ? "White's turn" : "Black's turn";
};

socket.on("playerRole", (role) => {
  playerRole = role;
  playerRoleDiv.innerText = `You are the ${role === 'w' ? 'White' : 'Black'} player`; // Display player role
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  playerRoleDiv.innerText = "You are a spectator"; // Display spectator role
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

renderBoard();
