// =====================================================================
// GUARDIÕES DA FAUNA — js/main.js
// Orquestrador: telas, save, inputs, cutscenes, opções, HUD, bestiário
// =====================================================================
'use strict';

const App = {
  currentScreen: 'screen-title',
  save: null,
  activeGame: null,
  currentBiome: null,
  pausedForOptions: false,
};

// ════════════════════════════════════════════════════════════════════
// SAVE SYSTEM
// ════════════════════════════════════════════════════════════════════
const SaveManager = {
  KEY: 'guardioes_fauna_save',

  load() {
    try {
      const r = localStorage.getItem(this.KEY);
      if (!r) return JSON.parse(JSON.stringify(DEFAULT_SAVE));
      return Object.assign(JSON.parse(JSON.stringify(DEFAULT_SAVE)), JSON.parse(r));
    } catch { return JSON.parse(JSON.stringify(DEFAULT_SAVE)); }
  },

  save(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch(e) {}
  },

  reset() {
    localStorage.removeItem(this.KEY);
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  },

  catalogAnimal(data, id) {
    if (data.cataloged.includes(id)) return data;
    data.cataloged.push(id);
    data.totalCataloged = data.cataloged.length;
    if (data.totalCataloged >= getTotalAnimals())
      data = this.unlockAchievement(data, 'naturalista');
    const a = getAnimalById(id);
    if (a?.achievement) data = this.unlockAchievement(data, a.achievement);
    if (a?.dropsCollectible) data = this.addCollectible(data, a.dropsCollectible);
    this.save(data);
    return data;
  },

  completeBiome(data, b) {
    data.biomesCompleted[b] = true;
    const ord = ['mata','amazonia','cerrado','pantanal'];
    const idx = ord.indexOf(b);
    if (idx >= 0 && idx < ord.length - 1) data.biomesUnlocked[ord[idx+1]] = true;
    this.save(data);
    return data;
  },

  unlockAchievement(data, id) {
    if (!data.achievements.includes(id)) {
      data.achievements.push(id);
      this.save(data);
      showAchievementToast(id);
    }
    return data;
  },

  addCollectible(data, id) {
    if (!data.collectibles.includes(id)) {
      data.collectibles.push(id);
      this.save(data);
      showAchievementToast('pena_azul');
    }
    return data;
  },
};

// ════════════════════════════════════════════════════════════════════
// INPUTS (teclado + touch)
// ════════════════════════════════════════════════════════════════════
const Keys = {
  left:false, right:false, up:false, down:false,
  jump:false, interact:false, binoculo:false, pause:false
};

const KEY_MAP = {
  ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down',
  KeyA:'left', KeyD:'right', KeyW:'up', KeyS:'down',
  Space:'jump', KeyE:'interact', KeyQ:'binoculo', Escape:'pause'
};

window.addEventListener('keydown', e => {
  AudioSys.resume();
  const k = KEY_MAP[e.code];
  if (k) { Keys[k] = true; if (e.code !== 'Escape') e.preventDefault(); }
  if (e.code === 'ArrowUp') Keys.jump = true;
  if (e.code === 'Enter' && App.currentScreen === 'screen-title') {
    if (!App.save.introSeen) { App.save.introSeen = true; SaveManager.save(App.save); playCutscene('intro', () => showScreen('screen-biome')); }
    else showScreen('screen-biome');
  }
  if (e.code === 'Space' && App.currentScreen === 'screen-cutscene') { e.preventDefault(); cutsceneAdvance(); }
  if (e.code === 'Escape' && App.currentScreen === 'screen-game') togglePause();
});

window.addEventListener('keyup', e => {
  const k = KEY_MAP[e.code];
  if (k) Keys[k] = false;
  if (e.code === 'ArrowUp') Keys.jump = false;
});

function _setupTouch() {
  if (!('ontouchstart' in window)) return;
  const pad = document.createElement('div'); pad.id = 'touch-pad';
  pad.innerHTML = `
    <div class="touch-dpad">
      <button class="touch-btn" data-key="left">◀</button>
      <button class="touch-btn" data-key="right">▶</button>
    </div>
    <div class="touch-actions">
      <button class="touch-btn" data-key="jump">↑</button>
      <button class="touch-btn t-interact" data-key="interact">E</button>
      <button class="touch-btn t-bino" data-key="binoculo">Q</button>
    </div>`;
  document.body.appendChild(pad);
  pad.querySelectorAll('.touch-btn').forEach(b => {
    const k = b.dataset.key;
    b.addEventListener('touchstart', e => { Keys[k] = true; AudioSys.resume(); e.preventDefault(); }, {passive:false});
    b.addEventListener('touchend',   () => Keys[k] = false);
    b.addEventListener('touchcancel',() => Keys[k] = false);
  });
}

