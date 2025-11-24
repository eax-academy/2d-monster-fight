// Player class handles position, physics, and drawing

import { keys } from './input.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 32;
    this.height = 32;
    this.speed = 0.2;
    this.gravity = 0.5;
    this.jumpForce = -10;
    this.grounded = false;
    this.color = 'red';
    this.score = 0;
  }

  update(delta, level) {
    // Horizontal movement
    if (keys.left) this.vx = -this.speed * delta;
    else if (keys.right) this.vx = this.speed * delta;
    else this.vx = 0;

    // Jump
    if (keys.jump && this.grounded) {
      this.vy = this.jumpForce;
      this.grounded = false;
    }

    // Gravity
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    // Simple ground collision
    const groundLevel = level.groundY - this.height;
    if (this.y > groundLevel) {
      this.y = groundLevel;
      this.vy = 0;
      this.grounded = true;
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
