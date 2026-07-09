const TILE = {
  WALL: "#",
  FLOOR: ".",
  PLAYER_START: "P",
  MAP_PIECE: "M",
  SILVER_KEY: "S",
  GOLDEN_KEY: "G",
  SILVER_GATE: "s",
  GOLDEN_GATE: "g",
  SWITCH_OFF: "O",
  SWITCH_ON: "o",
  TRAP: "T",
  SAFE_ZONE: "Z",
  MONSTER_START: "X",
  TREASURE: "C"
};

const COLS = 24;
const ROWS = 16;
const SHIFT_INTERVAL_SECONDS = 30;
const MONSTER_MOVE_MS = 650;
const DAMAGE_COOLDOWN_MS = 1200;
const TRAP_TOGGLE_MS = 2500;
const TOTAL_MAP_PIECES = 3;
const TOTAL_SWITCHES = 2;
const MAX_COMPASS_ENERGY = 3;
const VISION_RADIUS = 3;
const SAFE_ZONE_VISION_RADIUS = 5;
const MONSTER_DETECTION_RANGE = 4;
const SYMBOL_OPTIONS = ["Skull", "Moon", "Anchor", "Star", "Shell"];

const gameBoard = document.getElementById("gameBoard");
const healthElement = document.getElementById("health");
const mapPiecesElement = document.getElementById("mapPieces");
const silverKeyElement = document.getElementById("silverKey");
const goldenKeyElement = document.getElementById("goldenKey");
const switchesElement = document.getElementById("switches");
const compassEnergyElement = document.getElementById("compassEnergy");
const shiftTimerElement = document.getElementById("shiftTimer");
const messagePanel = document.getElementById("messagePanel");
const restartButton = document.getElementById("restartButton");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const overlayRestartButton = document.getElementById("overlayRestartButton");
const puzzleModal = document.getElementById("puzzleModal");
const puzzleSelects = [
  document.getElementById("puzzleSymbolOne"),
  document.getElementById("puzzleSymbolTwo"),
  document.getElementById("puzzleSymbolThree")
];
const submitPuzzleButton = document.getElementById("submitPuzzleButton");
const closePuzzleButton = document.getElementById("closePuzzleButton");

let originalMap;
let map;
let player;
let monsters;
let gameState;
let monsterTimerId;
let shiftTimerId;
let trapTimerId;
let damageCooldown = false;
let shiftCountdown = SHIFT_INTERVAL_SECONDS;
let shiftIndex = 0;
let visitedTiles;

const mapPieceSymbols = {
  "8,2": "Skull",
  "3,10": "Moon",
  "15,13": "Anchor"
};

const shiftableTiles = [
  { x: 6, y: 2 },
  { x: 7, y: 2 },
  { x: 13, y: 3 },
  { x: 14, y: 3 },
  { x: 6, y: 9 },
  { x: 7, y: 9 },
  { x: 12, y: 12 },
  { x: 14, y: 12 },
  { x: 18, y: 2 },
  { x: 18, y: 3 },
  { x: 4, y: 8 },
  { x: 5, y: 8 }
];

function buildOriginalMap() {
  const maze = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) =>
      x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1 ? TILE.WALL : TILE.FLOOR
    )
  );

  addVerticalWall(maze, 5, 1, 13, [3, 8, 13]);
  addVerticalWall(maze, 11, 2, 14, [5, 10]);
  addVerticalWall(maze, 17, 1, 13, [4, 9]);
  addHorizontalWall(maze, 4, 2, 9, [4]);
  addHorizontalWall(maze, 7, 6, 16, [10, 14]);
  addHorizontalWall(maze, 11, 2, 20, [8, 13, 18]);
  addTreasureRoom(maze);

  placeTile(maze, 1, 1, TILE.PLAYER_START);
  placeTile(maze, 8, 2, TILE.MAP_PIECE);
  placeTile(maze, 3, 10, TILE.MAP_PIECE);
  placeTile(maze, 15, 13, TILE.MAP_PIECE);
  placeTile(maze, 2, 13, TILE.SILVER_KEY);
  placeTile(maze, 19, 3, TILE.GOLDEN_KEY);
  placeTile(maze, 11, 5, TILE.SILVER_GATE);
  placeTile(maze, 19, 12, TILE.GOLDEN_GATE);
  placeTile(maze, 6, 6, TILE.SWITCH_OFF);
  placeTile(maze, 16, 13, TILE.SWITCH_OFF);
  placeTile(maze, 9, 6, TILE.TRAP);
  placeTile(maze, 16, 10, TILE.TRAP);
  placeTile(maze, 4, 5, TILE.TRAP);
  placeTile(maze, 18, 6, TILE.TRAP);
  placeTile(maze, 2, 2, TILE.SAFE_ZONE);
  placeTile(maze, 13, 9, TILE.SAFE_ZONE);
  placeTile(maze, 14, 2, TILE.MONSTER_START);
  placeTile(maze, 7, 13, TILE.MONSTER_START);
  placeTile(maze, 21, 12, TILE.TREASURE);

  return maze;
}

