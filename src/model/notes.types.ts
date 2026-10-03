import { NoteColor } from "./notes.colors";

export type NoteGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NoteDraft = { content: string; color: NoteColor };
export type Note = NoteGeometry & NoteDraft & { id: string };

export type NotesAction =
  | { type: "note/created"; note: Note }
  | { type: "note/geometryCommitted"; id: string; geometry: NoteGeometry }
  | { type: "note/contentUpdated"; id: string; draft: NoteDraft }
  | { type: "note/broughtToFront"; id: string }
  | { type: "note/deleted"; id: string };
