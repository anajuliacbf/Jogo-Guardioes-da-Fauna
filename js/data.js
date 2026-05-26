// =====================================================================
// GUARDIÕES DA FAUNA — js/data.js
// Banco de dados conforme GDD: 20 animais, 4 biomas, 5 tipos de robô,
// cutscenes, conquistas, tilemaps
// =====================================================================
'use strict';

// ── TILES ───────────────────────────────────────────────────────────
const TILES = {
  AIR:0, SOLID:1, PLATFORM:2, LIANA:3, WATER:4, FIRE:5,
  LILY:6, EXIT:7, CHECKPOINT:8, WATER_TOP:9, CUPIM:10, TREE_HOLLOW:11
};
const CHAR_TO_TILE = {
  ' ':0, '#':1, '-':2, 'V':3, '~':4, 'F':5,
  'L':6, 'E':7, 'C':8, 'W':9, 'P':10, 'H':11
};
function parseMap(rows){ return rows.map(r => r.split('').map(c => CHAR_TO_TILE[c] ?? 0)); }

// ── ANIMAIS (20 — 5 por bioma, conforme GDD) ─────────────────────────
const ANIMALS = [
  // ════ MATA ATLÂNTICA ════
  {id:'mico_leao', biome:'mata', name:'Mico-Leão-Dourado', scientific:'Leontopithecus rosalia',
   emoji:'🦁', status:'Em Perigo', statusLevel:3,
   fact:'Símbolo mundial da luta contra a extinção! Sua pelagem dourada é única no planeta.',
   behavior:'treetop', catchMode:'normal', catchRadius:44, isRare:false},

  {id:'tucano', biome:'mata', name:'Tucano-de-Bico-Preto', scientific:'Ramphastos vitellinus',
   emoji:'🦜', status:'Vulnerável', statusLevel:2,
   fact:'Seu bico colorido serve como radiador natural para regular a temperatura corporal!',
   behavior:'perched', catchMode:'normal', catchRadius:48, isRare:false},

  {id:'preguica', biome:'mata', name:'Bicho-Preguiça', scientific:'Bradypus variegatus',
   emoji:'🦥', status:'Pouco Preocupante', statusLevel:1,
   fact:'Move-se tão devagar que algas crescem em sua pelagem, dando camuflagem perfeita!',
   behavior:'slow', catchMode:'protect', catchRadius:52, isRare:false},

  {id:'jaguatirica', biome:'mata', name:'Jaguatirica', scientific:'Leopardus pardalis',
   emoji:'🐆', status:'Quase Ameaçado', statusLevel:2,
   fact:'O felino manchado mais habilidoso da América! Nada, escala árvores e caça com maestria.',
   behavior:'hidden', catchMode:'secret', catchRadius:38, isRare:false},

  {id:'quati', biome:'mata', name:'Quati', scientific:'Nasua nasua',
   emoji:'🦡', status:'Pouco Preocupante', statusLevel:1,
   fact:'Vivem em grupos de até 20 fêmeas! Usam o focinho longo para farejar insetos.',
   behavior:'group', catchMode:'group_save', catchRadius:58, isRare:false},

  // ════ AMAZÔNIA ════
  {id:'boto', biome:'amazonia', name:'Boto-Cor-de-Rosa', scientific:'Inia geoffrensis',
   emoji:'🐬', status:'Em Perigo', statusLevel:3,
   fact:'O maior golfinho de água doce do mundo! Gira a cabeça 180° graças às vértebras móveis.',
   behavior:'aquatic', catchMode:'disable_net', catchRadius:62, isRare:false},

  {id:'peixe_boi', biome:'amazonia', name:'Peixe-Boi-da-Amazônia', scientific:'Trichechus inunguis',
   emoji:'🦭', status:'Vulnerável', statusLevel:2,
   fact:'Único mamífero aquático totalmente herbívoro do Brasil. Come até 8% do peso por dia!',
   behavior:'aquatic_slow', catchMode:'normal', catchRadius:66, isRare:false},

  {id:'arara_azul', biome:'amazonia', name:'Arara-Azul', scientific:'Anodorhynchus hyacinthinus',
   emoji:'🦜', status:'Vulnerável', statusLevel:2,
   fact:'O maior papagaio do mundo! Ao ser salva, solta uma pena azul como recompensa.',
   behavior:'treetop', catchMode:'normal', catchRadius:42, isRare:false, dropsCollectible:'pena_azul'},

  {id:'tamandua_mirim', biome:'amazonia', name:'Tamanduá-Mirim', scientific:'Tamandua tetradactyla',
   emoji:'🐜', status:'Pouco Preocupante', statusLevel:1,
   fact:'Pode comer até 9.000 insetos por dia! Usa as garras para abrir cupinzeiros.',
   behavior:'ground', catchMode:'normal', catchRadius:46, isRare:false},

  {id:'uirapuru', biome:'amazonia', name:'Uirapuru', scientific:'Cyphorhinus arada',
   emoji:'🐦', status:'Pouco Preocupante', statusLevel:1,
   fact:'O pássaro da felicidade! Seu canto imita outras espécies com perfeição.',
   behavior:'hidden', catchMode:'secret', catchRadius:36, isRare:false},

  // ════ CERRADO ════
  {id:'lobo_guara', biome:'cerrado', name:'Lobo-Guará', scientific:'Chrysocyon brachyurus',
   emoji:'🦊', status:'Quase Ameaçado', statusLevel:2,
   fact:'Não é lobo nem raposa! Único do seu gênero. Pernas longas para enxergar na vegetação alta.',
   behavior:'shy', catchMode:'slow_approach', catchRadius:84, isRare:false, fleeRadius:130},

  {id:'tamandua_bandeira', biome:'cerrado', name:'Tamanduá-Bandeira', scientific:'Myrmecophaga tridactyla',
   emoji:'🐜', status:'Vulnerável', statusLevel:2,
   fact:'A língua entra e sai do cupinzeiro até 160 vezes por minuto para capturar insetos!',
   behavior:'foraging', catchMode:'normal', catchRadius:52, isRare:false},

  {id:'ema', biome:'cerrado', name:'Ema', scientific:'Rhea americana',
   emoji:'🦢', status:'Quase Ameaçado', statusLevel:2,
   fact:'A maior ave das Américas! Corre até 60 km/h. Os machos chocam os ovos!',
   behavior:'running', catchMode:'normal', catchRadius:74, isRare:false},

  {id:'tatu_canastra', biome:'cerrado', name:'Tatu-Canastra', scientific:'Priodontes maximus',
   emoji:'🦔', status:'Vulnerável', statusLevel:2,
   fact:'O maior tatu do mundo! Suas tocas servem de abrigo para mais de 50 espécies.',
   behavior:'burrowing', catchMode:'normal', catchRadius:48, isRare:false},

  {id:'seriema', biome:'cerrado', name:'Seriema', scientific:'Cariama cristata',
   emoji:'🦃', status:'Pouco Preocupante', statusLevel:1,
   fact:'Parente distante dos dinossauros predadores! Bate a presa no chão antes de comer.',
   behavior:'ground', catchMode:'normal', catchRadius:52, isRare:false},

  // ════ PANTANAL ════
  {id:'tuiuiu', biome:'pantanal', name:'Tuiuiú', scientific:'Jabiru mycteria',
   emoji:'🦢', status:'Vulnerável', statusLevel:2,
   fact:'Ave símbolo do Pantanal! Seus ninhos podem pesar até 200 kg e são reutilizados por anos.',
   behavior:'nesting', catchMode:'normal', catchRadius:52, isRare:false},

  {id:'capivara', biome:'pantanal', name:'Capivara', scientific:'Hydrochoerus hydrochaeris',
   emoji:'🦛', status:'Pouco Preocupante', statusLevel:1,
   fact:'O maior roedor do mundo! Ao salvar uma capivara, toda a família é resgatada junto!',
   behavior:'group_water', catchMode:'group_save', catchRadius:74, isRare:false},

  {id:'jacare', biome:'pantanal', name:'Jacaré-do-Pantanal', scientific:'Caiman crocodilus yacare',
   emoji:'🐊', status:'Pouco Preocupante', statusLevel:1,
   fact:'Fundamental para o equilíbrio do ecossistema! Controla populações de peixes e roedores.',
   behavior:'semi_aquatic', catchMode:'normal', catchRadius:56, isRare:false},

  {id:'lontra', biome:'pantanal', name:'Lontra-Gigante', scientific:'Pteronura brasiliensis',
   emoji:'🦦', status:'Em Perigo', statusLevel:3,
   fact:'O maior mustelídeo do mundo! Vive em famílias coesas e canta para se comunicar.',
   behavior:'aquatic', catchMode:'normal', catchRadius:58, isRare:false},

  {id:'onca_pintada', biome:'pantanal', name:'Onça-Pintada', scientific:'Panthera onca',
   emoji:'🐆', status:'Vulnerável', statusLevel:2,
   fact:'O maior felino das Américas! Nada, escala árvores e é mestre da camuflagem.',
   behavior:'rare', catchMode:'secret', catchRadius:42, isRare:true, achievement:'guardiao_supremo'},
];

