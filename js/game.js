// ══════════════════════════════════════════════════════════════
//  GUARDIÕES DA FAUNA — game.js
//  Canvas engine: player, platforms, robots, animals, rendering
// ══════════════════════════════════════════════════════════════

class Game {
  constructor(canvas, biomeKey) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.biome   = BIOMES[biomeKey];
    this.biomeKey= biomeKey;
    this.running = false;
    this.paused  = false;
    this.raf     = null;
    this.tick    = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.initLevel();
    this.initInput();
  }

  resize() {
    const hud = document.getElementById('hud');
    const hudH = hud ? hud.offsetHeight : 56;
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight - hudH;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
  }

  // ── LEVEL GENERATION ────────────────────────────────────────
  initLevel() {
    const T = GAME_CONFIG.TILE;
    this.camera = { x: 0, y: 0 };
    this.levelW  = 3000;

    // Ground segments
    this.ground = this._buildGround();
    // Platforms
    this.platforms = this._buildPlatforms();
    // Water zones (for aquatic biomes)
    this.waterZones = this.biome.theme === 'water' ? this._buildWater() : [];
    // Hazards (fire for cerrado)
    this.hazards = this.biome.theme === 'savanna' ? this._buildFire() : [];

    // Player
    this.player = new Player(80, 100, this);

    // Animals
    this.animals = this._spawnAnimals();

    // Robots
    this.robots = this._spawnRobots();

    // Particles
    this.particles = [];

    // Stats
    this.lives        = GAME_CONFIG.LIVES;
    this.cataloged    = 0;
    this.totalAnimals = this.animals.length;
    this.invincible   = 0;
    this.binocularOn  = false;
    this.binocularTimer = 0;
    this.levelDone    = false;

    this._updateHUD();
  }

  _buildGround() {
    const T = GAME_CONFIG.TILE;
    const H = 600; // virtual height
    const gY = H - T * 3;
    const segs = [];
    let x = 0;
    while (x < this.levelW) {
      const w = 120 + Math.random() * 160 | 0;
      const gap = Math.random() < 0.08 ? (40 + Math.random() * 60 | 0) : 0;
      segs.push({ x, y: gY, w, h: T * 3 });
      x += w + gap;
    }
    return segs;
  }

  _buildPlatforms() {
    const T = GAME_CONFIG.TILE;
    const H = 600;
    const plats = [];
    let x = 300;
    while (x < this.levelW - 200) {
      const w = 80 + Math.random() * 100 | 0;
      const y = H - T * 3 - (80 + Math.random() * 160 | 0);
      plats.push({ x, y, w, h: T });
      x += 140 + Math.random() * 120;
    }
    return plats;
  }

  _buildWater() {
    return [
      { x: 500, y: 500, w: 400, h: 80 },
      { x: 1200, y: 490, w: 300, h: 90 },
    ];
  }

  _buildFire() {
    const fires = [];
    for (let i = 0; i < 6; i++) {
      fires.push({ x: 400 + i * 380, y: 510, w: 32, h: 40 });
    }
    return fires;
  }

  _spawnAnimals() {
    const T = GAME_CONFIG.TILE;
    const H = 600;
    const gY = H - T * 3;
    const biomeAnimals = this.biome.animals;
    const animals = [];

    biomeAnimals.forEach((id, i) => {
      const animalData = ANIMALS.find(a => a.id === id);
      if (!animalData) return;

      const x = 400 + i * 500 + (Math.random() * 100 | 0);
      let y;
      if (animalData.type === 'platform' && this.platforms.length > i) {
        const plat = this.platforms[i * 3 % this.platforms.length];
        y = plat.y - 32;
      } else if (animalData.type === 'water') {
        y = gY - 60;
      } else {
        y = gY - 32;
      }

      animals.push(new Animal(x, y, animalData, this));
    });

    return animals;
  }

  _spawnRobots() {
    const T  = GAME_CONFIG.TILE;
    const H  = 600;
    const gY = H - T * 3;
    const robots = [];
    const positions = [300, 700, 1100, 1600, 2100, 2600];
    positions.forEach((x, i) => {
      const type = ['patrol', 'patrol', 'heavy', 'drone', 'patrol', 'heavy'][i];
      robots.push(new Robot(x, gY - 40, type, this));
    });
    return robots;
  }

  // ── INPUT ────────────────────────────────────────────────────
  initInput() {
    this.keys = {};
    this._onKey = (e) => {
      const down = e.type === 'keydown';
      this.keys[e.code] = down;

      if (down && e.code === 'KeyQ') this._toggleBinocular();
      if (down && e.code === 'KeyE') this._tryInteract();
      if (down && e.code === 'Escape') togglePause();
      if (down && e.code === 'Enter') this._tryInteract();
    };
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('keyup',   this._onKey);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keyup',   this._onKey);
    window.removeEventListener('resize', this._resizeFn);
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  _toggleBinocular() {
    if (this.binocularTimer > 0) return;
    this.binocularOn = true;
    this.binocularTimer = 120;
    this._disableNearbyRobots();
  }

  _disableNearbyRobots() {
    const p = this.player;
    this.robots.forEach(r => {
      const dx = r.x - p.x, dy = r.y - p.y;
      if (Math.sqrt(dx*dx + dy*dy) < GAME_CONFIG.BINOCULAR_RANGE) {
        r.stunned = 180;
        this._spawnParticles(r.x + 16, r.y + 16, '#76ff73', 12);
      }
    });
  }

  _tryInteract() {
    if (this.levelDone) return;
    const p = this.player;
    let cataloged = false;
    this.animals.forEach(a => {
      if (a.cataloged) return;
      const dx = a.x - p.x, dy = a.y - p.y;
      if (Math.sqrt(dx*dx + dy*dy) < GAME_CONFIG.CATALOG_RADIUS) {
        a.cataloged = true;
        this.cataloged++;
        STATE.catalog(a.data.id);
        this._spawnParticles(a.x + 16, a.y, '#ffb300', 20);
        this._showAnimalCard(a.data);
        cataloged = true;
        this._updateHUD();
      }
    });
  }

  _showAnimalCard(data) {
    this.paused = true;
    document.getElementById('card-emoji').textContent  = data.emoji;
    document.getElementById('card-name').textContent   = data.name;
    document.getElementById('card-sci').textContent    = data.sci;
    document.getElementById('card-status').textContent = data.status;
    document.getElementById('card-fact').textContent   = data.fact;
    document.getElementById('animal-card').classList.remove('hidden');
  }

  _spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: -Math.random() * 5 - 1,
        life: 40 + Math.random() * 30 | 0,
        color,
        size: 3 + Math.random() * 4 | 0
      });
    }
  }

  _updateHUD() {
    // Lives
    for (let i = 1; i <= 3; i++) {
      const h = document.getElementById(`h${i}`);
      if (h) h.classList.toggle('lost', i > this.lives);
    }
    // Fauna count
    const fc = document.getElementById('fauna-count');
    const ft = document.getElementById('fauna-total');
    if (fc) fc.textContent = this.cataloged;
    if (ft) ft.textContent = this.totalAnimals;
    // Minimap player position
    const mp = document.getElementById('minimap-player');
    if (mp) {
      const pct = (this.player.x / this.levelW) * 100;
      mp.style.left = Math.min(95, pct) + '%';
    }
    // Total counter in biome screen
    const tc = document.getElementById('total-cataloged');
    if (tc) tc.textContent = STATE.cataloged.size;
    const bc = document.getElementById('bestiary-count');
    if (bc) bc.textContent = STATE.cataloged.size;

    // Robot alert
    const alert = document.getElementById('robot-alert');
    if (alert) {
      const p = this.player;
      const near = this.robots.some(r => {
        const dx = r.x - p.x;
        return Math.abs(dx) < 200 && !r.stunned && !r.disabled;
      });
      alert.classList.toggle('hidden', !near);
    }
  }

  // ── LOOP ─────────────────────────────────────────────────────
  start() {
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      if (!this.paused) {
        this.update();
        this.render();
      }
    };
    loop();
  }

  pause()  { this.paused = true; }
  resume() { this.paused = false; }
  stop()   { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); }

  // ── UPDATE ────────────────────────────────────────────────────
  update() {
    this.tick++;

    this.player.update(this.keys);
    this.robots.forEach(r => r.update());
    this.animals.forEach(a => a.update());
    this._updateParticles();

    // Camera follow
    const targetX = this.player.x - this.W / 2 + 40;
    this.camera.x = Math.max(0, Math.min(this.levelW - this.W, targetX));

    // Binocular timer
    if (this.binocularTimer > 0) {
      this.binocularTimer--;
      if (this.binocularTimer === 0) this.binocularOn = false;
    }

    // Invincibility frames
    if (this.invincible > 0) this.invincible--;

    // Win condition
    if (this.cataloged >= this.totalAnimals && !this.levelDone) {
      this.levelDone = true;
      setTimeout(() => this._winLevel(), 1200);
    }

    this._updateHUD();
  }

  _updateParticles() {
    this.particles = this.particles.filter(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.15;
      p.life--;
      return p.life > 0;
    });
  }

  hurtPlayer() {
    if (this.invincible > 0) return;
    this.lives--;
    this.invincible = 90;
    this._spawnParticles(this.player.x + 12, this.player.y, '#e53935', 16);
    this._updateHUD();
    if (this.lives <= 0) {
      setTimeout(() => this._gameOver(), 400);
    }
  }

  _gameOver() {
    this.stop();
    document.getElementById('gameover-title').textContent = '💀 GAME OVER';
    document.getElementById('gameover-msg').textContent   = 'Você perdeu todas as vidas!';
    document.getElementById('gameover-overlay').classList.remove('hidden');
  }

  _winLevel() {
    this.stop();
    // Unlock next biome
    const order = ['mata', 'amazonia', 'cerrado', 'pantanal'];
    const idx = order.indexOf(this.biomeKey);
    if (idx >= 0 && idx < order.length - 1) {
      STATE.unlockBiome(order[idx + 1]);
    }
    document.getElementById('gameover-title').textContent = '🎉 BIOMA RESTAURADO!';
    document.getElementById('gameover-msg').textContent   = `Você catalogou todos os animais! Próximo bioma desbloqueado.`;
    document.getElementById('gameover-overlay').classList.remove('hidden');
  }

  // ── RENDER ────────────────────────────────────────────────────
  render() {
    const ctx = this.ctx;
    const cx  = this.camera.x;
    const H   = this.H;
    const VH  = 600; // virtual scene height
    const scale = H / VH;

    ctx.save();
    ctx.scale(scale, scale);
    const VW = this.W / scale;

    // Sky / background
    this._drawBG(ctx, VW, VH, cx);

    // World elements
    ctx.save();
    ctx.translate(-cx, 0);

    this._drawWater(ctx, VH);
    this._drawHazards(ctx, VH);
    this._drawGround(ctx);
    this._drawPlatforms(ctx);
    this.animals.forEach(a => a.render(ctx, this.tick));
    this.robots.forEach(r => r.render(ctx, this.tick));
    this.player.render(ctx, this.tick, this.invincible);
    this._drawParticles(ctx);

    ctx.restore();

    // Binocular beam overlay
    if (this.binocularOn) {
      this._drawBinocularBeam(ctx, VW, VH, cx);
    }

    ctx.restore();
  }

  _drawBG(ctx, VW, VH, cx) {
    const cols = this.biome.bgColor;
    const grad = ctx.createLinearGradient(0, 0, 0, VH);
    grad.addColorStop(0,   cols[0]);
    grad.addColorStop(0.5, cols[1]);
    grad.addColorStop(1,   cols[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VW, VH);

    // Stars / fireflies in sky
    if (this.biomeKey === 'pantanal') {
      ctx.fillStyle = 'rgba(255,180,0,0.6)';
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 173 + cx * 0.02) % VW);
        const sy = 20 + (i * 37) % 180;
        ctx.fillRect(sx | 0, sy | 0, 2, 2);
      }
    }

    // Parallax trees / background elements
    this._drawParallaxBG(ctx, VW, VH, cx);
  }

  _drawParallaxBG(ctx, VW, VH, cx) {
    const parallax = cx * 0.3;
    ctx.fillStyle = this.biome.theme === 'savanna' ? '#5c3a0a' : '#1a4a0a';

    for (let i = 0; i < 10; i++) {
      const tx = ((i * 220 - parallax) % (VW + 80) + VW + 80) % (VW + 80) - 40;
      const th = 120 + (i * 37) % 80;
      const tw = 30 + (i * 17) % 20;
      // trunk
      ctx.fillRect(tx | 0, VH - th, tw / 3 | 0, th);
      // canopy
      ctx.fillStyle = this.biome.theme === 'savanna' ? '#6a4a0a' :
                      this.biome.theme === 'water'   ? '#0a3a5a' : '#1a5a0a';
      const cr = tw / 2 + 10;
      ctx.beginPath();
      ctx.arc((tx + tw / 6) | 0, (VH - th) | 0, cr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.biome.theme === 'savanna' ? '#5c3a0a' : '#1a4a0a';
    }
  }

  _drawGround(ctx) {
    this.ground.forEach(seg => {
      // Main ground
      ctx.fillStyle = this.biome.groundColor;
      ctx.fillRect(seg.x, seg.y, seg.w, seg.h);
      // Top edge
      ctx.fillStyle = this.biome.theme === 'savanna' ? '#8c6a2a' : '#3d8c28';
      ctx.fillRect(seg.x, seg.y, seg.w, 6);
      // Pixel texture lines
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (let i = seg.x; i < seg.x + seg.w; i += 16) {
        ctx.fillRect(i, seg.y + 8, 8, 4);
      }
    });
  }

  _drawPlatforms(ctx) {
    this.platforms.forEach(p => {
      ctx.fillStyle = this.biome.platformColor;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = this.biome.theme === 'savanna' ? '#7a5a1a' : '#2d6b1e';
      ctx.fillRect(p.x, p.y, p.w, 5);
      // Pixel bricks
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let i = p.x; i < p.x + p.w; i += 16) {
        ctx.fillRect(i, p.y + 6, 1, p.h - 6);
      }
    });
  }

  _drawWater(ctx, VH) {
    this.waterZones.forEach(w => {
      const alpha = 0.55 + 0.1 * Math.sin(this.tick * 0.05);
      ctx.fillStyle = `rgba(20,80,150,${alpha})`;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      // Wave lines
      ctx.strokeStyle = 'rgba(100,180,255,0.4)';
      ctx.lineWidth = 2;
      for (let wi = 0; wi < w.w; wi += 24) {
        ctx.beginPath();
        ctx.moveTo(w.x + wi, w.y + 8);
        ctx.quadraticCurveTo(
          w.x + wi + 12, w.y + 4 + 4 * Math.sin(this.tick * 0.1 + wi * 0.1),
          w.x + wi + 24, w.y + 8
        );
        ctx.stroke();
      }
    });
  }

  _drawHazards(ctx, VH) {
    this.hazards.forEach(h => {
      const phase = Math.sin(this.tick * 0.3 + h.x * 0.01);
      // Glow
      ctx.fillStyle = `rgba(255,100,0,${0.2 + 0.1 * phase})`;
      ctx.fillRect(h.x - 4, h.y - 8, h.w + 8, h.h + 8);
      // Main flame
      const grad = ctx.createLinearGradient(h.x, h.y + h.h, h.x, h.y - 10);
      grad.addColorStop(0, '#ff4400');
      grad.addColorStop(0.5, '#ff9900');
      grad.addColorStop(1, 'rgba(255,220,0,0)');
      ctx.fillStyle = grad;
      const fw = h.w * (0.7 + 0.3 * phase);
      const fx = h.x + (h.w - fw) / 2;
      ctx.beginPath();
      ctx.moveTo(fx, h.y + h.h);
      ctx.quadraticCurveTo(fx + fw * 0.2, h.y + h.h / 2, fx + fw / 2, h.y - 10 * (1 + phase * 0.3));
      ctx.quadraticCurveTo(fx + fw * 0.8, h.y + h.h / 2, fx + fw, h.y + h.h);
      ctx.closePath();
      ctx.fill();
    });
  }

  _drawBinocularBeam(ctx, VW, VH, cx) {
    const px = this.player.x - cx + 20;
    const py = this.player.y - this.player.h / 2;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, GAME_CONFIG.BINOCULAR_RANGE);
    grad.addColorStop(0, 'rgba(118,255,115,0.25)');
    grad.addColorStop(0.7, 'rgba(118,255,115,0.08)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, GAME_CONFIG.BINOCULAR_RANGE, 0, Math.PI * 2);
    ctx.fill();

    // Charge bar
    const pct = this.binocularTimer / 120;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(px - 30, py - 40, 60, 6);
    ctx.fillStyle = `hsl(${pct * 120}, 80%, 50%)`;
    ctx.fillRect(px - 30, py - 40, 60 * pct, 6);
  }

  _drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 60;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }

  // ── COLLISION HELPERS ────────────────────────────────────────
  getGroundY(x, w) {
    let minY = 9999;
    const checkSegs = [...this.ground, ...this.platforms];
    checkSegs.forEach(seg => {
      if (x + w > seg.x && x < seg.x + seg.w) {
        if (seg.y < minY) minY = seg.y;
      }
    });
    return minY;
  }

  isOnGround(entity) {
    const checkSegs = [...this.ground, ...this.platforms];
    for (const seg of checkSegs) {
      if (entity.x + entity.w > seg.x && entity.x < seg.x + seg.w) {
        if (Math.abs((entity.y + entity.h) - seg.y) < 4) return true;
      }
    }
    return false;
  }

  resolveGround(entity) {
    const checkSegs = [...this.ground, ...this.platforms];
    for (const seg of checkSegs) {
      if (entity.x + entity.w > seg.x && entity.x < seg.x + seg.w) {
        const bottom = entity.y + entity.h;
        if (bottom > seg.y && bottom - entity.vy <= seg.y + 4) {
          entity.y = seg.y - entity.h;
          entity.vy = 0;
          entity.onGround = true;
          return;
        }
      }
    }
    entity.onGround = false;
  }
}


