// Emberwild is a small side-view survival game built with p5play sprites.

const GAME_WIDTH = 960;
const GAME_HEIGHT = 600;
const GROUND_Y = 520;
const TILE_SIZE = 40;
const SURVIVE_SECONDS = 75;

let player;
let ground;
let leftWall;
let rightWall;
let resourceSprites = [];
let enemySprites = [];
let placedBlocks = [];
let gameSprites = [];
let inventory;
let selectedTool;
let selectedBlock;
let gameStartedAt;
let nextEnemyAt;
let nextPlayerHitAt;
let nextActionAt;
let gameEndedAt;
let gameState;
let canvasElement;
let messageText = '';
let messageUntil = 0;

function setup() {
  const gameCanvas = new Canvas(GAME_WIDTH, GAME_HEIGHT);
  canvasElement = gameCanvas.elt;
  canvasElement.addEventListener('contextmenu', (event) => event.preventDefault());
  textFont('Arial');
  textAlign(CENTER, CENTER);
  startGame();
}

function startGame() {
  removeGameSprites();

  world.gravity.x = 0;
  world.gravity.y = 12;

  inventory = { wood: 3, stone: 3 };
  selectedTool = 'axe';
  selectedBlock = 'wood';
  gameStartedAt = millis();
  nextEnemyAt = gameStartedAt + 10000;
  nextPlayerHitAt = 0;
  nextActionAt = 0;
  gameEndedAt = 0;
  gameState = 'playing';
  resourceSprites = [];
  enemySprites = [];
  placedBlocks = [];

  ground = makeSprite(GAME_WIDTH / 2, GROUND_Y + 40, GAME_WIDTH, 80, '#65452f', 'static');
  leftWall = makeSprite(-16, GAME_HEIGHT / 2, 32, GAME_HEIGHT, '#65452f', 'static');
  rightWall = makeSprite(GAME_WIDTH + 16, GAME_HEIGHT / 2, 32, GAME_HEIGHT, '#65452f', 'static');
  ground.stroke = '#382c27';
  leftWall.visible = false;
  rightWall.visible = false;

  player = makeSprite(155, GROUND_Y - 28, 30, 52, '#54b7ce', 'dynamic');
  player.rotationLock = true;
  player.friction = 0.15;
  player.bounciness = 0;
  player.stroke = '#153f54';
  player.gameRole = 'player';
  player.healthPoints = 5;

  addResource('tree', 300, 466, 44, 108, '#4d8c49', 4);
  addResource('tree', 575, 466, 44, 108, '#4d8c49', 4);
  addResource('tree', 835, 466, 44, 108, '#4d8c49', 4);
  addResource('stone', 235, 488, 48, 48, '#9ba6a8', 4);
  addResource('stone', 470, 488, 48, 48, '#9ba6a8', 4);
  addResource('stone', 720, 488, 48, 48, '#9ba6a8', 4);

  spawnEnemy(790);
}

function makeSprite(x, y, spriteWidth, spriteHeight, spriteColor, physicsType) {
  const sprite = new Sprite(x, y, spriteWidth, spriteHeight, physicsType);
  sprite.color = spriteColor;
  sprite.stroke = '#28333a';
  gameSprites.push(sprite);
  return sprite;
}

function addResource(kind, x, y, spriteWidth, spriteHeight, spriteColor, hits) {
  const sprite = makeSprite(x, y, spriteWidth, spriteHeight, spriteColor, 'static');
  sprite.gatherType = kind;
  sprite.gatherHits = hits;
  resourceSprites.push(sprite);

  if (kind === 'tree') {
    const trunk = makeSprite(x, y + 34, 15, 40, '#93613c', 'static');
    trunk.stroke = '#64432e';
    sprite.trunkSprite = trunk;
  }
}

function spawnEnemy(x) {
  const enemy = makeSprite(x, GROUND_Y - 20, 38, 38, '#a66de1', 'dynamic');
  enemy.diameter = 38;
  enemy.rotationLock = true;
  enemy.friction = 0.05;
  enemy.bounciness = 0;
  enemy.gameRole = 'slime';
  enemy.healthPoints = 2;
  enemy.moveDirection = x < player.x ? 1 : -1;
  enemySprites.push(enemy);
}