// ── BIOMAS ───────────────────────────────────────────────────────────
const BIOMES = {
  mata: {
    id:'mata', name:'Mata Atlântica', desc:'Floresta densa e vertical', targetCount:5,
    gravity:0.55, hasWater:false, hasClimbing:true, hasFire:false, hasBoss:false,
    colors:{sky:'#4a8f6f', skyB:'#a8d8a8', ground:'#5D4037', gTop:'#388E3C',
            platform:'#8B6914', liana:'#4CAF50', bg1:'#1B5E20', bg2:'#2E7D32'}
  },
  amazonia: {
    id:'amazonia', name:'Amazônia', desc:'Floresta inundada & rios', targetCount:5,
    gravity:0.55, gravityWater:0.12, swimSpeed:2.8, hasWater:true, hasClimbing:true,
    hasFire:false, hasBoss:false, lilyDuration:2200,
    colors:{sky:'#0288D1', skyB:'#4FC3F7', ground:'#3E2723', gTop:'#1B5E20',
            platform:'#5D4037', liana:'#66BB6A', water:'#01579B', waterS:'#0288D1',
            bg1:'#1A237E', bg2:'#283593'}
  },
  cerrado: {
    id:'cerrado', name:'Cerrado', desc:'Seca & árvores retorcidas', targetCount:5,
    gravity:0.55, hasWater:false, hasClimbing:false, hasFire:true, hasBoss:false,
    fireDamageInterval:900,
    colors:{sky:'#BF6900', skyB:'#FFCC80', ground:'#BF360C', gTop:'#8D6E63',
            platform:'#6D4C41', fire:'#FF6D00', bg1:'#E65100', bg2:'#BF360C'}
  },
  pantanal: {
    id:'pantanal', name:'Pantanal', desc:'Confronto Final — Robô Alfa', targetCount:5,
    gravity:0.55, gravityWater:0.12, swimSpeed:2.8, hasWater:true, hasClimbing:false,
    hasFire:false, hasBoss:true,
    colors:{sky:'#4a1530', skyB:'#FF6F00', ground:'#4E342E', gTop:'#5D4037',
            platform:'#6D4C41', water:'#01579B', waterS:'#0277BD',
            bg1:'#880E4F', bg2:'#6A1B4D'}
  },
};

