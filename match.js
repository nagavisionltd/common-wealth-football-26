// ========== MATCH.JS — Match Logic, Pitch Drawing, Goal Detection ==========

class Match {
    constructor(playerCountry, difficulty) {
        this.playerCountry = playerCountry;
        this.difficulty = difficulty;
        this.score = [0, 0];
        this.timer = MATCH_TIME;
        this.ball = new Ball();
        this.players = [];
        this.ai = new AIController(1, difficulty);
        this.paused = false;
        this.goalScored = false;
        this.goalTimer = 0;
        this.over = false;
        this.kickoff = true;
        this.setupPlayers();
    }

    setupPlayers() {
        this.players = [];
        // Team 0 (player) — left side, 5 players
        const positions0 = [
            { x: PITCH_X + 80, y: CANVAS_H / 2 },       // GK
            { x: PITCH_X + 200, y: CANVAS_H / 2 - 100 }, // DEF
            { x: PITCH_X + 200, y: CANVAS_H / 2 + 100 }, // DEF
            { x: PITCH_X + 350, y: CANVAS_H / 2 - 60 },  // MID
            { x: PITCH_X + 450, y: CANVAS_H / 2 },        // FWD (user)
        ];
        for (let i = 0; i < 5; i++) {
            const p = new Player(positions0[i].x, positions0[i].y, 0, i === 4);
            // Apply country bonus
            const bonus = this.playerCountry.bonus;
            if (bonus.speed) p.speed += bonus.speed * 0.3;
            if (bonus.stamina) p.maxStamina += bonus.stamina * 15;
            // Apply game stats
            const stats = game.stats;
            p.speed += stats.speed * 0.15;
            p.maxStamina += stats.stamina * 5;
            p.stamina = p.maxStamina;
            this.players.push(p);
        }
        // Team 1 (AI) — right side
        const positions1 = [
            { x: PITCH_X + PITCH_W - 80, y: CANVAS_H / 2 },
            { x: PITCH_X + PITCH_W - 200, y: CANVAS_H / 2 - 100 },
            { x: PITCH_X + PITCH_W - 200, y: CANVAS_H / 2 + 100 },
            { x: PITCH_X + PITCH_W - 350, y: CANVAS_H / 2 + 60 },
            { x: PITCH_X + PITCH_W - 450, y: CANVAS_H / 2 },
        ];
        for (let i = 0; i < 5; i++) {
            const p = new Player(positions1[i].x, positions1[i].y, 1);
            p.speed += this.difficulty * 0.3;
            this.players.push(p);
        }
    }

    getUserPlayer() { return this.players.find(p => p.isUser); }

    resetAfterGoal() {
        this.ball.reset();
        // Reset player positions
        const positions0 = [
            { x: PITCH_X + 80, y: CANVAS_H / 2 },
            { x: PITCH_X + 200, y: CANVAS_H / 2 - 100 },
            { x: PITCH_X + 200, y: CANVAS_H / 2 + 100 },
            { x: PITCH_X + 350, y: CANVAS_H / 2 - 60 },
            { x: PITCH_X + 450, y: CANVAS_H / 2 },
        ];
        const positions1 = [
            { x: PITCH_X + PITCH_W - 80, y: CANVAS_H / 2 },
            { x: PITCH_X + PITCH_W - 200, y: CANVAS_H / 2 - 100 },
            { x: PITCH_X + PITCH_W - 200, y: CANVAS_H / 2 + 100 },
            { x: PITCH_X + PITCH_W - 350, y: CANVAS_H / 2 + 60 },
            { x: PITCH_X + PITCH_W - 450, y: CANVAS_H / 2 },
        ];
        this.players.forEach((p, i) => {
            const pos = i < 5 ? positions0[i] : positions1[i - 5];
            p.x = pos.x; p.y = pos.y;
            p.vx = 0; p.vy = 0;
        });
        this.goalScored = false;
    }

    checkGoal() {
        const goalTop = CANVAS_H / 2 - GOAL_H / 2;
        const goalBot = CANVAS_H / 2 + GOAL_H / 2;
        // Left goal (AI scores)
        if (this.ball.x < PITCH_X && this.ball.y > goalTop && this.ball.y < goalBot) {
            this.score[1]++;
            this.goalScored = true; this.goalTimer = 90;
            sfxGoal(); triggerShake(6, 20); triggerFlash('#f44', 30);
            spawnParticles(PITCH_X, CANVAS_H / 2, 30, '#f44', 5, 50);
            return;
        }
        // Right goal (Player scores)
        if (this.ball.x > PITCH_X + PITCH_W && this.ball.y > goalTop && this.ball.y < goalBot) {
            this.score[0]++;
            this.goalScored = true; this.goalTimer = 90;
            sfxGoal(); triggerShake(8, 25); triggerFlash('#ffd700', 40);
            spawnParticles(PITCH_X + PITCH_W, CANVAS_H / 2, 40, '#ffd700', 6, 60);
            return;
        }
    }

