// Basic level background and ground drawing

export class Level {
  constructor() {
    this.groundY = 420;
  }

  draw(ctx) {
    // Draw ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, this.groundY, ctx.canvas.width, ctx.canvas.height - this.groundY);

    // Example platforms or obstacles (placeholder)
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(200, 360, 100, 20);
    ctx.fillRect(400, 320, 80, 20);
  }
}
