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
  Color,
  Raycaster,
  Vector2,
  Sprite,
  SpriteMaterial,
  CanvasTexture,
  MeshLambertMaterial,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  RepeatWrapping,
  SRGBColorSpace,
} from "@iwsdk/core";
import projectOptions from "virtual:iwsdk-project";
import { Chess } from "chess.js";

const SQUARE = 0.11;
const BOARD_Y = 0.95;
const BOARD_Z = -1.95;
const chess = new Chess();

type Role = "solo" | "host" | "guest";
let role: Role = "solo";
let link: any = null;
let micTrack: MediaStreamTrack | null = null;

function grainMap(fill: string, line: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 48; i++) {
    const x = (i * 37) % 128;
    ctx.strokeStyle = line;
    ctx.lineWidth = i % 5 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 10, 70, x - 12, 150, x + 4, 256);
    ctx.stroke();
  }
  const map = new CanvasTexture(canvas);
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  map.colorSpace = SRGBColorSpace;
  return map;
}
const ivory = grainMap("#f6efe2", "rgba(150,110,60,0.22)");
const ebony = grainMap("#5a3b28", "rgba(20,8,0,0.35)");
const oak = grainMap("#a56b3c", "rgba(90,50,20,0.25)");
const walnut = grainMap("#6b4128", "rgba(40,18,8,0.3)");
function flat(color: number) {
  return new MeshLambertMaterial({ color });
}
function woodTex(map: CanvasTexture) {
  return new MeshLambertMaterial({ color: 0xffffff, map });
}
function mat(color: number) {
  return flat(color);
}
function add(g: Group, mesh: Mesh, x: number, y: number, z = 0) {
  mesh.position.set(x, y, z);
  g.add(mesh);
}

function makePiece(type: string, white: boolean) {
  const g = new Group();
  const c = woodTex(white ? ivory : ebony);
  const a = woodTex(white ? ivory : ebony);
  const hit = new Mesh(
    new BoxGeometry(0.09, 0.16, 0.09),
    new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04, depthWrite: false }),
  );
  hit.position.y = 0.07;
  hit.raycast = () => {};
  g.add(hit);
  add(g, new Mesh(new CylinderGeometry(0.028, 0.032, 0.008, 28), a), 0, 0.004);
  add(g, new Mesh(new CylinderGeometry(0.02, 0.026, 0.008, 28), c), 0, 0.011);
  add(g, new Mesh(new CylinderGeometry(0.014, 0.02, 0.006, 24), a), 0, 0.017);
  const t = type.toLowerCase();
  if (t === "p") {
    add(g, new Mesh(new CylinderGeometry(0.008, 0.012, 0.028, 18), c), 0, 0.034);
    add(g, new Mesh(new CylinderGeometry(0.014, 0.01, 0.008, 18), a), 0, 0.05);
    add(g, new Mesh(new SphereGeometry(0.012, 22, 16), c), 0, 0.064);
  } else if (t === "r") {
    add(g, new Mesh(new CylinderGeometry(0.014, 0.018, 0.04, 22), c), 0, 0.04);
    add(g, new Mesh(new CylinderGeometry(0.02, 0.016, 0.012, 22), a), 0, 0.064);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      add(g, new Mesh(new BoxGeometry(0.006, 0.012, 0.006), c), Math.cos(ang) * 0.015, 0.074, Math.sin(ang) * 0.015);
    }
  } else if (t === "n") {
    add(g, new Mesh(new CylinderGeometry(0.012, 0.016, 0.02, 16), c), 0, 0.03);
    const neck = new Mesh(new SphereGeometry(0.013, 16, 12), c);
    neck.scale.set(1.1, 1.6, 0.8);
    neck.position.set(0.004, 0.05, 0);
    neck.rotation.z = -0.5;
    g.add(neck);
    const head = new Mesh(new SphereGeometry(0.014, 16, 12), c);
    head.scale.set(1.5, 0.9, 0.7);
    head.position.set(0.02, 0.066, 0);
    head.rotation.z = -0.4;
    g.add(head);
    add(g, new Mesh(new ConeGeometry(0.004, 0.016, 8), a), 0.03, 0.072, 0);
    add(g, new Mesh(new SphereGeometry(0.003, 8, 8), mat(0x111111)), 0.028, 0.068, 0.006);
    add(g, new Mesh(new ConeGeometry(0.003, 0.012, 6), a), 0.01, 0.078, 0);
  } else if (t === "b") {
    add(g, new Mesh(new CylinderGeometry(0.008, 0.014, 0.04, 18), c), 0, 0.04);
    add(g, new Mesh(new SphereGeometry(0.014, 18, 14), c), 0, 0.066);
    add(g, new Mesh(new ConeGeometry(0.01, 0.026, 14), c), 0, 0.086);
    const slit = new Mesh(new BoxGeometry(0.003, 0.016, 0.01), mat(white ? 0x8a7048 : 0x0c0a08));
    slit.position.set(0, 0.07, 0.008);
    g.add(slit);
  } else if (t === "q") {
    add(g, new Mesh(new CylinderGeometry(0.01, 0.015, 0.055, 20), c), 0, 0.048);
    add(g, new Mesh(new SphereGeometry(0.013, 16, 12), c), 0, 0.082);
    add(g, new Mesh(new CylinderGeometry(0.016, 0.012, 0.006, 18), a), 0, 0.094);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      add(g, new Mesh(new SphereGeometry(0.0035, 8, 8), a), Math.cos(ang) * 0.012, 0.102, Math.sin(ang) * 0.012);
    }
  } else {
    add(g, new Mesh(new CylinderGeometry(0.011, 0.016, 0.06, 20), c), 0, 0.05);
    add(g, new Mesh(new SphereGeometry(0.014, 16, 12), c), 0, 0.086);
    add(g, new Mesh(new CylinderGeometry(0.01, 0.01, 0.006, 14), a), 0, 0.098);
    add(g, new Mesh(new BoxGeometry(0.004, 0.02, 0.004), a), 0, 0.112);
    add(g, new Mesh(new BoxGeometry(0.018, 0.004, 0.004), a), 0, 0.12);
  }
  return g;
}