    handleInput() {
        const user = this.getUserPlayer();
        if (!user) return;
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -1;
        if (keys['s'] || keys['arrowdown']) dy = 1;
        if (keys['a'] || keys['arrowleft']) dx = -1;
        if (keys['d'] || keys['arrowright']) dx = 1;
        // Normalize
        if (dx && dy) { dx *= 0.707; dy *= 0.707; }
        const sprint = keys['z'];
        user.move(dx, dy, sprint, this.ball);
        // Pass
        if (keys[' '] && this.ball.owner === user) {
            const nearest = this.players.filter(p => p.team === 0 && p !== user)
                .sort((a, b) => dist(a, user) - dist(b, user))[0];
            if (nearest) {
                const ang = angle(user, nearest);
                const power = 6 + game.stats.passing * 0.3;
                this.ball.kick(ang, power);
                sfxPass();
                spawnParticles(user.x, user.y, 4, '#fff', 2, 15);
            }
            keys[' '] = false;
        }
        // Shoot (Charge Mechanic)
        if (keys['shift'] && this.ball.owner === user) {
            user.isCharging = true;
        } else if (user.isCharging) {
            // RELEASE SHIFT
            const goalTarget = { x: PITCH_X + PITCH_W, y: CANVAS_H / 2 + randRange(-30, 30) };
            const ang = angle(user, goalTarget);

            // Power scales from 5 (tap) to 15+ (full charge)
            const basePower = 7 + game.stats.shotPower * 0.4;
            const finalPower = basePower + (user.shootCharge * 12);

            this.ball.kick(ang, finalPower);
            user.state = 'shoot';
            sfxKick();

            // Dynamic feedback based on charge
            const shake = 2 + (user.shootCharge * 8);
            triggerShake(shake, 10 + user.shootCharge * 10);

            const partCount = 5 + Math.floor(user.shootCharge * 15);
            spawnParticles(user.x, user.y, partCount, user.shootCharge > 0.8 ? '#f00' : '#ff0', 3, 20);

            user.isCharging = false;
            user.shootCharge = 0;
            keys['shift'] = false;
        } else {
            user.isCharging = false;
            user.shootCharge = 0;
        }

        // Tackle
        if (keys['x'] && user.tackleCooldown <= 0) {
            const opp = this.players.filter(p => p.team !== 0).sort((a, b) => dist(a, user) - dist(b, user))[0];
            if (opp && dist(user, opp) < PLAYER_R * 4) {
                if (this.ball.owner === opp) {
                    const successChance = 0.5 + game.stats.strength * 0.03;
                    if (Math.random() < successChance) {
                        this.ball.owner = null; this.ball.free = true;
                        sfxTackle();
                        triggerShake(2, 6);
                        spawnParticles(opp.x, opp.y, 8, '#0f0', 2, 18);
                    }
                }
                user.tackleCooldown = 40;
            }
            keys['x'] = false;
        }
        // Player AI for teammates
        const teamAI = new AIController(0, 1);
        const teammates = this.players.filter(p => p.team === 0 && !p.isUser);
        teammates.forEach(p => {
            if (this.ball.owner === p) {
                // Pass to user or toward goal
                if (Math.random() < 0.02) {
                    const target = Math.random() < 0.5 ? user : { x: PITCH_X + PITCH_W - 50, y: CANVAS_H / 2 };
                    const ang = angle(p, target);
                    this.ball.kick(ang, 6);
                }
            } else if (this.ball.free) {
                const ang = angle(p, this.ball);
                if (dist(p, this.ball) < 200) p.move(Math.cos(ang) * 0.7, Math.sin(ang) * 0.7, false);
            }
        });
    }

