// ========== EFFECTS.JS — Particles, Screen Shake, Sound FX, Travel ==========

// ——— PARTICLE SYSTEM ———
const particles = [];

function spawnParticles(x, y, count, color, speed = 3, life = 40) {
    for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * speed + 1;
        particles.push({
            x, y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life, maxLife: life,
            color,
            size: Math.random() * 4 + 2,
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.1; // gravity
        p.vx *= 0.98;
        p.life--;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        drawCircle(p.x, p.y, p.size * alpha, p.color);
    }
    ctx.globalAlpha = 1;
}

// ——— SCREEN SHAKE ———
let shake = { intensity: 0, duration: 0 };

function triggerShake(intensity, duration) {
    shake.intensity = intensity;
    shake.duration = duration;
}

function applyShake() {
    if (shake.duration > 0) {
        const ox = (Math.random() - 0.5) * shake.intensity * 2;
        const oy = (Math.random() - 0.5) * shake.intensity * 2;
        ctx.translate(ox, oy);
        shake.duration--;
        if (shake.duration <= 0) shake.intensity = 0;
        return true;
    }
    return false;
}

function resetShake() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ——— FLASH OVERLAY ———
let flash = { alpha: 0, color: '#fff', duration: 0 };

function triggerFlash(color, duration) {
    flash.alpha = 1;
    flash.color = color;
    flash.duration = duration;
}

function updateFlash() {
    if (flash.alpha > 0) {
        ctx.fillStyle = flash.color;
        ctx.globalAlpha = flash.alpha * 0.4;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.globalAlpha = 1;
        flash.alpha -= 1 / flash.duration;
    }
}

// ——— SOUND FX (Web Audio API) ———
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(freq, duration, type = 'square', volume = 0.15) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function sfxKick() { playTone(180, 0.1, 'square', 0.12); playTone(120, 0.15, 'triangle', 0.1); }
function sfxGoal() {
    playTone(523, 0.15, 'square', 0.15);
    setTimeout(() => playTone(659, 0.15, 'square', 0.15), 150);
    setTimeout(() => playTone(784, 0.3, 'square', 0.2), 300);
}
function sfxTackle() { playTone(100, 0.08, 'sawtooth', 0.1); playTone(80, 0.1, 'square', 0.08); }
function sfxWhistle() {
    playTone(880, 0.4, 'sine', 0.15);
    setTimeout(() => playTone(880, 0.2, 'sine', 0.12), 500);
}
function sfxCoin() { playTone(988, 0.08, 'square', 0.1); setTimeout(() => playTone(1319, 0.15, 'square', 0.12), 80); }
function sfxLevelUp() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'square', 0.12), i * 100));
}
function sfxSelect() { playTone(440, 0.06, 'square', 0.08); }
function sfxPass() { playTone(330, 0.06, 'triangle', 0.1); }

