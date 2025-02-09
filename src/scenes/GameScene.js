import { Chess } from 'chess.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.chess = new Chess(); // Initialize chess.js
    this.selectedPiece = null;
    this.pieces = new Map(); // Store piece game objects
    this.selectionHighlight = null; // Add highlight reference
    
    // Unicode chess pieces
    this.pieceSymbols = {
      'wk': '♔', // white king
      'wq': '♕', // white queen
      'wr': '♖', // white rook
      'wb': '♗', // white bishop
      'wn': '♘', // white knight
      'wp': '♙', // white pawn
      'bk': '♚', // black king
      'bq': '♛', // black queen
      'br': '♜', // black rook
      'bb': '♝', // black bishop
      'bn': '♞', // black knight
      'bp': '♟' // black pawn
    };
  }

  preload() {
    // No image preloading needed for Unicode symbols
  }

  create() {
    this.createBoard();
    this.createPieces();
  }

  createBoard() {
    const tileSize = 60;
    const offsetX = (this.cameras.main.width - (tileSize * 8)) / 2;
    const offsetY = (this.cameras.main.height - (tileSize * 8)) / 2;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const x = offsetX + col * tileSize;
        const y = offsetY + row * tileSize;
        const color = (row + col) % 2 === 0 ? 0xECE9D5 : 0x4B7399;
        
        const tile = this.add.rectangle(x, y, tileSize, tileSize, color)
          .setOrigin(0, 0)
          .setInteractive()
          .on('pointerdown', () => this.handleTileClick(row, col));

        // Add coordinate labels
        if (row === 7) {
          this.add.text(x + 2, y + tileSize - 12, String.fromCharCode(97 + col), { 
            fontSize: '12px',
            color: (col % 2 === 0) ? '#4B7399' : '#ECE9D5'
          });
        }
        if (col === 0) {
          this.add.text(x + 2, y + 2, 8 - row, { 
            fontSize: '12px',
            color: (row % 2 === 0) ? '#4B7399' : '#ECE9D5'
          });
        }
      }
    }
  }

  createPieces() {
    const tileSize = 60;
    const offsetX = (this.cameras.main.width - (tileSize * 8)) / 2;
    const offsetY = (this.cameras.main.height - (tileSize * 8)) / 2;

    // Clear existing pieces
    this.pieces.forEach(piece => piece.destroy());
    this.pieces.clear();

    // Get the current position from chess.js
    const position = this.chess.board();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = position[row][col];
        if (piece) {
          const x = offsetX + col * tileSize + tileSize / 2;
          const y = offsetY + row * tileSize + tileSize / 2;
          
          const pieceType = piece.color + piece.type; // e.g., 'wp' for white pawn
          const symbol = this.pieceSymbols[pieceType];
          
          const pieceObj = this.add.text(x, y, symbol, {
            fontSize: '40px',
            color: piece.color === 'w' ? '#FFFFFF' : '#000000',
            stroke: '#000000',
            strokeThickness: piece.color === 'w' ? 1 : 0
          }).setOrigin(0.5);

          pieceObj.pieceType = pieceType;
          pieceObj.setInteractive();
          pieceObj.on('pointerdown', () => this.handlePieceClick(pieceObj, row, col));
          
          this.pieces.set(`${row}-${col}`, pieceObj);
        }
      }
    }
  }

  handlePieceClick(piece, row, col) {
    const square = this.coordsToSquare(row, col);
    const currentPiece = this.chess.get(square);
    const isCurrentPlayerPiece = currentPiece && 
      (currentPiece.color === 'w') === (this.chess.turn() === 'w');

    // Clear existing highlight
    if (this.selectionHighlight) {
      this.selectionHighlight.destroy();
      this.selectionHighlight = null;
    }

    if (!isCurrentPlayerPiece && this.selectedPiece === null) {
      return;
    }
    
    if (this.selectedPiece === null && isCurrentPlayerPiece) {
      this.selectedPiece = { piece, row, col };
      this.highlightSquare(row, col);
    } else if (this.selectedPiece) {
      if (this.selectedPiece.piece === piece) {
        this.selectedPiece = null;
      } else {
        const fromSquare = this.coordsToSquare(this.selectedPiece.row, this.selectedPiece.col);
        const toSquare = this.coordsToSquare(row, col);
        
        try {
          const move = this.chess.move({
            from: fromSquare,
            to: toSquare,
            promotion: 'q' // Always promote to queen for now
          });

          if (move) {
            this.createPieces(); // Refresh all pieces
            
            if (this.chess.isCheck()) {
              console.log('Check!');
            }
            if (this.chess.isCheckmate()) {
              console.log('Checkmate!');
            }
            if (this.chess.isDraw()) {
              console.log('Draw!');
            }
          }
        } catch (e) {
          console.log('Invalid move:', e);
        }
        
        this.selectedPiece = null;
      }
    }
  }

  handleTileClick(row, col) {
    if (this.selectedPiece) {
      const fromSquare = this.coordsToSquare(this.selectedPiece.row, this.selectedPiece.col);
      const toSquare = this.coordsToSquare(row, col);
      
      try {
        const move = this.chess.move({
          from: fromSquare,
          to: toSquare,
          promotion: 'q' // Always promote to queen for now
        });

        if (move) {
          this.createPieces(); // Refresh all pieces
          
          if (this.chess.isCheck()) {
            console.log('Check!');
          }
          if (this.chess.isCheckmate()) {
            console.log('Checkmate!');
          }
          if (this.chess.isDraw()) {
            console.log('Draw!');
          }
        }
      } catch (e) {
        console.log('Invalid move:', e);
      }
      
      // Clear highlight
      if (this.selectionHighlight) {
        this.selectionHighlight.destroy();
        this.selectionHighlight = null;
      }
      this.selectedPiece = null;
    }
  }

  // Convert our coordinates (0-7) to chess notation (a1-h8)
  coordsToSquare(row, col) {
    const file = String.fromCharCode(97 + col); // 97 is 'a' in ASCII
    const rank = 8 - row;
    return `${file}${rank}`;
  }

  // Convert chess notation (a1-h8) to our coordinates (0-7)
  squareToCoords(square) {
    const col = square.charCodeAt(0) - 97; // 97 is 'a' in ASCII
    const row = 8 - parseInt(square[1]);
    return { row, col };
  }

  // Add new method to handle square highlighting
  highlightSquare(row, col) {
    const tileSize = 60;
    const offsetX = (this.cameras.main.width - (tileSize * 8)) / 2;
    const offsetY = (this.cameras.main.height - (tileSize * 8)) / 2;
    const x = offsetX + col * tileSize;
    const y = offsetY + row * tileSize;

    this.selectionHighlight = this.add.rectangle(x, y, tileSize, tileSize, 0x00ff00, 0.3)
      .setOrigin(0, 0)
      .setDepth(1); // Ensure highlight is above the board but below pieces
  }
}
