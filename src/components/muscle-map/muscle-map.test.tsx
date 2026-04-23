import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MuscleMap } from "./muscle-map";

const svgMarkupByUrl: Record<string, string> = {
  "/images/body-maps/male-front.svg": `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g id="zones">
      <path
        class="muscle-zone"
        data-muscle-id="chest"
        fill="#fca5a5"
        fill-opacity="0.5"
        d="M20 20 H90 V90 H20 Z"
      />
      <path
        class="muscle-zone"
        data-muscle-id="deltoids"
        fill="#93c5fd"
        fill-opacity="0.5"
        d="M110 20 H180 V90 H110 Z"
      />
    </g>
    <g id="labels" fill="currentColor">
      <text class="muscle-label" data-muscle-id="chest" x="30" y="120">胸部</text>
      <text class="muscle-label" data-muscle-id="deltoids" x="120" y="120">肩部</text>
    </g>
  </svg>
`,
  "/images/body-maps/male-back.svg": `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g id="zones">
      <path
        class="muscle-zone"
        data-muscle-id="gluteal"
        fill="#f9a8d4"
        fill-opacity="0.5"
        d="M20 20 H90 V90 H20 Z"
      />
      <path
        class="muscle-zone"
        data-muscle-id="hamstrings"
        fill="#fdba74"
        fill-opacity="0.5"
        d="M110 20 H180 V90 H110 Z"
      />
    </g>
    <g id="labels" fill="currentColor">
      <text class="muscle-label" data-muscle-id="gluteal" x="30" y="120">臀部</text>
      <text class="muscle-label" data-muscle-id="hamstrings" x="120" y="120">腘绳肌</text>
    </g>
  </svg>
`,
  "/images/body-maps/female-front.svg": `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g id="zones">
      <path
        class="muscle-zone"
        data-muscle-id="quadriceps"
        fill="#c4b5fd"
        fill-opacity="0.5"
        d="M20 20 H90 V90 H20 Z"
      />
      <path
        class="muscle-zone"
        data-muscle-id="abs"
        fill="#86efac"
        fill-opacity="0.5"
        d="M110 20 H180 V90 H110 Z"
      />
    </g>
    <g id="labels" fill="currentColor">
      <text class="muscle-label" data-muscle-id="quadriceps" x="30" y="120">股四头肌</text>
      <text class="muscle-label" data-muscle-id="abs" x="120" y="120">腹肌</text>
    </g>
  </svg>
`,
  "/images/body-maps/female-back.svg": `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g id="zones">
      <path
        class="muscle-zone"
        data-muscle-id="calves"
        fill="#7dd3fc"
        fill-opacity="0.5"
        d="M20 20 H90 V90 H20 Z"
      />
      <path
        class="muscle-zone"
        data-muscle-id="gluteal"
        fill="#f9a8d4"
        fill-opacity="0.5"
        d="M110 20 H180 V90 H110 Z"
      />
    </g>
    <g id="labels" fill="currentColor">
      <text class="muscle-label" data-muscle-id="calves" x="30" y="120">小腿肌群</text>
      <text class="muscle-label" data-muscle-id="gluteal" x="120" y="120">臀部</text>
    </g>
  </svg>
`,
};