function addVerticalWall(maze, x, yStart, yEnd, openings) {
  for (let y = yStart; y <= yEnd; y += 1) {
    if (!openings.includes(y)) {
      maze[y][x] = TILE.WALL;
    }
  }
}

function addHorizontalWall(maze, y, xStart, xEnd, openings) {
  for (let x = xStart; x <= xEnd; x += 1) {
    if (!openings.includes(x)) {
      maze[y][x] = TILE.WALL;
    }
  }
}

function addTreasureRoom(maze) {
  for (let x = 19; x <= 23; x += 1) {
    maze[10][x] = TILE.WALL;
    maze[14][x] = TILE.WALL;
  }

  for (let y = 10; y <= 14; y += 1) {
    maze[y][19] = TILE.WALL;
    maze[y][23] = TILE.WALL;
  }

  for (let y = 11; y <= 13; y += 1) {
    for (let x = 20; x <= 22; x += 1) {
      maze[y][x] = TILE.FLOOR;
    }
  }
}

function placeTile(maze, x, y, tile) {
  maze[y][x] = tile;
}

function cloneMap(sourceMap) {
  return sourceMap.map((row) => [...row]);
}

function initGame() {
  stopTimers();
  originalMap = buildOriginalMap();
  map = cloneMap(originalMap);
  monsters = [];
  damageCooldown = false;
  shiftCountdown = SHIFT_INTERVAL_SECONDS;
  shiftIndex = 0;
  visitedTiles = new Set();
  gameState = {
    health: 5,
    mapPieces: 0,
    switchesActivated: 0,
    compassEnergy: MAX_COMPASS_ENERGY,
    hasSilverKey: false,
    hasGoldenKey: false,
    goldenGateOpened: false,
    trapState: "active",
    collectedSymbols: [],
    isGameOver: false,
    hasWon: false
  };

  setupEntitiesFromMap();
  setupPuzzleOptions();
  overlay.classList.add("hidden");
  puzzleModal.classList.add("hidden");
  showMessage("Collect 3 map pieces, activate switches, find both keys, and reach the treasure.");
  renderGame();
  updateUI();
  startTimers();
}

function setupEntitiesFromMap() {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (map[y][x] === TILE.PLAYER_START) {
        player = { x, y };
        map[y][x] = TILE.FLOOR;
      }

      if (map[y][x] === TILE.MONSTER_START) {
        monsters.push({
          x,
          y,
          dx: monsters.length === 0 ? 1 : 0,
          dy: monsters.length === 0 ? 0 : -1,
          chasing: false
        });
        map[y][x] = TILE.FLOOR;
      }
    }
  }
}

function setupPuzzleOptions() {
  puzzleSelects.forEach((select) => {
    select.innerHTML = "";
    SYMBOL_OPTIONS.forEach((symbol) => {
      const option = document.createElement("option");
      option.value = symbol;
      option.textContent = symbol;
      select.appendChild(option);
    });
  });
}

function startTimers() {
  monsterTimerId = setInterval(moveMonsters, MONSTER_MOVE_MS);
  shiftTimerId = setInterval(updateMazeShiftTimer, 1000);
  trapTimerId = setInterval(toggleTrapState, TRAP_TOGGLE_MS);
}

function stopTimers() {
  clearInterval(monsterTimerId);
  clearInterval(shiftTimerId);
  clearInterval(trapTimerId);
}

function renderGame() {
  updateFogOfWar();
  gameBoard.innerHTML = "";

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      gameBoard.appendChild(renderTile(x, y));
    }
  }
}

