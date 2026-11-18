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
2. Pinch or click a gold piece. Legal squares turn green. Captures turn red.
3. Pinch or click a green or red square.
4. If a pawn reaches the last rank, choose Q, R, B, or N.
5. Red plays a legal reply. **Undo** takes back your move and that reply. **New game** starts over. **Opponent** switches between Fair and Easy.

A move makes a short sound. The last move stays highlighted. The panel lists what each side has lost.

## Rules

The board follows standard chess. [chess.js](https://github.com/jhlywa/chess.js) accepts or rejects every move.

- A piece can only move in its own way.
- You cannot move the other side, or move into check.
- Captures remove the taken piece.
- Castling, en passant, and promotion to a queen, rook, bishop, or knight are included.
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
- Three.js for the board, table, pieces, and the seated opponent
- chess.js for the rules
- PeerJS for a friend game and voice

## Later

These are not in this build. Each one is a large project on its own.

- A match that stays locked to one real table after the headset comes off, and is still there when you come back.
- Ranked play with accounts, clocks, tournaments, and spectators, plus a way to tell a hand move from an engine.
- The person across the table is your friend: their head, hands, and voice, taken from their own headset.
- A real wooden set in the room drives the game. The cameras read the pieces, and you feel the board when you touch it.
- A coach in the room that talks through a plan and can rewind the position without ending the live game.
- One clock shared by a person in a headset, a person on a phone, and a person watching on a computer.
