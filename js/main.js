// ══════════════════════════════════════════════════════════════
//  GUARDIÕES DA FAUNA — main.js
//  Screen management, UI, bestiary, keyboard shortcuts
// ══════════════════════════════════════════════════════════════

let currentGame = null;
let currentBiome = null;

// ── SCREEN MANAGER ───────────────────────────────────────────
function showScreen(id) {
  // Stop and cleanup game if leaving game screen
  if (id !== 'screen-game' && currentGame) {
    currentGame.stop();
    currentGame.destroy();
    currentGame = null;
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('animal-card').classList.add('hidden');
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    // Run screen-specific init
    if (id === 'screen-biome') initBiomeScreen();
    if (id === 'screen-bestiary') initBestiary();
  }
}

// ── BIOME SCREEN ─────────────────────────────────────────────
function initBiomeScreen() {
  // Update locked/unlocked visual state
  const order = ['mata', 'amazonia', 'cerrado', 'pantanal'];
  order.forEach(key => {
    const card = document.getElementById(`biome-${key}`);
    if (!card) return;
    if (STATE.unlockedBiomes.has(key)) {
      card.classList.remove('locked');
      card.querySelector('.biome-status').classList.remove('locked-status');
      card.querySelector('.biome-status').classList.add('unlocked');
      card.querySelector('.biome-status').textContent = 'JOGAR ▶';
    } else {
      card.classList.add('locked');
    }
  });
  // Update total counter
  const tc = document.getElementById('total-cataloged');
  if (tc) tc.textContent = STATE.cataloged.size;
}

// ── START GAME ───────────────────────────────────────────────
function startGame(biomeKey) {
  if (!STATE.unlockedBiomes.has(biomeKey)) return;

  currentBiome = biomeKey;
  showScreen('screen-game');

  // Update biome label in HUD
  const label = document.getElementById('biome-label');
  if (label) label.textContent = BIOMES[biomeKey].name;

  // Init canvas
  const canvas = document.getElementById('game-canvas');
  if (currentGame) { currentGame.stop(); currentGame.destroy(); }
  currentGame = new Game(canvas, biomeKey);
  currentGame.start();

  // Reset overlays
  document.getElementById('gameover-overlay').classList.add('hidden');
  document.getElementById('pause-overlay').classList.add('hidden');
  document.getElementById('animal-card').classList.add('hidden');
}

// ── GAME CONTROLS (called from HTML) ─────────────────────────
function togglePause() {
  if (!currentGame) return;
  currentGame.paused = !currentGame.paused;
  document.getElementById('pause-overlay').classList.toggle('hidden', !currentGame.paused);
}

function closeCard() {
  document.getElementById('animal-card').classList.add('hidden');
  if (currentGame) currentGame.paused = false;

  // Check win after closing card
  if (currentGame && currentGame.cataloged >= currentGame.totalAnimals) {
    // Will be handled by game loop
  }
}

function restartGame() {
  document.getElementById('gameover-overlay').classList.add('hidden');
  if (currentBiome) startGame(currentBiome);
}

// ── BESTIARY ─────────────────────────────────────────────────
function initBestiary() {
  const grid = document.getElementById('bestiary-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const bc = document.getElementById('bestiary-count');
  if (bc) bc.textContent = STATE.cataloged.size;

  ANIMALS.forEach(animal => {
    const found = STATE.cataloged.has(animal.id);
    const item = document.createElement('div');
    item.className = `bestiary-item ${found ? 'found' : 'unknown'}`;

    item.innerHTML = `
      <span class="bestiary-emoji">${found ? animal.emoji : '❓'}</span>
      <div class="bestiary-name">${found ? animal.name : '???'}</div>
      <div class="bestiary-biome">${found ? animal.biome : '—'}</div>
    `;

    if (found) {
      item.title = `${animal.sci}\n${animal.status}\n${animal.fact}`;
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => showAnimalDetail(animal));
    }

    grid.appendChild(item);
  });
}

function showAnimalDetail(animal) {
  // Reuse the card UI inline as a modal-like popup
  const popup = document.createElement('div');
  popup.id = 'bestiary-popup';
  popup.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.85);
    display:flex; align-items:center; justify-content:center; z-index:500;
    font-family:'Press Start 2P',monospace;
  `;
  popup.innerHTML = `
    <div style="background:#1a4a2e;border:4px solid #4caf50;padding:28px 36px;
      max-width:340px;width:90%;text-align:center;box-shadow:8px 8px 0 #000;">
      <div style="font-size:8px;color:#76ff73;margin-bottom:10px;letter-spacing:2px;">BESTIÁRIO</div>
      <div style="font-size:40px;margin:8px 0;">${animal.emoji}</div>
      <div style="font-size:10px;color:#ffb300;margin-bottom:6px;line-height:1.5;">${animal.name}</div>
      <div style="font-family:'VT323',monospace;font-size:15px;color:#aaa;font-style:italic;margin-bottom:8px;">${animal.sci}</div>
      <div style="display:inline-block;font-size:8px;padding:4px 10px;background:#e53935;color:#fff;margin-bottom:10px;">${animal.status}</div>
      <div style="font-family:'VT323',monospace;font-size:15px;color:#fff9e6;line-height:1.4;
        border:1px dashed #2d7a3e;padding:8px;margin-bottom:14px;">${animal.fact}</div>
      <div style="font-size:8px;color:#888;margin-bottom:14px;">Bioma: ${animal.biome}</div>
      <button onclick="document.getElementById('bestiary-popup').remove()"
        style="font-family:'Press Start 2P',monospace;font-size:9px;background:#2d7a3e;
          color:#76ff73;border:3px solid #4caf50;padding:10px 24px;cursor:pointer;box-shadow:3px 3px 0 #000;">
        FECHAR ✕
      </button>
    </div>
  `;
  document.body.appendChild(popup);
  popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
}

// ── KEYBOARD SHORTCUTS (global) ──────────────────────────────
document.addEventListener('keydown', (e) => {
  const activeName = document.querySelector('.screen.active')?.id;

  // Title screen: Enter = start
  if (activeName === 'screen-title' && e.code === 'Enter') {
    showScreen('screen-biome');
  }
  // Biome screen: Escape = back
  if (activeName === 'screen-biome' && e.code === 'Escape') {
    showScreen('screen-title');
  }
  // Bestiary / Credits: Escape = back
  if ((activeName === 'screen-bestiary' || activeName === 'screen-credits') && e.code === 'Escape') {
    showScreen('screen-title');
  }
});

// ── INIT ─────────────────────────────────────────────────────
(function init() {
  // Show title screen on load
  showScreen('screen-title');

  // Refresh bestiary counter on title
  const tc = document.getElementById('total-cataloged');
  if (tc) tc.textContent = STATE.cataloged.size;
})();
