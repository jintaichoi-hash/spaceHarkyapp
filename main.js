
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
let trailColor = 'rgba(0, 255, 255, 0.2)';

// Space theme stars
const stars = [];
for (let i = 0; i < 150; i++) {
    stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2,
        opacity: Math.random(),
        twinkle: Math.random() * 0.02
    });
}

function updateThemeColors() {
    const isLight = document.body.classList.contains('light-mode');
    rinkLineColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 242, 255, 0.5)';
    trailColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 255, 255, 0.1)';
    themeToggle.textContent = isLight ? 'DARK MODE' : 'LIGHT MODE';
}

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    updateThemeColors();
} else {
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
const WINNING_SCORE = 5;

const dpr = window.devicePixelRatio || 1;
function resizeCanvas() {
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Paddle {
  constructor(x, y, radius, color) {
    this.initialX = x;
    this.initialY = y;
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
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.fill();
    
    // Core glow
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.4, this.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  update() {
    this.vx = this.x - this.lastX;
    this.vy = this.y - this.lastY;
    this.lastX = this.x;
    this.lastY = this.y;
  }

  reset() {
    this.x = this.initialX;
    this.y = this.initialY;
    this.lastX = this.initialX;
    this.lastY = this.initialY;
    this.vx = 0;
    this.vy = 0;
  }
}

class Puck {
  constructor(x, y, radius, color) {
    this.initialX = x;
    this.initialY = y;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.vx = 0;
    this.vy = 0;
    this.friction = 0.99;
    this.trail = [];
    this.maxTrail = 12;
  }

  draw() {
    if (this.trail.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.radius;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    ctx.fill();
    
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.5, this.color);
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.friction;
    this.vy *= this.friction;

    if (Math.abs(this.vx) < 0.05) this.vx = 0;
    if (Math.abs(this.vy) < 0.05) this.vy = 0;
  }

  reset() {
    this.x = this.initialX;
    this.y = this.initialY;
    this.vx = 0;
    this.vy = 0;
    this.trail = [];
  }
}

const rinkWidth = canvas.width / dpr;
const rinkHeight = canvas.height / dpr;

// REVERSED SIDES: Player is Right (Pink), AI is Left (Cyan)
const player = new Paddle(rinkWidth - 60, rinkHeight / 2, 25, '#ff00ff');
const ai = new Paddle(60, rinkHeight / 2, 25, '#00f2ff');
const puck1 = new Puck(rinkWidth / 2, rinkHeight / 2 - 30, 15, '#ff3333');
const puck2 = new Puck(rinkWidth / 2, rinkHeight / 2 + 30, 15, '#ff3333');
const pucks = [puck1, puck2];

const goalWidth = 60;
const goalDepth = 20;
const cornerRadius = 50; 
const cornerRepulsion = 6.0; 

function handleCollisions() {
    pucks.forEach(puck => {
        const corners = [
            { x: 0, y: 0 },
            { x: rinkWidth, y: 0 },
            { x: 0, y: rinkHeight },
            { x: rinkWidth, y: rinkHeight }
        ];

        corners.forEach(corner => {
            const dx = puck.x - corner.x;
            const dy = puck.y - corner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = cornerRadius + puck.radius;

            if (dist < minDist) {
                const angle = Math.atan2(dy, dx);
                const overlap = minDist - dist;
                puck.x += Math.cos(angle) * overlap;
                puck.y += Math.sin(angle) * overlap;
                const nx = dx / dist;
                const ny = dy / dist;
                const dot = puck.vx * nx + puck.vy * ny;
                puck.vx = (puck.vx - 2 * dot * nx) * cornerRepulsion;
                puck.vy = (puck.vy - 2 * dot * ny) * cornerRepulsion;
                const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
                const maxSpeed = 35;
                if (speed > maxSpeed) {
                    puck.vx = (puck.vx / speed) * maxSpeed;
                    puck.vy = (puck.vy / speed) * maxSpeed;
                }
            }
        });

        if (puck.y - puck.radius < 0) {
            puck.y = puck.radius;
            puck.vy *= -1.5;
        } else if (puck.y + puck.radius > rinkHeight) {
            puck.y = rinkHeight - puck.radius;
            puck.vy *= -1.5;
        }

        if (puck.x - puck.radius < 0) {
            if (puck.y > rinkHeight / 2 - goalWidth / 2 && puck.y < rinkHeight / 2 + goalWidth / 2) {
                scoreGoal('player');
            } else {
                puck.x = puck.radius;
                puck.vx *= -1.5;
            }
        } else if (puck.x + puck.radius > rinkWidth) {
            if (puck.y > rinkHeight / 2 - goalWidth / 2 && puck.y < rinkHeight / 2 + goalWidth / 2) {
                scoreGoal('ai');
            } else {
                puck.x = rinkWidth - puck.radius;
                puck.vx *= -1.5;
            }
        }

        handlePaddlePuckCollision(player, puck);
        handlePaddlePuckCollision(ai, puck);
    });

    // Handle collision between player and AI
    handlePaddlePaddleCollision(player, ai);

    const dx = puck2.x - puck1.x;
    const dy = puck2.y - puck1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < puck1.radius + puck2.radius) {
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const tempVx = puck1.vx;
        const tempVy = puck1.vy;
        puck1.vx = puck2.vx * 0.8;
        puck1.vy = puck2.vy * 0.8;
        puck2.vx = tempVx * 0.8;
        puck2.vy = tempVy * 0.8;
        const overlap = (puck1.radius + puck2.radius - distance) / 2;
        puck1.x -= cos * overlap;
        puck1.y -= sin * overlap;
        puck2.x += cos * overlap;
        puck2.y += sin * overlap;
    }
}

function handlePaddlePaddleCollision(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = p1.radius + p2.radius;

    if (distance < minDist) {
        const angle = Math.atan2(dy, dx);
        const overlap = minDist - distance;
        
        const pushFactor = 0.5;
        p1.x -= Math.cos(angle) * (overlap * pushFactor);
        p1.y -= Math.sin(angle) * (overlap * pushFactor);
        p2.x += Math.cos(angle) * (overlap * pushFactor);
        p2.y += Math.sin(angle) * (overlap * pushFactor);

        const relVx = p2.vx - p1.vx;
        const relVy = p2.vy - p1.vy;
        const normalX = dx / distance;
        const normalY = dy / distance;
        const dot = relVx * normalX + relVy * normalY;

        if (dot < 0) {
            const restitution = 1.2;
            const impulse = -(1 + restitution) * dot;
            p1.x -= normalX * impulse * 2;
            p1.y -= normalY * impulse * 2;
            p2.x += normalX * impulse * 2;
            p2.y += normalY * impulse * 2;
        }
    }
}

function handlePaddlePuckCollision(paddle, puck) {
    const dx = puck.x - paddle.x;
    const dy = puck.y - paddle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = paddle.radius + puck.radius;

    if (distance < minDist) {
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const overlap = minDist - distance;
        puck.x += cos * overlap;
        puck.y += sin * overlap;
        const normalX = cos;
        const normalY = sin;
        const relVx = puck.vx - paddle.vx;
        const relVy = puck.vy - paddle.vy;
        const dot = relVx * normalX + relVy * normalY;

        if (dot < 0) {
            const restitution = 0.8;
            puck.vx -= (1 + restitution) * dot * normalX;
            puck.vy -= (1 + restitution) * dot * normalY;
            puck.vx += paddle.vx * 0.5;
            puck.vy += paddle.vy * 0.5;
            
            // Haptic on collision
            if (paddle === player && navigator.vibrate) {
                const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
                if (speed > 5) navigator.vibrate(20);
            }
        }

        const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
        const maxSpeed = 15;
        if (speed > maxSpeed) {
            puck.vx = (puck.vx / speed) * maxSpeed;
            puck.vy = (puck.vy / speed) * maxSpeed;
        }
    }
}

// --- GOD-LEVEL AI LOGIC ---
function updateAI() {
    let targetPuck = pucks[0];
    const getThreatLevel = (p) => {
        const distToAIGoal = Math.abs(p.x);
        const speedFactor = p.vx < 0 ? 2.0 : 0.5;
        return (10000 / (distToAIGoal + 1)) * speedFactor;
    };
    targetPuck = getThreatLevel(puck1) > getThreatLevel(puck2) ? puck1 : puck2;

    const predictionFrames = 8;
    let predictedX = targetPuck.x + targetPuck.vx * predictionFrames;
    let predictedY = targetPuck.y + targetPuck.vy * predictionFrames;

    if (predictedY < targetPuck.radius) predictedY = targetPuck.radius + Math.abs(predictedY - targetPuck.radius);
    if (predictedY > rinkHeight - targetPuck.radius) predictedY = (rinkHeight - targetPuck.radius) - Math.abs(predictedY - (rinkHeight - targetPuck.radius));

    let targetX, targetY;
    const distToPuck = Math.sqrt(Math.pow(ai.x - targetPuck.x, 2) + Math.pow(ai.y - targetPuck.y, 2));

    if (ai.x > targetPuck.x + 40 && targetPuck.vx > 0) {
        // AI is behind the puck, try to get back
        targetX = Math.max(ai.radius, targetPuck.x - 100);
        targetY = targetPuck.y;
        ai.x += (targetX - ai.x) * 0.1;
        ai.y += (targetY - ai.y) * 0.1;
    } else {
        // Normal puck chasing/prediction
        targetX = predictedX - 40;
        targetY = predictedY;

        if (distToPuck < 150) {
            targetX = targetPuck.x;
            targetY = targetPuck.y;
            ai.x += (targetX - ai.x) * 0.15;
            ai.y += (targetY - ai.y) * 0.15;
        } else {
            ai.x += (targetX - ai.x) * 0.08;
            ai.y += (targetY - ai.y) * 0.08;
        }
    }

    if (ai.x < ai.radius) ai.x = ai.radius;
    if (ai.x > rinkWidth - ai.radius) ai.x = rinkWidth - ai.radius;
    if (ai.y < ai.radius) ai.y = ai.radius;
    if (ai.y > rinkHeight - ai.radius) ai.y = rinkHeight - ai.radius;

    ai.update();
}

function gameLoop() {
    ctx.clearRect(0, 0, rinkWidth, rinkHeight);
    drawRink();
    if (isGameStarted) {
        player.update();
        pucks.forEach(p => p.update());
        updateAI();
        handleCollisions();
    }
    pucks.forEach(p => p.draw());
    player.draw();
    ai.draw();
    requestAnimationFrame(gameLoop);
}

function drawRink() {
    // 1. Draw Cosmic Background
    const isLight = document.body.classList.contains('light-mode');
    if (!isLight) {
        const bgGrad = ctx.createRadialGradient(rinkWidth/2, rinkHeight/2, 0, rinkWidth/2, rinkHeight/2, rinkWidth);
        bgGrad.addColorStop(0, '#0a0b1e');
        bgGrad.addColorStop(0.5, '#050508');
        bgGrad.addColorStop(1, '#000000');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, rinkWidth, rinkHeight);

        // Draw Stars
        stars.forEach(star => {
            star.opacity += star.twinkle;
            if (star.opacity > 1 || star.opacity < 0.2) star.twinkle *= -1;
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.beginPath();
            ctx.arc(star.x * rinkWidth, star.y * rinkHeight, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // 2. Draw Glowing Lines
    ctx.save();
    if (!isLight) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f2ff';
    }
    ctx.strokeStyle = rinkLineColor;
    ctx.lineWidth = 2;
    
    // Half line
    ctx.beginPath();
    ctx.moveTo(rinkWidth / 2, 0);
    ctx.lineTo(rinkWidth / 2, rinkHeight);
    ctx.stroke();

    // Center Galaxy (Circle)
    ctx.beginPath();
    ctx.arc(rinkWidth / 2, rinkHeight / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
    
    if (!isLight) {
        const centerGrad = ctx.createRadialGradient(rinkWidth/2, rinkHeight/2, 0, rinkWidth/2, rinkHeight/2, 60);
        centerGrad.addColorStop(0, 'rgba(0, 242, 255, 0.2)');
        centerGrad.addColorStop(1, 'rgba(255, 0, 255, 0.1)');
        ctx.fillStyle = centerGrad;
        ctx.fill();
    }

    // Circles
    [
        [rinkWidth * 0.2, rinkHeight * 0.2],
        [rinkWidth * 0.2, rinkHeight * 0.8],
        [rinkWidth * 0.8, rinkHeight * 0.2],
        [rinkWidth * 0.8, rinkHeight * 0.8]
    ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.stroke();
    });

    // 3. Glowing Corner Bumpers (Solar Flares)
    [
        [0, 0],
        [rinkWidth, 0],
        [0, rinkHeight],
        [rinkWidth, rinkHeight]
    ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, cornerRadius, 0, Math.PI * 2);
        ctx.save();
        if (!isLight) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00f2ff';
            ctx.strokeStyle = '#00f2ff';
        } else {
            ctx.strokeStyle = '#000';
        }
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    });

    // 4. Glowing Goals (Portals)
    ctx.lineWidth = 4;
    // Player Goal Portal
    ctx.save();
    if (!isLight) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff00ff';
    }
    ctx.strokeStyle = '#ff00ff'; 
    ctx.strokeRect(rinkWidth - goalDepth, rinkHeight / 2 - goalWidth / 2, goalDepth * 2, goalWidth);
    ctx.restore();

    // AI Goal Portal
    ctx.save();
    if (!isLight) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00f2ff';
    }
    ctx.strokeStyle = '#00f2ff'; 
    ctx.strokeRect(-goalDepth, rinkHeight / 2 - goalWidth / 2, goalDepth * 2, goalWidth);
    ctx.restore();
    ctx.restore();
}

