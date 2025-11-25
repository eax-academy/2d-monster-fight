// Core game loop and rendering logic

import { setupInput } from './input.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { Monster } from './monster.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

const TARGET_FRAME_MS = 1000 / 60;

const gameState = {
  isPaused: false,
  player: {
    hp: 100,
    accuracy: 0.88,
    critChance: 0.1,
    damageDealt: 0
  },
  monster: {
    name: 'Training Dummy',
    hp: 250,
    maxHP: 250,
    word: '',
    animationState: 'idle',
    frameTimer: 0,
    frameInterval: 250,
    defeated: false,
    victoryAnnounced: false
  },
  level: {
    id: 1,
    name: 'Grassy Dojo',
    difficulty: 'Easy'
  },
  ui: {
    score: 0,
    damageText: null,
    victoryMessage: null
  }
};

let lastTime = 0;
let player;
let level;
let monster;
let fpsAccumulator = 0;
let fpsFrames = 0;

function init() {
  setupInput();
  bindControls();
  player = new Player(100, 350);
  level = new Level();
  monster = createMonsterForLevel(gameState.level);
  lastTime = performance.now();
  console.info('Game loop initialized. Target: 60 FPS');
  window.requestAnimationFrame(gameLoop);
}

function createMonsterForLevel(levelInfo) {
  const instance = new Monster({
    name: 'Training Dummy',
    hp: 250 + levelInfo.id * 25,
    x: 520,
    y: 260,
    spriteSrc: 'assets/monsters/training-dummy.svg'
  });
  const word = loadMonsterWord();
  instance.setWord(word);
  gameState.monster.word = word;
  gameState.monster.name = instance.name;
  gameState.monster.hp = instance.hp;
  gameState.monster.maxHP = instance.maxHP;
  gameState.monster.defeated = false;
  gameState.monster.victoryAnnounced = false;
  return instance;
}

function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  if (!gameState.isPaused) {
    update(deltaTime);
    draw();
    checkFrameBudget(deltaTime);
    reportFps(deltaTime);
  }

  window.requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  monster.update(deltaTime);
  updateMonsterState(deltaTime);
  updatePlayerState(deltaTime);
  updateUiState(deltaTime);
}

function updateMonsterState(deltaTime) {
  const monsterState = gameState.monster;
  monsterState.frameTimer += deltaTime;
  if (monsterState.frameTimer >= monsterState.frameInterval) {
    monsterState.animationState = monsterState.animationState === 'idle' ? 'attack-ready' : 'idle';
    monsterState.frameTimer = 0;
  }

  monsterState.hp = monster.hp;
  monsterState.maxHP = monster.maxHP;
  monsterState.word = monster.currentWord;
  monsterState.defeated = !monster.alive;

  if (monsterState.defeated && !monsterState.victoryAnnounced) {
    handleMonsterDefeat();
  }
}

function updatePlayerState(deltaTime) {
  player.update(deltaTime, level);
  gameState.player.hp = Math.max(gameState.player.hp - deltaTime * 0.001, 0);
  gameState.player.damageDealt += deltaTime * 0.01;
}

