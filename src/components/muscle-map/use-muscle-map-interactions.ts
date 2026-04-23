import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
} from "react";
import musclesData from "@/data/muscles.json";

interface MuscleInfo {
  nameZh: string;
  nameEn: string;
  tagline: string;
}

interface LastPointer {
  clientX: number;
  clientY: number;
  pointerType: string;
}

interface UseMuscleMapInteractionsOptions {
  didPanRef: MutableRefObject<boolean>;
  interactionResetToken?: number;
  onMuscleClick?: (muscleId: string) => void;
  svgContent: string;
}

const TOOLTIP_OFFSET = 12;

const muscleInfoMap = new Map<string, MuscleInfo>(
  musclesData.map((muscle) => [
    muscle.id,
    {
      nameEn: muscle.nameEn,
      nameZh: muscle.nameZh,
      tagline: muscle.functions[0],
    },
  ])
);

export function useMuscleMapInteractions({
  didPanRef,
  interactionResetToken = 0,
  onMuscleClick,
  svgContent,
}: UseMuscleMapInteractionsOptions) {
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipNameZhRef = useRef<HTMLParagraphElement>(null);
  const tooltipNameEnRef = useRef<HTMLParagraphElement>(null);
  const tooltipTaglineRef = useRef<HTMLParagraphElement>(null);
  const tooltipVisibleRef = useRef(false);
  const tooltipMuscleIdRef = useRef<string | null>(null);
  const zonesRef = useRef<SVGElement[]>([]);
  const labelsRef = useRef<SVGElement[]>([]);
  const originalOpacitiesRef = useRef(new Map<SVGElement, string>());
  const originalLabelFillsRef = useRef(new Map<SVGElement, string>());
  const activeMuscleIdRef = useRef<string | null>(null);
  const lastPointerRef = useRef<LastPointer | null>(null);

  const getTooltipPosition = useCallback((clientX: number, clientY: number) => {
    if (!outerContainerRef.current || !tooltipRef.current) {
      return { x: 0, y: 0 };
    }

    const containerRect = outerContainerRef.current.getBoundingClientRect();
    const tipRect = tooltipRef.current.getBoundingClientRect();

    let x = clientX - containerRect.left + TOOLTIP_OFFSET;
    let y = clientY - containerRect.top + TOOLTIP_OFFSET;

    if (x + tipRect.width > containerRect.width) {
      x = clientX - containerRect.left - tipRect.width - TOOLTIP_OFFSET;
    }

    if (y + tipRect.height > containerRect.height) {
      y = clientY - containerRect.top - tipRect.height - TOOLTIP_OFFSET;
    }

    if (x < 0) x = 0;
    if (y < 0) y = 0;

    return { x, y };
  }, []);

  const updateTooltipPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!tooltipVisibleRef.current || !tooltipRef.current) return;

      const { x, y } = getTooltipPosition(clientX, clientY);
      tooltipRef.current.style.left = `${x}px`;
      tooltipRef.current.style.top = `${y}px`;
    },
    [getTooltipPosition]
  );

  const hideTooltip = useCallback(() => {
    tooltipVisibleRef.current = false;
    tooltipMuscleIdRef.current = null;

    if (tooltipRef.current) {
      tooltipRef.current.hidden = true;
    }

    if (tooltipNameZhRef.current) {
      tooltipNameZhRef.current.textContent = "";
    }

    if (tooltipNameEnRef.current) {
      tooltipNameEnRef.current.textContent = "";
    }

    if (tooltipTaglineRef.current) {
      tooltipTaglineRef.current.textContent = "";
    }
  }, []);

  const resetHighlightedMuscles = useCallback(() => {
    zonesRef.current.forEach((zone) => {
      zone.setAttribute(
        "fill-opacity",
        originalOpacitiesRef.current.get(zone) || "0.5"
      );
      zone.style.filter = "none";
    });

    labelsRef.current.forEach((label) => {
      label.setAttribute(
        "fill",
        originalLabelFillsRef.current.get(label) || "currentColor"
      );
    });
  }, []);

  const highlightMuscle = useCallback(
    (muscleId: string) => {
      if (activeMuscleIdRef.current === muscleId) return;

      resetHighlightedMuscles();

      zonesRef.current.forEach((zone) => {
        if (zone.getAttribute("data-muscle-id") !== muscleId) return;

        zone.setAttribute("fill-opacity", "0.9");
        zone.style.filter =
          "brightness(1.3) saturate(1.5) drop-shadow(0 0 6px rgba(0,0,0,0.3))";
      });

      labelsRef.current.forEach((label) => {
        if (label.getAttribute("data-muscle-id") !== muscleId) return;

        label.setAttribute("fill", "#2563eb");
      });

      activeMuscleIdRef.current = muscleId;
    },
    [resetHighlightedMuscles]
  );

  const showTooltip = useCallback(
    (muscleId: string, clientX: number, clientY: number) => {
      const info = muscleInfoMap.get(muscleId);

      if (!info || !tooltipRef.current) return;

      const { x, y } = getTooltipPosition(clientX, clientY);

      tooltipVisibleRef.current = true;
      tooltipMuscleIdRef.current = muscleId;
      tooltipRef.current.hidden = false;
      tooltipRef.current.style.left = `${x}px`;
      tooltipRef.current.style.top = `${y}px`;

      if (tooltipNameZhRef.current) {
        tooltipNameZhRef.current.textContent = info.nameZh;
      }

      if (tooltipNameEnRef.current) {
        tooltipNameEnRef.current.textContent = info.nameEn;
      }

      if (tooltipTaglineRef.current) {
        tooltipTaglineRef.current.textContent = info.tagline;
      }
    },
    [getTooltipPosition]
  );

  const clearInteractionState = useCallback(() => {
    activeMuscleIdRef.current = null;
    resetHighlightedMuscles();
    hideTooltip();
  }, [hideTooltip, resetHighlightedMuscles]);

  const canShowTooltip = useCallback(
    (pointerType: string) =>
      pointerType !== "touch" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    []
  );

  const getInteractiveTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;

    const container = svgContainerRef.current;
    let current: Element | null = target;

    while (current && current !== container) {
      if (
        current.classList.contains("muscle-zone") ||
        current.classList.contains("muscle-label")
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }, []);

  const handleMuscleSelect = useCallback(
    (muscleId: string | null) => {
      if (!muscleId || !onMuscleClick) return;

      clearInteractionState();
      onMuscleClick(muscleId);
    },
    [clearInteractionState, onMuscleClick]
  );

  const syncInteractiveElement = useCallback(
    (
      target: EventTarget | null,
      options?: {
        clientX?: number;
        clientY?: number;
        pointerType?: string;
      }
    ) => {
      const interactiveTarget = getInteractiveTarget(target);
      const muscleId = interactiveTarget?.getAttribute("data-muscle-id");

      if (!muscleId) {
        clearInteractionState();
        return;
      }

      const clientX = options?.clientX ?? lastPointerRef.current?.clientX ?? 0;
      const clientY = options?.clientY ?? lastPointerRef.current?.clientY ?? 0;
      const pointerType =
        options?.pointerType ?? lastPointerRef.current?.pointerType ?? "mouse";

      lastPointerRef.current = { clientX, clientY, pointerType };
      highlightMuscle(muscleId);

      if (!canShowTooltip(pointerType)) {
        hideTooltip();
        return;
      }

      if (
        tooltipVisibleRef.current &&
        tooltipMuscleIdRef.current === muscleId
      ) {
        updateTooltipPosition(clientX, clientY);
        return;
      }

      showTooltip(muscleId, clientX, clientY);
    },
    [
      canShowTooltip,
      clearInteractionState,
      getInteractiveTarget,
      hideTooltip,
      highlightMuscle,
      showTooltip,
      updateTooltipPosition,
    ]
  );

  const syncFromLastPointer = useCallback(() => {
    if (typeof document === "undefined" || !lastPointerRef.current) {
      clearInteractionState();
      return;
    }

    const { clientX, clientY, pointerType } = lastPointerRef.current;
    const target = document.elementFromPoint(clientX, clientY);

    syncInteractiveElement(target, { clientX, clientY, pointerType });
  }, [clearInteractionState, syncInteractiveElement]);

  useEffect(() => {
    const container = svgContainerRef.current;

    if (!container) return;

    if (container.innerHTML !== svgContent) {
      container.innerHTML = svgContent;
    }
  }, [svgContent]);

  useEffect(() => {
    const container = svgContainerRef.current;

    if (!container || !svgContent) return;

    activeMuscleIdRef.current = null;
    tooltipVisibleRef.current = false;
    tooltipMuscleIdRef.current = null;
    resetHighlightedMuscles();
    hideTooltip();

    const zones = Array.from(
      container.querySelectorAll<SVGElement>(".muscle-zone")
    );
    const labels = Array.from(
      container.querySelectorAll<SVGElement>(".muscle-label")
    );

    zonesRef.current = zones;
    labelsRef.current = labels;
    originalOpacitiesRef.current = new Map();
    originalLabelFillsRef.current = new Map();

    const originalOpacities = new Map<SVGElement, string>();
    zones.forEach((zone) => {
      originalOpacities.set(
        zone,
        zone.getAttribute("fill-opacity") || "0.5"
      );
      zone.style.cursor = "pointer";
      zone.style.transition = "fill-opacity 0.15s, filter 0.15s";
    });
    originalOpacitiesRef.current = originalOpacities;

    const originalLabelFills = new Map<SVGElement, string>();
    labels.forEach((label) => {
      originalLabelFills.set(
        label,
        label.getAttribute("fill") || "currentColor"
      );
      label.style.cursor = "pointer";
      label.style.transition = "fill 0.15s";
    });
    originalLabelFillsRef.current = originalLabelFills;

    const handlePointerEnter = (event: Event) => {
      const pointerEvent = event as PointerEvent;

      syncInteractiveElement(event.currentTarget, {
        clientX: pointerEvent.clientX,
        clientY: pointerEvent.clientY,
        pointerType: pointerEvent.pointerType || "mouse",
      });
    };

    const handlePointerMove = (event: Event) => {
      const pointerEvent = event as PointerEvent;

      syncInteractiveElement(event.currentTarget, {
        clientX: pointerEvent.clientX,
        clientY: pointerEvent.clientY,
        pointerType: pointerEvent.pointerType || "mouse",
      });
    };

    const handlePointerLeave = (event: Event) => {
      const pointerEvent = event as PointerEvent;
      const currentTarget = event.currentTarget as SVGElement | null;
      const currentMuscleId = currentTarget?.getAttribute("data-muscle-id");
      const relatedMuscleId =
        getInteractiveTarget(pointerEvent.relatedTarget)?.getAttribute(
          "data-muscle-id"
        ) ?? null;

      if (currentMuscleId && relatedMuscleId === currentMuscleId) {
        return;
      }

      clearInteractionState();
    };

    const handlePointerDown = (event: Event) => {
      const pointerEvent = event as PointerEvent;

      syncInteractiveElement(event.currentTarget, {
        clientX: pointerEvent.clientX,
        clientY: pointerEvent.clientY,
        pointerType: pointerEvent.pointerType || "mouse",
      });
    };

    const handleClick = (event: Event) => {
      if (didPanRef.current) {
        didPanRef.current = false;
        return;
      }

      const muscleId = (event.currentTarget as SVGElement | null)?.getAttribute(
        "data-muscle-id"
      );

      handleMuscleSelect(muscleId ?? null);
    };

    const interactiveElements = [...zones, ...labels];
    interactiveElements.forEach((element) => {
      element.addEventListener("pointerenter", handlePointerEnter);
      element.addEventListener("pointermove", handlePointerMove);
      element.addEventListener("pointerleave", handlePointerLeave);
      element.addEventListener("pointerdown", handlePointerDown);
      element.addEventListener("click", handleClick);
    });

    return () => {
      interactiveElements.forEach((element) => {
        element.removeEventListener("pointerenter", handlePointerEnter);
        element.removeEventListener("pointermove", handlePointerMove);
        element.removeEventListener("pointerleave", handlePointerLeave);
        element.removeEventListener("pointerdown", handlePointerDown);
        element.removeEventListener("click", handleClick);
      });

      activeMuscleIdRef.current = null;
      tooltipVisibleRef.current = false;
      tooltipMuscleIdRef.current = null;
      zonesRef.current = [];
      labelsRef.current = [];
      originalOpacitiesRef.current = new Map();
      originalLabelFillsRef.current = new Map();
    };
  }, [
    clearInteractionState,
    didPanRef,
    getInteractiveTarget,
    handleMuscleSelect,
    hideTooltip,
    resetHighlightedMuscles,
    svgContent,
    syncInteractiveElement,
  ]);

  useEffect(() => {
    if (interactionResetToken === 0) return;

    clearInteractionState();

    const rafId = window.requestAnimationFrame(() => {
      syncFromLastPointer();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [clearInteractionState, interactionResetToken, syncFromLastPointer]);

  return {
    clearInteractionState,
    outerContainerRef,
    svgContainerRef,
    tooltipRefs: {
      tooltipNameEnRef,
      tooltipNameZhRef,
      tooltipRef,
      tooltipTaglineRef,
    },
  };
}