function renderTile(x, y) {
  const tile = document.createElement("div");
  const tileType = map[y][x];
  const visible = isTileVisible(x, y);
  const visited = visitedTiles.has(getTileKey(x, y));

  tile.className = `tile ${getTileClass(tileType)}`;

  if (!visible && !visited) {
    tile.className = "tile fog-unknown";
    return tile;
  }

  tile.textContent = getTileIcon(tileType);

  const monster = monsters.find((item) => item.x === x && item.y === y);
  if (monster && visible) {
    tile.textContent = "\uD83D\uDC80";
    tile.classList.add("monster");
  }

  if (player.x === x && player.y === y) {
    tile.textContent = "\uD83C\uDFF4\u200D\u2620\uFE0F";
    tile.classList.add("player");
  } else if (!visible) {
    tile.textContent = "";
    tile.classList.add("fog-visited");
  }

  return tile;
}

function getTileClass(tile) {
  if (tile === TILE.WALL) return "wall";
  if (tile === TILE.SAFE_ZONE) return "safe";
  if (tile === TILE.TRAP) return `tile-trap trap-${gameState.trapState}`;
  if (tile === TILE.SWITCH_OFF) return "switch-off";
  if (tile === TILE.SWITCH_ON) return "switch-on";
  if (tile === TILE.SILVER_GATE) return "silver-gate";
  if (tile === TILE.GOLDEN_GATE) return "golden-gate";
  if (tile === TILE.TREASURE) return "treasure";
  return "floor";
}

function getTileIcon(tile) {
  if (tile === TILE.WALL) return "";
  if (tile === TILE.MAP_PIECE) return "\uD83D\uDDFA\uFE0F";
  if (tile === TILE.SILVER_KEY) return "\uD83D\uDDDD\uFE0F";
  if (tile === TILE.GOLDEN_KEY) return "\uD83D\uDD11";
  if (tile === TILE.SILVER_GATE) return "\uD83D\uDD12";
  if (tile === TILE.GOLDEN_GATE) return "\uD83D\uDEAA";
  if (tile === TILE.SWITCH_OFF) return "\u2699\uFE0F";
  if (tile === TILE.SWITCH_ON) return "\u2705";
  if (tile === TILE.TRAP) return gameState.trapState === "active" ? "\u26A0\uFE0F" : ".";
  if (tile === TILE.SAFE_ZONE) return "\uD83D\uDEDF";
  if (tile === TILE.TREASURE) return "\uD83E\uDDF0";
  return "";
}

function handleKeyDown(event) {
  if (gameState.isGameOver || gameState.hasWon) {
    return;
  }

  const key = event.key.toLowerCase();

  if (key === "c") {
    event.preventDefault();
    useCompass();
    return;
  }

  const movement = {
    arrowup: { dx: 0, dy: -1 },
    w: { dx: 0, dy: -1 },
    arrowdown: { dx: 0, dy: 1 },
    s: { dx: 0, dy: 1 },
    arrowleft: { dx: -1, dy: 0 },
    a: { dx: -1, dy: 0 },
    arrowright: { dx: 1, dy: 0 },
    d: { dx: 1, dy: 0 }
  };

  if (!movement[key] || isTreasurePuzzleOpen()) {
    return;
  }

  event.preventDefault();
  movePlayer(movement[key].dx, movement[key].dy);
}

function movePlayer(dx, dy) {
  const nextX = player.x + dx;
  const nextY = player.y + dy;
  const tile = map[nextY][nextX];

  if (tile === TILE.WALL) {
    showMessage("A stone wall blocks the way.");
    return;
  }

  if ((tile === TILE.SILVER_GATE || tile === TILE.GOLDEN_GATE) && !tryOpenGate(tile, nextX, nextY)) {
    return;
  }

  player.x = nextX;
  player.y = nextY;
  handleTileInteraction(map[player.y][player.x]);
  checkMonsterCollision();
  renderGame();
  updateUI();
}

function handleTileInteraction(tile) {
  if (tile === TILE.MAP_PIECE) {
    collectMapPiece();
    return;
  }

  if (tile === TILE.SILVER_KEY || tile === TILE.GOLDEN_KEY) {
    collectKey(tile);
    return;
  }

  if (tile === TILE.SWITCH_OFF) {
    activateSwitch();
    return;
  }

  if (tile === TILE.TRAP) {
    handleTrapTile();
    return;
  }

  if (tile === TILE.SAFE_ZONE) {
    showMessage("You are safe here.");
    return;
  }

  if (tile === TILE.TREASURE) {
    checkWinCondition();
  }
}

