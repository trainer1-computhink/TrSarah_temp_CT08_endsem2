const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 520;
const FLOOR_Y = 440;
const PLAYER_X = 185;
const PLAYER_WIDTH = 38;
const PLAYER_HEIGHT = 42;
const UNLOCK_KEY = 'starfallRunUnlockedLevel';
const RUN_SPEED = 4.2;
const JUMP_SPEED = -16;

const LEVELS = [
  {
    name: 'Neon Outpost',
    length: 3100,
    hazards: [
      { x: 550, type: 'spike', width: 38, height: 38 },
      { x: 930, type: 'laser', width: 62, height: 56 },
      { x: 1320, type: 'wall', width: 42, height: 72 },
      { x: 1740, type: 'spike', width: 38, height: 38 },
      { x: 2140, type: 'laser', width: 58, height: 58 },
      { x: 2580, type: 'wall', width: 42, height: 72 },
    ],
  },
  {
    name: 'Ion Foundry',
    length: 3400,
    hazards: [
      { x: 500, type: 'laser', width: 62, height: 58 },
      { x: 880, type: 'spike', width: 38, height: 38 },
      { x: 1240, type: 'wall', width: 44, height: 76 },
      { x: 1620, type: 'spike', width: 38, height: 38 },
      { x: 2000, type: 'laser', width: 62, height: 58 },
      { x: 2380, type: 'wall', width: 44, height: 76 },
      { x: 2800, type: 'spike', width: 38, height: 38 },
    ],
  },
  {
    name: 'Singularity Gate',
    length: 3700,
    hazards: [
      { x: 520, type: 'spike', width: 38, height: 38 },
      { x: 900, type: 'wall', width: 44, height: 78 },
      { x: 1280, type: 'laser', width: 64, height: 60 },
      { x: 1660, type: 'spike', width: 38, height: 38 },
      { x: 2040, type: 'wall', width: 44, height: 78 },
      { x: 2440, type: 'laser', width: 64, height: 60 },
      { x: 2840, type: 'spike', width: 38, height: 38 },
      { x: 3240, type: 'wall', width: 44, height: 78 },
    ],
  },
];

let player;
let ground;
let hazards = [];
let stars = [];
let currentLevelIndex = 0;
let worldDistance = 0;
let gameState = 'ready';
let onGround = false;
let statusElement;
let actionButton;

function setup() {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent('game');
  statusElement = document.querySelector('#game-status');
  actionButton = document.querySelector('#action-button');

  const storedProgress = Number(localStorage.getItem(UNLOCK_KEY) || '1');
  const highestUnlockedLevel = Number.isInteger(storedProgress)
    ? Math.max(1, Math.min(LEVELS.length, storedProgress))
    : 1;
  const requestedLevel = Number(new URLSearchParams(location.search).get('level') || '1');
  currentLevelIndex =
    Number.isInteger(requestedLevel) &&
    requestedLevel >= 1 &&
    requestedLevel <= highestUnlockedLevel
      ? requestedLevel - 1
      : 0;

  for (let index = 0; index < 70; index += 1) {
    stars.push({
      x: random(CANVAS_WIDTH),
      y: random(20, FLOOR_Y - 70),
      size: random(1, 3),
      depth: random(0.08, 0.24),
    });
  }

  actionButton.addEventListener('click', handleActionButton);
  createLevelSprites();
  updateStatus('ready');
}

function createLevelSprites() {
  if (player) player.delete();
  if (ground) ground.delete();
  hazards.forEach((hazard) => hazard.sprite.delete());
  hazards = [];
  worldDistance = 0;

  world.gravity.y = 24;
  ground = new Sprite(CANVAS_WIDTH / 2, FLOOR_Y + 30, CANVAS_WIDTH, 60, STATIC);
  ground.color = '#132d42';
  ground.stroke = '#39dff0';
  ground.friction = 0;

  player = new Sprite(PLAYER_X, FLOOR_Y - PLAYER_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT);
  player.color = '#5cf2ff';
  player.stroke = '#ffffff';
  player.rotationLock = true;
  player.bounciness = 0;
  player.friction = 0;

  const level = LEVELS[currentLevelIndex];
  level.hazards.forEach((hazardData) => {
    const sprite = new Sprite(
      PLAYER_X + hazardData.x,
      FLOOR_Y - hazardData.height / 2,
      hazardData.width,
      hazardData.height,
      STATIC
    );
    sprite.color = hazardColor(hazardData.type);
    sprite.stroke = '#fff4d1';
    hazards.push({ sprite, worldX: hazardData.x, type: hazardData.type });
  });

  gameState = 'ready';
}

function hazardColor(type) {
  if (type === 'laser') return '#ff3c86';
  if (type === 'wall') return '#ff9c42';
  return '#ffdf58';
}

function draw() {
  drawBackdrop();
  drawProgress();

  player.collides(ground);
  onGround = player.colliding(ground) > 0;

  if (gameState === 'playing') {
    worldDistance += RUN_SPEED;
    hazards.forEach((hazard) => {
      hazard.sprite.x = PLAYER_X + hazard.worldX - worldDistance;
      if (player.overlaps(hazard.sprite)) finishLevel(false);
    });

    if (worldDistance >= LEVELS[currentLevelIndex].length) {
      finishLevel(true);
    }
  }

  drawHazardAccents();
  drawPlayerGlow();
}