// ── TILEMAPS (60×8 — ~2.4 telas) ─────────────────────────────────────
const LEVEL_MAPS = {
  mata: [
    "                                                            ",
    "           -                    -          -                ",
    "    -         V       -              V         --           ",
    "          -   V          -          V    --                 ",
    "  --      -   V    --    -     --   V  -      -             ",
    "C             V                V              C        E    ",
    "##############################V#####V############################",
    "############################################################"
  ],
  amazonia: [
    "                                                            ",
    "    --        -                -          --        -       ",
    "                                                            ",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "~  L     L    L                    L     L    L           ~",
    "~                                                          ~",
    "C  ##########L######L########L######L#########  C  #####  E  ",
    "############################################################"
  ],
  cerrado: [
    "                                                            ",
    "                                                            ",
    "  --          --          --          --          --        ",
    "      FFFF         FFFF        FFFF         FFFF            ",
    "  ---        ---         ---        ---   ---    ---        ",
    "C                                               C       E   ",
    "############################################################",
    "############################################################"
  ],
  pantanal: [
    "                                                            ",
    "   --           --            --           --               ",
    "      WWWWWWWWW                  WWWWWWWWWWWW               ",
    "  --- ~~~~~~~~~   ---            ~~~~~~~~~~~~  ---          ",
    "      ~~~~~~~~~                  ~~~~~~~~~~~~               ",
    "C                                              C        E   ",
    "############################################################",
    "############################################################"
  ],
};

