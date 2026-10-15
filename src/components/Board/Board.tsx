import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { notesReducer } from "../../model/notes.reducer";
import { loadNotesSnapshot, Note, NoteGeometry } from "../../model/notes.types";
import { StickyNote } from "../StickyNote/StickyNote";
import { TrashZone } from "../TrashZone/TrashZone";
import { CreateNoteModal } from "../CreateNoteModal/CreateNoteModal";
import { SavingFeedback } from "../Common/SavingFeedback";
import "./Board.css";
import { useNotePersistence } from "../../hooks/useNotePersistence";
import { useCreateNote } from "../../hooks/useCreateNote";
import { UndoDeleteFeedback } from "../Common/UndoDeleteFeedback";
import { useDrawCreate } from "../../hooks/useDrawCreate";

export function Board() {
  const [initialSnapshot] = useState(loadNotesSnapshot);
  const [notes, dispatch] = useReducer(notesReducer, initialSnapshot.notes);

  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [trashActive, setTrashActive] = useState(false);

  const interactionLockRef = useRef<string | null>(null);

  const isSaving = useNotePersistence(notes, initialSnapshot.version);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deletedNote, setDeletedNote] = useState<Note | undefined>();
  const stableNotes = useRef<Note[]>(initialSnapshot.notes);

  useEffect(() => {
    stableNotes.current = notes;
  }, [notes]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const commitGeometry = useCallback((id: string, geometry: NoteGeometry) => {
    dispatch({ type: "note/geometryCommitted", id, geometry });
  }, []);
  const deleteNote = useCallback((id: string) => {
    if (interactionLockRef.current !== null) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    const deleted = stableNotes.current.find((it) => it.id === id);
    setDeletedNote(deleted);

    const timeoutId = setTimeout(() => {
      setDeletedNote(undefined);
      timerRef.current = null;
    }, 5000);

    timerRef.current = timeoutId;

    dispatch({ type: "note/deleted", id });
  }, []);

  const restoreNote = useCallback(() => {
    if (deletedNote) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      dispatch({ type: "note/restored", note: deletedNote });

      setDeletedNote(undefined);
    }
  }, [deletedNote]);

  const bringToFront = useCallback((id: string) => {
    if (interactionLockRef.current === null)
      dispatch({ type: "note/broughtToFront", id });
  }, []);

  const { updateNote, createNote, openModal, closeModal, modal } =
    useCreateNote({ interactionLockRef, boardRef, dispatch, notes });

  const commitDrawnGeometry = useCallback(
    (drawnGeometry: NoteGeometry) => {
      openModal({ type: "create", initial: drawnGeometry });
    },
    [openModal],
  );

  const { previewRef, startDrawCreation } = useDrawCreate({
    interactionLockRef,
    boardRef,
    commitDrawnGeometry,
  });

  const editedNote =
    modal?.type === "edit"
      ? notes.find((note) => note.id === modal.noteId)
      : undefined;

  return (
    <main className="workspace">
      <div
        ref={viewportRef}
        className="board-viewport"
        role="region"
        aria-label="Notes board"
      >
        <div ref={boardRef} className="board" onPointerDown={startDrawCreation}>
          <header className="workspace__header">
            <h1>
              Sticky notes<span>.</span>
            </h1>
            <div className="workspace__tools">
              <span className="workspace__count" role="status">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </span>
              <button
                type="button"
                className="create-note-button"
                onClick={() => {
                  openModal({ type: "create" });
                }}
              >
                ＋ New note
              </button>
            </div>
          </header>
          {notes.map((note, index) => (
            <StickyNote
              key={note.id}
              note={note}
              number={index + 1}
              boardRef={boardRef}
              trashRef={trashRef}
              viewportRef={viewportRef}
              onTrashChange={setTrashActive}
              interactionLockRef={interactionLockRef}
              onCommit={commitGeometry}
              onDelete={deleteNote}
              onEdit={() => openModal({ type: "edit", noteId: note.id })}
              onSelect={bringToFront}
            />
          ))}
          {notes.length > 0 && (
            <footer className="board-footer">
              Drag header to move · Corner to resize · Esc to cancel
            </footer>
          )}
          <TrashZone zoneRef={trashRef} active={trashActive} />
          <div className="drawn-preview" ref={previewRef} />
        </div>
      </div>
      {modal?.type === "create" && (
        <CreateNoteModal
          mode="create"
          initialGeometry={modal.geometry}
          boardBounds={modal.bounds}
          onCreate={createNote}
          onClose={closeModal}
        />
      )}
      {editedNote && (
        <CreateNoteModal
          mode="edit"
          note={editedNote}
          onSave={updateNote}
          onClose={closeModal}
        />
      )}
      {isSaving && <SavingFeedback />}
      {deletedNote && <UndoDeleteFeedback onRestoreNote={restoreNote} />}
    </main>
  );
}
