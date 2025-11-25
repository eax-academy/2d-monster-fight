// Core game loop and rendering logic

import { setupInput } from './input.js';
import { Player } from './player.js';
import { Level } from './level.js';

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
    animationState: 'idle',
    frameTimer: 0,
    frameInterval: 250
  },
  level: {
    id: 1,
    name: 'Grassy Dojo',
    difficulty: 'Easy'
  },
ui: {
    score: 0,
    damageText: null,
    lastUpdate: 0
  }
};

let lastTime = 0;
let player;
let level;
  let fpsAccumulator = 0;
  let fpsFrames = 0;
  
  function init() {
    setupInput();
    bindPauseControls();
    player = new Player(100, 350);
    level = new Level();
    lastTime = performance.now();
    console.info('Game loop initialized. Target: 60 FPS');
    window.requestAnimationFrame(gameLoop);
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
  updateMonsterState(deltaTime);
  updatePlayerState(deltaTime);
  updateUiState(deltaTime);
}

function updateMonsterState(deltaTime) {
  const monster = gameState.monster;
  monster.frameTimer += deltaTime;
  if (monster.frameTimer >= monster.frameInterval) {
    monster.animationState = monster.animationState === 'idle' ? 'attack-ready' : 'idle';
    monster.frameTimer = 0;
  }
}

function updatePlayerState(deltaTime) {
  player.update(deltaTime, level);
  // Placeholder for derived stat adjustments
  gameState.player.hp = Math.max(gameState.player.hp - deltaTime * 0.001, 0);
  gameState.player.damageDealt += deltaTime * 0.01;
}
function updateUiState() {
    gameState.ui.score = player.score;
    scoreEl.textContent = gameState.ui.score.toFixed(0);
  }
  
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    level.draw(ctx);
    player.draw(ctx);
    drawMonsterState();
  }
  
  function drawMonsterState() {
    ctx.fillStyle = '#333';
    ctx.font = '14px monospace';
    ctx.fillText(`Monster: ${gameState.monster.animationState}`, 16, 24);
    ctx.fillText(`Player HP: ${gameState.player.hp.toFixed(0)}`, 16, 44);
  }
  
  function bindPauseControls() {
    document.addEventListener('keydown', evt => {
      if (evt.key.toLowerCase() === 'p') {
        togglePause();
      }
    });
      document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseGame();
      }
    });
  window.gameLoopControls = { pauseGame, resumeGame, togglePause };
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