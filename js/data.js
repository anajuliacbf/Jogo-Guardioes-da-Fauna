// ══════════════════════════════════════════════════════════════
//  GUARDIÕES DA FAUNA — data.js
//  Animal database, biome configs, game constants
// ══════════════════════════════════════════════════════════════

const ANIMALS = [
  // ── MATA ATLÂNTICA ──────────────────────────────────────────
  {
    id: 'mico',
    name: 'Mico-Leão-Dourado',
    sci: 'Leontopithecus rosalia',
    emoji: '🐒',
    status: 'Em Perigo',
    biome: 'Mata Atlântica',
    fact: 'Símbolo da luta contra a extinção! Só restam ~3.000 no mundo.',
    color: '#d4a017',
    x: 400, y: 0, // will be set by level
    type: 'platform' // found on platforms
  },
  {
    id: 'tucano',
    name: 'Tucano-de-Bico-Preto',
    sci: 'Ramphastos vitellinus',
    emoji: '🦜',
    status: 'Vulnerável',
    biome: 'Mata Atlântica',
    fact: 'Seu bico colorido ajuda na dispersão de sementes pela floresta.',
    color: '#000',
    x: 700, y: 0,
    type: 'platform'
  },
  {
    id: 'preguica',
    name: 'Bicho-Preguiça',
    sci: 'Bradypus variegatus',
    emoji: '🦥',
    status: 'Pouco Preocupante',
    biome: 'Mata Atlântica',
    fact: 'Move-se tão devagar que algas crescem em seu pelo!',
    color: '#8c7a5a',
    x: 900, y: 0,
    type: 'ground'
  },
  // ── AMAZÔNIA ────────────────────────────────────────────────
  {
    id: 'boto',
    name: 'Boto-Cor-de-Rosa',
    sci: 'Inia geoffrensis',
    emoji: '🐬',
    status: 'Vulnerável',
    biome: 'Amazônia',
    fact: 'O único golfinho de água doce da América do Sul!',
    color: '#ff9fbf',
    x: 500, y: 0,
    type: 'water'
  },
  {
    id: 'peixeboi',
    name: 'Peixe-Boi da Amazônia',
    sci: 'Trichechus inunguis',
    emoji: '🐄',
    status: 'Em Perigo',
    biome: 'Amazônia',
    fact: 'Pode comer até 8% de seu peso corporal em plantas aquáticas por dia.',
    color: '#5a8a8a',
    x: 800, y: 0,
    type: 'water'
  },
  {
    id: 'arara',
    name: 'Arara-Azul',
    sci: 'Anodorhynchus hyacinthinus',
    emoji: '🦜',
    status: 'Vulnerável',
    biome: 'Amazônia',
    fact: 'A maior arara do mundo! Solta uma pena ao ser salva.',
    color: '#1a5cbf',
    x: 1100, y: 0,
    type: 'platform'
  },
  // ── CERRADO ─────────────────────────────────────────────────
  {
    id: 'lobo',
    name: 'Lobo-Guará',
    sci: 'Chrysocyon brachyurus',
    emoji: '🦊',
    status: 'Quase Ameaçado',
    biome: 'Cerrado',
    fact: 'Aproxime devagar! É tímido e foge ao mínimo barulho.',
    color: '#c8742a',
    x: 450, y: 0,
    type: 'ground'
  },
  {
    id: 'tamandua',
    name: 'Tamanduá-Bandeira',
    sci: 'Myrmecophaga tridactyla',
    emoji: '🐜',
    status: 'Vulnerável',
    biome: 'Cerrado',
    fact: 'Sua língua pode entrar e sair da boca 150 vezes por minuto!',
    color: '#5a3a1a',
    x: 750, y: 0,
    type: 'ground'
  },
  {
    id: 'ema',
    name: 'Ema',
    sci: 'Rhea americana',
    emoji: '🦢',
    status: 'Pouco Preocupante',
    biome: 'Cerrado',
    fact: 'A maior ave do Brasil! Corre a até 60 km/h nas planícies.',
    color: '#8c7a5a',
    x: 1000, y: 0,
    type: 'ground'
  },
  // ── PANTANAL ────────────────────────────────────────────────
  {
    id: 'tuiuiu',
    name: 'Tuiuiú',
    sci: 'Jabiru mycteria',
    emoji: '🦢',
    status: 'Pouco Preocupante',
    biome: 'Pantanal',
    fact: 'Ave símbolo do Pantanal! Seus ninhos chegam a 2 metros de diâmetro.',
    color: '#fff',
    x: 400, y: 0,
    type: 'platform'
  },
  {
    id: 'capivara',
    name: 'Capivara',
    sci: 'Hydrochoerus hydrochaeris',
    emoji: '🦛',
    status: 'Pouco Preocupante',
    biome: 'Pantanal',
    fact: 'O maior roedor do mundo! Salvar uma salva o grupo inteiro.',
    color: '#8c6a3a',
    x: 700, y: 0,
    type: 'ground'
  },
  {
    id: 'onca',
    name: 'Onça-Pintada',
    sci: 'Panthera onca',
    emoji: '🐆',
    status: 'Vulnerável',
    biome: 'Pantanal',
    fact: 'RARA! O maior felino da América. Conquista "Guardião Supremo"!',
    color: '#d4a017',
    x: 1300, y: 0,
    type: 'ground'
  },
];

