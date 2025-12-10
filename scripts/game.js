// Core game loop and rendering logic

import { setupInput } from './input.js';
import { Player } from './player.js';
import { Level } from './level.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const accuracyEl = document.getElementById('accuracy');
const targetWordEl = document.getElementById('currentTarget');
const typingInput = document.getElementById('typeField');

const LETTER_DAMAGE = 8;
const MISTAKE_HP_LOSS = 4;

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
  },
  typing: {
    currentIndex: 0,
    progress: [],
    totalTyped: 0,
    correctTyped: 0
  }
};

let lastTime = 0;
let player;
let level;

function init() {
  setupInput();
  player = new Player(100, 350);
  level = new Level();
  monster = createMonsterForLevel(gameState.level);
  setupTypingInput();
  resetTypingForWord(monster.currentWord);
  updateAccuracy();
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
  updateTargetWord(word);
  return instance;
}

function gameLoop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  update(delta);
  draw();

  window.requestAnimationFrame(gameLoop);
}

function update(delta) {
  player.update(delta, level);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  level.draw(ctx);
  player.draw(ctx);
  monster.draw(ctx, gameState.typing);
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
  ctx.fillText(`Accuracy: ${(gameState.player.accuracy * 100).toFixed(1)}%`, 16, 84);
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

function setupTypingInput() {
  if (!typingInput) return;
  typingInput.value = '';
  typingInput.focus();

  typingInput.addEventListener('input', () => {
    const value = typingInput.value;
    if (!value) return;
    for (const ch of value) {
      handleTypedChar(ch);
    }
    typingInput.value = '';
  });

  typingInput.addEventListener('keydown', evt => {
    if (evt.key === 'Backspace') {
      evt.preventDefault();
      handleBackspace();
    }
  });

  window.addEventListener('click', () => typingInput.focus());
}

function handleTypedChar(rawChar) {
  if (gameState.isPaused || !monster || !monster.alive) return;
  if (!monster.currentWord) return;
  const char = rawChar.toLowerCase();
  if (!char || char.length !== 1 || !/^[a-z]$/.test(char)) return;

  const typing = gameState.typing;
  if (typing.currentIndex >= monster.currentWord.length) return;
  const expected = monster.currentWord[typing.currentIndex];
  typing.totalTyped += 1;

  if (char === expected) {
    typing.progress[typing.currentIndex] = 'correct';
    typing.currentIndex += 1;
    typing.correctTyped += 1;
    applyMonsterDamage(LETTER_DAMAGE);
    if (typing.currentIndex >= monster.currentWord.length) {
      handleWordComplete();
    }
  } else {
    typing.progress[typing.currentIndex] = 'wrong';
    applyPlayerMistakePenalty();
  }

  updateAccuracy();
}

function handleBackspace() {
  const typing = gameState.typing;
  if (typing.currentIndex <= 0) return;
  typing.currentIndex -= 1;
  typing.progress[typing.currentIndex] = null;
}

function resetTypingForWord(word) {
  const normalized = word || '';
  gameState.typing.currentIndex = 0;
  gameState.typing.progress = new Array(normalized.length).fill(null);
  if (typingInput) typingInput.value = '';
  updateTargetWord(normalized);
}

function updateAccuracy() {
  const { totalTyped, correctTyped } = gameState.typing;
  const accuracy = totalTyped === 0 ? 1 : correctTyped / totalTyped;
  gameState.player.accuracy = accuracy;
  if (accuracyEl) {
    accuracyEl.textContent = `${(accuracy * 100).toFixed(1)}%`;
  }
}

function updateTargetWord(word) {
  if (targetWordEl) {
    targetWordEl.textContent = word || '';
  }
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

function applyPlayerMistakePenalty() {
  gameState.player.hp = Math.max(gameState.player.hp - MISTAKE_HP_LOSS, 0);
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
  monster.setWord('');
  gameState.monster.word = '';
  resetTypingForWord('');
  updateTargetWord('Monster defeated!');
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
  gameState.typing.totalTyped = 0;
  gameState.typing.correctTyped = 0;
  resetTypingForWord(word);
  updateAccuracy();
  console.info('Level restarted');
}

function loadMonsterWord() {
  if (window.wordPack && typeof window.wordPack.getNextWord === 'function') {
    return window.wordPack.getNextWord();
  }

  const fallbackWords = ['ember', 'specter', 'nova', 'glyph', 'zephyr'];
  return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
}

function handleWordComplete() {
  if (!monster.alive) return;
  const newWord = loadMonsterWord();
  assignWordToMonster(newWord);
}

function assignWordToMonster(word) {
  monster.setWord(word);
  gameState.monster.word = word;
  resetTypingForWord(word);
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
