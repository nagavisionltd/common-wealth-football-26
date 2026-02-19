// ========== SCREENS.JS — All Menu/UI Screens, Mini-Games, Store, Upgrades ==========

// ——— TITLE SCREEN ———
function drawTitleScreen() {
    // Background Image
    if (game.assets.titleBg.complete && game.assets.titleBg.naturalWidth > 0) {
        ctx.drawImage(game.assets.titleBg, 0, 0, CANVAS_W, CANVAS_H);
        // Darken overlay
        drawRect(0, 0, CANVAS_W, CANVAS_H, 'rgba(0,0,0,0.3)');
    } else {
        drawRect(0, 0, CANVAS_W, CANVAS_H, '#0a1a0a');
    }

    // High-Impact 16-Bit Style Logo
    function drawStylizedLogo(text, x, y, size, sub = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.italic = true;
        ctx.font = `italic bold ${size}px "Impact", "Arial Black", sans-serif`;
        ctx.textAlign = 'center';

        // 1. Extreme Drop Shadow / Offset Extrusion
        ctx.fillStyle = '#000';
        for (let i = 1; i <= 6; i++) {
            ctx.fillText(text, i, i);
        }

        // 2. Thick Outer Outline (Deep Blue/Black)
        ctx.strokeStyle = '#00084d';
        ctx.lineWidth = 12;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, 0, 0);

        // 3. Inner Outline (White/Silver)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 6;
        ctx.strokeText(text, 0, 0);

        // 4. Main Metal/Gold Gradient
        const grad = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
        if (sub) {
            grad.addColorStop(0, '#00f2ff'); // Cyan
            grad.addColorStop(0.5, '#0066ff'); // Blue
            grad.addColorStop(1, '#003399'); // Deep Blue
        } else {
            grad.addColorStop(0, '#fff3a0'); // White-gold highlight
            grad.addColorStop(0.2, '#ffd700'); // Gold
            grad.addColorStop(0.5, '#ff8c00'); // Orange-gold
            grad.addColorStop(0.8, '#8b4513'); // Bronze bottom
            grad.addColorStop(1, '#3d1f00'); // Dark depth
        }
        ctx.fillStyle = grad;
        ctx.fillText(text, 0, 0);

        // 5. Glossy "Shine" Overlay (top half)
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(-CANVAS_W / 2, -size / 2, CANVAS_W, size / 3);

        ctx.restore();
    }

    // Background decorative elements (speed strikes)
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 10; i++) {
        ctx.fillRect(CANVAS_W / 2 - 300 + i * 60, 110, 40, 2);
    }
    ctx.restore();

    drawStylizedLogo('COMMONWEALTH KICK', CANVAS_W / 2, 120 + Math.sin(Date.now() / 600) * 5, 72);
    drawStylizedLogo('ROAD TO GOLD', CANVAS_W / 2 + 20, 195 + Math.sin(Date.now() / 600 + 0.5) * 3, 48, true);

    // Moving Background Particles (Stadium Sparkle)
    ctx.save();
    for (let i = 0; i < 20; i++) {
        const x = (Math.sin(i * 1.5 + Date.now() / 2000) * 0.5 + 0.5) * CANVAS_W;
        const y = (Math.cos(i * 0.8 + Date.now() / 3000) * 0.3 + 0.4) * CANVAS_H;
        const size = (Math.sin(Date.now() / 500 + i) * 0.5 + 0.5) * 2;
        drawCircle(x, y, size, 'rgba(255,255,255,0.4)');
    }
    ctx.restore();

    // Buttons (Higher impact buttons)
    const btnW = 220, btnH = 50;
    const btnX = CANVAS_W / 2 - btnW / 2;

    if (drawButton('NEW GAME', btnX, 340, btnW, btnH)) {
        sfxSelect();
        game.changeState(GameState.COUNTRY_SELECT);
    }
    if (game.hasSave && drawButton('CONTINUE', btnX, 410, btnW, btnH)) {
        sfxSelect();
        game.loadGame();
        game.changeState(GameState.CITY_MAP);
    }

    // Version Badge
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(CANVAS_W - 160, CANVAS_H - 35, 150, 25);
    drawText('v2.0 PROTOTYPE', CANVAS_W - 85, CANVAS_H - 18, 12, '#0f0', 'center');
}

