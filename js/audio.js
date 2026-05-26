// =====================================================================
// GUARDIÕES DA FAUNA — js/audio.js
// Sistema de áudio procedural via Web Audio API
// Música por bioma + 12 efeitos sonoros, conforme GDD seção 10
// =====================================================================
'use strict';

const AudioSys = (() => {
  let ctx = null;
  let musicVol = 0.7;
  let sfxVol   = 0.8;
  let currentTheme = null;
  let _seqTimeout = null;
  let _seqIdx = 0;

  function _ctx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function _tone(freq, type, dur, vol, delay=0) {
    const c = _ctx(); if (!c) return;
    try {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = type; osc.frequency.value = freq;
      const t = c.currentTime + delay;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * sfxVol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur + 0.05);
    } catch(e) {}
  }

  function _noise(dur, vol, freq=800, delay=0) {
    const c = _ctx(); if (!c) return;
    try {
      const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i=0; i<d.length; i++) d[i] = (Math.random()*2-1);
      const src = c.createBufferSource();
      const g = c.createGain();
      const f = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.6;
      src.buffer = buf;
      src.connect(f); f.connect(g); g.connect(c.destination);
      const t = c.currentTime + delay;
      g.gain.setValueAtTime(vol * sfxVol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.start(t); src.stop(t + dur + 0.05);
    } catch(e) {}
  }

  // ── EFEITOS SONOROS ─────────────────────────────────────────────────
  const SFX = {
    jump()      { _tone(330, 'square', 0.08, 0.3); _tone(440, 'square', 0.12, 0.25, 0.05); },
    djump()     { _tone(440, 'square', 0.08, 0.35); _tone(660, 'square', 0.15, 0.3, 0.06); },
    land()      { _noise(0.07, 0.2, 400); },
    step()      { _noise(0.04, 0.08, 1200); }, // passos na grama
    hurt()      { _tone(200, 'sawtooth', 0.3, 0.4); _tone(150, 'sawtooth', 0.3, 0.35, 0.1); },
    catalog()   { [523, 659, 784, 1047].forEach((f,i) => _tone(f, 'sine', 0.15, 0.3, i*0.08)); },
    binoFire()  { _tone(880, 'square', 0.05, 0.2); _tone(1100, 'square', 0.08, 0.15, 0.03); },
    stun()      { [440, 330, 220].forEach((f,i) => _tone(f, 'sawtooth', 0.12, 0.3, i*0.07)); },
    checkpoint(){ [440, 550, 660].forEach((f,i) => _tone(f, 'sine', 0.15, 0.25, i*0.06)); },
    swim()      { _noise(0.08, 0.1, 200); }, // água corrente
    fire()      { _noise(0.15, 0.18, 600); }, // crepitar do fogo
    exit()      { [523, 659, 784, 880, 1047].forEach((f,i) => _tone(f, 'sine', 0.2, 0.3, i*0.07)); },
    gameover()  { [330, 294, 262, 247, 220].forEach((f,i) => _tone(f, 'sawtooth', 0.3, 0.35, i*0.12)); },
    win()       { [523, 659, 784, 880, 1047, 1319].forEach((f,i) => _tone(f, 'sine', 0.25, 0.3, i*0.08)); },
    menuMove()  { _tone(440, 'square', 0.04, 0.1); },
    menuSel()   { _tone(660, 'square', 0.06, 0.15); _tone(880, 'square', 0.08, 0.12, 0.05); },
    cutsceneAdvance(){ _tone(550, 'sine', 0.06, 0.15); },
    bossRoar()  { [110, 98, 87, 110].forEach((f,i)=> _tone(f, 'sawtooth', 0.25, 0.45, i*0.08)); },
    collectible(){ [880, 1100, 1320, 1760].forEach((f,i) => _tone(f, 'sine', 0.12, 0.25, i*0.06)); },
    netDisable(){ _noise(0.3, 0.25, 300); _tone(220, 'sawtooth', 0.2, 0.3, 0.1); },
  };

  // ── TEMAS MUSICAIS POR BIOMA ────────────────────────────────────────
  // Cada tema é uma sequência tocada em loop com melodia + harmonia
  const THEMES = {
    title:    {notes:[262,294,330,349,392,440,494,523,494,440,392,349], tempo:280, wave:'sine',     vol:0.10},
    mata:     {notes:[330,392,440,494,523,440,392,330,294,330,392,440], tempo:300, wave:'triangle', vol:0.09},
    amazonia: {notes:[294,330,370,392,440,494,523,494,440,392,370,330], tempo:340, wave:'sine',     vol:0.09},
    cerrado:  {notes:[220,247,262,294,330,294,262,247,220,196,220,247], tempo:280, wave:'sawtooth', vol:0.06},
    pantanal: {notes:[196,220,247,220,196,175,196,220,247,262,247,220], tempo:260, wave:'triangle', vol:0.08},
    boss:     {notes:[110,123,131,110,98,110,123,147,131,110,98,87],    tempo:180, wave:'sawtooth', vol:0.11},
    cutscene: {notes:[294,349,392,349,294,262,294,349],                 tempo:380, wave:'sine',     vol:0.08},
  };

  function _stopMusic() {
    if (_seqTimeout) { clearTimeout(_seqTimeout); _seqTimeout = null; }
    currentTheme = null;
  }

  function _playTheme(name) {
    if (currentTheme === name) return;
    _stopMusic();
    const th = THEMES[name]; if (!th) return;
    currentTheme = name;
    _seqIdx = 0;
    function step() {
      if (currentTheme !== name) return;
      const note = th.notes[_seqIdx % th.notes.length];
      _seqIdx++;
      _tone(note, th.wave, (th.tempo/1000)*0.85, th.vol * musicVol);
      // harmonia (oitava)
      if (_seqIdx % 3 === 0) _tone(note*2, 'sine', (th.tempo/1000)*0.6, th.vol*0.35*musicVol);
      // baixo
      if (_seqIdx % 4 === 0) _tone(note/2, 'triangle', (th.tempo/1000)*1.2, th.vol*0.4*musicVol);
      _seqTimeout = setTimeout(step, th.tempo);
    }
    step();
  }

  return {
    play(name)      { if (SFX[name]) SFX[name](); },
    playTheme(name) { _playTheme(name); },
    stopMusic()     { _stopMusic(); },
    setMusicVol(v)  { musicVol = Math.max(0, Math.min(1, v)); },
    setSfxVol(v)    { sfxVol   = Math.max(0, Math.min(1, v)); },
    getMusicVol()   { return musicVol; },
    getSfxVol()     { return sfxVol; },
    resume()        { _ctx(); },
  };
})();
