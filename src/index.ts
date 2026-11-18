import {
  World,
  Mesh,
  MeshBasicMaterial,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  Group,
  OneHandGrabbable,
  DistanceGrabbable,
  RayInteractable,
} from "@iwsdk/core";
import projectOptions from "virtual:iwsdk-project";
import { Chess } from "chess.js";
import { Color, Raycaster, Vector2 } from "three";

const SQUARE = 0.09;
const BOARD_Y = 0.78;
const BOARD_Z = -0.05;
const chess = new Chess();

type Role = "solo" | "host" | "guest";
let role: Role = "solo";
let link: any = null;
let micTrack: MediaStreamTrack | null = null;

function mat(color: number) {
  return new MeshBasicMaterial({ color });
}
function add(g: Group, mesh: Mesh, x: number, y: number, z = 0) {
  mesh.position.set(x, y, z);
  g.add(mesh);
}

function makePiece(type: string, white: boolean) {
  const g = new Group();
  const c = mat(white ? 0xe7d7a8 : 0xc62828);
  const a = mat(white ? 0xb89b58 : 0x7a1212);
  const hit = new Mesh(
    new BoxGeometry(0.16, 0.24, 0.16),
    new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04, depthWrite: false }),
  );
  hit.position.y = 0.1;
  hit.raycast = () => {};
  g.add(hit);
  add(g, new Mesh(new CylinderGeometry(0.04, 0.044, 0.012, 24), a), 0, 0.006);
  add(g, new Mesh(new CylinderGeometry(0.03, 0.036, 0.012, 24), c), 0, 0.016);
  add(g, new Mesh(new CylinderGeometry(0.02, 0.028, 0.01, 20), a), 0, 0.026);
  const t = type.toLowerCase();
  if (t === "p") {
    add(g, new Mesh(new CylinderGeometry(0.011, 0.014, 0.04, 16), c), 0, 0.05);
    add(g, new Mesh(new CylinderGeometry(0.018, 0.014, 0.012, 16), a), 0, 0.074);
    add(g, new Mesh(new SphereGeometry(0.016, 20, 16), c), 0, 0.092);
  } else if (t === "r") {
    add(g, new Mesh(new CylinderGeometry(0.02, 0.024, 0.055, 18), c), 0, 0.056);
    add(g, new Mesh(new CylinderGeometry(0.028, 0.024, 0.014, 18), a), 0, 0.088);
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2;
      add(g, new Mesh(new BoxGeometry(0.008, 0.018, 0.008), c), Math.cos(ang) * 0.02, 0.104, Math.sin(ang) * 0.02);
    }
  } else if (t === "n") {
    add(g, new Mesh(new CylinderGeometry(0.016, 0.02, 0.03, 14), c), 0, 0.042);
    const neck = new Mesh(new BoxGeometry(0.02, 0.05, 0.026), c);
    neck.position.set(0.004, 0.072, 0);
    neck.rotation.z = -0.45;
    g.add(neck);
    const head = new Mesh(new BoxGeometry(0.02, 0.028, 0.018), c);
    head.position.set(0.02, 0.09, 0);
    head.rotation.z = -0.9;
    g.add(head);
    add(g, new Mesh(new BoxGeometry(0.03, 0.01, 0.012), c), 0.034, 0.078, 0);
    add(g, new Mesh(new ConeGeometry(0.006, 0.02, 8), a), 0.012, 0.112, 0);
    add(g, new Mesh(new SphereGeometry(0.004, 8, 8), mat(0x111111)), 0.036, 0.086, 0.006);
  } else if (t === "b") {
    add(g, new Mesh(new CylinderGeometry(0.012, 0.02, 0.05, 16), c), 0, 0.052);
    add(g, new Mesh(new SphereGeometry(0.02, 18, 14), c), 0, 0.086);
    add(g, new Mesh(new ConeGeometry(0.012, 0.03, 12), c), 0, 0.112);
    const slit = new Mesh(new BoxGeometry(0.004, 0.022, 0.014), mat(white ? 0x6d5428 : 0x4a0808));
    slit.position.set(0, 0.09, 0.012);
    g.add(slit);
  } else if (t === "q") {
    add(g, new Mesh(new CylinderGeometry(0.013, 0.02, 0.07, 18), c), 0, 0.062);
    add(g, new Mesh(new SphereGeometry(0.018, 16, 12), c), 0, 0.104);
    add(g, new Mesh(new CylinderGeometry(0.02, 0.016, 0.01, 16), a), 0, 0.118);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      add(g, new Mesh(new SphereGeometry(0.005, 8, 8), a), Math.cos(ang) * 0.016, 0.128, Math.sin(ang) * 0.016);
    }
  } else {
    add(g, new Mesh(new CylinderGeometry(0.015, 0.022, 0.078, 18), c), 0, 0.066);
    add(g, new Mesh(new SphereGeometry(0.018, 16, 12), c), 0, 0.112);
    add(g, new Mesh(new CylinderGeometry(0.012, 0.012, 0.01, 12), a), 0, 0.128);
    add(g, new Mesh(new BoxGeometry(0.006, 0.03, 0.006), a), 0, 0.148);
    add(g, new Mesh(new BoxGeometry(0.026, 0.006, 0.006), a), 0, 0.156);
  }
  return g;
}