// ══════════════════════════════════════════════════════════════
//  PLAYER
// ══════════════════════════════════════════════════════════════
class Player {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.w = 24;
    this.h = 40;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.jumps = 0;
    this.facing = 1;
    this.game = game;
    this.walkFrame = 0;
    this.walkTimer = 0;
  }

  update(keys) {
    const G = GAME_CONFIG;
    const spd = G.PLAYER_SPEED;

    // Horizontal
    this.vx = 0;
    if (keys['ArrowLeft']  || keys['KeyA']) { this.vx = -spd; this.facing = -1; }
    if (keys['ArrowRight'] || keys['KeyD']) { this.vx =  spd; this.facing =  1; }

    // Walk animation
    if (this.vx !== 0 && this.onGround) {
      this.walkTimer++;
      if (this.walkTimer % 8 === 0) this.walkFrame = (this.walkFrame + 1) % 4;
    } else if (this.vx === 0) { this.walkFrame = 0; this.walkTimer = 0; }

    // Jump
    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && this.jumps < 2) {
      if (!this._jumpHeld) {
        this.vy = G.JUMP_FORCE;
        this.jumps++;
        this._jumpHeld = true;
      }
    } else {
      this._jumpHeld = false;
    }

    // Gravity
    this.vy += G.GRAVITY;
    if (this.vy > 16) this.vy = 16;

    // Move
    this.x += this.vx;
    this.y += this.vy;

    // Clamp X
    this.x = Math.max(0, Math.min(this.game.levelW - this.w, this.x));

    // Ground resolution
    this.game.resolveGround(this);
    if (this.onGround) this.jumps = 0;

    // Fall off world
    if (this.y > 700) {
      this.y = 100;
      this.vy = 0;
      this.game.hurtPlayer();
    }

    // Robot collisions
    if (this.game.invincible === 0) {
      this.game.robots.forEach(r => {
        if (r.stunned || r.disabled) return;
        if (this._overlaps(r)) this.game.hurtPlayer();
      });
    }

    // Hazard collisions (fire)
    this.game.hazards.forEach(h => {
      if (this.x + this.w > h.x && this.x < h.x + h.w &&
          this.y + this.h > h.y && this.y < h.y + h.h) {
        this.game.hurtPlayer();
      }
    });
  }

  _overlaps(other) {
    return this.x < other.x + other.w &&
           this.x + this.w > other.x &&
           this.y < other.y + other.h &&
           this.y + this.h > other.y;
  }

  render(ctx, tick, invincible) {
    if (invincible > 0 && Math.floor(invincible / 6) % 2 === 0) return;
    const x = this.x | 0;
    const y = this.y | 0;
    const f = this.facing;

    ctx.save();
    ctx.translate(x + (f === -1 ? this.w : 0), y);
    ctx.scale(f, 1);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(2, this.h - 2, this.w - 4, 4);

    // Body walk offset
    const bob = this.onGround && this.vx !== 0 ? [0, -1, 0, 1][this.walkFrame] : 0;

    // Legs
    ctx.fillStyle = '#3d6b2f';
    if (this.onGround && this.vx !== 0) {
      const legFrames = [[0, 20, 8, 10], [8, 22, 8, 8]];
      const lf = this.walkFrame % 2;
      ctx.fillRect(legFrames[lf][0], legFrames[lf][1] + bob, legFrames[lf][2], legFrames[lf][3]);
      ctx.fillRect(legFrames[1-lf][0], legFrames[1-lf][1] + bob, 8, 8);
    } else {
      ctx.fillRect(0, 26 + bob, 10, 14);
      ctx.fillRect(14, 26 + bob, 10, 14);
    }
    // Boots
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(0,  34 + bob, 10, 6);
    ctx.fillRect(14, 34 + bob, 10, 6);

    // Body
    ctx.fillStyle = '#3d6b2f';
    ctx.fillRect(0, 16 + bob, 24, 14);
    // Belt
    ctx.fillStyle = '#8c6a2a';
    ctx.fillRect(0, 24 + bob, 24, 3);
    // Backpack
    ctx.fillStyle = '#5a8c3e';
    ctx.fillRect(16, 16 + bob, 8, 10);

    // Arms
    ctx.fillStyle = '#c8845a';
    ctx.fillRect(-4, 18 + bob, 6, 10);
    ctx.fillRect(22, 18 + bob, 6, 10);

    // Neck
    ctx.fillStyle = '#c8845a';
    ctx.fillRect(8, 10 + bob, 8, 8);

    // Head
    ctx.fillStyle = '#c8845a';
    ctx.fillRect(2, 0 + bob, 20, 16);
    // Hair
    ctx.fillStyle = '#5a2a0a';
    ctx.fillRect(2, 0 + bob, 20, 5);
    // Eyes
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(6, 5 + bob, 3, 3);
    ctx.fillRect(15, 5 + bob, 3, 3);
    // Cap
    ctx.fillStyle = '#1a4a0a';
    ctx.fillRect(1, -4 + bob, 22, 6);
    ctx.fillRect(0, 0 + bob, 24, 3);
    // Cap badge
    ctx.fillStyle = '#76ff73';
    ctx.fillRect(9, -3 + bob, 6, 3);

    // Binocular when active
    if (this.game.binocularOn) {
      ctx.fillStyle = '#4a8c4a';
      ctx.fillRect(-2, 18 + bob, 10, 5);
      ctx.fillStyle = '#76ff73';
      ctx.fillRect(-4, 19 + bob, 4, 3);
      ctx.fillRect(4,  19 + bob, 4, 3);
    }

    ctx.restore();
  }
}


