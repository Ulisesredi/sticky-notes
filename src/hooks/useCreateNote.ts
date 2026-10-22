import { RefObject, useState } from "react";
import {
  Note,
  NoteDraft,
  NoteGeometry,
  NotesAction,
} from "../model/notes.types";
import { MIN_NOTE_SIZE, Size, getInitialGeometry } from "../utils/geometry";

type ModalState =
  | { type: "create"; geometry: NoteGeometry; bounds: Size }
  | { type: "edit"; noteId: string };

type Options = {
  boardRef: RefObject<HTMLDivElement | null>;
  interactionLockRef: RefObject<string | null>;
  dispatch: (action: NotesAction) => void;
  notes: Note[];
};

export function useCreateNote({
  interactionLockRef,
  boardRef,
  dispatch,
  notes,
}: Options) {
  const [modal, setModal] = useState<ModalState | null>(null);

  function openModal(
    mode:
      | { type: "create"; initial?: NoteGeometry }
      | { type: "edit"; noteId: string },
  ) {
    if (interactionLockRef.current === null) {
      if (mode.type === "edit") {
        setModal({ ...mode });
      }

      if (mode.type === "create") {
        const board = boardRef.current;
        if (!board) return;
        const bounds = {
          width: board.clientWidth,
          height: board.clientHeight,
        };
        const geometry =
          mode.initial ?? getInitialGeometry(window.innerHeight, bounds, notes);
        setModal({
          type: "create",
          geometry,
          bounds,
        });
      }
    }
  }

  function closeModal() {
    setModal(null);
  }

  function createNote(draft: NoteDraft & NoteGeometry) {
    const board = boardRef.current;
    if (!board) return;
    const bounds = {
      width: board.clientWidth,
      height: board.clientHeight,
    };
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
    setModal(null);
  }

  function updateNote(id: string, draft: NoteDraft) {
    dispatch({ type: "note/contentUpdated", id, draft });
    setModal(null);
  }

  return {
    updateNote,
    createNote,
    openModal,
    closeModal,
    modal,
  };
}