// ——— COUNTRY SELECT ———
function drawCountrySelect() {
    drawRect(0, 0, CANVAS_W, CANVAS_H, '#0a0a1a');
    drawText('SELECT YOUR NATION', CANVAS_W / 2, 50, 30, '#ffd700');
    const startX = 50;
    for (let i = 0; i < COUNTRIES.length; i++) {
        const c = COUNTRIES[i];
        const x = startX + i * 180;
        const y = 100;
        const w = 160, h = 350;
        const hover = mouse.x > x && mouse.x < x + w && mouse.y > y && mouse.y < y + h;
        // Card
        drawRect(x, y, w, h, hover ? '#333' : '#1a1a2a');
        ctx.strokeStyle = hover ? c.accent : '#444'; ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        // Flag placeholder
        drawRect(x + 20, y + 15, 120, 70, c.flag);
        drawRect(x + 20, y + 50, 120, 35, c.accent);
        // Name
        drawText(c.name, x + w / 2, y + 115, 16, '#fff');
        // Bonus
        const bonusKey = Object.keys(c.bonus)[0];
        drawText(`+${c.bonus[bonusKey]} ${bonusKey.toUpperCase()}`, x + w / 2, y + 145, 13, '#0f0');
        // Trait
        drawText(c.trait, x + w / 2, y + 175, 11, '#ff0');
        drawText(c.traitDesc, x + w / 2, y + 195, 10, '#aaa');
        // Stats preview
        const stats = ['Speed', 'Shot Power', 'Accuracy', 'Passing', 'Stamina', 'Strength', 'Technique'];
        stats.forEach((s, si) => {
            const val = 5 + (c.bonus[s.toLowerCase()] || 0);
            drawText(s, x + 10, y + 225 + si * 18, 9, '#888', 'left');
            drawRect(x + 80, y + 216 + si * 18, 60, 8, '#222');
            drawRect(x + 80, y + 216 + si * 18, 60 * (val / 10), 8, '#0a0');
        });
        // Click
        if (hover && mouse.clicked) {
            game.selectCountry(i);
        }
    }
}

// ——— CITY MAP ———
const CITIES = [
    { name: 'Grassfield Town', tier: 1, x: 100, y: 350, difficulty: 1 },
    { name: 'Riverside City', tier: 1, x: 250, y: 280, difficulty: 1.3 },
    { name: 'Iron Borough', tier: 2, x: 400, y: 200, difficulty: 1.6 },
    { name: 'Capital District', tier: 2, x: 550, y: 300, difficulty: 1.9 },
    { name: 'Commonwealth Arena', tier: 3, x: 700, y: 180, difficulty: 2.2 },
    { name: 'Gold Stadium', tier: 4, x: 830, y: 100, difficulty: 2.5 },
];