// ── SPAWNS DE ANIMAIS ────────────────────────────────────────────────
const ANIMAL_SPAWNS = {
  mata:[
    {id:'mico_leao',   tx:7,  ty:2},  // galho alto
    {id:'tucano',      tx:22, ty:2},  // copa média
    {id:'preguica',    tx:27, ty:3},  // tronco — precisa proteger
    {id:'quati',       tx:43, ty:5},  // chão em grupo
    {id:'jaguatirica', tx:55, ty:2},  // área secreta
  ],
  amazonia:[
    {id:'arara_azul',     tx:7,  ty:1}, // topo
    {id:'tamandua_mirim', tx:20, ty:6}, // chão seco
    {id:'boto',           tx:29, ty:5}, // submerso
    {id:'peixe_boi',      tx:39, ty:6}, // fundo do rio
    {id:'uirapuru',       tx:53, ty:1}, // copa escondida
  ],
  cerrado:[
    {id:'ema',               tx:9,  ty:5}, // planície
    {id:'tamandua_bandeira', tx:19, ty:5}, // perto cupinzeiro
    {id:'lobo_guara',        tx:31, ty:5}, // tímido!
    {id:'tatu_canastra',     tx:41, ty:5}, // saindo da toca
    {id:'seriema',           tx:50, ty:5}, // planície
  ],
  pantanal:[
    {id:'capivara',     tx:9,  ty:5}, // família na margem
    {id:'tuiuiu',       tx:21, ty:1}, // ninho alto
    {id:'jacare',       tx:30, ty:5}, // beira d'água
    {id:'lontra',       tx:39, ty:4}, // dentro da água
    {id:'onca_pintada', tx:55, ty:1}, // RARA — área secreta
  ],
};

// ── SPAWNS DE ROBÔS ──────────────────────────────────────────────────
const ENEMY_SPAWNS = {
  mata:[
    {type:'patrulheiro', tx:13, ty:6, patrol:[10,18]},
    {type:'patrulheiro', tx:32, ty:6, patrol:[28,36]},
    {type:'drone',       tx:40, ty:2, patrol:[37,48]},
    {type:'pesado',      tx:51, ty:6, patrol:[49,56]},
  ],
  amazonia:[
    {type:'patrulheiro', tx:12, ty:6, patrol:[9,19]},
    {type:'drone',       tx:26, ty:1, patrol:[22,32]},
    {type:'piranha',     tx:33, ty:5, patrol:[28,40]},
    {type:'piranha',     tx:44, ty:6, patrol:[40,52]},
    {type:'pesado',      tx:50, ty:6, patrol:[47,55]},
  ],
  cerrado:[
    {type:'patrulheiro', tx:6,  ty:5, patrol:[3,12]},
    {type:'patrulheiro', tx:17, ty:5, patrol:[14,25]},
    {type:'drone',       tx:28, ty:1, patrol:[23,36]},
    {type:'patrulheiro', tx:38, ty:5, patrol:[34,45]},
    {type:'pesado',      tx:47, ty:5, patrol:[44,53]},
  ],
  pantanal:[
    {type:'patrulheiro', tx:5,  ty:5, patrol:[2,12]},
    {type:'drone',       tx:16, ty:1, patrol:[11,24]},
    {type:'piranha',     tx:31, ty:4, patrol:[26,40]},
    {type:'patrulheiro', tx:40, ty:5, patrol:[37,47]},
    {type:'drone',       tx:50, ty:1, patrol:[45,55]},
    {type:'alfa',        tx:52, ty:5, isBoss:true},
  ],
};

// ── METADATA POR FASE ────────────────────────────────────────────────
const LEVEL_META = {
  mata:    {checkpoints:[{tx:1,ty:5},{tx:37,ty:5}], exit:{tx:57,ty:5}},
  amazonia:{checkpoints:[{tx:1,ty:6},{tx:34,ty:6}], exit:{tx:57,ty:6}},
  cerrado: {checkpoints:[{tx:1,ty:5},{tx:32,ty:5}], exit:{tx:56,ty:5}},
  pantanal:{checkpoints:[{tx:1,ty:5},{tx:32,ty:5}], exit:{tx:57,ty:5}},
};