function squareOf(file: number, rankFromTop: number) {
  return String.fromCharCode(97 + file) + (8 - rankFromTop);
}
function posOf(square: string) {
  const file = square.charCodeAt(0) - 97;
  const rank = 8 - Number(square[1]);
  return { x: (file - 3.5) * SQUARE, y: BOARD_Y + 0.014, z: BOARD_Z + (rank - 3.5) * SQUARE };
}
function nearestSquare(x: number, z: number) {
  const file = Math.round(x / SQUARE + 3.5);
  const rank = Math.round((z - BOARD_Z) / SQUARE + 3.5);
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return squareOf(file, rank);
}

function panel() {
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;top:12px;left:12px;z-index:20;background:#1b140f;color:#f4efe4;font:14px sans-serif;padding:12px;border-radius:10px;width:240px";
  box.innerHTML = `
    <div id="status">Solo vs computer. Host to play a friend.</div>
    <button id="host" style="margin-top:8px;width:100%">Host game + voice</button>
    <div style="display:flex;gap:6px;margin-top:8px">
      <input id="code" placeholder="friend code" style="flex:1" />
      <button id="join">Join</button>
    </div>
    <button id="mute" style="margin-top:8px;width:100%">Mute mic</button>
  `;
  document.body.appendChild(box);
  return {
    status: box.querySelector("#status") as HTMLDivElement,
    host: box.querySelector("#host") as HTMLButtonElement,
    join: box.querySelector("#join") as HTMLButtonElement,
    code: box.querySelector("#code") as HTMLInputElement,
    mute: box.querySelector("#mute") as HTMLButtonElement,
  };
}

