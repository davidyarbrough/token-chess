import { Chess } from 'chess.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.chess = new Chess();
    this.selectedPiece = null;
    this.selectedToken = null;
    this.pieces = new Map();
    this.selectionHighlight = null;
    
    // Token pools
    this.whiteTokens = [
      { type: 'rook', used: false },
      { type: 'knight', used: false },
      { type: 'bishop', used: false }
    ];
    
    this.blackTokens = [
      { type: 'rook', used: false },
      { type: 'knight', used: false },
      { type: 'bishop', used: false }
    ];
    
    this.neutralTokens = [
      { type: 'rook', used: false },
      { type: 'rook', used: false },
      { type: 'queen', used: false }
    ];

    // Unicode symbols for pieces on tokens
    this.tokenSymbols = {
      'rook': '♜',
      'knight': '♞',
      'bishop': '♝',
      'queen': '♛'
    };

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

  create() {
    this.scale.on('resize', this.resize, this);
    this.createLayout();
  }

  createLayout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const isWide = width >= height * 1.2; // Screen is significantly wide
    
    // Calculate board size and position
    const minDimension = Math.min(width, height);
    const boardSize = minDimension * 0.7;
    const tileSize = boardSize / 8;
    
    // Store these for other methods to use
    this.boardSize = boardSize;
    this.tileSize = tileSize;
    
    // Calculate board position - always center the board
    const boardX = (width - boardSize) / 2;
    const boardY = (height - boardSize) / 2;
    
    this.boardX = boardX;
    this.boardY = boardY;

    // Clear existing game objects
    this.children.removeAll();
    
    // Create board and pieces
    this.createBoard();
    this.createPieces();
    
    // Create token pools
    this.createTokenPools(isWide);
  }

  createBoard() {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const x = this.boardX + col * this.tileSize;
        const y = this.boardY + row * this.tileSize;
        const color = (row + col) % 2 === 0 ? 0xECE9D5 : 0x4B7399;
        
        const tile = this.add.rectangle(x, y, this.tileSize, this.tileSize, color)
          .setOrigin(0, 0)
          .setInteractive()
          .on('pointerdown', () => this.handleTileClick(row, col));

        if (row === 7) {
          this.add.text(x + 2, y + this.tileSize - 12, String.fromCharCode(97 + col), { 
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

  createTokenPools(isWide) {
    const tokenSize = this.tileSize * 0.8;
    const poolPadding = this.tileSize * 1.2; // Consistent padding from board edge
    
    // Black tokens - always horizontal across the top
    this.createTokenPool(
      this.blackTokens,
      this.boardX + this.boardSize / 2, // Center on board
      this.boardY - poolPadding, // Above board
      tokenSize,
      false, // horizontal
      'black'
    );
    
    // White tokens - always horizontal across the bottom
    this.createTokenPool(
      this.whiteTokens,
      this.boardX + this.boardSize / 2, // Center on board
      this.boardY + this.boardSize + poolPadding, // Below board
      tokenSize,
      false, // horizontal
      'white'
    );
    
    // Neutral tokens - vertical on narrow screens, horizontal on wide screens
    this.createTokenPool(
      this.neutralTokens,
      this.boardX + this.boardSize + poolPadding, // Right of board
      this.boardY + this.boardSize / 2, // Center vertically with board
      tokenSize,
      !isWide, // vertical unless screen is wide
      'neutral'
    );
  }

  createTokenPool(tokens, x, y, size, vertical, owner) {
    const spacing = size * 1.2; // Space between tokens
    const poolLength = (tokens.length - 1) * spacing;
    
    // Adjust starting position to center the pool
    const startX = vertical ? x : x - poolLength / 2;
    const startY = vertical ? y - poolLength / 2 : y;
    
    tokens.forEach((token, index) => {
      const tokenX = vertical ? startX : startX + index * spacing;
      const tokenY = vertical ? startY + index * spacing : startY;
      
      // Create token circle
      const circle = this.add.circle(tokenX, tokenY, size / 2, 0x808080)
        .setInteractive()
        .on('pointerdown', () => this.handleTokenClick(token, owner));

      // Add piece symbol
      const symbol = this.add.text(tokenX, tokenY, this.tokenSymbols[token.type], {
        fontSize: `${size * 0.6}px`,
        color: '#404040'
      }).setOrigin(0.5);

      if (token.used) {
        circle.setAlpha(0.5);
        symbol.setAlpha(0.5);
      }
    });
  }

  createPieces() {
    // Clear existing pieces
    this.pieces.forEach(piece => piece.destroy());
    this.pieces.clear();

    const position = this.chess.board();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = position[row][col];
        if (piece) {
          const x = this.boardX + col * this.tileSize + this.tileSize / 2;
          const y = this.boardY + row * this.tileSize + this.tileSize / 2;
          
          const pieceType = piece.color + piece.type; // e.g., 'wp' for white pawn
          const symbol = this.pieceSymbols[pieceType];
          
          const pieceText = this.add.text(x, y, symbol, {
            fontSize: `${this.tileSize * 0.7}px`,
            color: piece.color === 'w' ? '#FFFFFF' : '#000000',
            stroke: '#000000',
            strokeThickness: piece.color === 'w' ? 1 : 0
          })
          .setOrigin(0.5)
          .setInteractive()
          .on('pointerdown', () => this.handlePieceClick(pieceText, row, col));

          // Store reference to the piece
          this.pieces.set(`${row},${col}`, pieceText);
        }
      }
    }
  }

  handleTokenClick(token, owner) {
    if (token.used) return;
    
    const isCurrentPlayer = (owner === 'white' && this.chess.turn() === 'w') ||
                          (owner === 'black' && this.chess.turn() === 'b');
    
    if (!isCurrentPlayer && owner !== 'neutral') return;
    
    console.log(`Token clicked: ${token.type} from ${owner} pool`);
    // TODO: Implement token selection and spending logic
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

  coordsToSquare(row, col) {
    const file = String.fromCharCode(97 + col); // 97 is 'a' in ASCII
    const rank = 8 - row;
    return `${file}${rank}`;
  }

  squareToCoords(square) {
    const col = square.charCodeAt(0) - 97; // 97 is 'a' in ASCII
    const row = 8 - parseInt(square[1]);
    return { row, col };
  }

  highlightSquare(row, col) {
    const x = this.boardX + col * this.tileSize;
    const y = this.boardY + row * this.tileSize;

    this.selectionHighlight = this.add.rectangle(x, y, this.tileSize, this.tileSize, 0x00ff00, 0.3)
      .setOrigin(0, 0)
      .setDepth(1); // Ensure highlight is above the board but below pieces
  }

  resize(gameSize) {
    this.createLayout();
  }
}
