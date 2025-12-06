const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let lastTime = 0;
let player;
let hazards = [];
let walls = [];
let keys = {};
let lives = 3;
let score = 0;
let level = 1;
let spawnTimer = 0;
let spawnInterval = 1000; 
let gameOver = false;
let paused = false;

const LEVEL_2_SCORE = 25;

function createPlayer() {
  return {
    x: canvas.width / 2 - 15,
    y: canvas.height - 70,
    width: 30,
    height: 30,
    speed: 260, 
    color: "#22c55e",
    invincible: false,
    invincibleTime: 0,
  };
}

function createHazard() {
  const type = Math.random() < 0.5 ? "small-fast" : "big-slow";

  let width, height, speed;
  if (type === "small-fast") {
    width = 18;
    height = 18;
    speed = 260 + Math.random() * 120;
  } else {
    width = 40;
    height = 40;
    speed = 160 + Math.random() * 80;
  }

  const x = Math.random() * (canvas.width - width);
  const y = -height;

  return {
    x,
    y,
    width,
    height,
    speed,
    type,
  };
}

function createWalls() {
  const thickness = 20;
  return [
    { x: 0, y: 0, width: thickness, height: canvas.height },
    {
      x: canvas.width - thickness,
      y: 0,
      width: thickness,
      height: canvas.height,
    },
  ];
}

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === "p" || e.key === "P") {
    if (!gameOver) paused = !paused;
  }

  if (e.key === "r" || e.key === "R") {
    restartGame();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

document.getElementById("restartButton").addEventListener("click", () => {
  restartGame();
});

function isColliding(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

function initGame() {
  player = createPlayer();
  hazards = [];
  walls = createWalls();
  lives = 3;
  score = 0;
  level = 1;
  spawnTimer = 0;
  spawnInterval = 1000;
  gameOver = false;
  paused = false;
}

function restartGame() {
  initGame();
}

function update(deltaTime) {
  if (gameOver || paused) return;

  const dt = deltaTime / 1000;

  let moveX = 0;
  let moveY = 0;

  if (keys["a"] || keys["arrowleft"]) moveX -= 1;
  if (keys["d"] || keys["arrowright"]) moveX += 1;
  if (keys["w"] || keys["arrowup"]) moveY -= 1;
  if (keys["s"] || keys["arrowdown"]) moveY += 1;

  if (moveX !== 0 && moveY !== 0) {
    moveX *= Math.SQRT1_2;
    moveY *= Math.SQRT1_2;
  }

  player.x += moveX * player.speed * dt;
  player.y += moveY * player.speed * dt;

  const wallThickness = walls[0].width;
  if (player.x < wallThickness) player.x = wallThickness;
  if (player.x + player.width > canvas.width - wallThickness) {
    player.x = canvas.width - wallThickness - player.width;
  }
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height) {
    player.y = canvas.height - player.height;
  }

  if (player.invincible) {
    player.invincibleTime -= deltaTime;
    if (player.invincibleTime <= 0) {
      player.invincible = false;
    }
  }

  spawnTimer += deltaTime;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    hazards.push(createHazard());
  }

  for (let h of hazards) {
    h.y += h.speed * dt;
  }

  hazards = hazards.filter((h) => {
    if (h.y > canvas.height) {
      score += 1;
      return false;
    }
    return true;
  });

  if (level === 1 && score >= LEVEL_2_SCORE) {
    level = 2;
    spawnInterval = 700; 
  }

  if (!player.invincible) {
    for (let h of hazards) {
      if (isColliding(player, h)) {
        lives -= 1;
        player.invincible = true;
        player.invincibleTime = 1200;
        if (lives <= 0) {
          gameOver = true;
        }
        break;
      }
    }
  }
}

function draw() {
  if (level === 1) {
    ctx.fillStyle = "#020617";
  } else {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#1d293a");
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1f2937";
  walls.forEach((w) => {
    ctx.fillRect(w.x, w.y, w.width, w.height);
  });

  if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
    ctx.fillStyle = "#bbf7d0"; 
  } else {
    ctx.fillStyle = player.color;
  }
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Hazards
  hazards.forEach((h) => {
    if (h.type === "small-fast") {
      ctx.fillStyle = level === 1 ? "#f97316" : "#fb923c";
    } else {
      ctx.fillStyle = level === 1 ? "#ef4444" : "#fca5a5";
    }
    ctx.fillRect(h.x, h.y, h.width, h.height);
  });

  // UI: Score, Lives, Level
  ctx.fillStyle = "#e5e7eb";
  ctx.font = "16px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 16, 24);
  ctx.fillText(`Lives: ${lives}`, 16, 44);
  ctx.fillText(`Level: ${level}`, 16, 64);

  if (paused && !gameOver) {
    ctx.fillStyle = "rgba(15,23,42,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(
      "Press P to resume",
      canvas.width / 2,
      canvas.height / 2 + 30
    );
  }

  if (gameOver) {
    ctx.fillStyle = "rgba(15,23,42,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f97316";
    ctx.font = "40px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "18px system-ui, sans-serif";
    ctx.fillText(
      `Final Score: ${score}`,
      canvas.width / 2,
      canvas.height / 2 + 22
    );
    ctx.fillText(
      "Press R or click Restart to play again",
      canvas.width / 2,
      canvas.height / 2 + 50
    );
  }
}

function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

initGame();
requestAnimationFrame(gameLoop);
