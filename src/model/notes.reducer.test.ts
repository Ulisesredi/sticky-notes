import { notesReducer } from "./notes.reducer";
import { Note } from "./notes.types";

test("commits only the selected note without mutating previous state", () => {
  const first = Object.freeze({ id: "a", content: "An idea", color: "#f9e9a2" as const, x: 0, y: 0, width: 240, height: 200 });
  const second = Object.freeze({ ...first, id: "b" });
  const state: Note[] = [first, second];
  Object.freeze(state);
  const next = notesReducer(state, {
    type: "note/geometryCommitted", id: "a",
    geometry: { x: 50, y: 80, width: 240, height: 200 },
  });
  expect(next[0].x).toBe(50);
  expect(first.x).toBe(0);
  expect(next[1]).toBe(second);
});

test("a late commit cannot resurrect a deleted note", () => {
  const note = { id: "a", content: "An idea", color: "#f9e9a2" as const, x: 0, y: 0, width: 240, height: 200 };
  const state = notesReducer([note], { type: "note/deleted", id: "a" });
  expect(notesReducer(state, { type: "note/geometryCommitted", id: "a", geometry: note }))
    .toBe(state);
});
