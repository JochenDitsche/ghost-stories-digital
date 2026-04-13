// Spiel-Konfiguration
const VILLAGE_TILES = [
    { name: "Buddha-Tempel", token: "🛕", color: "#4ecdc4", buddha: true },
    { name: "Festung", token: "🏯", color: "#ffd93d" },
    { name: "Friedhof", token: "⚰️", color: "#95a5a6" },
    { name: "Altar", token: "⛩️", color: "#e74c3c" },
    { name: "Wetterturm", token: "🌪️", color: "#9b59b6" },
    { name: "Höhle", token: "🗿", color: "#34495e" },
    { name: "Gebete", token: "🕯️", color: "#f39c12", start: true },
    { name: "Totenacker", token: "🪦", color: "#7f8c8d" },
    { name: "Geistertor", token: "🚪", color: "#c0392b", dangerous: true }
];

const MONKS = [
    { 
        name: "Blauer Mönch (Xuán Wù)", 
        shortName: "Blauer Mönch",
        color: "#3498db", 
        ability: "Windläufer", 
        abilityDesc: "Fliege zu JEDEM Feld (1x/Runde)",
        health: 4,
        canFly: true
    },
    { 
        name: "Grüner Mönch (Qīng Lóng)", 
        shortName: "Grüner Mönch",
        color: "#27ae60", 
        ability: "Heiler", 
        abilityDesc: "Heile Dorf oder Qi (1x/Runde)",
        health: 4,
        canHeal: true
    },
    { 
        name: "Gelber Mönch (Huáng Lóng)", 
        shortName: "Gelber Mönch",
        color: "#f1c40f", 
        ability: "Waffenmeister", 
        abilityDesc: "Wirf 4 statt 3 Würfel",
        health: 4,
        extraDie: true
    },
    { 
        name: "Roter Mönch (Zhū Què)", 
        shortName: "Roter Mönch",
        color: "#e74c3c", 
        ability: "Flammenklinge", 
        abilityDesc: "2 Geister pro Erfolg",
        health: 4,
        doubleDamage: true
    }
];

class GhostStoriesGame {
    constructor() {
        this.villageHealth = 4;
        this.yinYang = 4;
        this.taoTokens = 0;
        this.buddhaCount = 0;
        this.ghostCount = 0;
        this.deckCount = 20;
        this.incarnationLevel = 0;
        this.currentMonk = 0;
        this.phase = 'yin';
        this.gameOver = false;
        this.selectedTile = null;
        this.abilityUsed = [false, false, false, false];
        
        this.villages = VILLAGE_TILES.map((tile, index) => ({
            ...tile,
            id: index,
            haunted: false,
            ghostLevel: 0,
            monks: [],
            buddha: tile.buddha || false
        }));
        
        this.monks = MONKS.map((monk, index) => ({
            ...monk,
            id: index,
            position: 6,
            health: 4,
            active: index === 0,
            dead: false
        }));

        this.villages[6].monks = [0, 1, 2, 3];
        
        this.init();
    }

    init() {
        this.renderBoard();
        this.renderMonks();
        this.updateStats();
        this.log("🎮 Ghost Stories Enhanced gestartet!", "player");
        this.log("🎯 Besiege Wu-Feng und seine Geisterhorden!", "player");
        this.log("👻 Yin-Phase: Ziehe Geister vom Deck!", "ghost");
    }

    renderBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = this.villages.map((village, index) => `
            <div class="village-tile ${village.haunted ? 'haunted' : ''} ${this.selectedTile === index ? 'selected' : ''}" 
                 onclick="game.selectTile(${index})"
                 style="border-color: ${village.color}">
                <div class="tile-header">
                    <span class="village-name">${village.name}</span>
                    ${village.ghostLevel > 0 ? `<span class="ghost-badge">${village.ghostLevel}</span>` : ''}
                </div>
                <div class="village-token">${village.token}</div>
                <div class="tile-footer">
                    ${village.buddha ? '<div class="buddha-indicator">🛕</div>' : ''}
                    <div class="monks-on-tile">
                        ${village.monks.map(m => {
                            const monk = this.monks[m];
                            return `<div class="monk-icon" style="background: ${monk.color}; ${monk.dead ? 'opacity:0.3' : ''}" title="${monk.shortName}"></div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderMonks() {
        const container = document.getElementById('monks-container');
        container.innerHTML = this.monks.map((monk, index) => `
            <div class="monk-card ${monk.active ? 'active' : ''} ${monk.dead ? 'dead' : ''}" 
                 style="border-color: ${monk.color}; color: ${monk.color}"
                 onclick="game.selectMonk(${index})">
                <div class="monk-header">
                    <span class="monk-name">${monk.shortName}</span>
                    <span class="monk-health">${'❤️'.repeat(monk.health)}${'🖤'.repeat(4-monk.health)}</span>
                </div>
                <div class="monk-ability">${monk.ability}: ${monk.abilityDesc}</div>
                <div class="monk-position">📍 ${this.villages[monk.position].name}</div>
            </div>
        `).join('');
    }

    updateStats() {
        document.getElementById('village-health').textContent = this.villageHealth;
        document.getElementById('yin-yang').textContent = this.yinYang;
        document.getElementById('tao-tokens').textContent = this.taoTokens;
        document.getElementById('buddha-count').textContent = this.buddhaCount;
        document.getElementById('ghost-count').textContent = this.ghostCount;
        document.getElementById('deck-count').textContent = this.deckCount;
        document.getElementById('deck-remaining').textContent = this.deckCount;
        document.getElementById('incarnation').textContent = this.incarnationLevel;

        const phaseIndicator = document.getElementById('phase-indicator');
        if (this.phase === 'yin') {
            phaseIndicator.textContent = '🌙 Yin-Phase: Ziehe Geister';
            phaseIndicator.style.background = 'rgba(233, 69, 96, 0.3)';
            phaseIndicator.style.borderColor = '#e94560';
        } else {
            phaseIndicator.textContent = '☀️ Yang-Phase: Mönch agiert';
            phaseIndicator.style.background = 'rgba(78, 205, 196, 0.3)';
            phaseIndicator.style.borderColor = '#4ecdc4';
        }

        document.getElementById('btn-draw').disabled = this.phase !== 'yin' || this.gameOver;
        document.getElementById('btn-move').disabled = this.phase !== 'yang' || this.gameOver;
        document.getElementById('btn-exorcise').disabled = this.phase !== 'yang' || this.gameOver;
        document.getElementById('btn-ability').disabled = this.phase !== 'yang' || this.gameOver || this.abilityUsed[this.currentMonk];
        document.getElementById('btn-buddha').disabled = this.phase !== 'yang' || this.gameOver || this.buddhaCount < 1;
        document.getElementById('btn-meditate').disabled = this.phase !== 'yang' || this.gameOver;
    }

    log(message, type = 'default') {
        const logArea = document.getElementById('log-area');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        logArea.insertBefore(entry, logArea.firstChild);
        if (logArea.children.length > 20) {
            logArea.removeChild(logArea.lastChild);
        }
    }

    selectTile(index) {
        if (this.gameOver) return;
        this.selectedTile = index;
        this.renderBoard();
    }

    selectMonk(index) {
        if (this.gameOver || this.monks[index].dead) return;
        this.monks[this.currentMonk].active = false;
        this.currentMonk = index;
        this.monks[index].active = true;
        this.renderMonks();
        
        const monk = this.monks[index];
        document.getElementById('ability-hint').innerHTML = `
            <strong>${monk.ability}:</strong> ${monk.abilityDesc}
            ${this.abilityUsed[index] ? '<br><em>(Bereits eingesetzt)</em>' : ''}
        `;
    }

    drawGhostPhase() {
        if (this.gameOver || this.phase !== 'yin') return;
        
        const ghostCount = this.monks.filter(m => !m.dead).length;
        
        for (let i = 0; i < ghostCount; i++) {
            if (this.deckCount <= 0) break;
            
            this.deckCount--;
            
            if (this.deckCount === 0) {
                this.incarnationLevel = 1;
                this.log("🔥 WU-FENG ERSCHEINT! Die Inkarnation des Bösen!", "warning");
                this.spawnGhost(true);
            } else {
                this.spawnGhost(false);
            }
        }
        
        this.moveGhosts();
        
        this.phase = 'yang';
        this.abilityUsed = [false, false, false, false];
        this.log("☀️ Yang-Phase beginnt! Mönche können handeln.", "player");
        this.updateStats();
    }

    spawnGhost(isWuFeng = false) {
        let spawnTile;
        if (Math.random() < 0.3) {
            spawnTile = 8;
        } else {
            spawnTile = Math.floor(Math.random() * 9);
        }
        
        this.villages[spawnTile].haunted = true;
        this.villages[spawnTile].ghostLevel++;
        this.ghostCount++;
        
        const tileName = this.villages[spawnTile].name;
        if (isWuFeng) {
            this.log(`🔥 Wu-Feng erscheint in ${tileName}!`, "warning");
        } else {
            this.log(`👻 Geister erscheinen in ${tileName}!`, "ghost");
        }
        
        if (this.villages[spawnTile].ghostLevel >= 3) {
            this.villageHealth--;
            this.villages[spawnTile].ghostLevel = 3;
            this.log(`💀 ${tileName} wurde überrannt! Dorf verliert 1 Gesundheit.`, "warning");
            
            if (this.villageHealth <= 0) {
                this.endGame(false);
            }
        }
    }

    moveGhosts() {
        for (let i = 0; i < this.villages.length; i++) {
            if (this.villages[i].ghostLevel > 0 && Math.random() < 0.3) {
                const adjacent = this.getAdjacentTiles(i);
                if (adjacent.length > 0) {
                    const target = adjacent[Math.floor(Math.random() * adjacent.length)];
                    if (this.villages[i].ghostLevel > 1) {
                        this.villages[i].ghostLevel--;
                        this.villages[target].haunted = true;
                        this.villages[target].ghostLevel++;
                        this.log(`👻 Geister wandern von ${this.villages[i].name} nach ${this.villages[target].name}`, "ghost");
                    }
                }
            }
        }
        this.renderBoard();
    }

    getAdjacentTiles(index) {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const adjacent = [];
        
        const directions = [[-1,0], [1,0], [0,-1], [0,1]];
        for (let [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 3) {
                adjacent.push(newRow * 3 + newCol);
            }
        }
        return adjacent;
    }

    moveMonk() {
        if (this.gameOver || this.phase !== 'yang') return;
        
        const monk = this.monks[this.currentMonk];
        
        if (monk.dead) {
            this.log("💀 Dieser Mönch ist bereits tot!", "warning");
            return;
        }
        
        if (monk.canFly && !this.abilityUsed[this.currentMonk]) {
            this.log(`✨ ${monk.shortName} nutzt Windläufer und fliegt zu einem beliebigen Feld!`, "success");
            this.abilityUsed[this.currentMonk] = true;
        }
        
        if (this.selectedTile === null) {
            this.log("🎯 Wähle erst ein Zielfeld (klicke auf ein Dorf)!", "warning");
            return;
        }
        
        this.villages[monk.position].monks = this.villages[monk.position].monks.filter(m => m !== monk.id);
        
        monk.position = this.selectedTile;
        this.villages[this.selectedTile].monks.push(monk.id);
        
        this.log(`${monk.shortName} bewegt sich nach ${this.villages[this.selectedTile].name}`, "player");
        
        this.selectedTile = null;
        this.renderBoard();
        this.renderMonks();
        this.nextMonk();
    }

    exorcise() {
        if (this.gameOver || this.phase !== 'yang') return;
        
        const monk = this.monks[this.currentMonk];
        const village = this.villages[monk.position];
        
        if (monk.dead) {
            this.log("💀 Tote Mönche können nicht exorzieren!", "warning");
            return;
        }
        
        if (!village.haunted) {
            this.log("✨ Hier gibt es keine Geister zu exorzieren!", "warning");
            return;
        }
        
        const diceCount = monk.extraDie ? 4 : 3;
        let rolls = [];
        let successes = 0;
        
        for (let i = 0; i < diceCount; i++) {
            const roll = Math.floor(Math.random() * 6) + 1;
            rolls.push(roll);
            if (roll >= 4) successes++;
        }
        
        this.log(`🎲 ${monk.shortName} würfelt: [${rolls.join(', ')}] → ${successes} Erfolge`, "player");
        
        if (successes > 0) {
            const damage = monk.doubleDamage ? Math.min(successes * 2, village.ghostLevel) : Math.min(successes, village.ghostLevel);
            
            for (let i = 0; i < damage; i++) {
                if (village.ghostLevel > 0) {
                    village.ghostLevel--;
                    this.ghostCount--;
                    
                    if (Math.random() < 0.3) {
                        this.taoTokens++;
                        this.log("📿 Tao-Token gefunden!", "success");
                    }
                }
            }
            
            if (village.ghostLevel <= 0) {
                village.haunted = false;
                village.ghostLevel = 0;
                this.log(`✅ ${village.name} wurde gereinigt!`, "success");
            } else {
                this.log(`⚔️ ${damage} Geister besiegt! Noch ${village.ghostLevel} übrig.`, "success");
            }
            
            this.updateStats();
            this.renderBoard();
        } else {
            this.log("❌ Exorzismus fehlgeschlagen!", "warning");
        }
        
        this.nextMonk();
    }

    useAbility() {
        if (this.gameOver || this.phase !== 'yang') return;
        
        const monk = this.monks[this.currentMonk];
        
        if (monk.dead) {
            this.log("💀 Tote Mönche können keine Fähigkeiten nutzen!", "warning");
            return;
        }
        
        if (this.abilityUsed[this.currentMonk]) {
            this.log("⚠️ Fähigkeit wurde bereits diese Runde eingesetzt!", "warning");
            return;
        }
        
        this.abilityUsed[this.currentMonk] = true;
        
        if (monk.canHeal) {
            if (this.villageHealth < 4) {
                this.villageHealth++;
                this.log(`💚 ${monk.shortName} heilt 1 Dorfbewohner!`, "success");
            } else if (monk.health < 4) {
                monk.health++;
                this.log(`💚 ${monk.shortName} heilt sich selbst (+1 Qi)!`, "success");
            }
        }
        
        if (monk.canFly) {
            this.log(`✨ ${monk.shortName} aktiviert Windläufer! Kann jetzt zu einem beliebigen Feld fliegen.`, "success");
        }
        
        if (monk.extraDie) {
            this.log(`⚔️ ${monk.shortName} aktiviert Waffenmeister! Wirft beim nächsten Exorzismus 4 Würfel.`, "success");
        }
        
        if (monk.doubleDamage) {
            this.log(`🔥 ${monk.shortName} aktiviert Flammenklinge! Zerstört 2 Geister pro Erfolg.`, "success");
        }
        
        this.updateStats();
        this.renderMonks();
    }

    placeBuddha() {
        if (this.gameOver || this.phase !== 'yang' || this.buddhaCount < 1) return;
        
        const monk = this.monks[this.currentMonk];
        
        if (this.selectedTile === null) {
            this.log("🎯 Wähle ein Feld für den Buddha!", "warning");
            return;
        }
        
        this.buddhaCount--;
        this.villages[this.selectedTile].buddha = true;
        
        if (this.villages[this.selectedTile].ghostLevel > 0) {
            this.villages[this.selectedTile].ghostLevel = 0;
            this.villages[this.selectedTile].haunted = false;
            this.ghostCount--;
            this.log(`🛕 Buddha in ${this.villages[this.selectedTile].name} platziert! Geister wurden gebannt.`, "success");
        } else {
            this.log(`🛕 Buddha in ${this.villages[this.selectedTile].name} platziert! Schützt vor Geistern.`, "success");
        }
        
        this.selectedTile = null;
        this.updateStats();
        this.renderBoard();
        this.nextMonk();
    }

    meditate() {
        if (this.gameOver || this.phase !== 'yang') return;
        
        const monk = this.monks[this.currentMonk];
        
        if (monk.dead) {
            this.log("🧘 Tote Mönche können nicht meditieren!", "warning");
            return;
        }
        
        this.yinYang = Math.min(this.yinYang + 1, 8);
        this.log(`🧘 ${monk.shortName} meditiert und sammelt Qi. Yin-Yang: ${this.yinYang}`, "success");
        
        this.updateStats();
        this.nextMonk();
    }

    nextMonk() {
        let allPlayed = true;
        let nextIndex = this.currentMonk;
        
        for (let i = 1; i <= 4; i++) {
            const checkIndex = (this.currentMonk + i) % 4;
            if (!this.monks[checkIndex].dead && !this.monks[checkIndex].hasPlayed) {
                allPlayed = false;
                nextIndex = checkIndex;
                break;
            }
        }
        
        if (allPlayed) {
            this.phase = 'yin';
            this.monks.forEach(m => m.hasPlayed = false);
            this.log("🌙 Alle Mönche haben gespielt. Yin-Phase beginnt!", "ghost");
        } else {
            this.monks[this.currentMonk].hasPlayed = true;
            this.monks[this.currentMonk].active = false;
            this.currentMonk = nextIndex;
            this.monks[this.currentMonk].active = true;
        }
        
        this.updateStats();
        this.renderMonks();
    }

    endGame(victory) {
        this.gameOver = true;
        const modal = document.getElementById('game-modal');
        const content = document.getElementById('modal-content');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        
        if (victory) {
            content.className = 'modal-content victory';
            title.textContent = "🎉 Sieg!";
            message.innerHTML = `Das Dorf wurde gerettet!<br><br>
                Wu-Feng wurde besiegt!<br>
                Verbleibende Dorfbewohner: ${this.villageHealth}<br>
                Gesammelte Tao-Token: ${this.taoTokens}`;
        } else {
            content.className = 'modal-content defeat';
            title.textContent = "💀 Niederlage";
            message.innerHTML = `Das Dorf wurde von den Geistern überrannt...<br><br>
                Wu-Feng triumphiert!<br>
                Geister im Dorf: ${this.ghostCount}`;
        }
        
        modal.classList.add('active');
    }

    restart() {
        location.reload();
    }
}

const game = new GhostStoriesGame();