function seatOpponent(world: any) {
  const g = new Group();
  const cloth = mat(0x243044);
  const skin = mat(0xc9a27a);
  const chair = mat(0x4a3424);
  add(g, new Mesh(new BoxGeometry(0.46, 0.08, 0.46), chair), 0, 0.42, 0);
  add(g, new Mesh(new BoxGeometry(0.46, 0.5, 0.08), chair), 0, 0.7, -0.2);
  add(g, new Mesh(new CylinderGeometry(0.16, 0.2, 0.42, 16), cloth), 0, 0.78, 0);
  add(g, new Mesh(new SphereGeometry(0.11, 18, 14), skin), 0, 1.12, 0.02);
  add(g, new Mesh(new SphereGeometry(0.055, 12, 10), mat(0x1a1a1a)), 0, 1.2, 0);
  const arm = new Mesh(new CylinderGeometry(0.035, 0.04, 0.28, 10), cloth);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(0.22, 0.86, 0.05);
  g.add(arm);
  const arm2 = arm.clone();
  arm2.position.x = -0.22;
  g.add(arm2);
  g.position.set(0, 0, BOARD_Z - 0.72);
  world.createTransformEntity(g);
}

function tag(text: string, x: number, z: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f3e6c8";
  ctx.font = "bold 72px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 64, 64);
  const sprite = new Sprite(new SpriteMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false }));
  sprite.position.set(x, BOARD_Y + 0.03, z);
  sprite.scale.set(0.055, 0.055, 0.055);
  return sprite;
}

