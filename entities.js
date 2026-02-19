// ========== ENTITIES.JS — Player, Ball, AI Team ==========

class Ball {
    constructor() { this.reset(); }
    reset() {
        this.x = CANVAS_W / 2; this.y = CANVAS_H / 2;
        this.vx = 0; this.vy = 0;
        this.owner = null; this.free = true;
        this.shotPower = 0;
    }
    update() {
        if (this.owner) {
            const off = 18;
            this.x = this.owner.x + Math.cos(this.owner.facing) * off;
            this.y = this.owner.y + Math.sin(this.owner.facing) * off;
            this.vx = 0; this.vy = 0;
        } else {
            this.x += this.vx; this.y += this.vy;
            this.vx *= 0.98; this.vy *= 0.98; // Changed from BALL_FRICTION to 0.98 as per instruction
            if (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) { this.vx = 0; this.vy = 0; this.free = true; }
            // Pitch bounds
            if (this.y < PITCH_Y + BALL_R) { this.y = PITCH_Y + BALL_R; this.vy *= -0.6; }
            if (this.y > PITCH_Y + PITCH_H - BALL_R) { this.y = PITCH_Y + PITCH_H - BALL_R; this.vy *= -0.6; }
            // Side bounds (but allow goal area)
            const goalTop = CANVAS_H / 2 - GOAL_H / 2;
            const goalBot = CANVAS_H / 2 + GOAL_H / 2;
            if (this.x < PITCH_X + BALL_R && (this.y < goalTop || this.y > goalBot)) { this.x = PITCH_X + BALL_R; this.vx *= -0.6; }
            if (this.x > PITCH_X + PITCH_W - BALL_R && (this.y < goalTop || this.y > goalBot)) { this.x = PITCH_X + PITCH_W - BALL_R; this.vx *= -0.6; }
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(0, BALL_R, BALL_R * 1.2, BALL_R * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        // Body (Circle for soccer ball)
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, BALL_R, 0, Math.PI * 2); ctx.fill();
        // Outline
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.stroke();
        // Simple soccer ball pattern (pentagons)
        ctx.fillStyle = '#333';
        for (let i = 0; i < 5; i++) {
            const ang = (i / 5) * Math.PI * 2 + (Date.now() / 100);
            ctx.beginPath();
            ctx.arc(Math.cos(ang) * BALL_R * 0.6, Math.sin(ang) * BALL_R * 0.6, BALL_R * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.beginPath(); ctx.arc(0, 0, BALL_R * 0.25, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    kick(ang, power) {
        this.owner = null; this.free = false;
        this.vx = Math.cos(ang) * power;
        this.vy = Math.sin(ang) * power;
    }
}

class Player {
    constructor(x, y, team, isUser = false) {
        this.x = x; this.y = y; this.team = team;
        this.vx = 0; this.vy = 0;
        this.isUser = isUser;
        this.facing = team === 0 ? 0 : Math.PI;
        this.speed = 1.6; this.sprintMult = 1.5;
        this.stamina = 100; this.maxStamina = 100;
        this.sprinting = false;
        this.tackleCooldown = 0;
        this.animFrame = 0; this.animTimer = 0;
        this.state = 'idle'; // idle, run, shoot, tackle

        // Charge Shooting
        this.isCharging = false;
        this.shootCharge = 0;
        this.chargeRate = 0.02; // Matches 60fps, 1s for full charge
    }
    update(ball) {
        // Stamina regen
        if (!this.sprinting) this.stamina = Math.min(this.maxStamina, this.stamina + 0.15);
        if (this.tackleCooldown > 0) this.tackleCooldown--;
        // Friction - Apply global FRICTION (0.85)
        this.vx *= FRICTION; this.vy *= FRICTION;
        // Snap to stop if slow
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        if (Math.abs(this.vy) < 0.1) this.vy = 0;

        this.x += this.vx; this.y += this.vy;

        // Charging logic
        if (this.isCharging) {
            this.shootCharge = Math.min(1, this.shootCharge + this.chargeRate);
        } else {
            this.shootCharge = 0;
        }

        // Clamp to pitch
        this.x = clamp(this.x, PITCH_X + PLAYER_R, PITCH_X + PITCH_W - PLAYER_R);
        this.y = clamp(this.y, PITCH_Y + PLAYER_R, PITCH_Y + PITCH_H - PLAYER_R);
        // Facing direction
        if (Math.abs(this.vx) > 0.3 || Math.abs(this.vy) > 0.3) {
            this.facing = Math.atan2(this.vy, this.vx);
            this.state = 'run';
        } else { this.state = 'idle'; }
        // Animation
        this.animTimer++;
        if (this.animTimer > 8) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 4; }
        // Pick up ball - Slightly larger radius for "magnetic" feel
        if (ball.free && dist(this, ball) < PLAYER_R + BALL_R + 12) {
            ball.owner = this; ball.free = false;
        }
    }
    move(dx, dy, sprint, ball) {
        let spd = this.speed;
        this.sprinting = false;
        // Slow down when dribbling (slightly more pronounced)
        if (ball && ball.owner === this) spd *= 0.65;
        // If charging, slow down even more
        if (this.isCharging) spd *= 0.4;

        if (sprint && this.stamina > 0 && !this.isCharging) { spd *= this.sprintMult; this.stamina -= 0.5; this.sprinting = true; }

        // Higher acceleration for snappier response
        const acc = 0.5;
        this.vx += dx * spd * acc;
        this.vy += dy * spd * acc;
    }
    draw() {
        drawPlayerSprite(this.x, this.y, this.team, this.facing, this.animFrame, this.state, this.isUser);

        // Draw Charge Bar above head for user
        if (this.isUser && this.isCharging) {
            const bx = this.x - 20, by = this.y - 45, bw = 40, bh = 5;
            drawRect(bx, by, bw, bh, 'rgba(0,0,0,0.5)');
            drawRect(bx, by, bw * this.shootCharge, bh, this.shootCharge > 0.8 ? '#f00' : '#ff0');
        }
    }
}

class AIController {
    constructor(team, difficulty = 1) {
        this.team = team;
        this.difficulty = difficulty; // 1-4
        this.thinkTimer = 0;
        this.targets = {};
    }
    update(players, ball, goalX) {
        this.thinkTimer++;
        if (this.thinkTimer < 8 / this.difficulty) return; // Think slower at low difficulty
        this.thinkTimer = 0;
        const myPlayers = players.filter(p => p.team === this.team);
        const oppGoalX = this.team === 1 ? PITCH_X + 30 : PITCH_X + PITCH_W - 30;
        for (const p of myPlayers) {
            if (ball.owner === p) {
                // Has ball: move toward opponent goal and shoot when close
                const distToGoal = Math.abs(p.x - oppGoalX);
                if (distToGoal < 200) {
                    // Shoot!
                    const ang = angle(p, { x: oppGoalX, y: CANVAS_H / 2 + randRange(-40, 40) });
                    const power = 8 + this.difficulty * 2;
                    ball.kick(ang, power);
                    p.state = 'shoot';
                } else {
                    // Dribble toward goal
                    const ang = angle(p, { x: oppGoalX, y: CANVAS_H / 2 });
                    p.move(Math.cos(ang), Math.sin(ang), Math.random() < 0.3 * this.difficulty);
                }
            } else if (ball.free || (ball.owner && ball.owner.team !== this.team)) {
                // Chase ball
                const d = dist(p, ball);
                if (d < 300 / myPlayers.length || d === Math.min(...myPlayers.map(pp => dist(pp, ball)))) {
                    const ang = angle(p, ball);
                    p.move(Math.cos(ang), Math.sin(ang), d > 100);
                }
            } else {
                // Positioning: spread out
                const homeX = this.team === 1 ? PITCH_X + PITCH_W * 0.65 : PITCH_X + PITCH_W * 0.35;
                const homeY = PITCH_Y + PITCH_H * (0.2 + 0.6 * (myPlayers.indexOf(p) / (myPlayers.length - 1 || 1)));
                const ang = angle(p, { x: homeX, y: homeY });
                if (dist(p, { x: homeX, y: homeY }) > 30) {
                    p.move(Math.cos(ang) * 0.5, Math.sin(ang) * 0.5, false);
                }
            }
            // Tackle attempt
            if (ball.owner && ball.owner.team !== this.team && dist(p, ball.owner) < PLAYER_R * 3 && p.tackleCooldown <= 0) {
                if (Math.random() < 0.02 * this.difficulty) {
                    ball.owner = null; ball.free = true;
                    p.tackleCooldown = 60;
                }
            }
        }
    }
}
