import { Profiler, StrictMode, useReducer, useRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { StickyNote } from "../components/StickyNote/StickyNote";
import { notesReducer } from "../model/notes.reducer";
import { NoteGeometry } from "../model/notes.types";

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let boardLeft = 0;
let boardTop = 0;
let viewportHeight = 1000;
const onTrashChange = jest.fn();
const onCommit = jest.fn();
const onRender = jest.fn();
const onDelete = jest.fn();

function Fixture() {
  const [notes, dispatch] = useReducer(notesReducer, [
    { id: "a", content: "An idea", color: "#f9e9a2" as const, x: 100, y: 80, width: 240, height: 200 },
  ]);
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const interactionLockRef = useRef<string | null>(null);
  function commit(id: string, geometry: NoteGeometry) {
    onCommit(id, geometry);
    dispatch({ type: "note/geometryCommitted", id, geometry });
  }
  function remove(id: string) {
    onDelete(id);
    dispatch({ type: "note/deleted", id });
  }
  return <div ref={viewportRef} data-testid="viewport"><div ref={boardRef}>
    <div ref={trashRef} data-testid="trash" />
    <Profiler id="note" onRender={onRender}>
      {notes[0] && <StickyNote note={notes[0]} number={1} boardRef={boardRef}
        trashRef={trashRef} viewportRef={viewportRef} onTrashChange={onTrashChange} interactionLockRef={interactionLockRef} onCommit={commit} onDelete={remove} onEdit={jest.fn()} onSelect={jest.fn()} />}
    </Profiler>
    <output data-testid="position">{notes[0]?.x},{notes[0]?.y}</output>
  </div></div>;
}

function pointer(target: Element, type: string, x: number, y: number, extra = {}) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, buttons: 1, ...extra });
  Object.defineProperties(event, {
    pointerId: { value: 1 }, isPrimary: { value: true },
    ...Object.fromEntries(Object.entries(extra).filter(([key]) => ["pointerId", "isPrimary"].includes(key))
      .map(([key, value]) => [key, { value }])),
  });
  fireEvent(target, event);
}
function flushFrame() {
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(16));
  });
}
function setup() {
  render(<StrictMode><Fixture /></StrictMode>);
  return {
    move: screen.getByRole("button", { name: "Move note 1" }),
    resize: screen.getByRole("button", { name: "Resize note 1" }),
    note: screen.getByRole("article"),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  frames = new Map();
  nextFrame = 0;
  boardLeft = 0;
  boardTop = 0;
  viewportHeight = 1000;
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => { frames.delete(id); });
  jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const trash = this.dataset.testid === "trash";
    const viewport = this.dataset.testid === "viewport";
    const left = viewport ? 0 : boardLeft + (trash ? 1380 : 0);
    const top = viewport ? 0 : boardTop + (trash ? 864 : 0);
    const width = trash ? 200 : 1600;
    const height = trash ? 116 : viewport ? viewportHeight : 1000;
    return { left, top, right: left + width, bottom: top + height,
      width, height, x: left, y: top, toJSON: () => ({}) };
  });
  jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1600);
  jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function (this: HTMLElement) {
    return this.dataset.testid === "viewport" ? viewportHeight : 1000;
  });
  HTMLElement.prototype.setPointerCapture = jest.fn();
  HTMLElement.prototype.releasePointerCapture = jest.fn();
  HTMLElement.prototype.hasPointerCapture = jest.fn(() => true);
});
afterEach(() => { jest.restoreAllMocks(); });

test("moves visually without React renders, then commits the release position once", () => {
  const { move, note } = setup();
  const renders = onRender.mock.calls.length;
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 150, 110);
  flushFrame();
  expect(note.style.transform).toBe("translate(140px, 100px)");
  expect(screen.getByTestId("position").textContent).toBe("100,80");
  expect(onRender).toHaveBeenCalledTimes(renders);
  pointer(move, "pointerup", 160, 120);
  expect(onCommit).toHaveBeenCalledTimes(1);
  expect(note.style.transform).toBe("translate(150px, 110px)");
  expect(screen.getByTestId("position").textContent).toBe("150,110");
});

test("a fast release uses final coordinates before the pending frame", () => {
  const { move, note } = setup();
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 150, 110);
  pointer(move, "pointerup", 9000, 9000);
  flushFrame();
  expect(note.style.transform).toBe("translate(1360px, 800px)");
  expect(onCommit).toHaveBeenCalledTimes(1);
});

test.each(["pointercancel", "lostpointercapture"])("%s restores the initial geometry", (event) => {
  const { move, note } = setup();
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 150, 110);
  flushFrame();
  fireEvent(move, new Event(event));
  expect(note.style.transform).toBe("translate(100px, 80px)");
  expect(onCommit).not.toHaveBeenCalled();
  expect(frames.size).toBe(0);
});

test.each(["blur", "resize"])("window %s cancels an active gesture", (event) => {
  const { move, note } = setup();
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 150, 110);
  fireEvent(window, new Event(event));
  flushFrame();
  expect(note.style.transform).toBe("translate(100px, 80px)");
  expect(onCommit).not.toHaveBeenCalled();
});

test("Escape cancels and releases the lock for a later gesture", () => {
  const { move, note } = setup();
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 200, 200);
  fireEvent.keyDown(window, { key: "Escape" });
  pointer(move, "pointerup", 200, 200);
  expect(onCommit).not.toHaveBeenCalled();
  expect(note.style.transform).toBe("translate(100px, 80px)");
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointerup", 120, 100);
  expect(onCommit).toHaveBeenCalledTimes(1);
});

