// Starting token pools for each player
export const WHITE_STARTING_POOL = [
  { type: 'rook' },
  { type: 'knight' },
  { type: 'bishop' },
  { type: 'queen' }
];

export const BLACK_STARTING_POOL = [
  { type: 'rook' },
  { type: 'knight' },
  { type: 'bishop' },
  { type: 'queen' }
];

export const NEUTRAL_STARTING_POOL = [
  { type: 'knight' },
  { type: 'bishop' }
];

// Map chess.js piece types to token types
export const PIECE_TO_TOKEN_MAP = {
  'p': 'pawn',
  'r': 'rook',
  'n': 'knight',
  'b': 'bishop',
  'q': 'queen',
  'k': 'king'
};