function updateUiState(deltaTime) {
  gameState.ui.score = player.score;
  scoreEl.textContent = gameState.ui.score.toFixed(0);

  if (gameState.ui.damageText) {
    gameState.ui.damageText.timer -= deltaTime;
    gameState.ui.damageText.y -= deltaTime * 0.02;
    if (gameState.ui.damageText.timer <= 0) {
      gameState.ui.damageText = null;
    }
  }

  if (gameState.ui.victoryMessage) {
    gameState.ui.victoryMessage.timer -= deltaTime;
    if (gameState.ui.victoryMessage.timer <= 0) {
      gameState.ui.victoryMessage = null;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  level.draw(ctx);
  player.draw(ctx);
  monster.draw(ctx);
  drawHud();
  drawDamageText();
  drawVictory();
}

function drawHud() {
  ctx.fillStyle = '#333';
  ctx.font = '14px monospace';
  ctx.fillText(`Monster: ${gameState.monster.animationState}`, 16, 24);
  ctx.fillText(`Player HP: ${gameState.player.hp.toFixed(0)}`, 16, 44);
  if (gameState.monster.word) {
    ctx.fillText(`Word: ${gameState.monster.word}`, 16, 64);
  }
}

function drawDamageText() {
  const textState = gameState.ui.damageText;
  if (!textState) return;
  const alpha = Math.max(textState.timer / textState.maxTimer, 0);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ff5252';
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(textState.value, textState.x, textState.y);
  ctx.textAlign = 'start';
  ctx.restore();
}

function drawVictory() {
  const victory = gameState.ui.victoryMessage;
  if (!victory) return;

  const alpha = Math.min(victory.timer / victory.maxTimer, 1);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.save();
  
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, centerY - 60, canvas.width, 120);
  
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(victory.text, centerX, centerY);
  
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText('Press R to restart', centerX, centerY + 40);
  
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function bindControls() {
  document.addEventListener('keydown', evt => {
    const key = evt.key.toLowerCase();
    if (key === 'p') {
      togglePause();
    }
    if (key === 'h') {
      applyMonsterDamage(25);
    }
    if (key === 'r' && gameState.monster.defeated) {
      restartLevel();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseGame();
    }
  });

  window.gameLoopControls = {
    pauseGame,
    resumeGame,
    togglePause,
    hitMonster: applyMonsterDamage
  };
}

function pauseGame() {
  if (gameState.isPaused) return;
  gameState.isPaused = true;
  console.info('Game paused');
}

function resumeGame() {
  if (!gameState.isPaused) return;
  gameState.isPaused = false;
  lastTime = performance.now();
  console.info('Game resumed');
}

function togglePause() {
  gameState.isPaused ? resumeGame() : pauseGame();
}

function applyMonsterDamage(amount = 10) {
  monster.takeDamage(amount);
  spawnDamageText(amount);
}

function spawnDamageText(amount) {
  gameState.ui.damageText = {
    value: `-${amount}`,
    timer: 600,
    maxTimer: 600,
    x: monster.position.x + monster.width / 2,
    y: monster.position.y - 30
  };
}

function handleMonsterDefeat() {
  if (!gameState.monster.defeated || gameState.monster.victoryAnnounced) return;
  gameState.monster.victoryAnnounced = true;
  gameState.ui.victoryMessage = {
    text: `VICTORY! ${gameState.monster.name} Defeated!`,
    timer: 5000,
    maxTimer: 5000
  };
  console.info(`Victory! ${gameState.monster.name} defeated.`);
}

function restartLevel() {
  monster.resetHealth();
  const word = loadMonsterWord();
  monster.setWord(word);
  gameState.monster.hp = monster.hp;
  gameState.monster.maxHP = monster.maxHP;
  gameState.monster.word = word;
  gameState.monster.defeated = false;
  gameState.monster.victoryAnnounced = false;
  gameState.ui.victoryMessage = null;
  console.info('Level restarted');
}

function loadMonsterWord() {
  if (window.wordPack && typeof window.wordPack.getNextWord === 'function') {
    return window.wordPack.getNextWord();
  }

  const fallbackWords = ['ember', 'specter', 'nova', 'glyph', 'zephyr'];
  return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
}

function checkFrameBudget(deltaTime) {
  if (deltaTime > TARGET_FRAME_MS) {
    console.warn(`Frame over budget: ${deltaTime.toFixed(2)}ms (target ${TARGET_FRAME_MS.toFixed(2)}ms)`);
  }
}

function reportFps(deltaTime) {
  fpsAccumulator += deltaTime;
  fpsFrames += 1;
  if (fpsAccumulator >= 1000) {
    const fps = (fpsFrames / fpsAccumulator) * 1000;
    console.info(`FPS: ${fps.toFixed(1)} @ ${TARGET_FRAME_MS.toFixed(2)}ms target`);
    fpsAccumulator = 0;
    fpsFrames = 0;
  }
}

init();