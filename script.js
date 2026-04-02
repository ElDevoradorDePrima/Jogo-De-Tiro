const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let nivel = 1;
let gameRunning = true;
let projectiles = [];
let enemies = [];
let particles = []; 

let startTime = Date.now();
let finalTime = 0;

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    color: '#00d4ff',
    speed: 6 
};

const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (e) => { if(e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { if(e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = false; });

window.addEventListener('mousedown', (e) => {
    if(!gameRunning) return;
    const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
    projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 12,
        vy: Math.sin(angle) * 12,
        radius: 5
    });
});

function createExplosion(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 3,
            color: color,
            life: 1.0
        });
    }
}

function spawnEnemy() {
    if(!gameRunning) return;
    const radius = Math.random() * 20 + 15;
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    const dificuldadeExtra = nivel * 0.4; 
    enemies.push({
        x: x, y: y, radius: radius,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        speed: (Math.random() * 2 + 1) + dificuldadeExtra 
    });
}

let spawnInterval = setInterval(spawnEnemy, 1000);

function loop() {
    if(!gameRunning) return;
    requestAnimationFrame(loop);

    finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    timerElement.innerText = finalTime;

    // --- AJUSTE 1: Fundo que limpa o rastro mais rápido ---
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if(keys.w && player.y > player.radius) player.y -= player.speed;
    if(keys.s && player.y < canvas.height - player.radius) player.y += player.speed;
    if(keys.a && player.x > player.radius) player.x -= player.speed;
    if(keys.d && player.x < canvas.width - player.radius) player.x += player.speed;

    // --- AJUSTE 2: Desenho do Jogador isolando o brilho ---
    ctx.save(); // Salva o estado do canvas antes do brilho
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.restore(); // Limpa o brilho para não sujar o chão permanentemente

    particles.forEach((part, index) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life -= 0.02;
        ctx.globalAlpha = part.life;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
        ctx.fill();
        if(part.life <= 0) particles.splice(index, 1);
    });
    ctx.globalAlpha = 1.0;

    projectiles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "yellow";
        ctx.fill();
        if(p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) projectiles.splice(index, 1);
    });

    enemies.forEach((en, i) => {
        const angle = Math.atan2(player.y - en.y, player.x - en.x);
        en.x += Math.cos(angle) * en.speed;
        en.y += Math.sin(angle) * en.speed;

        ctx.beginPath();
        ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
        ctx.fillStyle = en.color;
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();

        const distPlayer = Math.hypot(player.x - en.x, player.y - en.y);
        if(distPlayer < player.radius + en.radius) {
            gameRunning = false;
            alert(`FIM DE JOGO!\nNível: ${nivel}\nTempo: ${finalTime}s\nPontos: ${score}`);
            location.reload();
        }

        projectiles.forEach((p, pi) => {
            const distBullet = Math.hypot(p.x - en.x, p.y - en.y);
            if(distBullet < en.radius + p.radius) {
                createExplosion(en.x, en.y, en.color); 
                enemies.splice(i, 1);
                projectiles.splice(pi, 1);
                score += 10;
                scoreElement.innerText = score;

                if(score % 100 === 0) {
                    nivel++;
                    clearInterval(spawnInterval);
                    spawnInterval = setInterval(spawnEnemy, Math.max(200, 1000 - (nivel * 100)));
                }
            }
        });
    });

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Nível: " + nivel, 20, canvas.height - 20);
}
loop();