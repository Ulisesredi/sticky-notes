import { getInitialGeometry, getGestureGeometry, isValidGeometry } from "./geometry";

const BOARD_SIZE = { width: 1600, height: 1000 };

const initial = { x: 100, y: 80, width: 240, height: 200 };

test("keeps a fast move inside all four board edges", () => {
  expect(getGestureGeometry(initial, "move", { x: -10000, y: -10000 }, BOARD_SIZE))
    .toEqual({ ...initial, x: 0, y: 0 });
  expect(getGestureGeometry(initial, "move", { x: 10000, y: 10000 }, BOARD_SIZE))
    .toEqual({ ...initial, x: 1360, y: 800 });
});

test("resizing clamps dimensions without moving the origin", () => {
  expect(getGestureGeometry(initial, "resize", { x: -10000, y: -10000 }, BOARD_SIZE))
    .toEqual({ ...initial, width: 48, height: 48 });
  expect(getGestureGeometry(initial, "resize", { x: 10000, y: 10000 }, BOARD_SIZE))
    .toEqual({ ...initial, width: 1500, height: 920 });
});

test.each([
  { ...initial, x: NaN },
  { ...initial, width: Infinity },
  { ...initial, x: -1 },
  { ...initial, width: 47 },
  { ...initial, height: 47 },
  { ...initial, x: 1500 },
])("rejects invalid creation geometry: %p", (geometry) => {
  expect(isValidGeometry(geometry, BOARD_SIZE)).toBe(false);
});

test.each([768, 1080, 1440])("new notes use twenty-five percent of viewport height %i on both axes", (height) => {
  expect(getInitialGeometry(height, { width: 1200, height: height - 64 }))
    .toEqual({ x: 16, y: 72, width: height * 0.25, height: height * 0.25 });
});