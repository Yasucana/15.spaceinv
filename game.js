// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Game constants
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 5;
const ALIEN_WIDTH = 40;
const ALIEN_HEIGHT = 30;
const ALIEN_SPEED = 1;
const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 10;
const PLAYER_BULLET_SPEED = 7;
const ALIEN_BULLET_SPEED = 3;
const ALIEN_ROWS = 5;
const ALIEN_COLS = 10;
const ALIEN_HORIZONTAL_SPACING = 60;
const ALIEN_VERTICAL_SPACING = 40;
const ALIEN_DESCENT = 20;
const ALIEN_SHOT_INTERVAL = 1000; // ms

// Game objects and state
let player = {
    x: canvas.width / 2 - PLAYER_WIDTH / 2,
    y: canvas.height - PLAYER_HEIGHT - 10,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
    lastShotTime: 0,
    shootCooldown: 500 // ms
};
let aliens = [];
let playerBullets = [];
let alienBullets = [];
let score = 0;
let gameState = 'playing';
let alienDirection = 1;
let lastAlienShotTime = 0;

// Keyboard input
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

document.addEventListener('keydown', (e) => {
    if (e.code in keys) keys[e.code] = true;
    if (gameState !== 'playing' && e.code === 'KeyR') init();
});

document.addEventListener('keyup', (e) => {
    if (e.code in keys) keys[e.code] = false;
});

// Collision detection
function rectIntersect(r1, r2) {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > r2.y;
}

// Initialize game
function init() {
    player.x = canvas.width / 2 - PLAYER_WIDTH / 2;
    player.y = canvas.height - PLAYER_HEIGHT - 10;
    player.lastShotTime = 0;

    aliens = [];
    for (let row = 0; row < ALIEN_ROWS; row++) {
        for (let col = 0; col < ALIEN_COLS; col++) {
            const x = col * ALIEN_HORIZONTAL_SPACING + 50;
            const y = row * ALIEN_VERTICAL_SPACING + 50;
            aliens.push({ x, y, width: ALIEN_WIDTH, height: ALIEN_HEIGHT, alive: true });
        }
    }

    playerBullets = [];
    alienBullets = [];
    score = 0;
    gameState = 'playing';
    alienDirection = 1;
    lastAlienShotTime = 0;
}

// Update game state
function update() {
    if (gameState !== 'playing') return;

    const currentTime = performance.now();

    // Player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Player shooting
    if (keys.Space && currentTime - player.lastShotTime > player.shootCooldown) {
        playerBullets.push({
            x: player.x + player.width / 2 - BULLET_WIDTH / 2,
            y: player.y - BULLET_HEIGHT,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT,
            speed: -PLAYER_BULLET_SPEED
        });
        player.lastShotTime = currentTime;
    }

    // Move player bullets
    playerBullets.forEach(bullet => bullet.y += bullet.speed);

    // Move alien bullets
    alienBullets.forEach(bullet => bullet.y += bullet.speed);

    // Alien movement
    aliens.forEach(alien => alien.x += ALIEN_SPEED * alienDirection);
    const aliveAliens = aliens.filter(alien => alien.alive);
    if (aliveAliens.length > 0) {
        const leftmost = Math.min(...aliveAliens.map(alien => alien.x));
        const rightmost = Math.max(...aliveAliens.map(alien => alien.x + alien.width));
        if (leftmost < 0 || rightmost > canvas.width) {
            aliens.forEach(alien => alien.y += ALIEN_DESCENT);
            alienDirection *= -1;
        }
    }

    // Alien shooting
    if (currentTime - lastAlienShotTime > ALIEN_SHOT_INTERVAL && aliveAliens.length > 0) {
        const randomAlien = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
        alienBullets.push({
            x: randomAlien.x + randomAlien.width / 2 - BULLET_WIDTH / 2,
            y: randomAlien.y + randomAlien.height,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT,
            speed: ALIEN_BULLET_SPEED
        });
        lastAlienShotTime = currentTime;
    }

    // Collision detection: player bullets vs aliens
    playerBullets.forEach((bullet, bIndex) => {
        aliens.forEach(alien => {
            if (alien.alive && rectIntersect(bullet, alien)) {
                alien.alive = false;
                playerBullets.splice(bIndex, 1);
                score += 10;
            }
        });
    });

    // Collision detection: alien bullets vs player
    alienBullets.forEach((bullet, bIndex) => {
        if (rectIntersect(bullet, player)) {
            alienBullets.splice(bIndex, 1);
            gameState = 'gameover';
        }
    });

    // Remove off-screen bullets
    playerBullets = playerBullets.filter(bullet => bullet.y > -bullet.height);
    alienBullets = alienBullets.filter(bullet => bullet.y < canvas.height);

    // Check lose condition (aliens reach bottom)
    if (aliveAliens.some(alien => alien.y + alien.height > canvas.height - 50)) {
        gameState = 'gameover';
    }

    // Check win condition (all aliens destroyed)
    if (aliveAliens.length === 0) {
        gameState = 'win';
    }
}

// Draw game
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'playing') {
        // Draw player
        ctx.fillStyle = 'green';
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Draw aliens
        ctx.fillStyle = 'red';
        aliens.forEach(alien => {
            if (alien.alive) ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
        });

        // Draw bullets
        ctx.fillStyle = 'yellow';
        playerBullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));
        ctx.fillStyle = 'white';
        alienBullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));

        // Draw score
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${score}`, 10, 30);
    } else if (gameState === 'gameover') {
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText('Press R to restart', canvas.width / 2 - 80, canvas.height / 2 + 40);
    } else if (gameState === 'win') {
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('You Win!', canvas.width / 2 - 80, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText('Press R to restart', canvas.width / 2 - 80, canvas.height / 2 + 40);
    }
}

// Game loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Start game
init();
loop();