import { useCallback, useEffect, useRef, useState } from "react";
import type { Gender, View } from "./types";

const SVG_MAP: Record<`${Gender}-${View}`, string> = {
  "male-front": "/images/body-maps/male-front.svg",
  "male-back": "/images/body-maps/male-back.svg",
  "female-front": "/images/body-maps/female-front.svg",
  "female-back": "/images/body-maps/female-back.svg",
};

const FLIP_DURATION = 250;

interface UseMuscleMapControllerOptions {
  onGenderChange?: (gender: Gender) => void;
  onViewportReset?: () => void;
}

export function useMuscleMapController({
  onGenderChange,
  onViewportReset,
}: UseMuscleMapControllerOptions = {}) {
  const [gender, setGender] = useState<Gender>("male");
  const [view, setView] = useState<View>("front");
  const [svgContent, setSvgContent] = useState("");
  const [svgError, setSvgError] = useState(false);
  const [svgRetry, setSvgRetry] = useState(0);
  const [flipRotation, setFlipRotation] = useState(0);
  const [flipTransition, setFlipTransition] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const flipTimersRef = useRef<number[]>([]);

  const svgKey = `${gender}-${view}` as const;

  const clearSvgState = useCallback(() => {
    setSvgContent("");
    setSvgError(false);
  }, []);

  const cancelFlipAnimation = useCallback(() => {
    flipTimersRef.current.forEach((id) => {
      window.clearTimeout(id);
      window.cancelAnimationFrame(id);
    });

    flipTimersRef.current = [];
    setIsFlipping(false);
    setFlipTransition(false);
    setFlipRotation(0);
  }, []);

  const changeGender = useCallback(
    (nextGender: Gender) => {
      if (nextGender === gender) return;

      cancelFlipAnimation();
      onViewportReset?.();
      clearSvgState();
      setGender(nextGender);
      onGenderChange?.(nextGender);
    },
    [cancelFlipAnimation, clearSvgState, gender, onGenderChange, onViewportReset]
  );

  const switchView = useCallback(
    (nextView: View) => {
      if (nextView === view || isFlipping) return;

      setIsFlipping(true);
      onViewportReset?.();
      setFlipTransition(true);
      setFlipRotation(90);

      const switchTimer = window.setTimeout(() => {
        clearSvgState();
        setView(nextView);
        setFlipTransition(false);
        setFlipRotation(-90);

        const rafId = window.requestAnimationFrame(() => {
          setFlipTransition(true);
          setFlipRotation(0);

          const endTimer = window.setTimeout(() => {
            setIsFlipping(false);
          }, FLIP_DURATION);

          flipTimersRef.current.push(endTimer);
        });

        flipTimersRef.current.push(rafId);
      }, FLIP_DURATION);

      flipTimersRef.current.push(switchTimer);
    },
    [clearSvgState, isFlipping, onViewportReset, view]
  );

  const retryLoad = useCallback(() => {
    setSvgError(false);
    setSvgRetry((value) => value + 1);
  }, []);

  useEffect(() => {
    const url = SVG_MAP[svgKey];
    let cancelled = false;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`SVG fetch failed: ${res.status}`);
        }

        return res.text();
      })
      .then((text) => {
        if (cancelled) return;

        setSvgError(false);
        setSvgContent(text);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("Failed to load SVG:", error);
        setSvgError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [svgKey, svgRetry]);

  useEffect(() => {
    return () => {
      flipTimersRef.current.forEach((id) => {
        window.clearTimeout(id);
        window.cancelAnimationFrame(id);
      });

      flipTimersRef.current = [];
    };
  }, []);

  return {
    changeGender,
    flipRotation,
    flipTransition,
    gender,
    isFlipping,
    retryLoad,
    svgContent,
    svgError,
    svgKey,
    switchView,
    view,
  };
}