// ── ZONAS ESPECIAIS ──────────────────────────────────────────────────
const SPECIAL_ZONES = {
  mata:    {lilyPads:[], nets:[]},
  amazonia:{lilyPads:[{tx:3},{tx:6},{tx:10},{tx:13},{tx:46},{tx:50},{tx:54}],
            nets:[{tx:29, ty:5}]}, // rede elétrica perto do Boto
  cerrado: {lilyPads:[], nets:[]},
  pantanal:{lilyPads:[], nets:[]},
};

// ── TIPOS DE ROBÔ (conforme GDD seção 5) ─────────────────────────────
const ENEMY_TYPES = {
  patrulheiro: {
    name:'Robô Patrulheiro (O Coletor)',
    w:30, h:38, speed:2.2, hpMax:3, damage:1, knockback:75,
    color:'#78909C', flies:false, aquatic:false, stunMs:4500,
    desc:'Anda de um lado pro outro com rede. Pula em cima e use binóculo nas costas.'
  },
  drone: {
    name:'Drone Aéreo (O Observador)',
    w:36, h:26, speed:3.0, hpMax:2, damage:1, knockback:55,
    color:'#546E7A', flies:true, aquatic:false, stunMs:3500,
    flashRange:110,
    desc:'Voa monitorando a área. Use binóculo para ofuscar a câmera dele.'
  },
  piranha: {
    name:'Robô Piranha (Limpador Aquático)',
    w:38, h:22, speed:1.7, hpMax:2, damage:1, knockback:50,
    color:'#4CAF50', flies:false, aquatic:true, stunMs:3500,
    desc:'No fundo dos rios. Desvie e use o binóculo para desativar os propulsores.'
  },
  pesado: {
    name:'Robô Pesado (O Bloqueador)',
    w:48, h:52, speed:1.4, hpMax:5, damage:1, knockback:38,
    color:'#FFA000', flies:false, aquatic:false, stunMs:7000, blocksPath:true,
    desc:'Carrega troncos e bloqueia o caminho. Espere ele parar e use o binóculo.'
  },
  alfa: {
    name:'Robô Alfa (Boss Final)',
    w:80, h:96, speed:1.0, hpMax:5, damage:1, knockback:120,
    color:'#F44336', flies:false, aquatic:false, stunMs:9000, isBoss:true,
    phases:[
      {hpThreshold:4, pattern:'stomp'},
      {hpThreshold:2, pattern:'charge'},
      {hpThreshold:1, pattern:'spin'},
    ],
    desc:'O núcleo do Protocolo Ferrugem. Três fases de combate!'
  },
};

// ── CONQUISTAS ───────────────────────────────────────────────────────
const ACHIEVEMENTS = {
  guardiao_supremo: {id:'guardiao_supremo', name:'Guardião Supremo',
    desc:'Catalogue a Onça-Pintada rara no Pantanal.', icon:'🏆'},
  naturalista: {id:'naturalista', name:'Naturalista Completo',
    desc:'Catalogue todos os 20 animais brasileiros.', icon:'📖'},
  coracao_intacto: {id:'coracao_intacto', name:'Guardião de Coração',
    desc:'Complete uma fase sem perder nenhum coração.', icon:'❤️'},
  velocista: {id:'velocista', name:'Velocista Verde',
    desc:'Complete a Mata Atlântica em menos de 3 minutos.', icon:'⚡'},
  pacifista: {id:'pacifista', name:'Pacifista Digital',
    desc:'Complete uma fase sem disparar o binóculo.', icon:'🕊️'},
  pena_azul: {id:'pena_azul', name:'Coletor de Penas',
    desc:'Receba a pena azul da Arara-Azul.', icon:'🪶'},
};

