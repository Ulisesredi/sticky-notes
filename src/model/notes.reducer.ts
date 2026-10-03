import { Note, NotesAction } from "./notes.types";

export function notesReducer(state: Note[], action: NotesAction): Note[] {
  switch (action.type) {
    case "note/created":
      return state.some((note) => note.id === action.note.id)
        ? state
        : [...state, action.note];
    case "note/geometryCommitted": {
      const index = state.findIndex((note) => note.id === action.id);
      if (index === -1) return state;
      const current = state[index];
      const next = action.geometry;
      if (
        current.x === next.x && current.y === next.y &&
        current.width === next.width && current.height === next.height
      ) return state;
      return state.map((note, i) => i === index ? { ...note, ...next } : note);
    }
    case "note/contentUpdated": {
      const index = state.findIndex((note) => note.id === action.id);
      if (index === -1) return state;
      const current = state[index];
      if (current.content === action.draft.content && current.color === action.draft.color) return state;
      return state.map((note, i) => i === index ? { ...note, ...action.draft } : note);
    }
    case "note/broughtToFront": {
      const index = state.findIndex((note) => note.id === action.id);
      if (index === -1 || index === state.length - 1) return state;
      return [...state.filter((note) => note.id !== action.id), state[index]];
    }
    case "note/deleted":
      return state.some((note) => note.id === action.id)
        ? state.filter((note) => note.id !== action.id)
        : state;
  }
}
