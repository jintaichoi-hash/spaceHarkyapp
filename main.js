
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const playerScoreEl = document.getElementById('player-score');
const aiScoreEl = document.getElementById('ai-score');
const goalNotification = document.getElementById('goal-notification');
const timerDisplay = document.getElementById('timer-display');
const startOverlay = document.getElementById('start-overlay');
const startButton = document.getElementById('start-button');
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverMessage = document.getElementById('game-over-message');
const restartButton = document.getElementById('restart-button');
const themeToggle = document.getElementById('theme-toggle');

let rinkLineColor = 'rgba(255, 255, 255, 0.3)';

function updateThemeColors() {
    const isLight = document.body.classList.contains('light-mode');
    rinkLineColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.3)';
    themeToggle.textContent = isLight ? 'DARK MODE' : 'LIGHT MODE';
}

// Initial theme setup
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    updateThemeColors();
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeColors();
});

let playerScore = 0;
let aiScore = 0;
let isGameStarted = false;
let timeLeft = 180;
let timerInterval;

// High-DPI scaling
const dpr = window.devicePixelRatio || 1;
canvas.width = canvas.offsetWidth * dpr;
canvas.height = canvas.offsetHeight * dpr;
ctx.scale(dpr, dpr);

// --- ENTITIES ---
class Paddle {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.vx = 0;
    this.vy = 0;
    this.lastX = x;
    this.lastY = y;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0; // Reset shadow for other elements
  }

  update() {
    this.vx = this.x - this.lastX;
    this.vy = this.y - this.lastY;
    this.lastX = this.x;
    this.lastY = this.y;
  }
}

class Puck {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.vx = 0;
    this.vy = 0;
    this.friction = 0.985;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.friction;
    this.vy *= this.friction;

    // Minimum speed threshold
    if (Math.abs(this.vx) < 0.1) this.vx = 0;
    if (Math.abs(this.vy) < 0.1) this.vy = 0;
  }
}

// --- INITIALIZATION --
const rinkWidth = canvas.width / dpr;
const rinkHeight = canvas.height / dpr;

const player = new Paddle(rinkWidth / 4, rinkHeight / 2, 25, '#0ff');
const ai = new Paddle((rinkWidth * 3) / 4, rinkHeight / 2, 25, '#f0f');
const puck = new Puck(rinkWidth / 2, rinkHeight / 2, 15, '#f00');
const puck2 = new Puck(rinkWidth / 2, rinkHeight / 2, 15, '#f00');

const playerGoalWidth = 140;
const aiGoalWidth = 80;
const goalDepth = 15;

// --- PHYSICS & COLLISION ---
function handleCollisions() {
    handlePuckCollisions(puck);
    handlePuckCollisions(puck2);

    // Paddle and Puck
    handlePaddlePuckCollision(player, puck);
    handlePaddlePuckCollision(ai, puck);
    handlePaddlePuckCollision(player, puck2);
    handlePaddlePuckCollision(ai, puck2);
}

function handlePuckCollisions(puck) {
    // Puck and Walls
    if (puck.y - puck.radius < 0) {
        puck.y = puck.radius;
        puck.vy *= -0.95;
    } else if (puck.y + puck.radius > rinkHeight) {
        puck.y = rinkHeight - puck.radius;
        puck.vy *= -0.95;
    }

    if (puck.x - puck.radius < 0 || puck.x + puck.radius > rinkWidth) {
        // Goal detection
        if (puck.x < rinkWidth/2) {
            // Left side (Player\'s goal)
            if (puck.y > rinkHeight/2 - playerGoalWidth/2 && puck.y < rinkHeight/2 + playerGoalWidth/2) {
                aiScore++;
                aiScoreEl.textContent = aiScore;
                showGoalNotification();
                if (aiScore >= 5) {
                    endGame("AI Wins!");
                } else {
                    resetPucks();
                }
            } else {
                puck.x = puck.radius;
                puck.vx *= -0.95;
            }
        } else {
            // Right side (AI\'s goal)
            if (puck.y > rinkHeight/2 - aiGoalWidth/2 && puck.y < rinkHeight/2 + aiGoalWidth/2) {
                playerScore++;
                playerScoreEl.textContent = playerScore;
                showGoalNotification();
                if (playerScore >= 5) {
                    endGame("You Win!");
                } else {
                    resetPucks();
                }
            } else {
                puck.x = rinkWidth - puck.radius;
                puck.vx *= -0.95;
            }
        }
    }
}


function handlePaddlePuckCollision(paddle, puck) {
    const dx = puck.x - paddle.x;
    const dy = puck.y - paddle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < paddle.radius + puck.radius) {
        // Resolve overlap
        const angle = Math.atan2(dy, dx);
        const overlap = paddle.radius + puck.radius - distance;
        puck.x += Math.cos(angle) * overlap;
        puck.y += Math.sin(angle) * overlap;

        // Collision response
        const relativeVx = puck.vx - paddle.vx;
        const relativeVy = puck.vy - paddle.vy;
        
        // Add paddle velocity to puck
        puck.vx = (puck.vx + paddle.vx) * 0.9;
        puck.vy = (puck.vy + paddle.vy) * 0.9;

        // Ensure minimum impact speed
        const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
        if (speed < 6) {
            puck.vx = Math.cos(angle) * 8;
            puck.vy = Math.sin(angle) * 8;
        }
    }
}