// ══════════════════════════════════════════════════════════════
//  ROBOT
// ══════════════════════════════════════════════════════════════
class Robot {
  constructor(x, y, type, game) {
    this.x = x;
    this.y = y;
    this.type = type; // patrol | heavy | drone
    this.game = game;
    this.stunned  = 0;
    this.disabled = false;
    this.facing   = 1;
    this.speed    = type === 'heavy' ? 0.8 : type === 'drone' ? 1.2 : 1.5;
    this.patrolDir= 1;
    this.patrolDist = 80 + Math.random() * 60;
    this.startX   = x;
    this.h = type === 'heavy' ? 48 : type === 'drone' ? 28 : 36;
    this.w = type === 'heavy' ? 40 : type === 'drone' ? 32 : 30;
    this.floatY   = 0;
  }

  update() {
    if (this.disabled) return;

    if (this.stunned > 0) {
      this.stunned--;
      if (this.stunned === 0) this.disabled = true;
      return;
    }

    // Patrol
    this.x += this.speed * this.patrolDir;
    if (Math.abs(this.x - this.startX) > this.patrolDist) {
      this.patrolDir *= -1;
      this.facing *= -1;
    }

    // Drone floats
    if (this.type === 'drone') {
      this.floatY = Math.sin(Date.now() * 0.002) * 20;
    }

    // Stay on ground
    if (this.type !== 'drone') {
      this.game.resolveGround(this);
    }
  }

