import { Chess } from 'chess.js';
import { TURN_STATES, TOKEN_SYMBOLS } from '../constants/enums';
import { WHITE_STARTING_POOL, BLACK_STARTING_POOL, NEUTRAL_STARTING_POOL, PIECE_TO_TOKEN_MAP } from '../constants/tokens';

export class GameInitializer {
  static initializeGame(scene) {
    // Initialize game state
    scene.chess = new Chess();
    scene.selectedPiece = null;
    scene.selectedToken = null;
    scene.pieces = new Map();
    scene.selectionHighlight = null;
    scene.turnIndicator = null;
    scene.turnState = TURN_STATES.SELECT_PIECE;
    scene.lastMovedPiece = null;
    scene.lastUsedToken = null;
    
    // Initialize token pools with deep copies
    scene.whiteTokens = WHITE_STARTING_POOL.map(token => ({...token}));
    scene.blackTokens = BLACK_STARTING_POOL.map(token => ({...token}));
    scene.neutralTokens = NEUTRAL_STARTING_POOL.map(token => ({...token}));

    // Initialize token requirements
    scene.tokenRequiredTypes = new Set();
    const allTokenTypes = new Set([
      ...scene.whiteTokens.map(t => t.type),
      ...scene.blackTokens.map(t => t.type),
      ...scene.neutralTokens.map(t => t.type)
    ]);
    
    for (const [pieceType, tokenType] of Object.entries(PIECE_TO_TOKEN_MAP)) {
      if (allTokenTypes.has(tokenType)) {
        scene.tokenRequiredTypes.add(pieceType);
      }
    }
  }

  static createLayout(scene) {
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;
    
    // Board dimensions
    const minDimension = Math.min(width, height);
    const boardSize = minDimension * 0.7;
    const tileSize = boardSize / 8;
    
    scene.boardSize = boardSize;
    scene.tileSize = tileSize;
    scene.boardX = (width - boardSize) / 2;
    scene.boardY = (height - boardSize) / 2;
    
    // Create board background
    scene.add.rectangle(scene.boardX, scene.boardY, boardSize, boardSize, 0x4b4b4b)
      .setOrigin(0, 0);
    
    // Create board squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const x = scene.boardX + col * tileSize;
        const y = scene.boardY + row * tileSize;
        const color = (row + col) % 2 === 0 ? 0xECE9D5 : 0x4B7399;
        
        const tile = scene.add.rectangle(x, y, tileSize, tileSize, color)
          .setOrigin(0, 0)
          .setInteractive()
          .on('pointerdown', () => scene.handleSquareClick(null, row, col));

        // Add board coordinates
        if (row === 7) {
          scene.add.text(x + 2, y + tileSize - 12, String.fromCharCode(97 + col), { 
            fontSize: '12px',
            color: (col % 2 === 0) ? '#4B7399' : '#ECE9D5'
          });
        }
        if (col === 0) {
          scene.add.text(x + 2, y + 2, 8 - row, { 
            fontSize: '12px',
            color: (row % 2 === 0) ? '#4B7399' : '#ECE9D5'
          });
        }
      }
    }
  }

  static createTokenPools(scene) {
    const isWide = scene.cameras.main.width >= scene.cameras.main.height * 1.2;
    const tokenSize = scene.tileSize * 0.8;
    const poolPadding = scene.tileSize * 1.2;
    
    // Black tokens (top)
    this.createTokenPool(
      scene,
      scene.blackTokens,
      scene.boardX + scene.boardSize / 2,
      scene.boardY - poolPadding,
      tokenSize,
      false,
      'black'
    );
    
    // White tokens (bottom)
    this.createTokenPool(
      scene,
      scene.whiteTokens,
      scene.boardX + scene.boardSize / 2,
      scene.boardY + scene.boardSize + poolPadding,
      tokenSize,
      false,
      'white'
    );
    
    // Neutral tokens (right or top)
    this.createTokenPool(
      scene,
      scene.neutralTokens,
      scene.boardX + scene.boardSize + poolPadding,
      scene.boardY + scene.boardSize / 2,
      tokenSize,
      !isWide,
      'neutral'
    );
  }

  static createTokenPool(scene, tokens, x, y, size, vertical, owner) {
    const spacing = size * 1.2;
    const poolLength = (tokens.length - 1) * spacing;
    
    const startX = vertical ? x : x - poolLength / 2;
    const startY = vertical ? y - poolLength / 2 : y;
    
    tokens.forEach((token, index) => {
      const tokenX = vertical ? startX : startX + index * spacing;
      const tokenY = vertical ? startY + index * spacing : startY;
      
      scene.add.circle(tokenX, tokenY, size / 2, owner === 'neutral' ? 0x808080 : owner === 'white' ? 0xFFFFFF : 0x000000)
        .setInteractive()
        .on('pointerdown', () => scene.handleTokenClick(token, owner));
      
      scene.add.text(tokenX, tokenY, TOKEN_SYMBOLS[token.type], {
        fontSize: `${size * 0.6}px`,
        color: owner === 'white' ? '#000000' : '#FFFFFF'
      }).setOrigin(0.5);
    });
  }

  static createTurnIndicator(scene) {
    const padding = scene.tileSize / 2;
    scene.turnIndicator = scene.add.text(padding, padding, '', {
      fontSize: `${scene.tileSize * 0.4}px`,
      color: '#000000',
      fontStyle: 'bold'
    });
  }
}
