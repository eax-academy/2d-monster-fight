// Monster entity handles health, damage, simple animation, and drawing

const DEFAULT_SPRITE = 'assets/monsters/training-dummy.svg';

export class Monster {
  constructor({
    x = 520,
    y = 260,
    width = 120,
    height = 120,
    name = 'Training Dummy',
    hp = 250,
    spriteSrc = DEFAULT_SPRITE
  } = {}) {
    this.position = { x, y };
    this.width = width;
    this.height = height;
    this.name = name;
    this.maxHP = hp;
    this.hp = hp;
    this.alive = true;
    this.currentWord = '';

    this.sprite = new Image();
    this.spriteLoaded = false;
    this.sprite.src = spriteSrc;
    this.sprite.addEventListener('load', () => {
      this.spriteLoaded = true;
    });

    this.hitFlash = 0;
    this.hitFlashDuration = 120;
    this.shakeDuration = 140;
    this.shakeTimer = 0;
    this.shakeMagnitude = 5;
  }

  setWord(word) {
    this.currentWord = word || '';
  }

  update(deltaTime) {
    if (this.hitFlash > 0) this.hitFlash = Math.max(this.hitFlash - deltaTime, 0);
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(this.shakeTimer - deltaTime, 0);
  }

  takeDamage(amount = 10) {
    if (!this.alive) return;
    this.hp = Math.max(this.hp - amount, 0);
    this.hitFlash = this.hitFlashDuration;
    this.shakeTimer = this.shakeDuration;

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  resetHealth() {
    this.hp = this.maxHP;
    this.alive = true;
    this.hitFlash = 0;
    this.shakeTimer = 0;
  }

  draw(ctx, typingState) {
    const { x, y } = this.getShakeOffset();
    ctx.save();
    ctx.translate(x, y);

    if (this.spriteLoaded) {
      ctx.drawImage(this.sprite, this.position.x, this.position.y, this.width, this.height);
    } else {
      ctx.fillStyle = '#795548';
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    if (this.hitFlash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    ctx.restore();

    this.drawHpBar(ctx);
    this.drawWord(ctx, typingState);
  }

  getShakeOffset() {
    if (this.shakeTimer <= 0) return { x: 0, y: 0 };
    const magnitude = (this.shakeTimer / this.shakeDuration) * this.shakeMagnitude;
    return {
      x: (Math.random() - 0.5) * magnitude,
      y: (Math.random() - 0.5) * magnitude
    };
  }

  drawHpBar(ctx) {
    const barWidth = this.width + 40;
    const barHeight = 12;
    const x = this.position.x - 20;
    const y = this.position.y - 20;
    const hpRatio = this.hp / this.maxHP;

    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ffc107' : '#f44336';
    ctx.fillRect(x, y, barWidth * hpRatio, barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`${this.name} ${this.hp}/${this.maxHP}`, x, y - 6);
  }

  drawWord(ctx, typingState) {
    if (!this.currentWord) return;

    const progress = typingState ? typingState.progress : null;
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    const charWidth = ctx.measureText('M').width;
    const startX = this.position.x + this.width / 2 - (this.currentWord.length * charWidth) / 2;
    const y = this.position.y - 16;

    for (let i = 0; i < this.currentWord.length; i++) {
      const letter = this.currentWord[i];
      const state = progress ? progress[i] : null;
      if (state === 'correct') ctx.fillStyle = '#4caf50';
      else if (state === 'wrong') ctx.fillStyle = '#f44336';
      else ctx.fillStyle = '#fff';

      ctx.fillText(letter, startX + i * charWidth, y);
    }

    ctx.textAlign = 'start';
  }
}

