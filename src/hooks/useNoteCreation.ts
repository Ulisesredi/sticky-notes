import { Dispatch, RefObject, useCallback, useState } from "react";
import { Note, NoteDraft, NoteGeometry, NotesAction } from "../model/notes.types";
import { getInitialGeometry, MIN_NOTE_SIZE, Size } from "../utils/geometry";

type CreationDialog = { initialGeometry: NoteGeometry; boardBounds: Size };

type Options = {
  boardRef: RefObject<HTMLDivElement | null>;
  interactionLockRef: RefObject<string | null>;
  notes: Note[];
  dispatch: Dispatch<NotesAction>;
};

export function useNoteCreation({ boardRef, interactionLockRef, notes, dispatch }: Options) {
  const [dialog, setDialog] = useState<CreationDialog | null>(null);

  const open = useCallback(() => {
    const board = boardRef.current;
    if (!board || interactionLockRef.current !== null) return;
    const boardBounds = { width: board.clientWidth, height: board.clientHeight };
    setDialog({
      initialGeometry: getInitialGeometry(window.innerHeight, boardBounds, notes),
      boardBounds,
    });
  }, [boardRef, interactionLockRef, notes]);

  const close = useCallback(() => setDialog(null), []);

  const create = useCallback((draft: NoteDraft & NoteGeometry) => {
    const board = boardRef.current;
    if (!board) return;
    if (![draft.x, draft.y, draft.width, draft.height].every(Number.isFinite)) return;
    const bounds = { width: board.clientWidth, height: board.clientHeight };
    const minWidth = Math.min(MIN_NOTE_SIZE.width, bounds.width);
    const minHeight = Math.min(MIN_NOTE_SIZE.height, bounds.height);
    const width = Math.min(Math.max(draft.width, minWidth), bounds.width);
    const height = Math.min(Math.max(draft.height, minHeight), bounds.height);
    dispatch({
      type: "note/created",
      note: {
        id: crypto.randomUUID(),
        ...draft,
        width,
        height,
        x: Math.max(0, Math.min(draft.x, bounds.width - width)),
        y: Math.max(0, Math.min(draft.y, bounds.height - height)),
      },
    });
    setDialog(null);
  }, [boardRef, dispatch]);

  return { dialog, open, close, create };
}