describe("MuscleMap", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = String(input);
        const svgMarkup = svgMarkupByUrl[url];

        return Promise.resolve({
          ok: Boolean(svgMarkup),
          text: vi.fn().mockResolvedValue(svgMarkup ?? ""),
        });
      })
    );

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    Object.defineProperty(document, "elementFromPoint", {
      writable: true,
      value: vi.fn().mockReturnValue(null),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps the same muscle active when moving between label and zone, then clears on blank space", async () => {
    const { container } = render(<MuscleMap />);

    await waitFor(() => {
      expect(
        container.querySelector('.muscle-label[data-muscle-id="chest"]')
      ).not.toBeNull();
    });

    const label = container.querySelector(
      '.muscle-label[data-muscle-id="chest"]'
    ) as SVGElement;
    const zone = container.querySelector(
      '.muscle-zone[data-muscle-id="chest"]'
    ) as SVGElement;
    fireEvent.pointerEnter(label, {
      pointerType: "mouse",
      clientX: 10,
      clientY: 20,
    });

    const tooltipText = await screen.findByText("Pectorals");
    const tooltip = tooltipText.parentElement as HTMLElement;

    expect(zone).toHaveAttribute("fill-opacity", "0.9");
    expect(label).toHaveAttribute("fill", "#2563eb");

    fireEvent.pointerMove(zone, {
      pointerType: "mouse",
      clientX: 32,
      clientY: 44,
    });

    expect(tooltip).toBeInTheDocument();
    expect(zone).toHaveAttribute("fill-opacity", "0.9");
    expect(label).toHaveAttribute("fill", "#2563eb");

    fireEvent.pointerLeave(zone, {
      pointerType: "mouse",
      clientX: 50,
      clientY: 60,
      relatedTarget: null,
    });

    await waitFor(() => {
      expect(screen.queryByText("Pectorals")).not.toBeInTheDocument();
    });
    expect(zone).toHaveAttribute("fill-opacity", "0.5");
    expect(label).toHaveAttribute("fill", "currentColor");
  });

  it("does not show the tooltip for touch pointers", async () => {
    const { container } = render(<MuscleMap />);

    await waitFor(() => {
      expect(
        container.querySelector('.muscle-label[data-muscle-id="chest"]')
      ).not.toBeNull();
    });

    const chestLabel = container.querySelector(
      '.muscle-label[data-muscle-id="chest"]'
    ) as SVGElement;
    const chestZone = container.querySelector(
      '.muscle-zone[data-muscle-id="chest"]'
    ) as SVGElement;

    fireEvent.pointerEnter(chestLabel, {
      pointerType: "touch",
      clientX: 12,
      clientY: 18,
    });

    expect(chestZone).toHaveAttribute("fill-opacity", "0.9");
    expect(chestLabel).toHaveAttribute("fill", "#2563eb");
    expect(screen.queryByText("Pectorals")).not.toBeInTheDocument();
  });

  it("opens the detail callback when clicking a muscle zone", async () => {
    const handleMuscleClick = vi.fn();
    const { container } = render(
      <MuscleMap onMuscleClick={handleMuscleClick} />
    );

    await waitFor(() => {
      expect(
        container.querySelector('.muscle-zone[data-muscle-id="chest"]')
      ).not.toBeNull();
    });

    const chestZone = container.querySelector(
      '.muscle-zone[data-muscle-id="chest"]'
    ) as SVGElement;

    fireEvent.click(chestZone);

    expect(handleMuscleClick).toHaveBeenCalledWith("chest");
  });

  it("still opens the detail callback after a hover tooltip render", async () => {
    const handleMuscleClick = vi.fn();
    const { container } = render(
      <MuscleMap onMuscleClick={handleMuscleClick} />
    );

    await waitFor(() => {
      expect(
        container.querySelector('.muscle-zone[data-muscle-id="chest"]')
      ).not.toBeNull();
    });

    const chestZone = container.querySelector(
      '.muscle-zone[data-muscle-id="chest"]'
    ) as SVGElement;

    fireEvent.pointerEnter(chestZone, {
      pointerType: "mouse",
      clientX: 24,
      clientY: 36,
    });

    await screen.findByText("Pectorals");

    fireEvent.click(chestZone);

    expect(handleMuscleClick).toHaveBeenCalledWith("chest");
  });

  it("re-highlights the same muscle on pointer down after a previous click cleared state", async () => {
    const handleMuscleClick = vi.fn();
    const { container } = render(
      <MuscleMap onMuscleClick={handleMuscleClick} />
    );

    await waitFor(() => {
      expect(
        container.querySelector('.muscle-zone[data-muscle-id="chest"]')
      ).not.toBeNull();
    });

    const chestZone = container.querySelector(
      '.muscle-zone[data-muscle-id="chest"]'
    ) as SVGElement;
    const chestLabel = container.querySelector(
      '.muscle-label[data-muscle-id="chest"]'
    ) as SVGElement;

    fireEvent.pointerEnter(chestZone, {
      pointerType: "mouse",
      clientX: 24,
      clientY: 36,
    });
    fireEvent.click(chestZone);

    expect(handleMuscleClick).toHaveBeenCalledWith("chest");
    expect(chestZone).toHaveAttribute("fill-opacity", "0.5");
    expect(chestLabel).toHaveAttribute("fill", "currentColor");

    fireEvent.pointerDown(chestZone, {
      pointerType: "mouse",
      clientX: 24,
      clientY: 36,
    });

    expect(chestZone).toHaveAttribute("fill-opacity", "0.9");
    expect(chestLabel).toHaveAttribute("fill", "#2563eb");
  });

  it("re-syncs the hovered label after the detail dialog closes", async () => {
    const handleMuscleClick = vi.fn();
    const { container, rerender } = render(
      <MuscleMap
        interactionResetToken={0}
        onMuscleClick={handleMuscleClick}
      />
    );

    await waitFor(() => {
      expect(
        container.querySelector('.muscle-label[data-muscle-id="chest"]')
      ).not.toBeNull();
    });

    const chestLabel = container.querySelector(
      '.muscle-label[data-muscle-id="chest"]'
    ) as SVGElement;
    const chestZone = container.querySelector(
      '.muscle-zone[data-muscle-id="chest"]'
    ) as SVGElement;

    vi.mocked(document.elementFromPoint).mockReturnValue(chestLabel);

    fireEvent.pointerEnter(chestLabel, {
      pointerType: "mouse",
      clientX: 28,
      clientY: 40,
    });
    fireEvent.click(chestLabel);

    expect(chestZone).toHaveAttribute("fill-opacity", "0.5");
    expect(chestLabel).toHaveAttribute("fill", "currentColor");

    rerender(
      <MuscleMap
        interactionResetToken={1}
        onMuscleClick={handleMuscleClick}
      />
    );

    await waitFor(() => {
      expect(chestZone).toHaveAttribute("fill-opacity", "0.9");
    });
    expect(chestLabel).toHaveAttribute("fill", "#2563eb");
    expect(screen.getByText("Pectorals")).toBeInTheDocument();
  });

  it("keeps zones and labels interactive after switching view and gender repeatedly", async () => {
    const handleMuscleClick = vi.fn();
    const { container } = render(
      <MuscleMap onMuscleClick={handleMuscleClick} />
    );

    await waitFor(() => {
      expect(
        container.querySelector('.muscle-label[data-muscle-id="chest"]')
      ).not.toBeNull();
    });

    fireEvent.click(
      container.querySelector(
        '.muscle-label[data-muscle-id="chest"]'
      ) as SVGElement
    );
    expect(handleMuscleClick).toHaveBeenLastCalledWith("chest");

    fireEvent.click(screen.getByRole("button", { name: "背面" }));

    await waitFor(() => {
      expect(
        container.querySelector('.muscle-label[data-muscle-id="gluteal"]')
      ).not.toBeNull();
    });

    fireEvent.click(
      container.querySelector(
        '.muscle-zone[data-muscle-id="gluteal"]'
      ) as SVGElement
    );
    expect(handleMuscleClick).toHaveBeenLastCalledWith("gluteal");

    fireEvent.click(
      container.querySelector(
        '.muscle-label[data-muscle-id="gluteal"]'
      ) as SVGElement
    );
    expect(handleMuscleClick).toHaveBeenLastCalledWith("gluteal");

    fireEvent.click(screen.getByRole("tab", { name: "女性" }));

    await waitFor(() => {
      expect(
        container.querySelector('.muscle-label[data-muscle-id="calves"]')
      ).not.toBeNull();
    });

    fireEvent.click(
      container.querySelector(
        '.muscle-zone[data-muscle-id="calves"]'
      ) as SVGElement
    );
    expect(handleMuscleClick).toHaveBeenLastCalledWith("calves");

    fireEvent.click(screen.getByRole("button", { name: "正面" }));

    await waitFor(() => {
      expect(
        container.querySelector('.muscle-label[data-muscle-id="quadriceps"]')
      ).not.toBeNull();
    });

    fireEvent.click(
      container.querySelector(
        '.muscle-label[data-muscle-id="quadriceps"]'
      ) as SVGElement
    );
    expect(handleMuscleClick).toHaveBeenLastCalledWith("quadriceps");
  });
});