// ——— PROCEDURAL PIXEL PLAYER SPRITES ———
function drawPlayerSprite(x, y, team, facing, animFrame, state, isUser) {
    const colors = team === 0 ?
        { shirt: game.playerCountry.accent, shorts: '#222', skin: '#8B5E3C', hair: '#222' } :
        { shirt: '#e44', shorts: '#222', skin: '#D4A574', hair: '#333' };

    const bobY = state === 'run' ? Math.sin(animFrame * 1.5) * 2 : 0;
    const legSpread = state === 'run' ? Math.sin(animFrame * 1.5) * 5 : 0;

    ctx.save();
    ctx.translate(x, y + bobY);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, PLAYER_R - 1, PLAYER_R * 0.7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = colors.skin;
    ctx.fillRect(-4 - legSpread, 4, 4, 8);
    ctx.fillRect(legSpread, 4, 4, 8);
    // Boots
    ctx.fillStyle = '#111';
    ctx.fillRect(-5 - legSpread, 10, 5, 3);
    ctx.fillRect(legSpread - 1, 10, 5, 3);

    // Body (shirt)
    ctx.fillStyle = colors.shirt;
    ctx.fillRect(-7, -6, 14, 12);
    // Shirt stripe
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-2, -6, 4, 12);

    // Arms
    const armSwing = state === 'run' ? Math.sin(animFrame * 1.5) * 4 : 0;
    ctx.fillStyle = colors.skin;
    ctx.fillRect(-10, -3 + armSwing, 4, 7);
    ctx.fillRect(6, -3 - armSwing, 4, 7);

    // Head
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(0, -10, 6, 0, Math.PI * 2);
    ctx.fill();
    // Hair
    ctx.fillStyle = colors.hair;
    ctx.beginPath();
    ctx.arc(0, -12, 5, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes (direction facing)
    const eyeX = Math.cos(facing) * 2;
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2 + eyeX, -11, 2, 2);
    ctx.fillRect(1 + eyeX, -11, 2, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(-1.5 + eyeX, -10.5, 1, 1);
    ctx.fillRect(1.5 + eyeX, -10.5, 1, 1);

    // Shoot pose
    if (state === 'shoot') {
        ctx.fillStyle = colors.shirt;
        ctx.fillRect(Math.cos(facing) * 8 - 2, Math.sin(facing) * 8 - 2, 6, 4);
    }

    // User arrow indicator
    if (isUser) {
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.moveTo(-5, -22); ctx.lineTo(5, -22); ctx.lineTo(0, -18);
        ctx.fill();
    }

    // Number on back
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isUser ? '10' : '7', 0, 2);

    ctx.restore();
}

// ——— SPRINT OBSTACLE MINI-GAME ———
let sprintGame = null;

function startSprintGame() {
    sprintGame = {
        playerX: 80,
        playerY: CANVAS_H - 100,
        speed: 0,
        distance: 0,
        targetDist: 2000,
        obstacles: [],
        timer: 20 * 60,
        score: 0,
        jumping: false,
        jumpVel: 0,
        groundY: CANVAS_H - 100,
        hit: false,
        hitTimer: 0,
        results: null,
        spawnTimer: 0,
    };
    // Pre-spawn obstacles
    for (let i = 0; i < 15; i++) {
        sprintGame.obstacles.push({
            x: 300 + i * 150 + Math.random() * 80,
            type: Math.random() < 0.5 ? 'cone' : 'hurdle',
            w: Math.random() < 0.5 ? 20 : 30,
            h: Math.random() < 0.5 ? 20 : 35,
        });
    }
}