function draw() {
  drawWorld();

  if (gameState === 'playing') {
    updatePlayer();
    updateEnemies();
    updateSurvivalClock();
  }

  drawHud();
  drawTargetHint();

  if (millis() < messageUntil) {
    drawMessage();
  }

  if (gameState !== 'playing') {
    drawEndScreen();
  }
}

function drawWorld() {
  const elapsed = gameState === 'playing'
    ? (millis() - gameStartedAt) / 1000
    : SURVIVE_SECONDS;
  const night = constrain(map(elapsed, 0, SURVIVE_SECONDS, 0.05, 0.48), 0.05, 0.48);
  const skyColor = lerpColor(color('#71c6d6'), color('#20294e'), night);
  background(skyColor);

  noStroke();
  fill(255, 231, 153, 220);
  circle(825, 135, 58);
  fill(71, 125, 111);
  triangle(0, GROUND_Y, 140, 300, 280, GROUND_Y);
  fill(59, 106, 101);
  triangle(170, GROUND_Y, 390, 330, 600, GROUND_Y);
  fill(49, 91, 88);
  triangle(520, GROUND_Y, 745, 305, 960, GROUND_Y);
  fill('#8b6842');
  rect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
  fill('#79a84f');
  rect(0, GROUND_Y, GAME_WIDTH, 10);
  fill('#6d5037');
  for (let x = 12; x < GAME_WIDTH; x += 38) {
    rect(x, GROUND_Y + 22, 18, 5, 3);
  }
  drawCloud(165, 150);
  drawCloud(500, 105);
}

function drawCloud(x, y) {
  noStroke();
  fill(242, 245, 220, 115);
  ellipse(x, y, 80, 24);
  ellipse(x - 18, y - 8, 34, 26);
  ellipse(x + 13, y - 11, 40, 30);
}

function updatePlayer() {
  let horizontal = 0;
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) horizontal -= 1;
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) horizontal += 1;
  player.vel.x = horizontal * 3.5;
  player.vel.x = constrain(player.vel.x, -3.5, 3.5);

  const invulnerable = millis() < nextPlayerHitAt;
  player.opacity = invulnerable && frameCount % 8 < 4 ? 0.35 : 1;
}

function updateEnemies() {
  const now = millis();

  for (const enemy of enemySprites) {
    const difference = player.x - enemy.x;
    enemy.moveDirection = difference < 0 ? -1 : 1;
    enemy.vel.x = enemy.moveDirection * 1.25;
    enemy.rotation = 0;

    if (rectanglesOverlap(player, enemy) && now >= nextPlayerHitAt) {
      player.healthPoints -= 1;
      nextPlayerHitAt = now + 1100;
      player.vel.x = enemy.x < player.x ? 5 : -5;
      player.vel.y = -4;
      showMessage('A shadow slime hit you!');
      if (player.healthPoints <= 0) finishGame('lost');
    }
  }
}

function updateSurvivalClock() {
  const now = millis();
  if (now >= nextEnemyAt && enemySprites.length < 5) {
    const spawnX = player.x < GAME_WIDTH / 2 ? GAME_WIDTH - 70 : 70;
    spawnEnemy(spawnX);
    nextEnemyAt = now + 12000;
  }

  if (now - gameStartedAt >= SURVIVE_SECONDS * 1000) {
    finishGame('won');
  }
}

function isPlayerGrounded() {
  if (player.vel.y < 0) return false;
  const playerBottom = player.y + player.h / 2;
  const platforms = [ground, ...placedBlocks];

  return platforms.some((platform) => {
    const platformTop = platform.y - platform.h / 2;
    const horizontalOverlap = Math.abs(player.x - platform.x) < (player.w + platform.w) / 2 - 2;
    return horizontalOverlap && Math.abs(playerBottom - platformTop) < 5;
  });
}

function keyPressed() {
  if (gameState !== 'playing') {
    if (key === 'r' || key === 'R' || key === ' ') startGame();
    return false;
  }

  if ((key === ' ' || keyCode === UP_ARROW) && isPlayerGrounded()) {
    player.vel.y = -7.5;
  }

  if (key === '1') selectedTool = 'axe';
  if (key === '2') selectedTool = 'pickaxe';
  if (key === '3') selectedTool = 'sword';
  if (key === 'q' || key === 'Q') {
    selectedBlock = selectedBlock === 'wood' ? 'stone' : 'wood';
  }
  return false;
}

