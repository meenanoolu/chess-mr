# Desk Chess

Seated mixed-reality chess. Play in the browser, or open the same page on a Meta Quest and move the pieces with your hands.

Play it here: https://meenanoolu.github.io/chess-mr/

## How to play

Gold moves first.

1. Click a gold piece. Legal squares turn green.
2. Click a green square to move.
3. Red plays a legal reply.
4. Illegal moves are rejected and the piece goes back.

On a Quest, open the page in the headset browser and pinch a piece. Drop it on a legal square.

To play a friend, press **Host game + voice**, send them the code, and have them press **Join** on the same page. You can talk while you play. Mute turns your microphone off.

## Rules

The board follows standard chess. [chess.js](https://github.com/jhlywa/chess.js) accepts or rejects every move.

- A piece can only move in its own way.
- You cannot move the other side, or move into check.
- Captures remove the taken piece.
- Castling, en passant, and promotion to a queen are included.
- Check, checkmate, stalemate, and draws are shown in the panel.

## Run it locally

Node 22 is required.

```bash
nvm use 22
cd chess-mr
npm install
npm run dev:runtime
```

Open https://localhost:8081/

`npm run dev` starts the Immersive Web SDK tools as well. `npm run build` writes the static site into `dist`.

## Stack

- [Immersive Web SDK](https://iwsdk.dev/) for the 3D scene, hand pinch, and Quest AR
- Three.js for the board, table, and pieces
- chess.js for the rules
- PeerJS for a friend game and voice