function collectMapPiece() {
  const symbol = mapPieceSymbols[getTileKey(player.x, player.y)] || SYMBOL_OPTIONS[gameState.mapPieces];

  gameState.mapPieces += 1;
  gameState.collectedSymbols.push(symbol);
  map[player.y][player.x] = TILE.FLOOR;

  if (gameState.mapPieces === TOTAL_MAP_PIECES) {
    showMessage(`The ancient code is revealed: ${gameState.collectedSymbols.join(" -> ")}`);
    return;
  }

  showMessage(`Map piece collected. It shows: ${symbol}.`);
}

function collectKey(tile) {
  if (tile === TILE.SILVER_KEY) {
    gameState.hasSilverKey = true;
    showMessage("Silver Key collected.");
  } else {
    gameState.hasGoldenKey = true;
    showMessage("Golden Key collected.");
  }

  map[player.y][player.x] = TILE.FLOOR;
}

function activateSwitch() {
  gameState.switchesActivated += 1;
  map[player.y][player.x] = TILE.SWITCH_ON;
  showMessage("Ancient switch activated.");
}

function handleTrapTile() {
  if (gameState.trapState === "active") {
    applyDamage(1, "You stepped on an active trap!");
    return;
  }

  showMessage("The trap is inactive. You passed safely.");
}

function tryOpenGate(tile, x, y) {
  if (tile === TILE.SILVER_GATE) {
    if (!gameState.hasSilverKey) {
      showMessage("You need the Silver Key to open this gate.");
      return false;
    }

    map[y][x] = TILE.FLOOR;
    showMessage("Silver Gate opened.");
    return true;
  }

  if (!gameState.hasGoldenKey) {
    showMessage("You need the Golden Key to open this gate.");
    return false;
  }

  if (gameState.mapPieces < TOTAL_MAP_PIECES) {
    showMessage("You need all map pieces to reveal the treasure route.");
    return false;
  }

  if (gameState.switchesActivated < TOTAL_SWITCHES) {
    showMessage("You need to activate all ancient switches.");
    return false;
  }

  map[y][x] = TILE.FLOOR;
  gameState.goldenGateOpened = true;
  showMessage("Golden Gate opened. The treasure is close.");
  return true;
}

function toggleTrapState() {
  if (gameState.isGameOver || gameState.hasWon) {
    return;
  }

  gameState.trapState = gameState.trapState === "active" ? "inactive" : "active";
  renderGame();
}

function useCompass() {
  if (gameState.compassEnergy === 0) {
    showMessage("Compass energy is empty.");
    return;
  }

  const target = getCompassTarget();
  gameState.compassEnergy -= 1;
  updateUI();

  if (!target) {
    showMessage("The treasure is nearby.");
    return;
  }

  showMessage(`Compass points ${getDirectionText(player, target)}.`);
}

function getCompassTarget() {
  if (gameState.mapPieces < TOTAL_MAP_PIECES) {
    return findNearestTile(TILE.MAP_PIECE);
  }

  if (!gameState.hasGoldenKey) {
    return findFirstTile(TILE.GOLDEN_KEY);
  }

  if (gameState.switchesActivated < TOTAL_SWITCHES) {
    return findNearestTile(TILE.SWITCH_OFF);
  }

  if (!gameState.goldenGateOpened) {
    return findFirstTile(TILE.GOLDEN_GATE);
  }

  return findFirstTile(TILE.TREASURE);
}

function findFirstTile(tileType) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (map[y][x] === tileType) {
        return { x, y };
      }
    }
  }

  return null;
}

function findNearestTile(tileType) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (map[y][x] !== tileType) {
        continue;
      }

      const distance = Math.abs(player.x - x) + Math.abs(player.y - y);
      if (distance < nearestDistance) {
        nearest = { x, y };
        nearestDistance = distance;
      }
    }
  }

  return nearest;
}

function getDirectionText(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const vertical = dy < 0 ? "north" : dy > 0 ? "south" : "";
  const horizontal = dx < 0 ? "west" : dx > 0 ? "east" : "";

  if (vertical && horizontal) {
    return `${vertical}-${horizontal}`;
  }

  return vertical || horizontal || "here";
}

