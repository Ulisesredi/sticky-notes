import { NoteGeometry } from "../model/notes.types";

export type Size = { width: number; height: number };
export type Point = { x: number; y: number };
export type InteractionKind = "move" | "resize";

export const MIN_NOTE_SIZE: Size = { width: 48, height: 48 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function isValidGeometry(geometry: NoteGeometry, bounds: Size): boolean {
  const { x, y, width, height } = geometry;
  return (
    [x, y, width, height].every(Number.isFinite) &&
    x >= 0 &&
    y >= 0 &&
    width >= MIN_NOTE_SIZE.width &&
    height >= MIN_NOTE_SIZE.height &&
    x + width <= bounds.width &&
    y + height <= bounds.height
  );
}

export function getGestureGeometry(
  initial: NoteGeometry,
  kind: InteractionKind,
  delta: Point,
  bounds: Size,
): NoteGeometry {
  if (kind === "move") {
    return {
      ...initial,
      x: clamp(initial.x + delta.x, 0, bounds.width - initial.width),
      y: clamp(initial.y + delta.y, 0, bounds.height - initial.height),
    };
  }
  return {
    ...initial,
    width: clamp(
      initial.width + delta.x,
      MIN_NOTE_SIZE.width,
      bounds.width - initial.x,
    ),
    height: clamp(
      initial.height + delta.y,
      MIN_NOTE_SIZE.height,
      bounds.height - initial.y,
    ),
  };
}

export type Rect = { left: number; top: number; right: number; bottom: number };

export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.left &&
    point.x < rect.right &&
    point.y >= rect.top &&
    point.y < rect.bottom
  );
}
export function getInitialGeometry(
  viewportHeight: number,
  bounds: Size,
  occupied: NoteGeometry[] = [],
): NoteGeometry {
  const size = Math.min(viewportHeight * 0.25, bounds.width, bounds.height);
  const startX = Math.min(16, Math.max(0, bounds.width - size));
  const startY = Math.min(72, Math.max(0, bounds.height - size));
  const step = Math.min(48, Math.max(24, size * 0.22));
  const columns = Math.max(1, Math.floor((bounds.width - size - startX) / step) + 1);
  const rows = Math.max(1, Math.floor((bounds.height - size - startY) / step) + 1);
  const occupiedPositions = new Set(occupied.map(({ x, y }) => `${x}:${y}`));
  let slot = 0;
  while (
    slot < columns * rows &&
    occupiedPositions.has(`${startX + (slot % columns) * step}:${startY + Math.floor(slot / columns) * step}`)
  ) {
    slot += 1;
  }
  if (slot === columns * rows) slot = occupied.length % (columns * rows);

  return {
    x: startX + (slot % columns) * step,
    y: startY + Math.floor(slot / columns) * step,
    width: size,
    height: size,
  };
}
