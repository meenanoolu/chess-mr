# Desk Chess

Seated mixed-reality chess. Play in the browser, or open the same page on a Meta Quest and move the pieces with your hands.

Play it here: https://meenanoolu.github.io/chess-mr/

## For judges

This is a seated, hands-first mixed-reality chess game built with the Immersive Web SDK.

Published build: https://meenanoolu.github.io/chess-mr/

The published page does not show the headset room until an XR runtime is active.

- On a Quest, open that link in the headset browser and press **Enter XR**. Pinch a gold piece, then pinch a green square.
- On a computer, either run the local server below, or install the [Immersive Web Emulator](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik), open the published page, click the extension icon, and press **Enter XR**.
- Look around with the emulator's play mode. Use hands mode. Left mouse pinches.

Gold moves first. Only legal chess moves are accepted. Red replies. **Host game + voice** starts a game with a friend.

## How to play

1. Press **Enter XR**.
2. Pinch or click a gold piece. Legal squares turn green.
3. Pinch or click a green square.
4. Red plays a legal reply. An illegal move is rejected.

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
