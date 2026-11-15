// A small cottagecore farming game built with p5play.

const GAME_WIDTH = 960;
const GAME_HEIGHT = 620;
const DAYS_TO_PLAY = 5;
const MONEY_GOAL = 60;
const SEED_PRICE = 15;
const MAX_CROP_GROWTH = 3;

let player;
let gardenPlots = [];
let seeds;
let harvestedCrops;
let money;
let currentDay;
let selectedTool;
let gameState;
let messageText = '';
let messageUntil = 0;

function setup() {
  new Canvas(GAME_WIDTH, GAME_HEIGHT);
  world.gravity.x = 0;
  world.gravity.y = 0;

  const gameCanvas = document.querySelector('canvas');
  gameCanvas.addEventListener('contextmenu', (event) => event.preventDefault());

  player = new Sprite(205, 345, 28, 36);
  player.collider = 'none';
  player.color = '#d98567';
  player.stroke = '#684b3e';

  startGame();
}

function startGame() {
  gardenPlots = [];
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      gardenPlots.push({
        x: 275 + column * 66,
        y: 242 + row * 62,
        state: 'empty',
        growth: 0,
        wateredToday: false
      });
    }
  }

  seeds = 12;
  harvestedCrops = 0;
  money = 0;
  currentDay = 1;
  selectedTool = 'hoe';
  gameState = 'playing';
  messageText = 'Welcome! Prepare a plot, plant a seed, and water it each day.';
  messageUntil = millis() + 3500;
  player.x = 205;
  player.y = 345;
}

function draw() {
  drawGarden();

  if (gameState === 'playing') {
    updatePlayer();
  }

  drawPlots();
  drawPlaces();
  drawHud();

  if (millis() < messageUntil) drawMessage();
  if (gameState !== 'playing') drawEndScreen();
}

function drawGarden() {
  background('#d9e8ba');

  noStroke();
  fill('#c9dda4');
  ellipse(115, 115, 260, 145);
  ellipse(850, 520, 300, 180);
  fill('#b4ce8d');
  ellipse(490, 570, 780, 130);

  fill('#e7d8ac');
  rect(0, 488, GAME_WIDTH, 62);
  fill('#d1bd8e');
  for (let x = 20; x < GAME_WIDTH; x += 58) {
    ellipse(x, 517 + (x % 3) * 4, 5, 3);
    ellipse(x + 24, 536 - (x % 2) * 5, 4, 3);
  }

  noStroke();
  fill('#829b61');
  for (let x = 35; x < GAME_WIDTH; x += 92) {
    flower(x, 150 + (x % 5) * 13);
    flower(x + 38, 548 - (x % 4) * 9);
  }
}

function flower(x, y) {
  noStroke();
  fill('#fff6de');
  circle(x - 4, y, 7);
  circle(x + 4, y, 7);
  circle(x, y - 4, 7);
  circle(x, y + 4, 7);
  fill('#e5b95f');
  circle(x, y, 4);
}

function updatePlayer() {
  let horizontal = 0;
  let vertical = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) horizontal -= 1;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) horizontal += 1;
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) vertical -= 1;
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) vertical += 1;

  const speed = horizontal !== 0 && vertical !== 0 ? 2.4 : 3.4;
  player.x = constrain(player.x + horizontal * speed, 28, GAME_WIDTH - 28);
  player.y = constrain(player.y + vertical * speed, 150, GAME_HEIGHT - 50);
}

function drawPlots() {
  for (const plot of gardenPlots) {
    noStroke();
    fill(plot.state === 'empty' ? '#9aaf73' : '#806348');
    rect(plot.x - 28, plot.y - 22, 56, 44, 9);

    if (plot.state !== 'empty') {
      fill(plot.wateredToday ? '#66513e' : '#76583f');
      rect(plot.x - 23, plot.y - 17, 46, 34, 7);
      stroke('#a5825d');
      strokeWeight(2);
      for (let lineX = plot.x - 15; lineX <= plot.x + 15; lineX += 15) {
        line(lineX, plot.y - 12, lineX, plot.y + 12);
      }
      noStroke();
    }

    if (plot.state === 'planted') drawCrop(plot);
    if (plot.wateredToday && plot.state === 'planted') {
      fill('#b7e5df');
      noStroke();
      circle(plot.x + 19, plot.y - 15, 7);
    }
  }
}

