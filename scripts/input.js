// Keyboard input handling

export const keys = { left: false, right: false, jump: false };

export function setupInput() {
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') keys.jump = true;
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.code === 'Space') keys.jump = false;
  });
}