test("resize preserves the position and never deletes", () => {
  const { resize, note } = setup();
  pointer(resize, "pointerdown", 340, 280);
  pointer(resize, "pointerup", 400, 320);
  expect(note.style.transform).toBe("translate(100px, 80px)");
  expect(note.style.width).toBe("300px");
  expect(note.style.height).toBe("240px");
  expect(onDelete).not.toHaveBeenCalled();
});

test("a second gesture and unrelated pointer events cannot hijack an active move", () => {
  const { move, resize, note } = setup();
  pointer(move, "pointerdown", 110, 90);
  pointer(resize, "pointerdown", 340, 280);
  pointer(move, "pointerup", 900, 900, { pointerId: 2 });
  expect(onCommit).not.toHaveBeenCalled();
  pointer(move, "pointerup", 120, 100);
  expect(note.style.width).toBe("240px");
  expect(onCommit).toHaveBeenCalledTimes(1);
});

test("scrolling is included in board-relative movement", () => {
  const { move, note } = setup();
  pointer(move, "pointerdown", 110, 90);
  boardLeft = -100;
  fireEvent.scroll(window);
  flushFrame();
  expect(note.style.transform).toBe("translate(200px, 80px)");
  pointer(move, "pointerup", 110, 90);
  expect(screen.getByTestId("position").textContent).toBe("200,80");
});

test("non-primary and right-button starts are ignored", () => {
  const { move } = setup();
  pointer(move, "pointerdown", 110, 90, { isPrimary: false });
  pointer(move, "pointerup", 150, 150);
  pointer(move, "pointerdown", 110, 90, { button: 2 });
  pointer(move, "pointerup", 150, 150);
  expect(onCommit).not.toHaveBeenCalled();
});

test("unmount cancels pending work and removes tracking", () => {
  const view = render(<Fixture />);
  const move = screen.getByRole("button", { name: "Move note 1" });
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 140, 110);
  view.unmount();
  flushFrame();
  pointer(move, "pointerup", 140, 110);
  expect(frames.size).toBe(0);
  expect(onCommit).not.toHaveBeenCalled();
});

test("a fast drop in trash deletes once without committing geometry", () => {
  const { move } = setup();
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 1400, 900);
  pointer(move, "pointerup", 1500, 950);
  flushFrame();
  expect(onDelete).toHaveBeenCalledTimes(1);
  expect(onDelete).toHaveBeenCalledWith("a");
  expect(onCommit).not.toHaveBeenCalled();
  expect(screen.queryByRole("article")).toBeNull();
});

test("trash feedback changes only at transitions and clears on leaving", () => {
  const { move, note } = setup();
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 1400, 900);
  flushFrame();
  expect(onTrashChange).toHaveBeenLastCalledWith(true);
  expect(note.dataset.deleteReady).toBe("true");
  pointer(move, "pointermove", 1450, 910);
  flushFrame();
  expect(onTrashChange).toHaveBeenCalledTimes(1);
  pointer(move, "pointermove", 1200, 700);
  flushFrame();
  expect(onTrashChange).toHaveBeenLastCalledWith(false);
  expect(note.dataset.deleteReady).toBeUndefined();
  pointer(move, "pointerup", 1200, 700);
  expect(onDelete).not.toHaveBeenCalled();
  expect(onCommit).toHaveBeenCalledTimes(1);
});

test("release outside trash overrides a previously active preview", () => {
  const { move } = setup();
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 1400, 900);
  flushFrame();
  pointer(move, "pointerup", 1200, 700);
  expect(onDelete).not.toHaveBeenCalled();
  expect(onTrashChange).toHaveBeenLastCalledWith(false);
  expect(onCommit).toHaveBeenCalledTimes(1);
});

test("resizing over trash never activates or deletes", () => {
  const { resize } = setup();
  pointer(resize, "pointerdown", 340, 280);
  pointer(resize, "pointermove", 1450, 900);
  flushFrame();
  pointer(resize, "pointerup", 1450, 900);
  expect(onDelete).not.toHaveBeenCalled();
  expect(onTrashChange).not.toHaveBeenCalled();
  expect(onCommit).toHaveBeenCalledTimes(1);
});

test.each(["Escape", "pointercancel", "lostpointercapture"])("%s in trash keeps the original note and clears feedback", (event) => {
  const { move, note } = setup();
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 1450, 900);
  flushFrame();
  if (event === "Escape") fireEvent.keyDown(window, { key: "Escape" });
  else fireEvent(move, new Event(event));
  pointer(move, "pointerup", 1450, 900);
  expect(onDelete).not.toHaveBeenCalled();
  expect(onCommit).not.toHaveBeenCalled();
  expect(onTrashChange).toHaveBeenLastCalledWith(false);
  expect(note.style.transform).toBe("translate(100px, 80px)");
});

test("a clipped trash target cannot delete outside the visible viewport", () => {
  viewportHeight = 600;
  const { move } = setup();
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 1450, 900);
  flushFrame();
  pointer(move, "pointerup", 1450, 900);
  expect(onDelete).not.toHaveBeenCalled();
  expect(onTrashChange).not.toHaveBeenCalled();
  expect(onCommit).toHaveBeenCalledTimes(1);
});

test("scrolling updates the trash rectangle while the pointer stays still", () => {
  viewportHeight = 600;
  const { move } = setup();
  pointer(move, "pointerdown", 110, 90);
  pointer(move, "pointermove", 1250, 500);
  flushFrame();
  expect(onTrashChange).not.toHaveBeenCalled();
  boardLeft = -200;
  boardTop = -400;
  fireEvent.scroll(window);
  flushFrame();
  expect(onTrashChange).toHaveBeenLastCalledWith(true);
  pointer(move, "pointerup", 1250, 500);
  expect(onDelete).toHaveBeenCalledTimes(1);
  expect(onCommit).not.toHaveBeenCalled();
});