function drawCityMap() {
    drawRect(0, 0, CANVAS_W, CANVAS_H, '#1a2a1a');
    drawText('CAMPAIGN MAP', CANVAS_W / 2, 35, 26, '#ffd700');
    // Path lines
    ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let i = 0; i < CITIES.length; i++) {
        const c = CITIES[i];
        if (i === 0) ctx.moveTo(c.x, c.y); else ctx.lineTo(c.x, c.y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    // Nodes
    for (let i = 0; i < CITIES.length; i++) {
        const c = CITIES[i];
        const unlocked = i <= game.currentCity;
        const current = i === game.currentCity;
        const completed = game.cityWins[i] >= 3;
        const r = 22;
        const hover = dist(mouse, c) < r + 10;
        // Node circle
        drawCircle(c.x, c.y, r, completed ? '#ffd700' : unlocked ? (current ? '#0f0' : '#4a4') : '#222');
        ctx.strokeStyle = hover && unlocked ? '#fff' : '#444'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();

        if (!unlocked) {
            drawText('LOCKED', c.x, c.y + 5, 8, '#666');
        }

        // Wins
        if (unlocked) {
            for (let w = 0; w < 3; w++) {
                drawCircle(c.x - 12 + w * 12, c.y + r + 14, 5, w < (game.cityWins[i] || 0) ? '#ffd700' : '#333');
            }
        }
        // Label
        drawText(c.name, c.x, c.y - r - 10, 12, unlocked ? '#fff' : '#555');
        const tierColors = { 1: '#aaa', 2: '#6cf', 3: '#ffd700', 4: '#f6f' };
        drawText(`Tier ${c.tier}`, c.x, c.y - r - 24, 10, tierColors[c.tier] || '#aaa');
        // Click
        if (hover && mouse.clicked && unlocked) {
            if (current && !completed) {
                sfxSelect();
                game.startMatch(i);
            }
        }
    }
    // Stats panel
    drawRect(10, CANVAS_H - 160, 200, 150, 'rgba(0,0,0,0.7)');
    drawText(`Lv.${game.level}  XP: ${game.xp}/${game.xpNeeded()}`, 110, CANVAS_H - 138, 13, '#fff');
    drawText(`Coins: ${game.coins}`, 110, CANVAS_H - 118, 13, '#ff0');
    drawText(`${game.playerCountry.name}`, 110, CANVAS_H - 98, 13, game.playerCountry.accent);
    // Buttons
    if (drawButton('UPGRADE', 20, CANVAS_H - 80, 100, 30)) { sfxSelect(); game.changeState(GameState.UPGRADE); }
    if (drawButton('STORE', 130, CANVAS_H - 80, 90, 30)) { sfxSelect(); game.changeState(GameState.STORE); }
    if (drawButton('SHOOT DRILL', 20, CANVAS_H - 42, 120, 30)) { game.trainingType = 0; game.changeState(GameState.TRAINING); }
    if (drawButton('SPRINT DRILL', 150, CANVAS_H - 42, 120, 30)) { game.trainingType = 1; game.changeState(GameState.TRAINING); }
}

// ——— MATCH RESULT ———
function drawMatchResult() {
    drawRect(0, 0, CANVAS_W, CANVAS_H, '#0a0a1a');
    const won = game.lastResult.score[0] > game.lastResult.score[1];
    drawText(won ? 'VICTORY!' : (game.lastResult.score[0] === game.lastResult.score[1] ? 'DRAW' : 'DEFEAT'), CANVAS_W / 2, 100, 44, won ? '#ffd700' : '#e44');
    drawText(`${game.lastResult.score[0]} - ${game.lastResult.score[1]}`, CANVAS_W / 2, 170, 50, '#fff');
    drawText(`XP Earned: +${game.lastResult.xpEarned}`, CANVAS_W / 2, 240, 20, '#0f0');
    drawText(`Coins Earned: +${game.lastResult.coinsEarned}`, CANVAS_W / 2, 275, 20, '#ff0');
    if (game.lastResult.levelUp) {
        drawText('LEVEL UP!', CANVAS_W / 2, 320, 28, '#f0f');
    }
    if (game.lastResult.medalEarned) {
        drawText(`🏅 ${game.lastResult.medalEarned} MEDAL EARNED!`, CANVAS_W / 2, 360, 22, '#ffd700');
    }
    if (drawButton('CONTINUE', CANVAS_W / 2 - 80, 410, 160, 40)) {
        if (game.travelPending) {
            game.travelPending = false;
            startTravel(game.travelFrom, game.travelTo);
            game.state = 'travel';
        } else {
            game.changeState(GameState.CITY_MAP);
        }
    }
}

// ——— UPGRADE SCREEN ———
function drawUpgradeScreen() {
    drawRect(0, 0, CANVAS_W, CANVAS_H, '#0a0a2a');
    drawText('UPGRADE STATS', CANVAS_W / 2, 50, 30, '#ffd700');
    drawText(`Skill Points: ${game.skillPoints}`, CANVAS_W / 2, 85, 18, '#0f0');
    const statNames = ['speed', 'shotPower', 'shotAccuracy', 'passing', 'stamina', 'strength', 'technique'];
    const labels = ['SPEED', 'SHOT POWER', 'SHOT ACCURACY', 'PASSING', 'STAMINA', 'STRENGTH', 'TECHNIQUE'];
    statNames.forEach((s, i) => {
        const y = 120 + i * 50;
        const val = game.stats[s];
        drawText(labels[i], 200, y + 6, 16, '#fff', 'right');
        // Bar
        drawRect(220, y - 8, 300, 20, '#222');
        drawRect(220, y - 8, 300 * (val / 50), 20, '#0a0');
        drawText(`${val}`, 530, y + 6, 14, '#fff', 'left');
        // + button
        if (game.skillPoints > 0 && val < 50) {
            const bx = 570, by = y - 10, bw = 35, bh = 24;
            const hover = mouse.x > bx && mouse.x < bx + bw && mouse.y > by && mouse.y < by + bh;
            drawRect(bx, by, bw, bh, hover ? '#0a0' : '#060');
            drawText('+', bx + bw / 2, by + bh / 2 + 6, 18, '#fff');
            if (hover && mouse.clicked) {
                game.stats[s]++;
                game.skillPoints--;
            }
        }
    });
    if (drawButton('BACK', CANVAS_W / 2 - 60, 490, 120, 35)) game.changeState(GameState.CITY_MAP);
}

// ——— STORE ———
const STORE_ITEMS = [
    { name: 'Speed Boots', cost: 100, stat: 'speed', boost: 2, desc: '+2 Speed' },
    { name: 'Power Cleats', cost: 150, stat: 'shotPower', boost: 2, desc: '+2 Shot Power' },
    { name: 'Energy Drink', cost: 50, stat: 'stamina', boost: 3, desc: '+3 Stamina' },
    { name: 'Technique Gloves', cost: 120, stat: 'technique', boost: 2, desc: '+2 Technique' },
    { name: 'Passing Manual', cost: 80, stat: 'passing', boost: 2, desc: '+2 Passing' },
    { name: 'Strength Band', cost: 100, stat: 'strength', boost: 2, desc: '+2 Strength' },
    { name: 'Aim Trainer', cost: 130, stat: 'shotAccuracy', boost: 2, desc: '+2 Shot Accuracy' },
];

function drawStore() {
    drawRect(0, 0, CANVAS_W, CANVAS_H, '#1a0a1a');
    drawText('STORE', CANVAS_W / 2, 50, 30, '#ffd700');
    drawText(`Coins: ${game.coins}`, CANVAS_W / 2, 85, 18, '#ff0');
    STORE_ITEMS.forEach((item, i) => {
        const x = 150, y = 110 + i * 50, w = 660, h = 42;
        const hover = mouse.x > x && mouse.x < x + w && mouse.y > y && mouse.y < y + h;
        const canBuy = game.coins >= item.cost && !game.purchased.includes(item.name);
        const owned = game.purchased.includes(item.name);
        drawRect(x, y, w, h, hover && canBuy ? '#333' : '#1a1a2a');
        ctx.strokeStyle = owned ? '#ffd700' : canBuy ? '#0a0' : '#444'; ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        drawText(item.name, x + 140, y + 26, 16, '#fff');
        drawText(item.desc, x + 340, y + 26, 13, '#aaa');
        if (owned) {
            drawText('OWNED', x + w - 60, y + 26, 14, '#ffd700');
        } else {
            drawText(`${item.cost}c`, x + w - 60, y + 26, 14, canBuy ? '#ff0' : '#666');
        }
        if (hover && mouse.clicked && canBuy) {
            game.coins -= item.cost;
            game.stats[item.stat] += item.boost;
            game.purchased.push(item.name);
        }
    });
    if (drawButton('BACK', CANVAS_W / 2 - 60, 490, 120, 35)) game.state = GameState.CITY_MAP;
}

// ——— TRAINING MINI-GAME: Shooting Drill ———
let training = null;

function startTraining() {
    training = {
        type: 'shooting',
        timer: 30 * 60, // 30 seconds at 60fps
        score: 0,
        targets: [],
        cooldown: 0,
        playerX: CANVAS_W / 2,
        results: null,
    };
    spawnTarget();
}

function spawnTarget() {
    if (!training) return;
    training.targets.push({
        x: randRange(CANVAS_W / 2 + 50, CANVAS_W - 80),
        y: randRange(100, CANVAS_H - 100),
        r: randRange(15, 30),
        hit: false,
        timer: 180,
    });
}

function updateTraining() {
    if (!training) return;
    if (training.results) {
        // Show results
        drawRect(0, 0, CANVAS_W, CANVAS_H, '#0a0a2a');
        drawText('TRAINING COMPLETE', CANVAS_W / 2, 120, 30, '#ffd700');
        const tier = training.score >= 5 ? 'GOLD' : training.score >= 3 ? 'SILVER' : 'BRONZE';
        const tierCol = tier === 'GOLD' ? '#ffd700' : tier === 'SILVER' ? '#c0c0c0' : '#cd7f32';
        drawText(`Score: ${training.score}`, CANVAS_W / 2, 180, 24, '#fff');
        drawText(`${tier}!`, CANVAS_W / 2, 230, 36, tierCol);
        const xpGain = tier === 'GOLD' ? 80 : tier === 'SILVER' ? 50 : 25;
        drawText(`+${xpGain} XP`, CANVAS_W / 2, 280, 20, '#0f0');
        if (drawButton('CONTINUE', CANVAS_W / 2 - 80, 340, 160, 40)) {
            game.xp += xpGain;
            game.checkLevelUp();
            training = null;
            game.changeState(GameState.CITY_MAP);
        }
        return;
    }
    training.timer--;
    if (training.timer <= 0) {
        training.results = true;
        return;
    }
    training.cooldown--;
    // Remove expired targets, spawn new
    training.targets = training.targets.filter(t => { t.timer--; return t.timer > 0 && !t.hit; });
    if (training.targets.length < 2 && Math.random() < 0.03) spawnTarget();
    // Draw
    drawRect(0, 0, CANVAS_W, CANVAS_H, '#1a2a1a');
    // Goal
    drawRect(CANVAS_W - 60, 60, 50, CANVAS_H - 120, '#333');
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.strokeRect(CANVAS_W - 60, 60, 50, CANVAS_H - 120);
    // Targets
    training.targets.forEach(t => {
        drawCircle(t.x, t.y, t.r, 'rgba(255,0,0,0.6)');
        ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.stroke();
        drawCircle(t.x, t.y, t.r * 0.4, 'rgba(255,255,0,0.5)');
    });
    // Player (ball kicker)
    training.playerX = clamp(mouse.x, 100, CANVAS_W / 2);
    drawCircle(training.playerX, CANVAS_H / 2, 16, game.playerCountry.accent);
    drawCircle(training.playerX + 20, CANVAS_H / 2, BALL_R, '#fff');
    // Shoot with click
    if (mouse.clicked && training.cooldown <= 0) {
        training.cooldown = 20;
        // Check hits
        training.targets.forEach(t => {
            const d = dist(mouse, t);
            if (d < t.r) {
                t.hit = true;
                training.score++;
            }
        });
    }
    // HUD
    drawText(`Score: ${training.score}`, CANVAS_W / 2, 30, 22, '#fff');
    drawText(`Time: ${Math.ceil(training.timer / 60)}s`, CANVAS_W / 2, 55, 16, '#ff0');
    drawText('Click targets to shoot!', CANVAS_W / 2, CANVAS_H - 20, 14, '#888');
}

// ——— DIALOGUE SCREEN ———
let dialogue = null;
function startDialogue(lines) {
    dialogue = { lines, index: 0, charIndex: 0, timer: 0, done: false };
}

function updateDialogue() {
    if (!dialogue) return;
    drawRect(0, 0, CANVAS_W, CANVAS_H, '#0a0a1a');
    // Background placeholder
    drawRect(100, 50, CANVAS_W - 200, 300, '#1a2a1a');
    drawText('📍 ' + CITIES[game.currentCity].name, CANVAS_W / 2, 80, 16, '#aaa');
    // Portraits
    drawCircle(180, 250, 40, game.playerCountry.accent);
    drawText('YOU', 180, 310, 12, '#fff');
    drawCircle(CANVAS_W - 180, 250, 40, '#e44');
    drawText('RIVAL', CANVAS_W - 180, 310, 12, '#fff');
    // Text box
    drawRect(80, 370, CANVAS_W - 160, 120, 'rgba(0,0,0,0.85)');
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.strokeRect(80, 370, CANVAS_W - 160, 120);
    const line = dialogue.lines[dialogue.index];
    // Typewriter
    dialogue.timer++;
    if (dialogue.timer % 2 === 0 && dialogue.charIndex < line.text.length) dialogue.charIndex++;
    const shown = line.text.substring(0, dialogue.charIndex);
    drawText(line.speaker + ':', 110, 400, 14, line.speaker === 'You' ? '#0f0' : '#f44', 'left');
    // Word wrap
    const words = shown.split(' ');
    let lineText = '', lineY = 420;
    words.forEach(w => {
        if (ctx.measureText(lineText + w).width > CANVAS_W - 200) {
            drawText(lineText, 110, lineY, 15, '#fff', 'left');
            lineY += 22; lineText = w + ' ';
        } else { lineText += w + ' '; }
    });
    drawText(lineText, 110, lineY, 15, '#fff', 'left');
    drawText('Click to continue...', CANVAS_W / 2, CANVAS_H - 20, 12, '#666');
    if (mouse.clicked) {
        if (dialogue.charIndex < line.text.length) {
            dialogue.charIndex = line.text.length;
        } else {
            dialogue.index++;
            dialogue.charIndex = 0;
            dialogue.timer = 0;
            if (dialogue.index >= dialogue.lines.length) {
                dialogue = null;
                game.state = GameState.CITY_MAP;
            }
        }
    }
}
