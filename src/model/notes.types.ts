import { NoteColor } from "./notes.colors";

export type NoteGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NoteDraft = { content: string; color: NoteColor };
export type Note = NoteGeometry & NoteDraft & { id: string };
export type NotesSnapshot = { version: number; notes: Note[] };

export const NOTES_STORAGE_KEY = "sticky-notes:notes";

export function isNote(value: unknown): value is Note {
  if (typeof value !== "object" || value === null) return false;
  const note = value as Record<string, unknown>;
  return typeof note.id === "string" &&
    typeof note.content === "string" &&
    typeof note.color === "string" &&
    Number.isFinite(note.x) && Number.isFinite(note.y) &&
    Number.isFinite(note.width) && Number.isFinite(note.height) &&
    (note.color === "#f9e9a2" || note.color === "#ffd4b8" || note.color === "#f7cbd7" ||
      note.color === "#ded2f5" || note.color === "#c8e3fa" || note.color === "#c8ebda" ||
      note.color === "#dce6bd" || note.color === "#eadcc7");
}

export function loadNotesSnapshot(): NotesSnapshot {
  try {
    const stored = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (stored === null) return { version: 0, notes: [] };
    const parsed: unknown = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.every(isNote)) {
      return { version: 0, notes: parsed };
    }
    if (typeof parsed === "object" && parsed !== null) {
      const snapshot = parsed as Record<string, unknown>;
      if (Number.isInteger(snapshot.version) && (snapshot.version as number) >= 0 &&
          Array.isArray(snapshot.notes) && snapshot.notes.every(isNote)) {
        return { version: snapshot.version as number, notes: snapshot.notes };
      }
    }
    return { version: 0, notes: [] };
  } catch {
    return { version: 0, notes: [] };
  }
}

export type NotesAction =
  | { type: "note/created"; note: Note }
  | { type: "note/geometryCommitted"; id: string; geometry: NoteGeometry }
  | { type: "note/contentUpdated"; id: string; draft: NoteDraft }
  | { type: "note/broughtToFront"; id: string }
  | { type: "note/deleted"; id: string };