// ── CUTSCENES (conforme GDD seção 12) ─────────────────────────────────
const CUTSCENES = {
  intro: [
    {bgArt:'forest_dawn',  speaker:'Narrador', text:'O equilíbrio natural da fauna brasileira está ameaçado...'},
    {bgArt:'factory_dark', speaker:'Narrador', text:'Uma antiga inteligência artificial, o "PROTOCOLO FERRUGEM", foi reativada por engano.'},
    {bgArt:'robots_advance',speaker:'Narrador', text:'Suas Unidades Robóticas invadiram os biomas para "organizar" a natureza, engaiolando animais.'},
    {bgArt:'leo_lab',      speaker:'Leo',      text:'O laboratório dos meus avós... e este é o BINÓCULO SOLAR que eles deixaram!'},
    {bgArt:'leo_ready',    speaker:'Leo',      text:'Sou Leo, Guardião da Fauna! Vou proteger todos os animais brasileiros!'},
  ],
  mata_chegada: [
    {bgArt:'mata_dense',   speaker:'Leo',      text:'A Mata Atlântica... que floresta densa! Posso ouvir os animais assustados.'},
    {bgArt:'mico_panic',   speaker:'Mico-Leão',text:'Squee! Os robôs estão capturando todos! Precisamos de ajuda urgente!'},
    {bgArt:'leo_brave',    speaker:'Leo',      text:'Vou catalogar cada um e desativar os robôs com a luz do meu binóculo!'},
  ],
  amazonia_chegada: [
    {bgArt:'amazon_river', speaker:'Leo',      text:'A Amazônia! A floresta inundada... vou precisar nadar muito por aqui.'},
    {bgArt:'boto_net',     speaker:'Boto',     text:'Glub! Estou preso numa rede elétrica subaquática! Por favor, me ajude!'},
    {bgArt:'leo_dive',     speaker:'Leo',      text:'Aguenta firme, Boto! Vou mergulhar e desativar essas redes!'},
  ],
  cerrado_chegada: [
    {bgArt:'cerrado_fire', speaker:'Leo',      text:'O Cerrado... os robôs atearam fogo na vegetação seca!'},
    {bgArt:'wolf_hidden',  speaker:'Lobo-Guará',text:'(Olha tímido escondido na vegetação alta...)'},
    {bgArt:'leo_quiet',    speaker:'Leo',      text:'Ei, Lobo-Guará... não fuja. Vou andar devagar para não te assustar.'},
  ],
  pantanal_chegada: [
    {bgArt:'pantanal_sun', speaker:'Leo',      text:'O Pantanal ao pôr do sol... lindo, mas perigoso. O núcleo está aqui.'},
    {bgArt:'alpha_reveal', speaker:'Robô Alfa',text:'INTRUSO DETECTADO. INICIANDO PROTOCOLO DE CONTENÇÃO.'},
    {bgArt:'leo_final',    speaker:'Leo',      text:'Com a ajuda de toda a fauna que salvei, vou desativar você de uma vez!'},
  ],
  final: [
    {bgArt:'victory',      speaker:'Narrador', text:'Leo desativou o núcleo do Protocolo Ferrugem permanentemente!'},
    {bgArt:'animals_free', speaker:'Narrador', text:'Todos os animais retornaram livres aos seus habitats naturais.'},
    {bgArt:'leo_smile',    speaker:'Leo',      text:'A tecnologia e a natureza podem coexistir em harmonia. Missão cumprida!'},
  ],
};

// ── SAVE PADRÃO ──────────────────────────────────────────────────────
const DEFAULT_SAVE = {
  version: 1,
  biomesUnlocked:  {mata:true,  amazonia:false, cerrado:false, pantanal:false},
  biomesCompleted: {mata:false, amazonia:false, cerrado:false, pantanal:false},
  cataloged: [],
  achievements: [],
  collectibles: [],  // ex: 'pena_azul'
  totalCataloged: 0,
  introSeen: false,
  musicVol: 0.7,
  sfxVol: 0.8,
};

// ── HELPERS ──────────────────────────────────────────────────────────
function getAnimalById(id) { return ANIMALS.find(a => a.id === id) || null; }
function getAnimalsByBiome(b) { return ANIMALS.filter(a => a.biome === b); }
function getTotalAnimals() { return ANIMALS.length; }
function getLevelGrid(b) { return parseMap(LEVEL_MAPS[b]); }
function buildLevel(b) {
  return {
    biome: b, biomeConfig: BIOMES[b], grid: getLevelGrid(b), tileSize: 32,
    animalSpawns: ANIMAL_SPAWNS[b], enemySpawns: ENEMY_SPAWNS[b],
    checkpoints: LEVEL_META[b].checkpoints, exit: LEVEL_META[b].exit,
    specialZones: SPECIAL_ZONES[b],
  };
}