function updateSprintGame() {
    if (!sprintGame) return;
    const sg = sprintGame;

    if (sg.results) {
        drawRect(0, 0, CANVAS_W, CANVAS_H, '#0a0a2a');
        drawText('SPRINT DRILL COMPLETE', CANVAS_W / 2, 120, 28, '#ffd700');
        const tier = sg.score >= 80 ? 'GOLD' : sg.score >= 50 ? 'SILVER' : 'BRONZE';
        const tierCol = tier === 'GOLD' ? '#ffd700' : tier === 'SILVER' ? '#c0c0c0' : '#cd7f32';
        drawText(`Distance: ${sg.score}%`, CANVAS_W / 2, 180, 22, '#fff');
        drawText(`${tier}!`, CANVAS_W / 2, 230, 36, tierCol);
        const xpGain = tier === 'GOLD' ? 80 : tier === 'SILVER' ? 50 : 25;
        drawText(`+${xpGain} XP  (Speed & Stamina)`, CANVAS_W / 2, 280, 18, '#0f0');
        if (drawButton('CONTINUE', CANVAS_W / 2 - 80, 340, 160, 40)) {
            game.xp += xpGain;
            game.stats.speed = Math.min(50, game.stats.speed + (tier === 'GOLD' ? 2 : 1));
            game.stats.stamina = Math.min(50, game.stats.stamina + (tier === 'GOLD' ? 2 : 1));
            game.checkLevelUp();
            sprintGame = null;
            game.state = GameState.CITY_MAP;
        }
        return;
    }

    sg.timer--;
    if (sg.timer <= 0 || sg.distance >= sg.targetDist) {
        sg.score = Math.floor((sg.distance / sg.targetDist) * 100);
        sg.results = true;
        return;
    }

    // Sprint input — mash Z or Shift to accelerate
    if (keys['z'] || keys['shift']) {
        sg.speed = Math.min(sg.speed + 0.3, 6);
        keys['z'] = false; keys['shift'] = false;
    }
    sg.speed *= 0.985; // drag
    sg.distance += sg.speed;

    // Jump
    if ((keys[' '] || keys['w'] || keys['arrowup']) && !sg.jumping) {
        sg.jumping = true;
        sg.jumpVel = -9;
        sfxKick();
        keys[' '] = false;
    }
    if (sg.jumping) {
        sg.playerY += sg.jumpVel;
        sg.jumpVel += 0.5;
        if (sg.playerY >= sg.groundY) {
            sg.playerY = sg.groundY;
            sg.jumping = false;
            sg.jumpVel = 0;
        }
    }

    // Hit recovery
    if (sg.hitTimer > 0) {
        sg.hitTimer--;
        sg.speed *= 0.9;
    }

    // Draw
    drawRect(0, 0, CANVAS_W, CANVAS_H, '#1a3a1a');
    // Track
    drawRect(0, CANVAS_H - 60, CANVAS_W, 60, '#8B4513');
    drawRect(0, CANVAS_H - 62, CANVAS_W, 3, '#fff');
    // Lane lines
    for (let i = 0; i < 20; i++) {
        const lx = (i * 80 - (sg.distance * 2) % 80) % CANVAS_W;
        drawRect(lx, CANVAS_H - 40, 30, 3, 'rgba(255,255,255,0.3)');
    }

    // Obstacles
    sg.obstacles.forEach(ob => {
        const screenX = ob.x - sg.distance * 1.5 + sg.playerX;
        if (screenX < -50 || screenX > CANVAS_W + 50) return;
        if (ob.type === 'cone') {
            ctx.fillStyle = '#f80';
            ctx.beginPath();
            ctx.moveTo(screenX, CANVAS_H - 62);
            ctx.lineTo(screenX - 10, CANVAS_H - 62);
            ctx.lineTo(screenX - 5, CANVAS_H - 62 - ob.h);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(screenX - 8, CANVAS_H - 62 - ob.h * 0.5, 6, 3);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(screenX - 2, CANVAS_H - 62 - ob.h, 4, ob.h);
            ctx.fillRect(screenX + ob.w - 2, CANVAS_H - 62 - ob.h, 4, ob.h);
            ctx.fillStyle = '#ff0';
            ctx.fillRect(screenX - 2, CANVAS_H - 62 - ob.h, ob.w + 4, 4);
        }
        // Collision
        if (screenX > sg.playerX - 12 && screenX < sg.playerX + 12 &&
            sg.playerY > CANVAS_H - 62 - ob.h - 10 && sg.hitTimer <= 0) {
            sg.hitTimer = 30;
            sg.speed *= 0.3;
            triggerShake(4, 10);
            spawnParticles(sg.playerX, sg.playerY, 8, '#f80');
            sfxTackle();
        }
    });

    // Player
    const bobY = Math.sin(sg.distance * 0.3) * (sg.speed > 1 ? 2 : 0);
    const py = sg.playerY + bobY;
    // Body
    ctx.fillStyle = game.playerCountry.accent;
    ctx.fillRect(sg.playerX - 6, py - 16, 12, 14);
    // Head
    ctx.fillStyle = '#8B5E3C';
    ctx.beginPath(); ctx.arc(sg.playerX, py - 20, 6, 0, Math.PI * 2); ctx.fill();
    // Legs
    const legAnim = Math.sin(sg.distance * 0.5) * 6;
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(sg.playerX - 4 + legAnim, py - 2, 3, 10);
    ctx.fillRect(sg.playerX + 1 - legAnim, py - 2, 3, 10);
    // Hit flash
    if (sg.hitTimer > 0 && sg.hitTimer % 4 < 2) {
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.fillRect(sg.playerX - 10, py - 24, 20, 34);
    }

    // HUD
    drawRect(0, 0, CANVAS_W, 45, 'rgba(0,0,0,0.6)');
    // Progress bar
    drawRect(100, 12, 400, 16, '#222');
    drawRect(100, 12, 400 * (sg.distance / sg.targetDist), 16, '#0a0');
    drawText(`${Math.floor(sg.distance / sg.targetDist * 100)}%`, 510, 26, 14, '#fff', 'left');
    // Speed
    drawText(`Speed: ${sg.speed.toFixed(1)}`, 700, 26, 14, '#ff0');
    drawText(`Time: ${Math.ceil(sg.timer / 60)}s`, 850, 26, 14, '#fff');
    drawText('Mash Z to SPRINT! SPACE to JUMP!', CANVAS_W / 2, CANVAS_H - 12, 13, '#888');

    updateParticles();
}