// ════════════════════════════════════════════════════════════════════
// NAVEGAÇÃO DE TELAS
// ════════════════════════════════════════════════════════════════════
function showScreen(id) {
  if (App.currentScreen === 'screen-game' && id !== 'screen-game') _stopGame();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const t = document.getElementById(id);
  if (t) t.classList.add('active');
  App.currentScreen = id;
  if (id === 'screen-biome')    _refreshBiome();
  if (id === 'screen-bestiary') renderBestiary();
  if (id === 'screen-options')  _loadOptions();
  if (id === 'screen-title' || id === 'screen-biome' || id === 'screen-bestiary'
      || id === 'screen-credits' || id === 'screen-options') {
    if (!App.pausedForOptions) AudioSys.playTheme('title');
  }
  AudioSys.play('menuSel');
}

// ════════════════════════════════════════════════════════════════════
// SELEÇÃO DE BIOMA
// ════════════════════════════════════════════════════════════════════
function _refreshBiome() {
  const s = App.save;
  _t('total-cataloged', s.totalCataloged);
  const ord = ['mata','amazonia','cerrado','pantanal'];
  const labels = {
    mata:    '▶ DESBLOQUEADO',
    amazonia:'🔒 COMPLETE MATA ATLÂNTICA',
    cerrado: '🔒 COMPLETE AMAZÔNIA',
    pantanal:'🔒 COMPLETE CERRADO',
  };
  ord.forEach(b => {
    const card = document.getElementById('biome-' + b);
    const st = card?.querySelector('.biome-status');
    if (!card) return;
    if (s.biomesUnlocked[b]) {
      card.classList.remove('locked');
      card.onclick = () => startGame(b);
      if (st) {
        st.className = 'biome-status ' + (s.biomesCompleted[b] ? 'completed' : 'unlocked');
        st.textContent = s.biomesCompleted[b] ? '✅ COMPLETO' : labels[b];
      }
    } else {
      card.classList.add('locked');
      card.onclick = null;
      if (st) {
        st.className = 'biome-status locked-status';
        st.textContent = labels[b];
      }
    }
  });
}

// ════════════════════════════════════════════════════════════════════
// CUTSCENE SYSTEM (conforme GDD seção 12)
// ════════════════════════════════════════════════════════════════════
let _csFrames = [], _csIdx = 0, _csAfter = null;

const CS_BG = {
  forest_dawn:    'linear-gradient(180deg,#0d2b0d 0%,#1B5E20 50%,#FF8F00 100%)',
  factory_dark:   'linear-gradient(180deg,#1a1a1a,#333333)',
  robots_advance: 'linear-gradient(180deg,#1a1a2e,#16213e)',
  leo_lab:        'linear-gradient(180deg,#16213e,#0f3460)',
  leo_ready:      'linear-gradient(180deg,#1a472a,#2d6a4f)',
  mata_dense:     'linear-gradient(180deg,#1B5E20,#2E7D32)',
  mico_panic:     'linear-gradient(180deg,#2E7D32,#1B5E20)',
  leo_brave:      'linear-gradient(180deg,#1B5E20,#33691E)',
  amazon_river:   'linear-gradient(180deg,#006064,#00838F)',
  boto_net:       'linear-gradient(180deg,#01579B,#006064)',
  leo_dive:       'linear-gradient(180deg,#006064,#0277BD)',
  cerrado_fire:   'linear-gradient(180deg,#BF360C,#E65100)',
  wolf_hidden:    'linear-gradient(180deg,#E65100,#8D6E63)',
  leo_quiet:      'linear-gradient(180deg,#BF360C,#8D6E63)',
  pantanal_sun:   'linear-gradient(180deg,#880E4F,#FF6F00)',
  alpha_reveal:   'linear-gradient(180deg,#4a0020,#880E4F)',
  leo_final:      'linear-gradient(180deg,#880E4F,#4a1530)',
  victory:        'linear-gradient(180deg,#1a472a,#FFD700)',
  animals_free:   'linear-gradient(180deg,#2E7D32,#A5D6A7)',
  leo_smile:      'linear-gradient(180deg,#1B5E20,#FFCA28)',
};

