import { useRef, useEffect, useCallback } from 'react';

/** Enables click-and-drag scrolling on a scrollable container. */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startScroll = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only left click, and ignore if clicking a button/input/link
    const tag = (e.target as HTMLElement).tagName;
    if (e.button !== 0 || tag === 'BUTTON' || tag === 'INPUT' || tag === 'A') return;
    dragging.current = true;
    startY.current = e.clientY;
    startScroll.current = ref.current?.scrollTop || 0;
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !ref.current) return;
      const dy = e.clientY - startY.current;
      ref.current.scrollTop = startScroll.current - dy;
    };
    const onMouseUp = () => { dragging.current = false; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return { ref, onMouseDown };
}
