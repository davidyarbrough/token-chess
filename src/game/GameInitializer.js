import { Chess } from 'chess.js';
import { TURN_STATES } from '../constants/enums';
import { PIECE_SYMBOLS } from '../constants/enums';
import { WHITE_STARTING_POOL, BLACK_STARTING_POOL, NEUTRAL_STARTING_POOL } from '../constants/tokens';

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
    scene.tokenRequiredTypes = new Set();
    
    // Initialize token pools with deep copies
    scene.whiteTokens = WHITE_STARTING_POOL.map(token => ({...token}));
    scene.blackTokens = BLACK_STARTING_POOL.map(token => ({...token}));
    scene.neutralTokens = NEUTRAL_STARTING_POOL.map(token => ({...token}));
  }

  static createLayout(scene) {
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;
    
    // Board dimensions
    scene.tileSize = Math.min(width, height) / 10;
    scene.boardSize = scene.tileSize * 8;
    scene.boardX = (width - scene.boardSize) / 2;
    scene.boardY = (height - scene.boardSize) / 2;
    
    // Create board background
    scene.add.rectangle(scene.boardX, scene.boardY, scene.boardSize, scene.boardSize, 0x4b4b4b)
      .setOrigin(0, 0);
    
    // Create board squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const x = scene.boardX + col * scene.tileSize;
        const y = scene.boardY + row * scene.tileSize;
        const color = (row + col) % 2 === 0 ? 0xffffff : 0x4b4b4b;
        
        scene.add.rectangle(x, y, scene.tileSize, scene.tileSize, color)
          .setOrigin(0, 0)
          .setInteractive()
          .on('pointerdown', () => scene.handleTileClick(row, col));
      }
    }
  }

  static createTokenPools(scene) {
    const tokenSize = scene.tileSize * 0.4;
    const spacing = scene.tileSize * 0.6;
    const startY = scene.boardY + scene.boardSize / 2;
    
    // White tokens (left side)
    scene.whiteTokens.forEach((token, index) => {
      const x = scene.boardX - spacing * 2;
      const y = startY - spacing * (index - scene.whiteTokens.length/2);
      
      scene.add.circle(x, y, tokenSize, 0xffffff)
        .setInteractive()
        .on('pointerdown', () => scene.handleTokenClick(token, 'white'));
      
      scene.add.text(x, y, PIECE_SYMBOLS[token.type], {
        fontSize: `${tokenSize}px`,
        color: '#000000'
      }).setOrigin(0.5);
    });
    
    // Black tokens (right side)
    scene.blackTokens.forEach((token, index) => {
      const x = scene.boardX + scene.boardSize + spacing * 2;
      const y = startY - spacing * (index - scene.blackTokens.length/2);
      
      scene.add.circle(x, y, tokenSize, 0x000000)
        .setInteractive()
        .on('pointerdown', () => scene.handleTokenClick(token, 'black'));
      
      scene.add.text(x, y, PIECE_SYMBOLS[token.type], {
        fontSize: `${tokenSize}px`,
        color: '#ffffff'
      }).setOrigin(0.5);
    });
    
    // Neutral tokens (top)
    scene.neutralTokens.forEach((token, index) => {
      const x = scene.boardX + scene.boardSize/2 + spacing * (index - scene.neutralTokens.length/2);
      const y = scene.boardY - spacing;
      
      scene.add.circle(x, y, tokenSize, 0x808080)
        .setInteractive()
        .on('pointerdown', () => scene.handleTokenClick(token, 'neutral'));
      
      scene.add.text(x, y, PIECE_SYMBOLS[token.type], {
        fontSize: `${tokenSize}px`,
        color: '#ffffff'
      }).setOrigin(0.5);
    });
  }

  static createTurnIndicator(scene) {
    const x = scene.boardX + scene.boardSize / 2;
    const y = scene.boardY + scene.boardSize + scene.tileSize / 2;
    
    scene.turnIndicator = scene.add.text(x, y, '', {
      fontSize: `${scene.tileSize * 0.4}px`,
      color: '#000000'
    }).setOrigin(0.5);
  }
}