// --- AI LOGIC ---
function updateAI() {
    const distToPuck1 = Math.sqrt(Math.pow(ai.x - puck.x, 2) + Math.pow(ai.y - puck.y, 2));
    const distToPuck2 = Math.sqrt(Math.pow(ai.x - puck2.x, 2) + Math.pow(ai.y - puck2.y, 2));

    const targetPuck = distToPuck1 < distToPuck2 ? puck : puck2;

    const targetY = targetPuck.y;
    // Let the AI patrol its area, moving towards the puck\'s x projection
    let targetX = (rinkWidth * 3 / 4) + (targetPuck.x - rinkWidth / 2) * 0.3;

    const dx = targetX - ai.x;
    const dy = targetY - ai.y;

    // Smoothing factor
    ai.x += dx * 0.12;
    ai.y += dy * 0.12;


    // Keep AI on its side
    if (ai.x < rinkWidth / 2 + ai.radius) {
        ai.x = rinkWidth / 2 + ai.radius;
    }
    if (ai.x > rinkWidth - ai.radius) {
        ai.x = rinkWidth - ai.radius;
    }
    if (ai.y - ai.radius < 0) {
        ai.y = ai.radius;
    }
    if (ai.y + ai.radius > rinkHeight) {
        ai.y = rinkHeight - ai.radius;
    }

    ai.update();
}


// --- GAME LOOP ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawRink();
  
  if (isGameStarted) {
      player.update();
      puck.update();
      puck2.update();
      updateAI();
      handleCollisions();
  }

  player.draw();
  ai.draw();
  puck.draw();
  puck2.draw();

  requestAnimationFrame(gameLoop);
}

// --- DRAWING ---
function drawRink() {
    ctx.strokeStyle = rinkLineColor;
    ctx.lineWidth = 2;

    // Center line
    ctx.beginPath();
    ctx.moveTo(rinkWidth / 2, 0);
    ctx.lineTo(rinkWidth / 2, rinkHeight);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(rinkWidth / 2, rinkHeight / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
    
    // Crease circles
    ctx.beginPath();
    ctx.arc(0, rinkHeight / 2, 100, -Math.PI/2, Math.PI/2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rinkWidth, rinkHeight / 2, 100, Math.PI/2, -Math.PI/2);
    ctx.stroke();

    // Goals
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#0ff';
    ctx.strokeRect(0, rinkHeight/2 - playerGoalWidth/2, goalDepth, playerGoalWidth);
    ctx.strokeStyle = '#f0f';
    ctx.strokeRect(rinkWidth - goalDepth, rinkHeight/2 - aiGoalWidth/2, goalDepth, aiGoalWidth);
}

// --- HELPERS ---
function resetPucks() {
    puck.x = rinkWidth / 2;
    puck.y = rinkHeight / 2;
    puck.vx = 0;
    puck.vy = 0;

    puck2.x = rinkWidth / 2;
    puck2.y = rinkHeight / 2;
    puck2.vx = 0;
    puck2.vy = 0;
    
    // Delay start of puck after goal
    setTimeout(() => {
        if (isGameStarted) {
            puck.vx = (Math.random() > 0.5 ? 1 : -1) * 5;
            puck.vy = (Math.random() * 2 - 1) * 3;
            puck2.vx = (Math.random() > 0.5 ? 1 : -1) * 5;
            puck2.vy = (Math.random() * 2 - 1) * 3;
        }
    }, 1000);
}

function showGoalNotification() {
    goalNotification.classList.remove('hidden');
    setTimeout(() => {
        goalNotification.classList.add('hidden');
    }, 1500);
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 180;
    timerDisplay.classList.remove('low-time');
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        if (isGameStarted) {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 10) {
                timerDisplay.classList.add('low-time');
            }
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if (playerScore < 5) {
                    endGame("GAME OVER! Time Out - AI Wins!");
                }
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function endGame(message) {
    isGameStarted = false;
    clearInterval(timerInterval);
    gameOverMessage.textContent = message;
    gameOverOverlay.classList.remove('hidden');
}

function restartGame() {
    playerScore = 0;
    aiScore = 0;
    playerScoreEl.textContent = playerScore;
    aiScoreEl.textContent = aiScore;
    gameOverOverlay.classList.add('hidden');
    isGameStarted = true;
    startTimer();
    resetPucks();
}

// --- CONTROL ---
function handleInput(x, y) {
    if (!isGameStarted) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / dpr / rect.width;
    const scaleY = canvas.height / dpr / rect.height;

    let mouseX = (x - rect.left) * scaleX;
    let mouseY = (y - rect.top) * scaleY;
    
    // Keep player on their side
    if (mouseX < player.radius) {
        mouseX = player.radius;
    }
    if (mouseY < player.radius) {
        mouseY = player.radius;
    }
    if (mouseY > rinkHeight - player.radius) {
        mouseY = rinkHeight - player.radius;
    }

    player.x = mouseX;
    player.y = mouseY;
}

canvas.addEventListener('mousemove', (e) => handleInput(e.clientX, e.clientY));
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleInput(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

startButton.addEventListener('click', () => {
    isGameStarted = true;
    startOverlay.classList.add('hidden');
    startTimer();
    resetPucks();
});

restartButton.addEventListener('click', restartGame);

// --- START GAME LOOP ---
gameLoop();