  render(ctx, tick) {
    if (this.disabled) return;
    const alpha = this.stunned > 0 ? 0.4 + 0.3 * Math.sin(tick * 0.5) : 1;
    ctx.globalAlpha = alpha;

    const x = this.x | 0;
    let y = this.y | 0;
    if (this.type === 'drone') y += this.floatY | 0;

    ctx.save();
    ctx.translate(x + (this.facing === -1 ? this.w : 0), y);
    ctx.scale(this.facing, 1);

    if (this.type === 'patrol') this._drawPatrol(ctx, tick);
    else if (this.type === 'heavy')  this._drawHeavy(ctx, tick);
    else if (this.type === 'drone')  this._drawDrone(ctx, tick);

    ctx.restore();
    ctx.globalAlpha = 1;

    // Stun stars
    if (this.stunned > 0) {
      for (let i = 0; i < 3; i++) {
        const angle = tick * 0.15 + i * (Math.PI * 2 / 3);
        const sx = x + this.w / 2 + 14 * Math.cos(angle);
        const sy = y - 10 + 5 * Math.sin(angle);
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px monospace';
        ctx.fillText('★', sx - 6, sy);
      }
    }
  }

  _drawPatrol(ctx, tick) {
    const col = this.game.biome.robotColor;
    // Treads
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 26, 30, 10);
    ctx.fillStyle = '#555';
    for (let i = 0; i < 4; i++) ctx.fillRect(2 + i * 7, 28, 5, 6);
    // Body
    ctx.fillStyle = col;
    ctx.fillRect(2, 8, 26, 20);
    // Head
    ctx.fillStyle = '#8c8c7a';
    ctx.fillRect(6, 0, 18, 12);
    // Eye
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(10, 3, 10, 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(12, 4, 3, 4);
    // Net arm
    ctx.fillStyle = '#7a7a6a';
    ctx.fillRect(26, 12, 8, 4);
    // Net
    if (Math.floor(tick / 20) % 2 === 0) {
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1;
      for (let ni = 0; ni < 3; ni++) {
        ctx.beginPath();
        ctx.moveTo(30 + ni * 4, 10);
        ctx.lineTo(34 + ni * 4, 24);
        ctx.stroke();
      }
    }
  }