function mousePressed() {
  if (mouseX < 0 || mouseX > GAME_WIDTH || mouseY < 0 || mouseY > GAME_HEIGHT) return;

  if (gameState !== 'playing') {
    const insideRestart = mouseX > GAME_WIDTH / 2 - 100
      && mouseX < GAME_WIDTH / 2 + 100
      && mouseY > GAME_HEIGHT / 2 + 70
      && mouseY < GAME_HEIGHT / 2 + 120;
    if (insideRestart) startGame();
    return false;
  }

  if (mouseButton === RIGHT) {
    placeBlock();
  } else {
    useTool();
  }
  return false;
}

function useTool() {
  const now = millis();
  if (now < nextActionAt) return;
  nextActionAt = now + 180;

  const enemy = enemySprites.find((candidate) => {
    return pointInsideSprite(mouseX, mouseY, candidate)
      && distance(player.x, player.y, candidate.x, candidate.y) < 125;
  });

  if (enemy) {
    if (selectedTool !== 'sword') {
      showMessage('Equip the sword with 3 to fight slimes.');
      return;
    }
    enemy.healthPoints -= 1;
    enemy.color = '#e2a9fa';
    if (enemy.healthPoints <= 0) {
      enemy.remove();
      enemySprites = enemySprites.filter((item) => item !== enemy);
      showMessage('Slime defeated!');
    } else {
      showMessage('Hit! One more sword strike.');
    }
    return;
  }

  const resource = resourceSprites.find((candidate) => {
    return pointInsideSprite(mouseX, mouseY, candidate)
      && distance(player.x, player.y, candidate.x, candidate.y) < 125;
  });

  if (!resource) {
    showMessage('Move closer and click a tree or stone.');
    return;
  }

  const rightTool = (resource.gatherType === 'tree' && selectedTool === 'axe')
    || (resource.gatherType === 'stone' && selectedTool === 'pickaxe');
  if (!rightTool) {
    showMessage(resource.gatherType === 'tree' ? 'Use the axe (1) on trees.' : 'Use the pickaxe (2) on stone.');
    return;
  }

  resource.gatherHits -= 1;
  resource.color = '#f6d87a';
  if (resource.gatherHits <= 0) {
    const gatheredType = resource.gatherType === 'tree' ? 'wood' : 'stone';
    inventory[gatheredType] += 3;
    resource.remove();
    if (resource.trunkSprite) resource.trunkSprite.remove();
    resourceSprites = resourceSprites.filter((item) => item !== resource);
    showMessage(`Gathered 3 ${gatheredType}.`);
  } else {
    showMessage(`Resource strength: ${resource.gatherHits} hits left.`);
  }
}