const CS_EMOJI = {
  forest_dawn:'🌅', factory_dark:'🏭', robots_advance:'🤖', leo_lab:'🔭', leo_ready:'🧑‍🌾',
  mata_dense:'🌳', mico_panic:'🦁', leo_brave:'💪',
  amazon_river:'🌊', boto_net:'🐬', leo_dive:'🤿',
  cerrado_fire:'🔥', wolf_hidden:'🦊', leo_quiet:'🤫',
  pantanal_sun:'🌇', alpha_reveal:'🤖', leo_final:'⚔️',
  victory:'🏆', animals_free:'🦜', leo_smile:'😊',
};

function playCutscene(name, after) {
  const frames = CUTSCENES[name];
  if (!frames || !frames.length) { if (after) after(); return; }
  _csFrames = frames; _csIdx = 0; _csAfter = after || null;
  AudioSys.playTheme('cutscene');
  showScreen('screen-cutscene');
  _renderCsFrame();
}

function _renderCsFrame() {
  const f = _csFrames[_csIdx];
  const bg = _el('cutscene-bg');
  const art = _el('cutscene-frame-art');
  const sp = _el('cutscene-speaker');
  const tx = _el('cutscene-text');
  if (bg) bg.style.background = CS_BG[f.bgArt] || '#000';
  if (art) art.textContent = CS_EMOJI[f.bgArt] || '🌿';
  if (sp) sp.textContent = f.speaker;
  if (tx) {
    tx.textContent = '';
    let i = 0;
    if (tx._timer) clearInterval(tx._timer);
    tx._timer = setInterval(() => {
      if (i < f.text.length) { tx.textContent += f.text[i]; i++; }
      else clearInterval(tx._timer);
    }, 28);
  }
}

function cutsceneAdvance() {
  const tx = _el('cutscene-text');
  if (tx?._timer) clearInterval(tx._timer);
  const f = _csFrames[_csIdx];
  if (tx && tx.textContent.length < f.text.length) { tx.textContent = f.text; return; }
  AudioSys.play('cutsceneAdvance');
  _csIdx++;
  if (_csIdx < _csFrames.length) _renderCsFrame();
  else _finishCutscene();
}

function _finishCutscene() {
  AudioSys.stopMusic();
  if (_csAfter) { const fn = _csAfter; _csAfter = null; fn(); }
  else showScreen('screen-biome');
}

function skipCutscene() {
  _csIdx = _csFrames.length;
  _finishCutscene();
}

document.addEventListener('click', e => {
  if (App.currentScreen === 'screen-cutscene' && !e.target.closest('#cutscene-skip'))
    cutsceneAdvance();
});

// ════════════════════════════════════════════════════════════════════
// INICIAR / REINICIAR JOGO
// ════════════════════════════════════════════════════════════════════
function startGame(b) {
  if (!App.save.biomesUnlocked[b]) return;
  App.currentBiome = b;
  AudioSys.stopMusic();
  const csKey = b + '_chegada';
  if (CUTSCENES[csKey] && !App.save.biomesCompleted[b]) {
    playCutscene(csKey, () => _launchGame(b));
  } else {
    _launchGame(b);
  }
}

function _launchGame(b) {
  App.currentBiome = b;
  showScreen('screen-game');
  _resizeCanvas();
  _el('pause-overlay')?.classList.add('hidden');
  _el('gameover-overlay')?.classList.add('hidden');
  _el('animal-card')?.classList.add('hidden');
  _el('exit-hint')?.classList.add('hidden');
  _t('biome-label', BIOMES[b].name.toUpperCase());
  _t('fauna-count', 0);
  _t('fauna-total', BIOMES[b].targetCount);
  _t('objective-progress', '0/' + BIOMES[b].targetCount);
  _t('objective-status', 'EM ANDAMENTO');
  updateHearts(3);
  AudioSys.playTheme(b === 'pantanal' ? 'pantanal' : b);
  App.pausedForOptions = false;
  if (typeof Game !== 'undefined') App.activeGame = Game.init(buildLevel(b), Keys);
}

function restartGame() {
  _el('gameover-overlay')?.classList.add('hidden');
  if (App.currentBiome) _launchGame(App.currentBiome);
}

function _stopGame() {
  if (App.activeGame?.destroy) App.activeGame.destroy();
  App.activeGame = null;
  AudioSys.stopMusic();
}

function togglePause() {
  if (!App.activeGame) return;
  const ov = _el('pause-overlay');
  const wasHidden = ov.classList.contains('hidden');
  ov.classList.toggle('hidden', !wasHidden);
  App.activeGame.setPaused(wasHidden);
  if (wasHidden) { AudioSys.stopMusic(); }
  else { AudioSys.playTheme(App.currentBiome === 'pantanal' ? 'pantanal' : App.currentBiome); }
}