    update() {
        if (this.over) return;
        if (this.goalScored) {
            this.goalTimer--;
            if (this.goalTimer <= 0) this.resetAfterGoal();
            return;
        }
        // Timer
        this.timer -= 1 / 60;
        if (this.timer <= 0) { this.timer = 0; this.over = true; return; }
        // Input
        this.handleInput();
        // AI
        this.ai.update(this.players, this.ball);
        // Physics
        this.players.forEach(p => p.update(this.ball));
        this.ball.update();
        // Collisions between players
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                const a = this.players[i], b = this.players[j];
                const d = dist(a, b);
                if (d < PLAYER_R * 2 && d > 0) {
                    const overlap = PLAYER_R * 2 - d;
                    const ang = angle(a, b);
                    a.x -= Math.cos(ang) * overlap * 0.5;
                    a.y -= Math.sin(ang) * overlap * 0.5;
                    b.x += Math.cos(ang) * overlap * 0.5;
                    b.y += Math.sin(ang) * overlap * 0.5;
                }
            }
        }
        this.checkGoal();
    }

    drawPitch() {
        // Stadium Background (Stands/Crowd)
        // Upper Stand
        drawRect(0, 0, CANVAS_W, PITCH_Y, '#111');
        for (let i = 0; i < 40; i++) {
            const cx = (i * 24 + Date.now() / 50) % CANVAS_W;
            const cy = 5 + (i % 3) * 8;
            drawRect(cx, cy, 18, 12, '#222'); // Seats
            // Crowd (dots)
            if (Math.random() < 0.6) {
                const colors = ['#f44', '#4f4', '#44f', '#ff0'];
                drawRect(cx + 4, cy + 2, 4, 4, colors[i % 4]);
            }
        }
        // Lower Stand
        drawRect(0, PITCH_Y + PITCH_H, CANVAS_W, CANVAS_H - (PITCH_Y + PITCH_H), '#111');

        // Floodlights
        const drawLight = (lx, ly) => {
            ctx.fillStyle = '#444';
            ctx.fillRect(lx - 10, ly - 30, 20, 30);
            ctx.fillStyle = '#fff';
            ctx.fillRect(lx - 8, ly - 28, 16, 8);
            // Light beam overlay
            const grad = ctx.createRadialGradient(lx, ly - 24, 5, lx, ly, 150);
            grad.addColorStop(0, 'rgba(255,255,255,0.2)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(lx, ly - 24, 150, 0, Math.PI * 2); ctx.fill();
        };
        drawLight(40, 40);
        drawLight(CANVAS_W - 40, 40);

        // Grass
        drawRect(PITCH_X, PITCH_Y, PITCH_W, PITCH_H, '#2d8a4e');
        // Stripes
        for (let i = 0; i < 10; i++) {
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fillRect(PITCH_X + (PITCH_W / 10) * i, PITCH_Y, PITCH_W / 10, PITCH_H);
            }
        }
        // Border
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.strokeRect(PITCH_X, PITCH_Y, PITCH_W, PITCH_H);
        // Center line
        ctx.beginPath(); ctx.moveTo(CANVAS_W / 2, PITCH_Y); ctx.lineTo(CANVAS_W / 2, PITCH_Y + PITCH_H); ctx.stroke();
        // Center circle
        ctx.beginPath(); ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 60, 0, Math.PI * 2); ctx.stroke();
        drawCircle(CANVAS_W / 2, CANVAS_H / 2, 4, '#fff');
        // Goals
        const goalTop = CANVAS_H / 2 - GOAL_H / 2;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        // Left goal
        ctx.strokeRect(PITCH_X - 25, goalTop, 25, GOAL_H);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(PITCH_X - 25, goalTop, 25, GOAL_H);
        // Right goal
        ctx.strokeRect(PITCH_X + PITCH_W, goalTop, 25, GOAL_H);
        ctx.fillRect(PITCH_X + PITCH_W, goalTop, 25, GOAL_H);
        // Penalty areas
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.strokeRect(PITCH_X, CANVAS_H / 2 - 100, 120, 200);
        ctx.strokeRect(PITCH_X + PITCH_W - 120, CANVAS_H / 2 - 100, 120, 200);
    }

    drawHUD() {
        // Score bar
        drawRect(CANVAS_W / 2 - 140, 2, 280, 34, 'rgba(0,0,0,0.7)');
        drawText(`${game.playerCountry.name}`, CANVAS_W / 2 - 60, 26, 14, '#fff');
        drawText(`${this.score[0]} - ${this.score[1]}`, CANVAS_W / 2, 26, 22, '#ff0');
        drawText('CPU', CANVAS_W / 2 + 70, 26, 14, '#e44');
        // Timer
        const mins = Math.floor(this.timer / 60);
        const secs = Math.floor(this.timer % 60);
        drawText(`${mins}:${secs.toString().padStart(2, '0')}`, CANVAS_W / 2, 54, 14, '#ccc');
        // Stamina bar
        const user = this.getUserPlayer();
        if (user) {
            drawRect(20, CANVAS_H - 30, 120, 12, '#333');
            drawRect(20, CANVAS_H - 30, 120 * (user.stamina / user.maxStamina), 12, user.stamina > 30 ? '#0a0' : '#f00');
            drawText('STA', 14, CANVAS_H - 20, 10, '#aaa', 'left');
        }
        // Controls hint
        drawText('WASD:Move  SPACE:Pass  SHIFT:Shoot  X:Tackle  Z:Sprint', CANVAS_W / 2, CANVAS_H - 8, 11, '#666');
    }

    draw() {
        applyShake();
        drawRect(0, 0, CANVAS_W, CANVAS_H, '#1a3a1a');
        this.drawPitch();
        // Sort by Y for depth
        const entities = [...this.players];
        entities.sort((a, b) => a.y - b.y);
        entities.forEach(p => p.draw());
        this.ball.draw();
        updateParticles();
        updateFlash();
        this.drawHUD();
        resetShake();
        // Goal flash
        if (this.goalScored) {
            ctx.fillStyle = `rgba(255,255,0,${0.3 + Math.sin(Date.now() / 100) * 0.2})`;
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
            drawText('GOAL!', CANVAS_W / 2, CANVAS_H / 2, 60, '#fff');
        }
    }
}