  _drawHeavy(ctx, tick) {
    const col = '#c8742a';
    // Treads
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 34, 40, 14);
    for (let i = 0; i < 5; i++) ctx.fillRect(2 + i * 8, 36, 6, 8);
    // Body
    ctx.fillStyle = col;
    ctx.fillRect(2, 10, 36, 26);
    // Shoulders
    ctx.fillStyle = '#e88c3a';
    ctx.fillRect(-4, 12, 10, 18);
    ctx.fillRect(34, 12, 10, 18);
    // Head
    ctx.fillStyle = '#c8742a';
    ctx.fillRect(8, 0, 24, 14);
    // Eyes
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(10, 3, 8, 6);
    ctx.fillRect(22, 3, 8, 6);
    // Log
    ctx.fillStyle = '#8c5a1e';
    ctx.fillRect(-8, 6, 14, 10);
  }

  _drawDrone(ctx, tick) {
    // Rotors
    ctx.fillStyle = '#555';
    const rotAngle = tick * 0.4;
    for (let r = 0; r < 2; r++) {
      ctx.save();
      ctx.translate(r === 0 ? 4 : 28, -4);
      ctx.rotate(rotAngle);
      ctx.fillRect(-10, -2, 20, 4);
      ctx.restore();
    }
    // Body
    ctx.fillStyle = '#5a7a8c';
    ctx.fillRect(6, 0, 20, 16);
    // Camera eye
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(16, 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00b8d4';
    ctx.beginPath();
    ctx.arc(16, 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}


// ══════════════════════════════════════════════════════════════
//  ANIMAL
// ══════════════════════════════════════════════════════════════
class Animal {
  constructor(x, y, data, game) {
    this.x = x;
    this.y = y;
    this.data = data;
    this.game = game;
    this.cataloged = STATE.cataloged.has(data.id);
    this.w = 28;
    this.h = 28;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.fled = this.cataloged;
  }

  update() {
    if (this.fled) return;

    // Stay on ground
    this.game.resolveGround(this);

    // Bob
    this.bobPhase += 0.05;

    // Check proximity for indicator
    const p = this.game.player;
    const dx = Math.abs(p.x - this.x);
    this.nearPlayer = dx < GAME_CONFIG.CATALOG_RADIUS;
  }

  render(ctx, tick) {
    if (this.fled) return;

    const x = this.x | 0;
    const y = (this.y + Math.sin(this.bobPhase) * 3) | 0;

    // Glow when near
    if (this.nearPlayer) {
      ctx.fillStyle = `rgba(255,180,0,${0.15 + 0.1 * Math.sin(tick * 0.2)})`;
      ctx.beginPath();
      ctx.arc(x + 14, y + 14, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Animal emoji drawn as canvas text
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.data.emoji, x + 14, y + 14);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Interaction prompt
    if (this.nearPlayer) {
      ctx.fillStyle = '#ffb300';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[E]', x + 14, y - 10);
      ctx.textAlign = 'left';

      // Bouncing arrow
      const arrowY = y - 20 + Math.sin(tick * 0.15) * 4;
      ctx.fillText('▼', x + 10, arrowY);
    }

    // Name tag
    if (this.nearPlayer) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(x - 30, y + 28, 88, 14);
      ctx.fillStyle = '#fff';
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      const shortName = this.data.name.length > 14 ? this.data.name.slice(0,14)+'…' : this.data.name;
      ctx.fillText(shortName, x + 14, y + 38);
      ctx.textAlign = 'left';
    }
  }
}
