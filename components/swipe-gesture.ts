'use client';

import {useEffect, useRef, useState, type PointerEvent} from 'react';

export function useSwipeVisibility(index: number) {
  const deck = useRef<HTMLElement>(null);
  useEffect(() => {
    let secondFrame = 0;
    const frame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        const stage = deck.current?.querySelector<HTMLElement>('.swipe-stage, .swipe-finish');
        if (!stage) return;
        const bounds = stage.getBoundingClientRect();
        const header = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
        const visibleTop = Math.max(0, header) + 8;
        const visibleHeight = window.innerHeight - visibleTop;
        if (bounds.top >= visibleTop && bounds.bottom <= window.innerHeight) return;
        const clearance = Math.max(0, Math.min(32, (visibleHeight - bounds.height) / 2));
        window.scrollBy({top: bounds.top - visibleTop - clearance, behavior: 'instant'});
      });
    });
    return () => {cancelAnimationFrame(frame); cancelAnimationFrame(secondFrame);};
  }, [index]);
  return deck;
}

export function useSwipeGesture(onDecision: (right: boolean) => void, disabled = false) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{x: number; y: number; id: number} | null>(null);
  const suppressClick = useRef(false);
  function begin(event: PointerEvent<HTMLAnchorElement>) {
    if (!event.isPrimary || event.button !== 0 || disabled) return;
    suppressClick.current = false;
    start.current = {x: event.clientX, y: event.clientY, id: event.pointerId};
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function move(event: PointerEvent<HTMLAnchorElement>) {
    const initial = start.current;
    if (!initial || initial.id !== event.pointerId) return;
    const dx = event.clientX - initial.x;
    if (Math.abs(dx) > 8) suppressClick.current = true;
    setOffset(Math.max(-130, Math.min(130, dx)));
  }

  function end(event: PointerEvent<HTMLAnchorElement>, cancelled = false) {
    const initial = start.current;
    if (!initial || initial.id !== event.pointerId) return;
    start.current = null;
    setDragging(false);
    setOffset(0);
    if (cancelled) { suppressClick.current = true; return; }
    const dx = event.clientX - initial.x, dy = event.clientY - initial.y;
    if (Math.abs(dx) >= 64 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      suppressClick.current = true;
      onDecision(dx > 0);
    }
  }


  return {
    offset, dragging,
    anchorProps: {
      onPointerDown: begin, onPointerMove: move, onPointerUp: end,
      onPointerCancel: (event: PointerEvent<HTMLAnchorElement>) => end(event, true),
      onLostPointerCapture: (event: PointerEvent<HTMLAnchorElement>) => end(event, true),
      onDragStart: (event: React.DragEvent<HTMLAnchorElement>) => event.preventDefault(),
      draggable: false,
      onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (event.detail !== 0 && suppressClick.current) event.preventDefault();
        suppressClick.current = false;
      },
    },
  };
}
