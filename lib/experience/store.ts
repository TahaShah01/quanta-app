// Shared state for the 3D scene, the side rail and smooth scrolling.
// `frame` holds per-frame values and is read in animation loops, never in render.

export type ShapeId =
  | "nexus"
  | "drift"
  | "stack"
  | "lattice"
  | "orbit"
  | "crew"
  | "singularity";

export interface SectionInfo {
  id: string;
  label: string;
  shape: ShapeId;
  /** Overrides the shape's horizontal framing (half-viewport units, desktop). */
  offsetX?: number;
}

export const frame = {
  /** 0..1 progress through the whole page */
  scroll: 0,
  /** px per tick, decays back to 0 */
  velocity: 0,
  /** -1..1, mouse only */
  pointerX: 0,
  pointerY: 0,
  /** 1 while the pointer is over an element marked data-scene-hover */
  pulse: 0,
  /** Hovered element centre, -1..1 */
  pullX: 0,
  pullY: 0,
  /** Set to true to scatter the particles once (easter egg) */
  explode: false,
  /** 0..1 progress through each registered section */
  sectionProgress: {} as Record<string, number>,
};

export const sinks: {
  /** buf = [x px, y px, depth 0..1] per node; weight = overall visibility 0..1 */
  labels: ((buf: Float32Array, weight: number) => void) | null;
  scrollTo: ((id: string) => void) | null;
} = {
  labels: null,
  scrollTo: null,
};

type Listener = () => void;

const listeners = new Set<Listener>();
const elements = new Map<string, HTMLElement>();
const EMPTY: SectionInfo[] = [];

let sections: SectionInfo[] = EMPTY;
let activeId = "";
let activeShape: ShapeId = "nexus";
let activeOffsetX: number | undefined;

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getSections = () => sections;
export const getActiveId = () => activeId;
export const getActiveShape = () => activeShape;
export const getActiveOffsetX = () => activeOffsetX;
export const getServerSections = () => EMPTY;
export const getServerActiveId = () => "";

export function registerSection(info: SectionInfo, el: HTMLElement): () => void {
  elements.set(info.id, el);

  const next = [...sections.filter((s) => s.id !== info.id), info];
  next.sort((a, b) => {
    const ea = elements.get(a.id);
    const eb = elements.get(b.id);
    if (!ea || !eb) return 0;
    return ea.compareDocumentPosition(eb) & Node.DOCUMENT_POSITION_FOLLOWING
      ? -1
      : 1;
  });
  sections = next;

  if (!activeId && next[0]) {
    activeId = next[0].id;
    activeShape = next[0].shape;
    activeOffsetX = next[0].offsetX;
  }
  emit();

  return () => {
    elements.delete(info.id);
    sections = sections.filter((s) => s.id !== info.id);
    if (activeId === info.id) {
      const first = sections[0];
      activeId = first ? first.id : "";
      if (first) {
        activeShape = first.shape;
        activeOffsetX = first.offsetX;
      }
    }
    emit();
  };
}

export function setActive(id: string) {
  if (id === activeId) return;
  const target = sections.find((s) => s.id === id);
  if (!target) return;
  activeId = id;
  activeShape = target.shape;
  activeOffsetX = target.offsetX;
  emit();
}