function openOptionsFromPause() {
  App.pausedForOptions = true;
  _el('options-back').onclick = () => {
    App.pausedForOptions = false;
    showScreen('screen-game');
  };
  showScreen('screen-options');
}

// ════════════════════════════════════════════════════════════════════
// HUD (chamadas pelo game.js)
// ════════════════════════════════════════════════════════════════════
function updateHearts(lives) {
  for (let i = 1; i <= 3; i++) {
    const h = _el('h' + i);
    if (h) h.textContent = i <= lives ? '❤️' : '🖤';
  }
}

function updateFaunaCount(cur, tot) {
  _t('fauna-count', cur);
  _t('fauna-total', tot);
  _t('objective-progress', cur + '/' + tot);
  if (cur >= tot) {
    _t('objective-status', 'CONCLUÍDO!');
    showExitHint(true);
  }
}

function updateMinimapPlayer(pct) {
  const e = _el('minimap-player');
  if (e) e.style.left = Math.max(0, Math.min(100, pct * 100)) + '%';
}

function showRobotAlert(v) { _el('robot-alert')?.classList.toggle('hidden', !v); }
function showExitHint(v)   { _el('exit-hint')?.classList.toggle('hidden', !v); }

// ════════════════════════════════════════════════════════════════════
// ANIMAL CARD (catalogação)
// ════════════════════════════════════════════════════════════════════
function showAnimalCard(id) {
  const a = getAnimalById(id);
  if (!a) return;
  App.save = SaveManager.catalogAnimal(App.save, id);
  _t('card-emoji',  a.emoji);
  _t('card-name',   a.name);
  _t('card-sci',    a.scientific);
  _t('card-status', a.status);
  _t('card-fact',   a.fact);
  const colors = {3:'#e74c3c', 2:'#e67e22', 1:'#27ae60'};
  const st = _el('card-status');
  if (st) st.style.color = colors[a.statusLevel] || '#fff';
  _el('animal-card')?.classList.remove('hidden');
  App.activeGame?.setPaused(true);
  AudioSys.play('catalog');
  const done = App.save.cataloged.filter(x => getAnimalById(x)?.biome === App.currentBiome).length;
  updateFaunaCount(done, BIOMES[App.currentBiome].targetCount);
  _t('bestiary-count', App.save.totalCataloged);
  _t('total-cataloged', App.save.totalCataloged);
}

function closeCard() {
  _el('animal-card')?.classList.add('hidden');
  App.activeGame?.setPaused(false);
}

// ════════════════════════════════════════════════════════════════════
// FIM DE JOGO
// ════════════════════════════════════════════════════════════════════
function showGameEnd(type, biomeId) {
  AudioSys.stopMusic();
  const ov = _el('gameover-overlay');
  const ttl = _el('gameover-title');
  const msg = _el('gameover-msg');
  if (type === 'win') {
    ttl.textContent = '🌿 FASE CONCLUÍDA!';
    msg.textContent = 'Você protegeu a fauna do ' + (BIOMES[biomeId]?.name || biomeId) + '!';
    App.save = SaveManager.completeBiome(App.save, biomeId);
    AudioSys.play('win');
    if (biomeId === 'pantanal') {
      setTimeout(() => playCutscene('final', () => { ov.classList.remove('hidden'); }), 800);
      return;
    }
  } else {
    ttl.textContent = '💀 GAME OVER';
    msg.textContent = 'Você perdeu todas as vidas! Tente novamente.';
    AudioSys.play('gameover');
  }
  ov?.classList.remove('hidden');
}

// ════════════════════════════════════════════════════════════════════
// BESTIÁRIO
// ════════════════════════════════════════════════════════════════════
function renderBestiary() {
  const grid = _el('bestiary-grid');
  if (!grid) return;
  const cat = App.save.cataloged;
  _t('bestiary-count', cat.length);
  grid.innerHTML = '';
  ANIMALS.forEach(a => {
    const found = cat.includes(a.id);
    const c = document.createElement('div');
    c.className = 'bestiary-card ' + (found ? 'found' : 'locked-card') + (a.isRare ? ' rare' : '');
    c.innerHTML = found ? `
      <div class="bc-emoji">${a.emoji}</div>
      <div class="bc-name">${a.name}</div>
      <div class="bc-sci">${a.scientific}</div>
      <div class="bc-status" style="color:${_scol(a.statusLevel)}">${a.status}</div>
      <div class="bc-biome">${BIOMES[a.biome].name}</div>
      <div class="bc-fact">"${a.fact}"</div>
    ` : `
      <div class="bc-emoji bc-mystery">?</div>
      <div class="bc-name">???</div>
      <div class="bc-sci">Ainda não catalogado</div>
      <div class="bc-biome">${BIOMES[a.biome].name}</div>
    `;
    grid.appendChild(c);
  });
}