World.create(document.getElementById("scene-container") as HTMLDivElement, projectOptions).then(async (world) => {
  const ui = panel();
  world.scene.background = new Color(0x24180f);
  const floor = new Mesh(new BoxGeometry(6, 0.04, 6), mat(0x5c3b22));
  floor.position.set(0, 0, 0);
  world.createTransformEntity(floor);
  const table = new Mesh(new BoxGeometry(1.7, 0.07, 1.25), mat(0x8a5a32));
  table.position.set(0, BOARD_Y - 0.08, BOARD_Z);
  world.createTransformEntity(table);
  const board = new Group();
  const frame = new Mesh(new BoxGeometry(SQUARE * 8 + 0.08, 0.02, SQUARE * 8 + 0.08), mat(0x6b3e26));
  frame.position.set(0, BOARD_Y - 0.025, BOARD_Z);
  board.add(frame);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = new Mesh(
        new BoxGeometry(SQUARE * 0.98, 0.012, SQUARE * 0.98),
        mat((r + c) % 2 === 0 ? 0xf3e6c8 : 0xb58863),
      );
      square.userData.sq = squareOf(c, r);
      square.userData.base = (r + c) % 2 === 0 ? 0xf3e6c8 : 0xb58863;
      square.position.set((c - 3.5) * SQUARE, BOARD_Y, BOARD_Z + (r - 3.5) * SQUARE);
      board.add(square);
    }
  }
  world.createTransformEntity(board);

  const pieces: any[] = [];
  const rows = ["rnbqkbnr", "pppppppp", "........", "........", "........", "........", "PPPPPPPP", "RNBQKBNR"];
  rows.forEach((row, r) => {
    for (let c = 0; c < 8; c++) {
      const ch = row[c];
      if (ch === ".") continue;
      const white = ch === ch.toUpperCase();
      const piece = makePiece(ch, white);
      const entity = world.createTransformEntity(piece);
      const square = squareOf(c, r);
      const p = posOf(square);
      entity.object3D!.position.set(p.x, p.y, p.z);
      if (!white) entity.object3D!.rotation.y = Math.PI;
      entity.addComponent(RayInteractable);
      entity.addComponent(OneHandGrabbable, { translate: true, rotate: false });
      entity.addComponent(DistanceGrabbable, { translate: true, rotate: false });
      const record = { obj: entity.object3D, type: ch.toLowerCase(), square, color: white ? "w" : "b", captured: false, still: 0, lastX: p.x, lastY: p.y, lastZ: p.z };
      entity.object3D!.traverse((child) => { child.userData.piece = record; });
      pieces.push(record);
    }
  });

  const squareMeshes = new Map<string, any>();
  board.traverse((child: any) => { if (child.userData.sq) squareMeshes.set(child.userData.sq, child); });

  const place = (piece: any) => {
    const p = posOf(piece.square);
    piece.obj.position.set(p.x, p.y, p.z);
    piece.lastX = p.x; piece.lastY = p.y; piece.lastZ = p.z;
    piece.still = 99;
  };
  function restyle(piece: any, type: string) {
    const fresh = makePiece(type, piece.color === "w");
    const group = piece.obj;
    while (group.children.length) group.remove(group.children[0]);
    while (fresh.children.length) group.add(fresh.children[0]);
    group.traverse((child: any) => { child.userData.piece = piece; });
    piece.type = type;
  }
  function sync() {
    const needed: { square: string; type: string; color: string }[] = [];
    chess.board().forEach((row, r) => {
      row.forEach((cell, c) => { if (cell) needed.push({ square: squareOf(c, r), type: cell.type, color: cell.color }); });
    });
    const used = new Set<any>();
    const claim = (pred: (p: any) => boolean) => pieces.find((p) => !used.has(p) && pred(p));
    for (const need of needed) {
      const piece = claim((p) => p.type === need.type && p.color === need.color && p.square === need.square)
        || claim((p) => p.type === need.type && p.color === need.color)
        || claim((p) => p.type === "p" && p.color === need.color);
      if (!piece) continue;
      used.add(piece);
      if (piece.type !== need.type) restyle(piece, need.type);
      piece.square = need.square;
      piece.captured = false;
      piece.obj.visible = true;
      place(piece);
    }
    for (const piece of pieces) {
      if (used.has(piece)) continue;
      piece.captured = true;
      piece.obj.visible = false;
    }
  }
  function outcome() {
    if (chess.isCheckmate()) return "mate";
    if (chess.isStalemate()) return "stalemate";
    if (chess.isDraw()) return "draw";
    if (chess.isCheck()) return "check";
    return "";
  }
  function paint(square?: string) {
    for (const [name, mesh] of squareMeshes) {
      mesh.material.color.setHex(name === square ? 0xd6b25e : mesh.userData.base);
    }
    if (!square) return;
    for (const move of chess.moves({ square, verbose: true }) as any[]) {
      squareMeshes.get(move.to)?.material.color.setHex(0x2f8f4e);
    }
  }
  let selected: any = null;
  function setSelected(piece: any | null) {
    selected = piece;
    paint(piece?.square);
  }
  function sayTurn() {
    const end = outcome();
    if (end === "mate") { ui.status.textContent = (chess.turn() === "w" ? "Red" : "Gold") + " wins. Checkmate."; return; }
    if (end === "stalemate") { ui.status.textContent = "Stalemate."; return; }
    if (end === "draw") { ui.status.textContent = "Draw."; return; }
    const mine = role === "guest" ? "b" : "w";
    const yours = chess.turn() === mine;
    const who = role === "solo" ? (yours ? "Your turn (gold)" : "Red's turn") : (yours ? "Your turn" : "Friend's turn");
    ui.status.textContent = end === "check" ? "Check. " + who : who;
  }
  function play(from: string, to: string) {
    let played: any = null;
    try { played = chess.move({ from, to, promotion: "q" }); }
    catch { return null; }
    if (!played) return null;
    sync();
    setSelected(null);
    sayTurn();
    return played;
  }
  function blackReply() {
    if (role !== "solo" || chess.turn() !== "b" || chess.isGameOver()) return;
    const values: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    const evaluate = () => {
      if (chess.isCheckmate()) return chess.turn() === "w" ? -20000 : 20000;
      if (chess.isDraw()) return 0;
      let score = 0;
      for (const row of chess.board()) for (const cell of row) if (cell) score += values[cell.type] * (cell.color === "b" ? 1 : -1);
      return score;
    };
    let best: any = null;
    let bestScore = -Infinity;
    for (const move of chess.moves({ verbose: true }) as any[]) {
      chess.move(move);
      let worst = 20000;
      const replies = chess.moves({ verbose: true }) as any[];
      if (!replies.length) worst = evaluate();
      for (const reply of replies) {
        chess.move(reply);
        worst = Math.min(worst, evaluate());
        chess.undo();
      }
      chess.undo();
      const noisy = worst + Math.random() * 8;
      if (noisy > bestScore) { bestScore = noisy; best = move; }
    }
    if (best) play(best.from, best.to);
  }

  const myColor = () => (role === "guest" ? "b" : "w");

  async function mic() {
    if (micTrack) return new MediaStream([micTrack]);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    micTrack = stream.getAudioTracks()[0];
    return stream;
  }
  function hear(stream: MediaStream) {
    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.srcObject = stream;
    document.body.appendChild(audio);
  }
  function bind(conn: any, peer: any, stream: MediaStream) {
    link = conn;
    conn.on("data", (msg: any) => {
      if (msg?.t !== "move") return;
      if (play(msg.from, msg.to)) return;
      ui.status.textContent = "Friend's move was rejected.";
    });
    conn.on("open", () => {
      ui.status.textContent = role === "host" ? "Friend joined. You are gold." : "Connected. You are red.";
      const call = role === "guest" ? peer.call(ui.code.value.trim(), stream) : null;
      if (call) call.on("stream", hear);
    });
    peer.on("call", (call: any) => {
      call.answer(stream);
      call.on("stream", hear);
    });
  }

  ui.host.onclick = async () => {
    const { Peer } = await import("peerjs");
    const stream = await mic();
    const peer = new Peer();
    role = "host";
    peer.on("open", (id: string) => {
      ui.status.textContent = "Your code: " + id;
      ui.code.value = id;
    });
    peer.on("connection", (conn: any) => bind(conn, peer, stream));
  };
  ui.join.onclick = async () => {
    const id = ui.code.value.trim();
    if (!id) return;
    const { Peer } = await import("peerjs");
    const stream = await mic();
    const peer = new Peer();
    role = "guest";
    peer.on("open", () => bind(peer.connect(id), peer, stream));
  };
  ui.mute.onclick = () => {
    if (!micTrack) return;
    micTrack.enabled = !micTrack.enabled;
    ui.mute.textContent = micTrack.enabled ? "Mute mic" : "Unmute mic";
  };

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  window.addEventListener("pointerdown", (ev: PointerEvent) => {
    const target = ev.target as HTMLElement | null;
    if (target && target.closest("button, input")) return;
    if (chess.isGameOver()) return;
    const rect = world.renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, world.camera);
    const origin = raycaster.ray.origin;
    const dir = raycaster.ray.direction;
    const depth = (BOARD_Y - origin.y) / dir.y;
    if (!Number.isFinite(depth) || depth < 0) return;
    const square = nearestSquare(origin.x + dir.x * depth, origin.z + dir.z * depth);
    if (!square) return;
    const turn = chess.turn();
    if (role === "solo" && turn !== "w") return;
    if (role !== "solo" && turn !== myColor()) return;
    const occupant = pieces.find((p) => !p.captured && p.square === square);
    if (selected) {
      const legal = (chess.moves({ square: selected.square, verbose: true }) as any[]).some((m) => m.to === square);
      if (legal) {
        const from = selected.square;
        play(from, square);
        if (role === "solo") setTimeout(blackReply, 250);
        else link?.send({ t: "move", from, to: square });
        return;
      }
    }
    if (occupant && occupant.color === turn) {
      setSelected(occupant);
      ui.status.textContent = occupant.square.toUpperCase() + " selected. Green squares are legal.";
      return;
    }
    ui.status.textContent = "Illegal move.";
  });

  const tick = () => {
    requestAnimationFrame(tick);
    const turn = chess.turn();
    if (chess.isGameOver()) return;
    if (role === "solo" && turn !== "w") return;
    if (role !== "solo" && turn !== myColor()) return;
    for (const piece of pieces) {
      if (piece.captured || piece.color !== turn) continue;
      const o = piece.obj.position;
      const moved = Math.hypot(o.x - piece.lastX, o.y - piece.lastY, o.z - piece.lastZ);
      piece.lastX = o.x; piece.lastY = o.y; piece.lastZ = o.z;
      if (moved > 0.002) { piece.still = 0; continue; }
      piece.still++;
      const home = posOf(piece.square);
      if (piece.still < 15 || Math.hypot(o.x - home.x, o.z - home.z) < 0.04) continue;
      const target = nearestSquare(o.x, o.z);
      const from = piece.square;
      if (!target || target === from || !play(from, target)) { place(piece); continue; }
      if (role === "solo") setTimeout(blackReply, 250);
      else link?.send({ t: "move", from, to: target });
      break;
    }
  };
  tick();
});
