// ========== GAME.JS — Main Game Object, Loop, Save/Load ==========

const STORY_LINES = {
    0: [
        { speaker: 'Coach', text: 'Welcome to Grassfield Town, kid. This is where legends start. Nobody knows your name yet — but they will.' },
        { speaker: 'You', text: "I didn't come this far to play it safe. Let's go." },
        { speaker: 'Coach', text: 'That\'s what I like to hear. Win 3 matches here and earn your first medal. Then we move on.' },
    ],
    1: [
        { speaker: 'Rival', text: "So you're the one everyone's been talking about. You won't find Riverside as easy as Grassfield." },
        { speaker: 'You', text: "I've been training. Bring it." },
        { speaker: 'Coach', text: "The competition gets real here. Stay sharp, trust your technique." },
    ],
    2: [
        { speaker: 'Reporter', text: "The kid from the grassroots is making waves. Iron Borough is watching." },
        { speaker: 'You', text: "Let them watch. I play my game." },
        { speaker: 'Coach', text: "Tier 2 football now. These teams have tactics. Use your upgrades wisely." },
    ],
    3: [
        { speaker: 'Rival', text: "Capital District doesn't fall to newcomers. This is elite level." },
        { speaker: 'You', text: "Elite is exactly where I belong." },
    ],
    4: [
        { speaker: 'Coach', text: "The Commonwealth Arena... This is what we trained for. Every nation's best is here." },
        { speaker: 'You', text: "One more step to glory." },
    ],
    5: [
        { speaker: 'Announcer', text: "Ladies and gentlemen... the Commonwealth Gold Final. This is the moment." },
        { speaker: 'You', text: "Everything I've done has led to this pitch. Time to make history." },
    ],
};