function updateFogOfWar() {
  const radius = map[player.y][player.x] === TILE.SAFE_ZONE ? SAFE_ZONE_VISION_RADIUS : VISION_RADIUS;

  for (let y = player.y - radius; y <= player.y + radius; y += 1) {
    for (let x = player.x - radius; x <= player.x + radius; x += 1) {
      if (isInsideMap(x, y) && isTileVisible(x, y)) {
        visitedTiles.add(getTileKey(x, y));
      }
    }
  }
}

function isTileVisible(x, y) {
  const radius = map[player.y][player.x] === TILE.SAFE_ZONE ? SAFE_ZONE_VISION_RADIUS : VISION_RADIUS;
  return Math.abs(player.x - x) + Math.abs(player.y - y) <= radius;
}

function moveMonsters() {
  if (gameState.isGameOver || gameState.hasWon || isTreasurePuzzleOpen()) {
    return;
  }

  monsters.forEach((monster) => {
    const chaseMove = chasePlayer(monster);
    if (chaseMove) {
      if (!monster.chasing) {
        showMessage("A monster noticed you!");
      }
      monster.chasing = true;
      moveMonster(monster, chaseMove);
      return;
    }

    monster.chasing = false;
    patrolMonster(monster);
  });

  checkMonsterCollision();
  renderGame();
}

function patrolMonster(monster) {
  if (moveMonster(monster, { dx: monster.dx, dy: monster.dy })) {
    return;
  }

  monster.dx *= -1;
  monster.dy *= -1;
  moveMonster(monster, { dx: monster.dx, dy: monster.dy });
}

function chasePlayer(monster) {
  if (map[player.y][player.x] === TILE.SAFE_ZONE) {
    return null;
  }

  const distance = Math.abs(player.x - monster.x) + Math.abs(player.y - monster.y);
  if (distance > MONSTER_DETECTION_RANGE) {
    return null;
  }

  const options = [
    { dx: Math.sign(player.x - monster.x), dy: 0 },
    { dx: 0, dy: Math.sign(player.y - monster.y) }
  ]
    .filter((move) => move.dx !== 0 || move.dy !== 0)
    .sort((a, b) => {
      const distanceA = getDistanceAfterMove(monster, a);
      const distanceB = getDistanceAfterMove(monster, b);
      return distanceA - distanceB;
    });

  return options.find((move) => isValidMonsterMove(monster.x + move.dx, monster.y + move.dy)) || null;
}

function getDistanceAfterMove(monster, move) {
  return Math.abs(player.x - (monster.x + move.dx)) + Math.abs(player.y - (monster.y + move.dy));
}

function moveMonster(monster, move) {
  const nextX = monster.x + move.dx;
  const nextY = monster.y + move.dy;

  if (!isValidMonsterMove(nextX, nextY)) {
    return false;
  }

  monster.x = nextX;
  monster.y = nextY;
  monster.dx = move.dx;
  monster.dy = move.dy;
  return true;
}

function isValidMonsterMove(x, y) {
  if (!isInsideMap(x, y)) {
    return false;
  }

  const tile = map[y][x];
  const blockedTiles = [
    TILE.WALL,
    TILE.SILVER_GATE,
    TILE.GOLDEN_GATE,
    TILE.SAFE_ZONE,
    TILE.TREASURE,
    TILE.MAP_PIECE,
    TILE.SILVER_KEY,
    TILE.GOLDEN_KEY,
    TILE.SWITCH_OFF,
    TILE.SWITCH_ON
  ];

  return !blockedTiles.includes(tile);
}

function checkMonsterCollision() {
  const touchedMonster = monsters.some((monster) => monster.x === player.x && monster.y === player.y);

  if (touchedMonster) {
    applyDamage(1, "A monster hit you!");
  }
}

function applyDamage(amount, reason) {
  if (damageCooldown || gameState.isGameOver || gameState.hasWon) {
    return;
  }

  gameState.health = Math.max(0, gameState.health - amount);
  damageCooldown = true;
  flashPlayerTile();
  showMessage(reason);
  updateUI();

  setTimeout(() => {
    damageCooldown = false;
  }, DAMAGE_COOLDOWN_MS);

  if (gameState.health === 0) {
    endGame("Game Over", "Game Over. The maze has claimed another pirate.");
  }
}

function flashPlayerTile() {
  const index = player.y * COLS + player.x;
  const playerTile = gameBoard.children[index];
  if (!playerTile) {
    return;
  }

  playerTile.classList.remove("player-hit");
  void playerTile.offsetWidth;
  playerTile.classList.add("player-hit");
}