function scoreGoal(winner) {
    if (winner === 'player') {
        playerScore++;
        playerScoreEl.textContent = playerScore;
        if (navigator.vibrate) navigator.vibrate([100, 30, 100]);
    } else {
        aiScore++;
        aiScoreEl.textContent = aiScore;
        if (navigator.vibrate) navigator.vibrate(200);
    }
    showGoalNotification();
    isGameStarted = false;
    if (playerScore >= WINNING_SCORE || aiScore >= WINNING_SCORE) {
        setTimeout(() => {
            endGame(playerScore >= WINNING_SCORE ? "YOU WIN!" : "AI WINS!");
        }, 1000);
    } else {
        setTimeout(() => {
            resetPositions();
            isGameStarted = true;
        }, 1500);
    }
}

// Pause game when app is in background
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        isGamePausedInternally = isGameStarted;
        isGameStarted = false;
    } else {
        if (typeof isGamePausedInternally !== 'undefined' && isGamePausedInternally) {
            // Only resume if it was running before and no overlays are showing
            if (startOverlay.classList.contains('hidden') && gameOverOverlay.classList.contains('hidden')) {
                isGameStarted = true;
            }
        }
    }
});
let isGamePausedInternally = false;

function resetPositions() {
    pucks.forEach(p => p.reset());
    player.reset();
    ai.reset();
    pucks.forEach(p => {
        p.vx = (Math.random() > 0.5 ? 1 : -1) * 3;
        p.vy = (Math.random() - 0.5) * 4;
    });
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
            if (timeLeft <= 10) timerDisplay.classList.add('low-time');
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                const msg = playerScore > aiScore ? "YOU WIN!" : (aiScore > playerScore ? "AI WINS!" : "DRAW!");
                endGame(msg);
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
    resetPositions();
    isGameStarted = true;
    startTimer();
}

function handleInput(x, y) {
    if (!isGameStarted) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rinkWidth / rect.width;
    const scaleY = rinkHeight / rect.height;
    let mouseX = (x - rect.left) * scaleX;
    let mouseY = (y - rect.top) * scaleY;
    
    // ALLOW PLAYER TO MOVE ACROSS ENTIRE RINK
    if (mouseX < player.radius) mouseX = player.radius;
    if (mouseX > rinkWidth - player.radius) mouseX = rinkWidth - player.radius;
    if (mouseY < player.radius) mouseY = player.radius;
    if (mouseY > rinkHeight - player.radius) mouseY = rinkHeight - player.radius;
    
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
    resetPositions();
    startTimer();
});

restartButton.addEventListener('click', restartGame);
gameLoop();