function drawCrop(plot) {
  const cropHeight = 8 + plot.growth * 5;
  const cropColor = plot.growth >= MAX_CROP_GROWTH ? '#d88d54' : '#638c4e';

  stroke('#496d3d');
  strokeWeight(3);
  line(plot.x, plot.y + 7, plot.x, plot.y + 7 - cropHeight);
  noStroke();
  fill(cropColor);
  ellipse(plot.x - 5, plot.y + 3 - cropHeight / 2, 11, 6);
  ellipse(plot.x + 5, plot.y + 1 - cropHeight / 2, 11, 6);

  if (plot.growth >= MAX_CROP_GROWTH) {
    fill('#e8b26a');
    circle(plot.x, plot.y - cropHeight - 1, 11);
    fill('#6d9148');
    ellipse(plot.x, plot.y - cropHeight - 8, 8, 4);
  }
}

function drawPlaces() {
  noStroke();
  fill('#c98762');
  rect(58, 255, 142, 106, 10);
  fill('#f0d7a2');
  triangle(45, 267, 129, 203, 213, 267);
  fill('#73523c');
  rect(111, 302, 34, 59, 5);
  fill('#f6eac9');
  textAlign(CENTER, CENTER);
  textSize(13);
  text('COTTAGE', 129, 282);

  fill('#d39a61');
  rect(772, 250, 130, 88, 10);
  fill('#a76d4b');
  triangle(758, 257, 837, 205, 916, 257);
  fill('#f7edce');
  textSize(13);
  text('MARKET', 837, 277);
  fill('#6f8d52');
  textSize(12);
  text('SELL HERE', 837, 300);
  fill('#e8c67e');
  rect(788, 318, 98, 13, 4);

  fill('#526c43');
  textSize(12);
  text('Press E to sleep', 129, 380);
}

function drawHud() {
  noStroke();
  fill(250, 246, 224, 238);
  rect(14, 12, GAME_WIDTH - 28, 94, 14);

  textAlign(LEFT, CENTER);
  fill('#4b6240');
  textSize(20);
  text('MEADOWLARK COTTAGE GARDEN', 30, 37);
  textSize(15);
  fill('#394a35');
  text(`Day ${currentDay} / ${DAYS_TO_PLAY}`, 30, 77);
  text(`Money: $${money} / $${MONEY_GOAL}`, 175, 77);
  text(`Seeds: ${seeds}`, 355, 77);
  text(`Harvest: ${harvestedCrops}`, 470, 77);
  text(`Tool: ${selectedTool.toUpperCase()} [${toolNumber()}]`, 610, 77);

  textAlign(RIGHT, CENTER);
  fill('#596c42');
  textSize(13);
  text('Water crops before sleeping to help them grow', GAME_WIDTH - 30, 37);
}

function toolNumber() {
  if (selectedTool === 'hoe') return 1;
  if (selectedTool === 'water') return 2;
  return 3;
}

function drawMessage() {
  noStroke();
  fill(71, 83, 54, 225);
  rect(GAME_WIDTH / 2 - 260, 116, 520, 34, 9);
  fill('#fff8dc');
  textAlign(CENTER, CENTER);
  textSize(14);
  text(messageText, GAME_WIDTH / 2, 133);
}

function keyPressed() {
  if (gameState !== 'playing') {
    if (key === 'r' || key === 'R' || key === ' ') startGame();
    return false;
  }

  if (key === '1') selectedTool = 'hoe';
  if (key === '2') selectedTool = 'water';
  if (key === '3') selectedTool = 'scythe';
  if (key === 'e' || key === 'E') useNearbyPlace();
  return false;
}

function mousePressed() {
  if (gameState !== 'playing') return false;

  const plot = gardenPlots.find((candidate) => {
    return Math.abs(mouseX - candidate.x) <= 28
      && Math.abs(mouseY - candidate.y) <= 22;
  });

  if (!plot) {
    showMessage('Choose one of the garden plots.');
    return false;
  }

  if (distance(player.x, player.y, plot.x, plot.y) > 92) {
    showMessage('Walk closer to that plot first.');
    return false;
  }

  if (mouseButton === RIGHT) {
    plantSeed(plot);
  } else {
    useSelectedTool(plot);
  }
  return false;
}