function drawBackdrop() {
  background('#070b18');
  noStroke();
  stars.forEach((star) => {
    const x = (star.x - worldDistance * star.depth + CANVAS_WIDTH) % CANVAS_WIDTH;
    fill(150, 225, 255, 170);
    circle(x, star.y, star.size);
  });

  fill('#0d1b2b');
  rect(0, FLOOR_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_Y);
  stroke('#247a91');
  strokeWeight(1);
  for (let x = -((worldDistance * 0.6) % 70); x < CANVAS_WIDTH; x += 70) {
    line(x, FLOOR_Y + 8, x - 34, CANVAS_HEIGHT);
  }
  stroke('#5cf2ff');
  strokeWeight(3);
  line(0, FLOOR_Y, CANVAS_WIDTH, FLOOR_Y);
  noStroke();

  fill('#eaf7ff');
  textAlign(LEFT, TOP);
  textSize(18);
  text(`LEVEL ${currentLevelIndex + 1}  //  ${LEVELS[currentLevelIndex].name}`, 24, 20);
}

function drawProgress() {
  const progress = Math.min(1, worldDistance / LEVELS[currentLevelIndex].length);
  noStroke();
  fill('#18354a');
  rect(24, 52, CANVAS_WIDTH - 48, 8, 4);
  fill('#5cf2ff');
  rect(24, 52, (CANVAS_WIDTH - 48) * progress, 8, 4);
}

function drawHazardAccents() {
  hazards.forEach((hazard) => {
    const centerX = hazard.sprite.x;
    if (centerX < -80 || centerX > CANVAS_WIDTH + 80) return;

    if (hazard.type === 'spike') {
      noStroke();
      fill('#ffdf58');
      triangle(
        centerX - hazard.sprite.width / 2,
        FLOOR_Y,
        centerX,
        FLOOR_Y - hazard.sprite.height,
        centerX + hazard.sprite.width / 2,
        FLOOR_Y
      );
    } else if (hazard.type === 'laser') {
      stroke('#ffd6e5');
      strokeWeight(2);
      line(
        centerX - hazard.sprite.width / 2,
        hazard.sprite.y,
        centerX + hazard.sprite.width / 2,
        hazard.sprite.y
      );
    }
  });
  noStroke();
}

function drawPlayerGlow() {
  if (gameState === 'playing' && player) {
    noFill();
    stroke(92, 242, 255, 90);
    strokeWeight(5);
    rect(player.x - PLAYER_WIDTH / 2 - 4, player.y - PLAYER_HEIGHT / 2 - 4, PLAYER_WIDTH + 8, PLAYER_HEIGHT + 8, 8);
    noStroke();
  }
}

function keyPressed() {
  if (key === ' ' || keyCode === 32) {
    if (gameState === 'ready') {
      startLevel();
    } else if (gameState === 'playing' && onGround) {
      player.vel.y = JUMP_SPEED;
      onGround = false;
    }
    return false;
  }

  if (key === 'r' || key === 'R') {
    createLevelSprites();
    updateStatus('ready');
  }
}

function startLevel() {
  gameState = 'playing';
  updateStatus('playing');
}

function finishLevel(won) {
  if (gameState !== 'playing') return;

  gameState = won ? 'won' : 'lost';
  player.vel.x = 0;
  player.vel.y = 0;

  if (won) {
    const unlockedThrough = Math.min(LEVELS.length, currentLevelIndex + 2);
    const oldProgress = Number(localStorage.getItem(UNLOCK_KEY) || '1');
    localStorage.setItem(UNLOCK_KEY, String(Math.max(unlockedThrough, oldProgress)));
    updateStatus('won');
  } else {
    updateStatus('lost');
  }
}

function updateStatus(state) {
  if (state === 'ready') {
    statusElement.textContent = `Level ${currentLevelIndex + 1}: ${LEVELS[currentLevelIndex].name} — press Space or Start mission.`;
    actionButton.textContent = 'Start mission';
    actionButton.disabled = false;
  } else if (state === 'playing') {
    statusElement.textContent = 'Run! Press Space to jump over spikes, lasers, and walls.';
    actionButton.textContent = 'Restart level';
    actionButton.disabled = false;
  } else if (state === 'won') {
    statusElement.textContent = `Level complete! Level ${Math.min(currentLevelIndex + 2, LEVELS.length)} is now unlocked on the homepage.`;
    actionButton.textContent = 'Play this level again';
    actionButton.disabled = false;
  } else if (state === 'lost') {
    statusElement.textContent = 'Mission failed — you hit a hazard. Press R or retry the level.';
    actionButton.textContent = 'Retry level';
    actionButton.disabled = false;
  }
}

function handleActionButton() {
  if (gameState === 'ready') {
    startLevel();
    return;
  }
  createLevelSprites();
  updateStatus('ready');
}
