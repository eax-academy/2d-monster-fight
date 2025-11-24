// Core game loop and rendering logic

import { setupInput } from './input.js';
import { Player } from './player.js';
import { Level } from './level.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

let lastTime = 0;
let player;
let level;

function init() {
  setupInput();
  player = new Player(100, 350);
  level = new Level();
  window.requestAnimationFrame(gameLoop);
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
  scoreEl.textContent = player.score;
}

init();
