export function flyToCart(source: HTMLImageElement) {
  const target = document.querySelector<HTMLElement>('[data-cart-target]');
  if (!target) return;
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const ghost = source.cloneNode(true) as HTMLImageElement;
  ghost.removeAttribute('srcset');
  ghost.className = 'fly-cart-img';
  ghost.alt = '';
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;
  document.body.appendChild(ghost);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  void ghost.getBoundingClientRect();
  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.15)`;
    ghost.style.opacity = '0.15';
  });
  const cleanup = () => ghost.remove();
  ghost.addEventListener('transitionend', cleanup, { once: true });
  window.setTimeout(cleanup, 800);
  target.classList.add('is-bump');
  window.setTimeout(() => target.classList.remove('is-bump'), 450);
}