function plantSeed(plot) {
  if (plot.state !== 'tilled') {
    showMessage('Use the hoe on an empty plot before planting.');
    return;
  }
  if (seeds <= 0) {
    showMessage('You are out of seeds.');
    return;
  }

  seeds -= 1;
  plot.state = 'planted';
  plot.growth = 0;
  plot.wateredToday = false;
  showMessage('Seed planted. Water it each day to help it grow.');
}

function useSelectedTool(plot) {
  if (selectedTool === 'hoe') {
    if (plot.state !== 'empty') {
      showMessage('That plot is already prepared or growing a crop.');
      return;
    }
    plot.state = 'tilled';
    showMessage('Soil prepared. Right-click this plot to plant a seed.');
    return;
  }

  if (selectedTool === 'water') {
    if (plot.state !== 'planted') {
      showMessage('Plant a seed here before watering.');
      return;
    }
    if (plot.wateredToday) {
      showMessage('This crop has already been watered today.');
      return;
    }
    plot.wateredToday = true;
    showMessage('Watered! The crop can grow when you sleep.');
    return;
  }

  if (plot.state !== 'planted') {
    showMessage('There is no crop here to harvest or clear.');
    return;
  }

  if (plot.growth < MAX_CROP_GROWTH) {
    plot.state = 'tilled';
    plot.growth = 0;
    plot.wateredToday = false;
    showMessage('Young crop cleared. Use the scythe carefully.');
    return;
  }

  plot.state = 'tilled';
  plot.growth = 0;
  plot.wateredToday = false;
  harvestedCrops += 1;
  showMessage('Harvest gathered! Visit the market and press E to sell.');
}

function useNearbyPlace() {
  if (distance(player.x, player.y, 837, 305) <= 100) {
    sellHarvest();
    return;
  }

  if (distance(player.x, player.y, 129, 337) <= 100) {
    sleepUntilTomorrow();
    return;
  }

  showMessage('Stand by the market to sell or the cottage to sleep.');
}

function sellHarvest() {
  if (harvestedCrops === 0) {
    showMessage('You have no crops to sell yet.');
    return;
  }

  const earnings = harvestedCrops * SEED_PRICE;
  money += earnings;
  harvestedCrops = 0;
  showMessage(`Sold your harvest for $${earnings}.`);

  if (money >= MONEY_GOAL) {
    gameState = 'won';
  }
}

function sleepUntilTomorrow() {
  if (currentDay >= DAYS_TO_PLAY) {
    gameState = money >= MONEY_GOAL ? 'won' : 'lost';
    return;
  }

  for (const plot of gardenPlots) {
    if (plot.state === 'planted' && plot.wateredToday) {
      plot.growth = Math.min(plot.growth + 1, MAX_CROP_GROWTH);
    }
    plot.wateredToday = false;
  }

  currentDay += 1;
  showMessage(`Good morning! It is day ${currentDay}. Check and water your crops.`);
}

function drawEndScreen() {
  noStroke();
  fill(45, 54, 39, 220);
  rect(GAME_WIDTH / 2 - 250, GAME_HEIGHT / 2 - 105, 500, 210, 18);
  fill(gameState === 'won' ? '#f5d98e' : '#f2b29a');
  textAlign(CENTER, CENTER);
  textSize(34);
  text(gameState === 'won' ? 'A thriving little garden!' : 'The season is over', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 42);
  fill('#fff8dc');
  textSize(17);
  text(
    gameState === 'won'
      ? `You earned $${money} and reached your $${MONEY_GOAL} goal.`
      : `You earned $${money}. The goal was $${MONEY_GOAL}.`,
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2 + 5
  );
  fill('#d9e8ba');
  rect(GAME_WIDTH / 2 - 92, GAME_HEIGHT / 2 + 42, 184, 42, 9);
  fill('#394a35');
  textSize(16);
  text('PLAY AGAIN  [R]', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 63);
}

function showMessage(message) {
  messageText = message;
  messageUntil = millis() + 2100;
}