function placeBlock() {
  const blockType = selectedBlock;
  if (inventory[blockType] <= 0) {
    showMessage(`No ${blockType} blocks. Gather more first.`);
    return;
  }

  const blockX = Math.floor(mouseX / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
  const blockY = Math.floor(mouseY / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
  if (distance(player.x, player.y, blockX, blockY) > 155) {
    showMessage('That spot is too far away.');
    return;
  }

  const overlapsPlayer = Math.abs(blockX - player.x) < (TILE_SIZE + player.w) / 2
    && Math.abs(blockY - player.y) < (TILE_SIZE + player.h) / 2;
  const overlapsSolid = [...resourceSprites, ...enemySprites, ...placedBlocks].some((sprite) => {
    return Math.abs(blockX - sprite.x) < (TILE_SIZE + sprite.w) / 2 - 2
      && Math.abs(blockY - sprite.y) < (TILE_SIZE + sprite.h) / 2 - 2;
  });
  const intersectsGround = blockY + TILE_SIZE / 2 > GROUND_Y;
  if (overlapsPlayer || overlapsSolid || intersectsGround) {
    showMessage('That space is occupied.');
    return;
  }

  const color = blockType === 'wood' ? '#a9794b' : '#879397';
  const block = makeSprite(blockX, blockY, TILE_SIZE, TILE_SIZE, color, 'static');
  block.stroke = '#3e3933';
  block.blockKind = blockType;
  placedBlocks.push(block);
  inventory[blockType] -= 1;
  showMessage(`${blockType} block placed.`);
}

function pointInsideSprite(x, y, sprite) {
  return x >= sprite.x - sprite.w / 2
    && x <= sprite.x + sprite.w / 2
    && y >= sprite.y - sprite.h / 2
    && y <= sprite.y + sprite.h / 2;
}

function rectanglesOverlap(first, second) {
  return Math.abs(first.x - second.x) < (first.w + second.w) / 2
    && Math.abs(first.y - second.y) < (first.h + second.h) / 2;
}

function drawHud() {
  noStroke();
  fill(13, 24, 35, 220);
  rect(15, 14, GAME_WIDTH - 30, 76, 12);

  textAlign(LEFT, CENTER);
  fill('#ffe6a1');
  textSize(20);
  text('EMBERWILD', 32, 36);
  fill('#f5f0d8');
  textSize(15);
  text(`Health: ${'♥'.repeat(Math.max(0, player.healthPoints))}${'♡'.repeat(Math.max(0, 5 - player.healthPoints))}`, 32, 68);
  text(`Wood: ${inventory.wood}    Stone: ${inventory.stone}`, 225, 68);
  text(`Tool: ${selectedTool.toUpperCase()} [${selectedTool === 'axe' ? 1 : selectedTool === 'pickaxe' ? 2 : 3}]`, 455, 36);
  text(`Block: ${selectedBlock.toUpperCase()} [Q]`, 455, 68);

  const secondsSurvived = gameState === 'playing'
    ? Math.floor((millis() - gameStartedAt) / 1000)
    : Math.floor((gameEndedAt - gameStartedAt) / 1000);
  const timeLeft = Math.max(0, SURVIVE_SECONDS - secondsSurvived);
  textAlign(RIGHT, CENTER);
  fill('#ffe6a1');
  textSize(18);
  text(`Survive: ${timeLeft}s`, GAME_WIDTH - 32, 36);
  fill('#f5f0d8');
  textSize(13);
  text('Find resources · Build cover · Watch for slimes', GAME_WIDTH - 32, 68);
}

function drawTargetHint() {
  if (gameState !== 'playing') return;
  let hint = '';
  const target = resourceSprites.find((sprite) => pointInsideSprite(mouseX, mouseY, sprite));
  if (target) {
    hint = target.gatherType === 'tree' ? 'TREE · AXE' : 'STONE · PICKAXE';
  } else if (enemySprites.some((sprite) => pointInsideSprite(mouseX, mouseY, sprite))) {
    hint = 'SHADOW SLIME · SWORD';
  } else if (mouseX >= 0 && mouseX <= GAME_WIDTH && mouseY >= 90 && mouseY < GROUND_Y) {
    hint = 'RIGHT-CLICK TO PLACE';
  }

  if (!hint) return;
  noStroke();
  fill(17, 26, 34, 210);
  rect(mouseX + 14, mouseY - 18, 154, 28, 6);
  fill('#fff2c8');
  textAlign(LEFT, CENTER);
  textSize(12);
  text(hint, mouseX + 22, mouseY - 4);
}

function showMessage(message) {
  messageText = message;
  messageUntil = millis() + 1500;
}

function drawMessage() {
  noStroke();
  fill(13, 24, 35, 220);
  rect(GAME_WIDTH / 2 - 180, 104, 360, 34, 8);
  fill('#fff0c1');
  textAlign(CENTER, CENTER);
  textSize(14);
  text(messageText, GAME_WIDTH / 2, 121);
}

function finishGame(result) {
  if (gameState !== 'playing') return;
  gameState = result;
  gameEndedAt = millis();
  player.vel.x = 0;
  player.vel.y = 0;
  for (const sprite of gameSprites) sprite.visible = false;
}

function drawEndScreen() {
  noStroke();
  fill(10, 16, 29, 225);
  rect(GAME_WIDTH / 2 - 250, GAME_HEIGHT / 2 - 112, 500, 255, 18);
  fill(gameState === 'won' ? '#ffe38c' : '#ff9c8b');
  textAlign(CENTER, CENTER);
  textSize(36);
  text(gameState === 'won' ? 'You survived the night!' : 'The wilds claimed you', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 48);
  fill('#f5f0d8');
  textSize(17);
  text(gameState === 'won' ? 'The Emberwild is safe... for now.' : 'Gather, build, and try a new strategy.', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 4);
  fill('#a5d38a');
  rect(GAME_WIDTH / 2 - 100, GAME_HEIGHT / 2 + 70, 200, 50, 10);
  fill('#17251d');
  textSize(18);
  text('PLAY AGAIN  [R]', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 95);
}

function removeGameSprites() {
  for (const sprite of gameSprites) sprite.remove();
  gameSprites = [];
}
