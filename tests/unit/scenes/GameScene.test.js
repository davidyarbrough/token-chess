import { GameScene } from '../GameScene';
import { Chess } from 'chess.js';

// Mock Phaser
const mockAdd = {
  text: jest.fn(() => ({
    setOrigin: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    destroy: jest.fn()
  })),
  rectangle: jest.fn(() => ({
    setOrigin: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    destroy: jest.fn()
  })),
  circle: jest.fn(() => ({
    setOrigin: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    setAlpha: jest.fn()
  }))
};

const mockScale = {
  width: 800,
  height: 600,
  on: jest.fn()
};

const mockChildren = {
  removeAll: jest.fn()
};

// Mock the Phaser.Scene class
jest.mock('phaser', () => ({
  Scene: class {
    constructor() {
      this.add = mockAdd;
      this.scale = mockScale;
      this.children = mockChildren;
    }
  }
}));

describe('GameScene', () => {
  let gameScene;

  beforeEach(() => {
    jest.clearAllMocks();
    gameScene = new GameScene();
    gameScene.create(); // Initialize the scene
  });

  describe('Token Management', () => {
    test('initializes token pools correctly', () => {
      expect(gameScene.whiteTokens).toHaveLength(3);
      expect(gameScene.blackTokens).toHaveLength(3);
      expect(gameScene.neutralTokens).toHaveLength(3);
    });

    test('white tokens contain correct pieces', () => {
      const expectedTypes = ['rook', 'knight', 'bishop'];
      gameScene.whiteTokens.forEach((token, index) => {
        expect(token.type).toBe(expectedTypes[index]);
        expect(token.used).toBe(false);
      });
    });

    test('neutral tokens contain correct pieces', () => {
      expect(gameScene.neutralTokens.filter(t => t.type === 'rook')).toHaveLength(2);
      expect(gameScene.neutralTokens.filter(t => t.type === 'queen')).toHaveLength(1);
    });
  });

  describe('Board Management', () => {
    test('creates chess board with correct dimensions', () => {
      gameScene.createBoard();
      // 64 squares (8x8) plus 16 coordinate labels
      const expectedCalls = 64 + 16;
      expect(mockAdd.rectangle).toHaveBeenCalledTimes(64);
      expect(mockAdd.text).toHaveBeenCalledTimes(16);
    });

    test('calculates square coordinates correctly', () => {
      const square = 'e4';
      const coords = gameScene.squareToCoords(square);
      expect(coords).toEqual({ row: 4, col: 4 });
    });

    test('converts coordinates to square notation correctly', () => {
      const row = 4;
      const col = 4;
      const square = gameScene.coordsToSquare(row, col);
      expect(square).toBe('e4');
    });
  });

  describe('Piece Movement', () => {
    test('handles valid pawn move', () => {
      const fromSquare = 'e2';
      const toSquare = 'e4';
      const move = gameScene.chess.move({ from: fromSquare, to: toSquare });
      expect(move).toBeTruthy();
      expect(gameScene.chess.get(toSquare).type).toBe('p');
    });

    test('prevents invalid moves', () => {
      const fromSquare = 'e2';
      const toSquare = 'e5'; // Invalid pawn move
      expect(() => {
        gameScene.chess.move({ from: fromSquare, to: toSquare });
      }).toThrow();
    });
  });

  describe('Game State', () => {
    test('detects check correctly', () => {
      // Set up a fool's mate position
      gameScene.chess.load('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
      expect(gameScene.chess.isCheck()).toBe(true);
    });

    test('detects checkmate correctly', () => {
      // Set up a fool's mate position
      gameScene.chess.load('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
      expect(gameScene.chess.isCheckmate()).toBe(true);
    });
  });

  describe('Layout and Responsiveness', () => {
    test('adjusts layout for different screen sizes', () => {
      gameScene.scale.width = 1200;
      gameScene.scale.height = 800;
      gameScene.resize();
      expect(mockChildren.removeAll).toHaveBeenCalled();
    });

    test('positions token pools correctly', () => {
      gameScene.createTokenPools(true);
      // Check that the correct number of tokens were created
      expect(mockAdd.circle).toHaveBeenCalledTimes(9); // 3 tokens per pool * 3 pools
    });
  });
});

// Note: The following aspects are difficult to test:
// 1. Phaser-specific rendering and visual elements
// 2. Real-time user interactions
// 3. Touch events and gesture handling
// 4. Animation sequences
// These would be better covered by integration tests or manual testing.
