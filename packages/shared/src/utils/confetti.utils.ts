export async function launchConfetti() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
}
