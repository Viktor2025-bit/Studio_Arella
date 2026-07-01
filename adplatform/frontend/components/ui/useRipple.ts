import { useCallback } from 'react';

export function useRipple() {
  const ripple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const btn = e.currentTarget;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const x = e.clientX - r.left - size / 2;
    const y = e.clientY - r.top - size / 2;

    const el = document.createElement('span');
    el.style.cssText = [
      'position:absolute',
      'border-radius:50%',
      'pointer-events:none',
      'transform:scale(0)',
      `width:${size}px`,
      `height:${size}px`,
      `left:${x}px`,
      `top:${y}px`,
      'background:rgba(255,255,255,0.32)',
      'animation:_ripple 560ms ease-out forwards',
    ].join(';');

    // Inject keyframes once
    if (!document.getElementById('_ripple-kf')) {
      const style = document.createElement('style');
      style.id = '_ripple-kf';
      style.textContent = '@keyframes _ripple{to{transform:scale(4);opacity:0}}';
      document.head.appendChild(style);
    }

    btn.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, []);

  // Applied directly to a button:
  // <button onClick={ripple} style={{ position:'relative', overflow:'hidden' }}>
  return ripple;
}
