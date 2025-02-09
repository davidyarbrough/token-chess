# Token Chess

A unique chess variant built with Phaser 3 where players must spend tokens to move certain pieces.

## Game Rules

1. Standard chess rules apply with the following modifications:
2. Players need tokens to move certain pieces:
   - Rook: Requires a rook token
   - Knight: Requires a knight token
   - Bishop: Requires a bishop token
   - Queen: Requires a queen token
   - King and Pawns: Can be moved for free

3. Token System:
   - Each player starts with:
     - 1 Rook token
     - 1 Knight token
     - 1 Bishop token
   - The neutral pool starts with:
     - 1 Rook token
     - 1 Knight token
     - 1 Bishop token
     - 1 Queen token

4. To move a piece that requires a token:
   1. Select the token you want to spend
   2. Move the corresponding piece
   3. Select a token from the neutral pool
   4. The spent token and selected neutral token switch places

## Development

### Prerequisites
- Node.js
- npm

### Installation
1. Clone the repository
2. Run `npm install`
3. Run `npm start` to start the development server

### Technologies Used
- Phaser 3 - Game Framework
- JavaScript (ES6+)
