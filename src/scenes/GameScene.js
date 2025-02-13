import { TURN_STATES, PIECE_SYMBOLS } from '../constants/enums';
import { GameInitializer } from '../game/GameInitializer';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    GameInitializer.initializeGame(this);
  }

  create() {
    GameInitializer.createLayout(this);
    GameInitializer.createTokenPools(this);
    GameInitializer.createTurnIndicator(this);
    this.createPieces();
    this.updateTurnIndicator();
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
      this.add.text(tokenX, tokenY, PIECE_SYMBOLS[token.type], {
        fontSize: `${size * 0.6}px`,
        color: '#404040'
      }).setOrigin(0.5);
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
          const symbol = PIECE_SYMBOLS[pieceType];
          
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
    if (this.turnState === TURN_STATES.SELECT_NEUTRAL_TOKEN) {
      if (owner === 'neutral') {
        this.handleNeutralTokenSelection(token);
      }
      return;
    }
    
    const isCurrentPlayer = (owner === 'white' && this.chess.turn() === 'w') ||
                          (owner === 'black' && this.chess.turn() === 'b');
    
    if (!isCurrentPlayer && owner !== 'neutral') return;
    
    if (this.turnState === TURN_STATES.SELECT_PIECE) {
      this.selectToken(token, owner);
    }
  }

  handleNeutralTokenSelection(token) {
    this.swapTokens(this.lastUsedToken, token);
    this.turnState = TURN_STATES.SELECT_PIECE;
    this.lastMovedPiece = null;
    this.lastUsedToken = null;
    this.updateTurnIndicator();
  }

  selectToken(token, owner) {
    this.selectedToken = token;
    this.highlightSelectedToken(token, owner);
  }

  highlightSelectedToken(token, owner) {
    const tokenCircles = this.children.list.filter(child => {
      return child.type === 'Circle' && child.input && child.input.enabled;
    });
    
    for (const circle of tokenCircles) {
      const x = circle.x;
      const y = circle.y;
      
      const pools = [
        { tokens: this.whiteTokens, owner: 'white' },
        { tokens: this.blackTokens, owner: 'black' },
        { tokens: this.neutralTokens, owner: 'neutral' }
      ];
      
      for (const pool of pools) {
        const tokenIndex = pool.tokens.findIndex(t => t === token);
        if (tokenIndex !== -1 && pool.owner === owner) {
          this.highlightObject(x, y, 0x00ff00);
          return;
        }
      }
    }
  }

  handlePieceClick(piece, row, col) {
    this.handleSquareClick(piece, row, col);
  }

  handleTileClick(row, col) {
    this.handleSquareClick(null, row, col);
  }

  handleSquareClick(piece, row, col) {
    if (this.turnState === TURN_STATES.SELECT_NEUTRAL_TOKEN) return;

    const square = this.coordsToSquare(row, col);
    const currentPiece = this.chess.get(square);
    const isCurrentPlayerPiece = currentPiece && 
      (currentPiece.color === 'w') === (this.chess.turn() === 'w');

    if (this.selectedPiece === null) {
      if (!isCurrentPlayerPiece) return;
      this.handlePieceSelection(currentPiece, piece, row, col);
    } else {
      this.handlePieceMovement(piece, row, col);
    }
  }

  handlePieceSelection(currentPiece, piece, row, col) {
    if (this.pieceRequiresToken(currentPiece)) {
      const matchingToken = this.findMatchingToken(currentPiece);
      if (!matchingToken) {
        this.highlightObject(
          this.boardX + col * this.tileSize + this.tileSize / 2,
          this.boardY + row * this.tileSize + this.tileSize / 2,
          0xffa500
        );
        return;
      }
      this.selectedToken = matchingToken;
    }
    
    this.selectedPiece = { piece, row, col };
    this.highlightObject(
      this.boardX + col * this.tileSize + this.tileSize / 2,
      this.boardY + row * this.tileSize + this.tileSize / 2,
      0x00ff00
    );
  }

  handlePieceMovement(piece, row, col) {
    if (this.selectedPiece.piece === piece) {
      this.selectedPiece = null;
      this.selectedToken = null;
      return;
    }

    const fromSquare = this.coordsToSquare(this.selectedPiece.row, this.selectedPiece.col);
    const toSquare = this.coordsToSquare(row, col);
    
    try {
      const move = this.chess.move({
        from: fromSquare,
        to: toSquare,
        promotion: 'q'
      });

      if (move) {
        this.handleSuccessfulMove(toSquare);
      }
    } catch (e) {
      console.log('Invalid move:', e);
    }
    
    this.selectedPiece = null;
  }

  handleSuccessfulMove(toSquare) {
    const movedPiece = this.chess.get(toSquare);
    const requiredToken = this.pieceRequiresToken(movedPiece);
    
    if (requiredToken && this.selectedToken) {
      this.lastMovedPiece = movedPiece;
      this.lastUsedToken = this.selectedToken;
      this.turnState = TURN_STATES.SELECT_NEUTRAL_TOKEN;
    } else {
      this.turnState = TURN_STATES.SELECT_PIECE;
      this.selectedToken = null;
    }
    
    this.createPieces();
    this.updateTurnIndicator();
    this.checkGameState();
  }

  checkGameState() {
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

  highlightObject(x, y, color) {
    if (this.selectionHighlight) {
      this.selectionHighlight.destroy();
    }
    
    this.selectionHighlight = this.add.circle(x, y, this.tileSize * 0.45, color)
      .setAlpha(0.5)
      .setDepth(1);
  }

  updateTurnIndicator() {
    if (!this.turnIndicator) return;
    const turn = this.chess.turn() === 'w' ? 'White' : 'Black';
    let text = `${turn} to move`;
    
    if (this.turnState === TURN_STATES.SELECT_NEUTRAL_TOKEN) {
      text = `${turn} must select a neutral token to swap`;
    }
    
    this.turnIndicator.setText(text);
  }

  resize(gameSize) {
    GameInitializer.createLayout(this);
  }

  // Helper method to determine if a piece requires a token
  pieceRequiresToken(piece) {
    if (!piece) return false;
    return this.tokenRequiredTypes.has(piece.type.toLowerCase());
  }

  // Helper method to get available tokens for the current player
  getAvailableTokens() {
    const currentPlayer = this.chess.turn() === 'w' ? 'white' : 'black';
    const tokens = currentPlayer === 'white' ? this.whiteTokens : this.blackTokens;
    return tokens;
  }

  // Helper method to find a matching token for a piece
  findMatchingToken(piece) {
    if (!piece) return null;
    const tokens = this.getAvailableTokens();
    
    // Map piece types to token types
    const requiredType = PIECE_TO_TOKEN_MAP[piece.type.toLowerCase()];
    const matchingToken = tokens.find(token => token.type === requiredType);
    return matchingToken;
  }

  swapTokens(usedToken, neutralToken) {
    // Swap the types
    const tempType = usedToken.type;
    usedToken.type = neutralToken.type;
    neutralToken.type = tempType;

    // Refresh the token displays
    GameInitializer.createTokenPools(this, this.scale.width >= this.scale.height * 1.2);
  }
}
