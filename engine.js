// ========== ENGINE.JS — Core Engine, Input, Constants ==========

const CANVAS_W = 960, CANVAS_H = 540;
const PITCH_X = 60, PITCH_Y = 40, PITCH_W = 840, PITCH_H = 460;
const GOAL_W = 80, GOAL_H = 120;
const MATCH_TIME = 60; // 1 minute matches
const PLAYER_R = 14, BALL_R = 6;
const FRICTION = 0.85, BALL_FRICTION = 0.98;

// Countries
const COUNTRIES = [
    { name: 'England', flag: '#fff', accent: '#c8102e', bonus: { passing: 2 }, trait: 'Precision Long Ball', traitDesc: '+15% pass accuracy' },
    { name: 'Jamaica', flag: '#009b3a', accent: '#fed100', bonus: { speed: 2 }, trait: 'Sprint Burst', traitDesc: 'Speed boost cooldown -30%' },
    { name: 'Nigeria', flag: '#008751', accent: '#fff', bonus: { strength: 2 }, trait: 'Physical Duel', traitDesc: '+20% tackle success' },
    { name: 'Australia', flag: '#00008b', accent: '#ffcd00', bonus: { stamina: 2 }, trait: 'Iron Lungs', traitDesc: 'Stamina drains 25% slower' },
    { name: 'India', flag: '#ff9933', accent: '#138808', bonus: { technique: 2 }, trait: 'Curve Shot', traitDesc: '+15% shot accuracy' },
];

// Input
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// Mouse
let mouse = { x: 0, y: 0, clicked: false, down: false };
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (CANVAS_W / r.width);
    mouse.y = (e.clientY - r.top) * (CANVAS_H / r.height);
});
canvas.addEventListener('mousedown', () => { mouse.clicked = true; mouse.down = true; });
canvas.addEventListener('mouseup', () => { mouse.down = false; });

// Utility
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function angle(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function randRange(lo, hi) { return lo + Math.random() * (hi - lo); }

function drawText(text, x, y, size, color, align = 'center', font = 'monospace') {
    ctx.font = `bold ${size}px ${font}`;
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawButton(text, x, y, w, h, hover) {
    const isHover = mouse.x > x && mouse.x < x + w && mouse.y > y && mouse.y < y + h;
    drawRect(x, y, w, h, isHover ? '#555' : '#333');
    ctx.strokeStyle = isHover ? '#fff' : '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    drawText(text, x + w / 2, y + h / 2 + 6, 18, '#fff');
    return isHover && mouse.clicked;
}

// Game State
const GameState = {
    TITLE: 'title',
    COUNTRY_SELECT: 'country_select',
    CITY_MAP: 'city_map',
    PRE_MATCH: 'pre_match',
    MATCH: 'match',
    MATCH_RESULT: 'match_result',
    UPGRADE: 'upgrade',
    STORE: 'store',
    TRAINING: 'training',
    DIALOGUE: 'dialogue',
};