function _scol(l) { return {4:'#c0392b', 3:'#e74c3c', 2:'#e67e22', 1:'#27ae60'}[l] || '#aaa'; }

// ════════════════════════════════════════════════════════════════════
// OPÇÕES
// ════════════════════════════════════════════════════════════════════
function _loadOptions() {
  const mv = Math.round(AudioSys.getMusicVol() * 100);
  const sv = Math.round(AudioSys.getSfxVol() * 100);
  const mi = _el('opt-music'); const si = _el('opt-sfx');
  if (mi) { mi.value = mv; _t('opt-music-val', mv); }
  if (si) { si.value = sv; _t('opt-sfx-val', sv); }
}

function setMusicVolume(v) {
  const val = parseFloat(v) / 100;
  AudioSys.setMusicVol(val);
  App.save.musicVol = val;
  SaveManager.save(App.save);
  _t('opt-music-val', v);
}

function setSfxVolume(v) {
  const val = parseFloat(v) / 100;
  AudioSys.setSfxVol(val);
  App.save.sfxVol = val;
  SaveManager.save(App.save);
  _t('opt-sfx-val', v);
  AudioSys.play('menuMove');
}

function resetSave() {
  if (confirm('⚠️ APAGAR todo o progresso?\n\nIsso vai limpar:\n- Biomas desbloqueados\n- Animais catalogados\n- Conquistas\n\nEsta ação NÃO pode ser desfeita!')) {
    App.save = SaveManager.reset();
    _t('total-cataloged', 0);
    _t('bestiary-count', 0);
    alert('✅ Progresso apagado!');
    showScreen('screen-title');
  }
}

// ════════════════════════════════════════════════════════════════════
// ACHIEVEMENT TOAST
// ════════════════════════════════════════════════════════════════════
function showAchievementToast(id) {
  const a = ACHIEVEMENTS[id];
  if (!a) return;
  const toast = _el('achievement-toast');
  _t('ach-icon', a.icon);
  _t('ach-name', a.name);
  toast?.classList.add('show');
  AudioSys.play('collectible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3800);
}

// ════════════════════════════════════════════════════════════════════
// CANVAS RESIZE
// ════════════════════════════════════════════════════════════════════
function _resizeCanvas() {
  const c = _el('game-canvas');
  if (!c) return;
  const hud = _el('hud');
  c.width = window.innerWidth;
  c.height = window.innerHeight - (hud ? hud.offsetHeight : 56);
  App.activeGame?.onResize?.(c.width, c.height);
}

window.addEventListener('resize', () => {
  if (App.currentScreen === 'screen-game') _resizeCanvas();
});

// ════════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════════
function _el(id) { return document.getElementById(id); }
function _t(id, v) { const e = _el(id); if (e) e.textContent = v; }

function _spawnStars() {
  const c = document.querySelector('.stars');
  if (!c) return;
  const f = document.createDocumentFragment();
  for (let i = 0; i < 90; i++) {
    const s = document.createElement('span');
    s.className = 'star';
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${(Math.random()*4).toFixed(2)}s;animation-duration:${(2+Math.random()*3).toFixed(2)}s;width:${Math.random()<0.2?3:2}px;height:${Math.random()<0.2?3:2}px`;
    f.appendChild(s);
  }
  c.appendChild(f);
}

// ════════════════════════════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  App.save = SaveManager.load();
  AudioSys.setMusicVol(App.save.musicVol ?? 0.7);
  AudioSys.setSfxVol(App.save.sfxVol ?? 0.8);
  _setupTouch();
  _spawnStars();
  showScreen('screen-title');
  _t('total-cataloged', App.save.totalCataloged);

  // Botão "INICIAR JOGO" → mostra intro se nunca vista, senão vai para biomas
  const startBtn = document.getElementById('btn-start');
  if (startBtn) {
    startBtn.onclick = () => {
      if (!App.save.introSeen) {
        App.save.introSeen = true;
        SaveManager.save(App.save);
        playCutscene('intro', () => showScreen('screen-biome'));
      } else {
        showScreen('screen-biome');
      }
    };
  }

  console.log('%cGuardiões da Fauna 🐾',
    'font-size:16px;font-weight:bold;color:#4CAF50;',
    '\nSave: ' + App.save.totalCataloged + '/20 animais catalogados.');
});
