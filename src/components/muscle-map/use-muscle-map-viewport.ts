import { useCallback, useRef, useState, type TouchEvent } from "react";
import type { Translate } from "./types";

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const PAN_CLICK_THRESHOLD = 5;

interface TouchPoint {
  clientX: number;
  clientY: number;
}

function getTouchDistance(firstTouch: TouchPoint, secondTouch: TouchPoint) {
  const dx = firstTouch.clientX - secondTouch.clientX;
  const dy = firstTouch.clientY - secondTouch.clientY;

  return Math.sqrt(dx * dx + dy * dy);
}

export function useMuscleMapViewport() {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<Translate>({ x: 0, y: 0 });

  const didPanRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<Translate>({ x: 0, y: 0 });
  const lastTranslateRef = useRef<Translate>({ x: 0, y: 0 });
  const lastPinchDistanceRef = useRef<number | null>(null);
  const lastScaleRef = useRef(1);

  const resetViewport = useCallback(() => {
    didPanRef.current = false;
    isPanningRef.current = false;
    lastPinchDistanceRef.current = null;
    lastScaleRef.current = 1;
    lastTranslateRef.current = { x: 0, y: 0 };
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (event.touches.length === 2) {
        lastPinchDistanceRef.current = getTouchDistance(
          event.touches[0],
          event.touches[1]
        );
        lastScaleRef.current = scale;
        didPanRef.current = true;
        event.preventDefault();
        return;
      }

      if (event.touches.length === 1 && scale > 1) {
        isPanningRef.current = true;
        didPanRef.current = false;
        panStartRef.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
        lastTranslateRef.current = { ...translate };
      }
    },
    [scale, translate]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (event.touches.length === 2 && lastPinchDistanceRef.current !== null) {
        const distance = getTouchDistance(event.touches[0], event.touches[1]);
        const ratio = distance / lastPinchDistanceRef.current;
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, lastScaleRef.current * ratio)
        );

        setScale(nextScale);
        event.preventDefault();
        return;
      }

      if (event.touches.length === 1 && isPanningRef.current) {
        const dx = event.touches[0].clientX - panStartRef.current.x;
        const dy = event.touches[0].clientY - panStartRef.current.y;

        if (
          Math.abs(dx) > PAN_CLICK_THRESHOLD ||
          Math.abs(dy) > PAN_CLICK_THRESHOLD
        ) {
          didPanRef.current = true;
        }

        setTranslate({
          x: lastTranslateRef.current.x + dx,
          y: lastTranslateRef.current.y + dy,
        });
        event.preventDefault();
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    lastPinchDistanceRef.current = null;
    isPanningRef.current = false;
    lastScaleRef.current = scale;
    lastTranslateRef.current = { ...translate };
  }, [scale, translate]);

  return {
    didPanRef,
    resetViewport,
    scale,
    touchHandlers: {
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onTouchStart: handleTouchStart,
    },
    translate,
  };
}
