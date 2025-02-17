import { TURN_STATES, PIECE_SYMBOLS } from '../constants/enums';
import { PIECE_TO_TOKEN_MAP } from '../constants/tokens';
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

  createPieces() {
    this.pieces.forEach(piece => piece.destroy());
    this.pieces.clear();

    const position = this.chess.board();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = position[row][col];
        if (piece) {
          const x = this.boardX + col * this.tileSize + this.tileSize / 2;
          const y = this.boardY + row * this.tileSize + this.tileSize / 2;
          
          const pieceType = `${piece.color}${piece.type}`;
          const symbol = PIECE_SYMBOLS[pieceType];
          
          const pieceText = this.add.text(x, y, symbol, {
            fontSize: `${this.tileSize * 0.7}px`,
            color: piece.color === 'w' ? '#FFFFFF' : '#000000',
            stroke: '#000000',
            strokeThickness: piece.color === 'w' ? 1 : 0
          })
          .setOrigin(0.5)
          .setInteractive()
          .on('pointerdown', () => this.handleSquareClick(pieceText, row, col));

          this.pieces.set(`${row},${col}`, pieceText);
        }
      }
    }
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
      this.highlightSelectedToken(matchingToken, this.chess.turn() === 'w' ? 'white' : 'black');
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
      this.unhighlightSelectedToken();
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
    
    this.unhighlightSelectedToken();
    this.createPieces();
    this.updateTurnIndicator();
    this.checkGameState();
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

  unhighlightSelectedToken() {
    if (this.selectionHighlight) {
      this.selectionHighlight.destroy();
    }
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

  highlightObject(x, y, color) {
    if (this.selectionHighlight) {
      this.selectionHighlight.destroy();
    }
    
    this.selectionHighlight = this.add.circle(x, y, this.tileSize * 0.45, color)
      .setAlpha(0.5)
      .setDepth(1);
  }

  updateTurnIndicator() {
    const currentTurn = this.chess.turn() === 'w' ? 'White' : 'Black';
    let text = `${currentTurn}'s turn`;
    
    if (this.turnState === TURN_STATES.SELECT_NEUTRAL_TOKEN) {
      const playerToSelect = this.lastMovedPiece.color === 'w' ? 'White' : 'Black';
      text = `${playerToSelect} must select a neutral token`;
    }
    
    this.turnIndicator.setText(text);
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

  // Helper methods
  coordsToSquare(row, col) {
    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = 8 - row;
    return `${file}${rank}`;
  }

  squareToCoords(square) {
    const file = square.charAt(0);
    const rank = parseInt(square.charAt(1));
    const col = file.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - rank;
    return { row, col };
  }

  pieceRequiresToken(piece) {
    return piece && this.tokenRequiredTypes.has(piece.type);
  }

  findMatchingToken(piece) {
    const tokenType = PIECE_TO_TOKEN_MAP[piece.type];
    const tokens = this.chess.turn() === 'w' ? this.whiteTokens : this.blackTokens;
    return tokens.find(token => token.type === tokenType);
  }

  swapTokens(usedToken, neutralToken) {
    const tempType = usedToken.type;
    usedToken.type = neutralToken.type;
    neutralToken.type = tempType;
    GameInitializer.createTokenPools(this);
  }
}