let audioCtx: AudioContext | null = null;
function tone(freq: number) {
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return;
  audioCtx = audioCtx || new Ctx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.09);
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
    <div id="status">Solo vs computer. Enter XR for the headset.</div>
    <button id="enter" style="margin-top:8px;width:100%">Enter XR</button>
    <div style="display:flex;gap:6px;margin-top:8px">
      <button id="reset" style="flex:1">New game</button>
      <button id="undo" style="flex:1">Undo</button>
    </div>
    <button id="level" style="margin-top:8px;width:100%">Opponent: Fair</button>
    <button id="host" style="margin-top:8px;width:100%">Host game + voice</button>
    <div style="display:flex;gap:6px;margin-top:8px">
      <input id="code" placeholder="friend code" style="flex:1" />
      <button id="join">Join</button>
    </div>
    <button id="mute" style="margin-top:8px;width:100%">Mute mic</button>
    <div id="promo" style="display:none;gap:6px;margin-top:8px">
      <button data-p="q">Q</button><button data-p="r">R</button><button data-p="b">B</button><button data-p="n">N</button>
    </div>
    <div id="taken" style="margin-top:8px;opacity:.85"></div>
  `;
  document.body.appendChild(box);
  return {
    status: box.querySelector("#status") as HTMLDivElement,
    host: box.querySelector("#host") as HTMLButtonElement,
    join: box.querySelector("#join") as HTMLButtonElement,
    code: box.querySelector("#code") as HTMLInputElement,
    mute: box.querySelector("#mute") as HTMLButtonElement,
    enter: box.querySelector("#enter") as HTMLButtonElement,
    reset: box.querySelector("#reset") as HTMLButtonElement,
    undo: box.querySelector("#undo") as HTMLButtonElement,
    level: box.querySelector("#level") as HTMLButtonElement,
    promo: box.querySelector("#promo") as HTMLDivElement,
    taken: box.querySelector("#taken") as HTMLDivElement,
  };
}

World.create(document.getElementById("scene-container") as HTMLDivElement, projectOptions).then(async (world) => {
  const ui = panel();
  world.scene.background = new Color(0x24180f);
  world.scene.add(new AmbientLight(0xfff4e4, 0.65));
  world.scene.add(new HemisphereLight(0xfff6ea, 0x3a291c, 0.55));
  const sun = new DirectionalLight(0xfff1d2, 1.15);
  sun.position.set(0.8, 2.2, 1.4);
  world.scene.add(sun);
  const floor = new Mesh(new BoxGeometry(6, 0.04, 6), woodTex(walnut));
  floor.position.set(0, 0, 0);
  world.createTransformEntity(floor);
  const table = new Group();
  const top = new Mesh(new BoxGeometry(1.55, 0.06, 1.15), woodTex(oak));
  top.position.set(0, BOARD_Y - 0.08, BOARD_Z);
  table.add(top);
  for (const [x, z] of [[-0.62, -0.42], [0.62, -0.42], [-0.62, 0.42], [0.62, 0.42]] as [number, number][]) {
    const leg = new Mesh(new BoxGeometry(0.06, BOARD_Y - 0.12, 0.06), woodTex(walnut));
    leg.position.set(x, (BOARD_Y - 0.12) / 2, BOARD_Z + z);
    table.add(leg);
  }
  world.createTransformEntity(table);
  const board = new Group();
  const frame = new Mesh(new BoxGeometry(SQUARE * 8 + 0.06, 0.018, SQUARE * 8 + 0.06), woodTex(walnut));
  frame.position.set(0, BOARD_Y - 0.025, BOARD_Z);
  board.add(frame);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = new Mesh(
        new BoxGeometry(SQUARE * 0.98, 0.012, SQUARE * 0.98),
        woodTex((r + c) % 2 === 0 ? ivory : oak),
      );
      square.userData.sq = squareOf(c, r);
      square.userData.base = 0xffffff;
      square.position.set((c - 3.5) * SQUARE, BOARD_Y, BOARD_Z + (r - 3.5) * SQUARE);
      board.add(square);
    }
  }
  world.createTransformEntity(board);
  seatOpponent(world);
  for (let i = 0; i < 8; i++) {
    world.scene.add(tag(String.fromCharCode(97 + i), (i - 3.5) * SQUARE, BOARD_Z + 4.2 * SQUARE));
    world.scene.add(tag(String(8 - i), -4.2 * SQUARE, BOARD_Z + (i - 3.5) * SQUARE));
  }

  const pieces: any[] = [];
  const rows = ["rnbqkbnr", "pppppppp", "........", "........", "........", "........", "PPPPPPPP", "RNBQKBNR"];
  rows.forEach((row, r) => {
    for (let c = 0; c < 8; c++) {
      const ch = row[c];
      if (ch === ".") continue;
      const white = ch === ch.toUpperCase();
      const piece = makePiece(ch, white);
      piece.scale.setScalar(1.85);
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
  let lastFrom = "";
  let lastTo = "";
  let level: "easy" | "fair" = "fair";
  let pending: { from: string; to: string } | null = null;
  function paint(square?: string) {
    for (const [name, mesh] of squareMeshes) {
      const last = name === lastFrom || name === lastTo;
      mesh.material.color.setHex(name === square ? 0xd6b25e : last ? 0xd8c27a : mesh.userData.base);
    }
    if (!square) return;
    for (const move of chess.moves({ square, verbose: true }) as any[]) {
      squareMeshes.get(move.to)?.material.color.setHex(move.captured ? 0x8f3d2f : 0x2f8f4e);
    }
  }
  let selected: any = null;
  function setSelected(piece: any | null) {
    selected = piece;
    paint(piece?.square);
  }
  function takenLine() {
    const start: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const live: Record<string, Record<string, number>> = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
    for (const row of chess.board()) for (const cell of row) if (cell && cell.type !== "k") live[cell.color][cell.type] += 1;
    const names: Record<string, string> = { p: "P", n: "N", b: "B", r: "R", q: "Q" };
    const lost = (color: "w" | "b") => Object.keys(start).flatMap((t) => Array(Math.max(0, start[t] - live[color][t])).fill(names[t])).join(" ");
    ui.taken.textContent = "You took " + (lost("b") || "nothing") + ". You lost " + (lost("w") || "nothing") + ".";
  }
  function sayTurn() {
    takenLine();
    const end = outcome();
    if (end === "mate") { ui.status.textContent = (chess.turn() === "w" ? "Black" : "White") + " wins. Checkmate."; return; }
    if (end === "stalemate") { ui.status.textContent = "Stalemate."; return; }
    if (end === "draw") { ui.status.textContent = "Draw."; return; }
    const mine = role === "guest" ? "b" : "w";
    const yours = chess.turn() === mine;
    const who = role === "solo" ? (yours ? "Your turn (white)" : "Black's turn") : (yours ? "Your turn" : "Friend's turn");
    ui.status.textContent = end === "check" ? "Check. " + who : who;
  }
  function promotes(from: string, to: string) {
    return (chess.moves({ square: from, verbose: true }) as any[]).some((m) => m.to === to && m.promotion);
  }
  function play(from: string, to: string, promotion = "q") {
    const spec: any = { from, to };
    if (promotes(from, to)) spec.promotion = promotion;
    let played: any = null;
    try { played = chess.move(spec); }
    catch { return null; }
    if (!played) return null;
    lastFrom = played.from;
    lastTo = played.to;
    tone(played.captured ? 196 : 523);
    sync();
    setSelected(null);
    sayTurn();
    return played;
  }
  function afterMove(from: string, to: string) {
    if (role === "solo") setTimeout(blackReply, 250);
    else link?.send({ t: "move", from, to });
  }
  function blackReply() {
    if (role !== "solo" || chess.turn() !== "b" || chess.isGameOver()) return;
    if (level === "easy") {
      const moves = chess.moves({ verbose: true }) as any[];
      const caps = moves.filter((m) => m.captured);
      const pool = caps.length ? caps : moves;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick) play(pick.from, pick.to, pick.promotion || "q");
      return;
    }
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
      ui.status.textContent = role === "host" ? "Friend joined. You are white." : "Connected. You are black.";
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
  ui.enter.onclick = () => {
    if (!navigator.xr) {
      ui.status.textContent = "No headset runtime on this tab. On the published page, click the Immersive Web Emulator icon, then Enter XR. Or open https://localhost:8081/ from npm run dev:runtime.";
      return;
    }
    ui.status.textContent = "Starting the headset session...";
    world.launchXR();
  };
  ui.reset.onclick = () => {
    chess.reset();
    lastFrom = "";
    lastTo = "";
    pending = null;
    ui.promo.style.display = "none";
    sync();
    setSelected(null);
    sayTurn();
  };
  ui.undo.onclick = () => {
    if (role !== "solo") { ui.status.textContent = "Undo is for a solo game."; return; }
    if (!chess.history().length) return;
    chess.undo();
    if (chess.turn() === "b" && chess.history().length) chess.undo();
    pending = null;
    ui.promo.style.display = "none";
    const hist = chess.history({ verbose: true }) as any[];
    const prev = hist[hist.length - 1];
    lastFrom = prev?.from || "";
    lastTo = prev?.to || "";
    sync();
    setSelected(null);
    sayTurn();
  };
  ui.level.onclick = () => {
    level = level === "fair" ? "easy" : "fair";
    ui.level.textContent = level === "fair" ? "Opponent: Fair" : "Opponent: Easy";
  };
  ui.promo.onclick = (ev: MouseEvent) => {
    const choice = (ev.target as HTMLElement).dataset.p;
    if (!choice || !pending) return;
    const { from, to } = pending;
    pending = null;
    ui.promo.style.display = "none";
    if (play(from, to, choice)) afterMove(from, to);
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
        if (promotes(from, square)) {
          pending = { from, to: square };
          ui.promo.style.display = "flex";
          ui.status.textContent = "Choose Q, R, B, or N.";
          return;
        }
        if (play(from, square)) afterMove(from, square);
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
    floor.visible = !world.session;
    world.scene.background = world.session ? null : new Color(0x24180f);
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