function updateMazeShiftTimer() {
  if (gameState.isGameOver || gameState.hasWon) {
    return;
  }

  shiftCountdown -= 1;

  if (shiftCountdown <= 0) {
    showMessage("Warning: The maze is shifting!");
    shiftMaze();
    shiftCountdown = SHIFT_INTERVAL_SECONDS;
  }

  updateUI();
}

function shiftMaze() {
  let changed = 0;
  let attempts = 0;

  while (changed < 4 && attempts < shiftableTiles.length * 2) {
    const tile = shiftableTiles[shiftIndex % shiftableTiles.length];
    shiftIndex += 1;
    attempts += 1;

    if (canShiftTile(tile.x, tile.y)) {
      map[tile.y][tile.x] = map[tile.y][tile.x] === TILE.WALL ? TILE.FLOOR : TILE.WALL;
      changed += 1;
    }
  }

  renderGame();
}

function canShiftTile(x, y) {
  const tile = map[y][x];
  const isPlayerTile = player.x === x && player.y === y;
  const isMonsterTile = monsters.some((monster) => monster.x === x && monster.y === y);

  return !isPlayerTile && !isMonsterTile && [TILE.FLOOR, TILE.WALL].includes(tile);
}

function checkWinCondition() {
  if (
    gameState.mapPieces === TOTAL_MAP_PIECES &&
    gameState.hasGoldenKey &&
    gameState.goldenGateOpened
  ) {
    openTreasurePuzzle();
    return;
  }

  showMessage("The treasure remains sealed. Collect map pieces, the Golden Key, switches, and open the Golden Gate.");
}

function openTreasurePuzzle() {
  puzzleModal.classList.remove("hidden");
  showMessage("Enter the ancient symbol code to unlock the treasure.");
}

function submitTreasurePuzzle() {
  const guess = puzzleSelects.map((select) => select.value);
  const isCorrect = guess.every((symbol, index) => symbol === gameState.collectedSymbols[index]);

  if (isCorrect) {
    puzzleModal.classList.add("hidden");
    showMessage("You solved the treasure puzzle!");
    endGame("Treasure Found", "You solved the treasure puzzle! You found the lost treasure!");
    return;
  }

  puzzleModal.classList.add("hidden");
  showMessage("Wrong code. The maze awakens!");
  applyDamage(1, "Wrong code. The maze awakens!");
  addAwakenedMonster();
  renderGame();
}

function addAwakenedMonster() {
  const spawn = { x: 20, y: 11 };
  if (isValidMonsterMove(spawn.x, spawn.y)) {
    monsters.push({ x: spawn.x, y: spawn.y, dx: -1, dy: 0, chasing: false });
  }
}

function isTreasurePuzzleOpen() {
  return !puzzleModal.classList.contains("hidden");
}

function endGame(title, message) {
  gameState.isGameOver = title === "Game Over";
  gameState.hasWon = title !== "Game Over";
  stopTimers();
  showMessage(message);
  updateUI();
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlay.classList.remove("hidden");
}

function updateUI() {
  healthElement.textContent = gameState.health;
  mapPiecesElement.textContent = `${gameState.mapPieces}/${TOTAL_MAP_PIECES}`;
  silverKeyElement.textContent = gameState.hasSilverKey ? "Yes" : "No";
  goldenKeyElement.textContent = gameState.hasGoldenKey ? "Yes" : "No";
  switchesElement.textContent = `${gameState.switchesActivated}/${TOTAL_SWITCHES}`;
  compassEnergyElement.textContent = `${gameState.compassEnergy}/${MAX_COMPASS_ENERGY}`;
  shiftTimerElement.textContent = `${shiftCountdown}s`;
}

function showMessage(text) {
  messagePanel.textContent = text;
}

function getTileKey(x, y) {
  return `${x},${y}`;
}

function isInsideMap(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}

restartButton.addEventListener("click", initGame);
overlayRestartButton.addEventListener("click", initGame);
submitPuzzleButton.addEventListener("click", submitTreasurePuzzle);
closePuzzleButton.addEventListener("click", () => {
  puzzleModal.classList.add("hidden");
  showMessage("You backed away from the treasure puzzle.");
});
document.addEventListener("keydown", handleKeyDown);

initGame();