const BIOMES = {
  mata: {
    name: 'MATA ATLÂNTICA',
    bgColor: ['#0d2b0a', '#1a4a14', '#2d7a1e'],
    groundColor: '#2d5a1a',
    platformColor: '#1a3d10',
    skyColor: '#1a3a1a',
    animals: ['mico', 'tucano', 'preguica'],
    robotColor: '#8c8c6a',
    theme: 'jungle'
  },
  amazonia: {
    name: 'AMAZÔNIA',
    bgColor: ['#0a1a3a', '#1a3a5c', '#0d4a2a'],
    groundColor: '#1a3a1a',
    platformColor: '#0d2a0a',
    skyColor: '#0a2a4a',
    animals: ['boto', 'peixeboi', 'arara'],
    robotColor: '#5a7a8c',
    theme: 'water'
  },
  cerrado: {
    name: 'CERRADO',
    bgColor: ['#3a1a0a', '#6a3a0a', '#8c5a1e'],
    groundColor: '#6a4a1a',
    platformColor: '#4a2a0a',
    skyColor: '#4a2a0a',
    animals: ['lobo', 'tamandua', 'ema'],
    robotColor: '#8c6a3a',
    theme: 'savanna'
  },
  pantanal: {
    name: 'PANTANAL',
    bgColor: ['#1a0a2a', '#3a1a0a', '#8c4a0a'],
    groundColor: '#3a2a1a',
    platformColor: '#2a1a0a',
    skyColor: '#2a0a1a',
    animals: ['tuiuiu', 'capivara', 'onca'],
    robotColor: '#c8742a',
    theme: 'wetland'
  }
};

const GAME_CONFIG = {
  TILE: 32,
  GRAVITY: 0.5,
  JUMP_FORCE: -12,
  PLAYER_SPEED: 4,
  LIVES: 3,
  BINOCULAR_RANGE: 250,
  ROBOT_SPEED: 1.5,
  CATALOG_RADIUS: 60,
};

// Save state
const STATE = {
  cataloged: new Set(),
  unlockedBiomes: new Set(['mata']),
  currentBiome: null,

  catalog(animalId) {
    this.cataloged.add(animalId);
    this.save();
  },
  unlockBiome(key) {
    this.unlockedBiomes.add(key);
    this.save();
  },
  save() {
    try {
      localStorage.setItem('gdf_save', JSON.stringify({
        cataloged: [...this.cataloged],
        unlockedBiomes: [...this.unlockedBiomes]
      }));
    } catch(e) {}
  },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem('gdf_save') || '{}');
      if (d.cataloged)      this.cataloged      = new Set(d.cataloged);
      if (d.unlockedBiomes) this.unlockedBiomes  = new Set(d.unlockedBiomes);
    } catch(e) {}
  }
};

STATE.load();