const game = {
    state: GameState.TITLE,
    level: 1,
    xp: 0,
    coins: 200,
    assets: {
        titleBg: new Image(),
    },
    skillPoints: 3,
    currentCity: 0,
    cityWins: [0, 0, 0, 0, 0, 0],
    medals: [],
    purchased: [],
    playerCountry: null,
    lastLevelUp: false,
    trainingType: 0, // alternates between 0=shooting, 1=sprint
    travelPending: false,
    travelFrom: 0,
    travelTo: 0,
    hasSave: false,
    match: null,
    lastResult: null,
    dialogueShown: [],
    stats: {
        speed: 5,
        shotPower: 5,
        shotAccuracy: 5,
        passing: 5,
        stamina: 5,
        strength: 5,
        technique: 5,
    },
    assets: {
        titleBg: new Image(),
        trainingBg: new Image(),
        trainingObjs: new Image(),
    },

    // Transition System
    transition: {
        active: false,
        timer: 0,
        duration: 30, // frames
        targetState: null,
        mode: 'out', // 'out' (fade to black) or 'in' (fade from black)
    },

    xpNeeded() { return 100 + this.level * 25; },

    checkLevelUp() {
        while (this.xp >= this.xpNeeded()) {
            this.xp -= this.xpNeeded();
            this.level++;
            this.skillPoints++;
            this.lastLevelUp = true;
        }
    },

    selectCountry(index) {
        initAudio();
        sfxSelect();
        this.playerCountry = COUNTRIES[index];
        // Apply country bonus to base stats
        for (const [stat, val] of Object.entries(this.playerCountry.bonus)) {
            if (this.stats[stat] !== undefined) this.stats[stat] += val;
        }
        // Show intro dialogue
        if (!this.dialogueShown.includes(0)) {
            this.dialogueShown.push(0);
            startDialogue(STORY_LINES[0]);
            this.state = GameState.DIALOGUE;
        } else {
            this.state = GameState.CITY_MAP;
        }
        this.saveGame();
    },

    changeState(newState) {
        if (this.state === newState) return;
        this.transition.active = true;
        this.transition.timer = 0;
        this.transition.mode = 'out';
        this.transition.targetState = newState;
    },

    startMatch(cityIndex) {
        initAudio();
        const city = CITIES[cityIndex];
        this.match = new Match(this.playerCountry, city.difficulty);
        this.changeState(GameState.MATCH);
    },

    endMatch() {
        const won = this.match.score[0] > this.match.score[1];
        const draw = this.match.score[0] === this.match.score[1];
        const city = CITIES[this.currentCity];
        const tierMult = city.tier;

        let xpEarned = won ? Math.floor(150 * tierMult) : draw ? Math.floor(75 * tierMult) : Math.floor(40 * tierMult);
        let coinsEarned = won ? Math.floor(75 * tierMult) : draw ? Math.floor(30 * tierMult) : Math.floor(15 * tierMult);

        sfxWhistle();
        this.xp += xpEarned;
        this.coins += coinsEarned;
        sfxCoin();

        let levelUp = false;
        this.lastLevelUp = false;
        this.checkLevelUp();
        levelUp = this.lastLevelUp;
        if (levelUp) sfxLevelUp();

        let medalEarned = null;
        if (won) {
            this.cityWins[this.currentCity]++;

            // Completion logic (3 wins)
            if (this.cityWins[this.currentCity] >= 3) {
                const medalTypes = ['Bronze', 'Bronze', 'Silver', 'Silver', 'Gold', 'Platinum'];
                medalEarned = medalTypes[this.currentCity] || 'Gold';

                // Only push if not already won this city's medal
                if (!this.medals.find(m => m.city === city.name)) {
                    this.medals.push({ city: city.name, type: medalEarned });
                }

                // Trigger formal travel to next city
                if (this.currentCity < CITIES.length - 1) {
                    this.travelPending = true;
                    this.travelFrom = this.currentCity;
                    this.travelTo = this.currentCity + 1;
                    // Note: currentCity index actually increments in travel system or here
                    // To keep it simple, we'll increment here and the travel system shows the transition
                    this.currentCity++;

                    if (STORY_LINES[this.currentCity] && !this.dialogueShown.includes(this.currentCity)) {
                        this.dialogueShown.push(this.currentCity);
                        this.pendingDialogue = STORY_LINES[this.currentCity];
                    }
                }
            } else if (this.cityWins[this.currentCity] === 1) {
                // First win unlocks the next city for selection even if not "travelled" yet
                console.log("New City Unlocked for selection!");
            }
        }

        this.lastResult = {
            score: [...this.match.score],
            xpEarned, coinsEarned, levelUp, medalEarned,
        };
        this.match = null;
        this.state = GameState.MATCH_RESULT;
        this.saveGame();
    },

    saveGame() {
        const data = {
            level: this.level, xp: this.xp, coins: this.coins,
            skillPoints: this.skillPoints, currentCity: this.currentCity,
            cityWins: this.cityWins, medals: this.medals,
            purchased: this.purchased, stats: this.stats,
            countryIndex: COUNTRIES.indexOf(this.playerCountry),
            dialogueShown: this.dialogueShown,
        };
        localStorage.setItem('commonwealthKick', JSON.stringify(data));
        this.hasSave = true;
    },

    loadGame() {
        const raw = localStorage.getItem('commonwealthKick');
        if (!raw) return;
        const data = JSON.parse(raw);
        Object.assign(this, {
            level: data.level, xp: data.xp, coins: data.coins,
            skillPoints: data.skillPoints, currentCity: data.currentCity,
            cityWins: data.cityWins, medals: data.medals,
            purchased: data.purchased, stats: data.stats,
            dialogueShown: data.dialogueShown || [],
        });
        this.playerCountry = COUNTRIES[data.countryIndex];
    },

    init() {
        this.assets.titleBg.src = 'assets/title_bg.png';
        this.assets.trainingBg.src = 'assets/training_bg.png';
        this.assets.trainingObjs.src = 'assets/training_objects.png';
        this.hasSave = !!localStorage.getItem('commonwealthKick');
    }
};

// ========== MAIN LOOP ==========
function gameLoop() {
    // Clear
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Update & Draw current state
    switch (game.state) {
        case GameState.TITLE: drawTitleScreen(); break;
        case GameState.COUNTRY_SELECT: drawCountrySelect(); break;
        case GameState.CITY_MAP: drawCityMap(); break;
        case GameState.MATCH:
            if (game.match) {
                game.match.update();
                game.match.draw();
                break;

        case GameState.UPGRADE:
            drawUpgradeScreen();
            break;

        case GameState.STORE:
            drawStore();
            break;

        case GameState.TRAINING:
            initAudio();
            if (game.trainingType === 0) {
                if (!training) startTraining();
                updateTraining();
            } else {
                if (!sprintGame) startSprintGame();
                updateSprintGame();
            }
            break;

        case GameState.DIALOGUE:
            updateDialogue();
            break;

        case 'travel':
            const travelDone = updateTravel();
            if (travelDone) {
                if (game.pendingDialogue) {
                    startDialogue(game.pendingDialogue);
                    game.pendingDialogue = null;
                    game.state = GameState.DIALOGUE;
                } else {
                    game.state = GameState.CITY_MAP;
                }
            }
            break;
    }

    // Reset click state at end of frame
    mouse.clicked = false;

    requestAnimationFrame(gameLoop);
}

// ========== BOOT ==========
game.init();
gameLoop();
