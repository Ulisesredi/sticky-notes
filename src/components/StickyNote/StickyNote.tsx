import { memo, RefObject, useRef } from "react";
import { useNoteElement } from "../../hooks/useNoteElement";
import { useNoteMoveInteraction } from "../../hooks/useNoteMoveInteraction";
import { useNoteResizeInteraction } from "../../hooks/useNoteResizeInteraction";
import { Note, NoteGeometry } from "../../model/notes.types";
import "./StickyNote.css";

type Props = {
  note: Note;
  number: number;
  boardRef: RefObject<HTMLDivElement | null>;
  trashRef: RefObject<HTMLDivElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  onTrashChange: (active: boolean) => void;
  interactionLockRef: RefObject<string | null>;
  onCommit: (id: string, geometry: NoteGeometry) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onSelect: (id: string) => void;
};

export const StickyNote = memo(function StickyNote({
  note, number, boardRef, trashRef, viewportRef, onTrashChange,
  interactionLockRef, onCommit, onDelete, onEdit, onSelect,
}: Props) {
  const cancelGestureRef = useRef<(() => void) | null>(null);
  const noteRef = useNoteElement(note, cancelGestureRef);
  const { startMove } = useNoteMoveInteraction({
    note, noteRef, boardRef, trashRef, viewportRef, onTrashChange,
    interactionLockRef, onCommit, onDelete, cancelGestureRef,
  });
  const { startResize } = useNoteResizeInteraction({
    note, noteRef, boardRef, interactionLockRef, onCommit, cancelGestureRef,
  });

  return (
    <article ref={noteRef} className="sticky-note"
      style={{ backgroundColor: note.color }}
      aria-label={`Note ${number}: ${note.content}`}
      onPointerDownCapture={() => onSelect(note.id)}>
      <header className="sticky-note__header">
        <button type="button" className="sticky-note__move"
          aria-label={`Move note ${number}` } title="Drag to move. Press Escape to cancel."
          onPointerDown={startMove}>
          <span aria-hidden="true">⠿</span>
        </button>
        <button type="button" className="sticky-note__edit"
          aria-label={`Edit note ${number}` } title="Edit note"
          onClick={() => onEdit(note.id)}>✎</button>
      </header>
      <div className="sticky-note__body"><p>{note.content}</p></div>
      <button type="button" className="sticky-note__resize"
        aria-label={`Resize note ${number}` } title="Drag to resize. Press Escape to cancel."
        onPointerDown={startResize}>
        <span aria-hidden="true">↘</span>
      </button>
    </article>
  );
});