// ——— TRAVEL ANIMATION ———
let travel = null;

function startTravel(fromCity, toCity) {
    const tier = CITIES[toCity].tier;
    const vehicles = ['🚌', '🚂', '✈️', '🛩️'];
    travel = {
        fromCity, toCity,
        vehicle: vehicles[Math.min(tier - 1, 3)],
        vehicleName: ['BUS', 'TRAIN', 'PLANE', 'PRIVATE JET'][Math.min(tier - 1, 3)],
        progress: 0,
        duration: 180, // 3 seconds
        fromName: CITIES[fromCity].name,
        toName: CITIES[toCity].name,
    };
}

function updateTravel() {
    if (!travel) return false;
    travel.progress++;

    drawRect(0, 0, CANVAS_W, CANVAS_H, '#0a1a3a');

    // Stars
    for (let i = 0; i < 40; i++) {
        const sx = (i * 97 + travel.progress * 2) % CANVAS_W;
        const sy = (i * 53) % (CANVAS_H - 100);
        const flicker = Math.sin(Date.now() / 300 + i) * 0.3 + 0.7;
        ctx.globalAlpha = flicker;
        drawCircle(sx, sy, 1, '#fff');
    }
    ctx.globalAlpha = 1;

    // Ground
    drawRect(0, CANVAS_H - 80, CANVAS_W, 80, '#1a3a1a');
    // Moving ground details
    for (let i = 0; i < 30; i++) {
        const gx = ((i * 60) - travel.progress * 3) % CANVAS_W;
        drawRect(gx, CANVAS_H - 60 + (i % 3) * 15, 20 + (i % 4) * 5, 3, '#2a4a2a');
    }

    // Vehicle path
    const t = travel.progress / travel.duration;
    const vx = lerp(100, CANVAS_W - 100, t);
    const vy = CANVAS_H / 2 + Math.sin(t * Math.PI * 4) * 15;

    drawText(travel.vehicle, vx, vy, 40, '#fff');

    // From/To labels
    drawText(travel.fromName, 80, CANVAS_H / 2 - 60, 16, t < 0.2 ? '#fff' : '#555');
    drawText(travel.toName, CANVAS_W - 80, CANVAS_H / 2 - 60, 16, t > 0.8 ? '#fff' : '#555');

    // Travel text
    drawText(`Travelling by ${travel.vehicleName}...`, CANVAS_W / 2, 60, 22, '#ffd700');

    // Progress bar
    drawRect(CANVAS_W / 2 - 150, CANVAS_H - 30, 300, 10, '#222');
    drawRect(CANVAS_W / 2 - 150, CANVAS_H - 30, 300 * t, 10, '#ffd700');

    if (travel.progress >= travel.duration) {
        travel = null;
        return true; // done
    }
    return false; // still going
}
