import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { notesReducer } from "../../model/notes.reducer";
import {
  loadNotesSnapshot,
  NOTES_STORAGE_KEY,
  NoteDraft,
  NoteGeometry,
} from "../../model/notes.types";
import { saveNotesToMockApi } from "../../services/notesApi";
import { useNoteCreation } from "../../hooks/useNoteCreation";
import { StickyNote } from "../StickyNote/StickyNote";
import { TrashZone } from "../TrashZone/TrashZone";
import { CreateNoteModal } from "../CreateNoteModal/CreateNoteModal";
import { SavingFeedback } from "../common/SavingFeedback";
import "./Board.css";

type ModalState = { type: "edit"; noteId: string };

export function Board() {
  const [initialSnapshot] = useState(loadNotesSnapshot);
  const [notes, dispatch] = useReducer(notesReducer, initialSnapshot.notes);
  const persistedNotesRef = useRef(notes);
  const versionRef = useRef(initialSnapshot.version);
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [trashActive, setTrashActive] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const pendingSavesRef = useRef(0);
  const interactionLockRef = useRef<string | null>(null);
  const noteCreation = useNoteCreation({
    boardRef,
    interactionLockRef,
    notes,
    dispatch,
  });

  useEffect(() => {
    if (notes === persistedNotesRef.current) return;
    const timeoutId = window.setTimeout(() => {
      const snapshot = { version: versionRef.current + 1, notes };
      versionRef.current = snapshot.version;
      pendingSavesRef.current += 1;
      setIsSaving(true);
      try {
        window.localStorage.setItem(
          NOTES_STORAGE_KEY,
          JSON.stringify(snapshot),
        );
        persistedNotesRef.current = notes;
      } catch {
        // Storage can be unavailable or full; keep the in-memory board usable.
      }
      void saveNotesToMockApi(snapshot)
        .catch(() => undefined)
        .finally(() => {
          pendingSavesRef.current -= 1;
          setIsSaving(pendingSavesRef.current > 0);
        });
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [notes]);

  const commitGeometry = useCallback((id: string, geometry: NoteGeometry) => {
    dispatch({ type: "note/geometryCommitted", id, geometry });
  }, []);
  const deleteNote = useCallback((id: string) => {
    if (interactionLockRef.current !== null) return;
    dispatch({ type: "note/deleted", id });
  }, []);
  const bringToFront = useCallback((id: string) => {
    if (interactionLockRef.current === null)
      dispatch({ type: "note/broughtToFront", id });
  }, []);
  const openEdit = useCallback((id: string) => {
    if (interactionLockRef.current === null)
      setModal({ type: "edit", noteId: id });
  }, []);

  function updateNote(id: string, draft: NoteDraft) {
    dispatch({ type: "note/contentUpdated", id, draft });
    setModal(null);
  }

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
        <div ref={boardRef} className="board">
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
                  noteCreation.open();
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
              onEdit={openEdit}
              onSelect={bringToFront}
            />
          ))}
          {notes.length > 0 && (
            <footer className="board-footer">
              Drag header to move · Corner to resize · Esc to cancel
            </footer>
          )}
          <TrashZone zoneRef={trashRef} active={trashActive} />
        </div>
      </div>
      {noteCreation.dialog && (
        <CreateNoteModal
          mode="create"
          initialGeometry={noteCreation.dialog.initialGeometry}
          boardBounds={noteCreation.dialog.boardBounds}
          onCreate={noteCreation.create}
          onClose={noteCreation.close}
        />
      )}
      {editedNote && (
        <CreateNoteModal
          mode="edit"
          note={editedNote}
          onSave={updateNote}
          onClose={() => setModal(null)}
        />
      )}
      {isSaving && <SavingFeedback />}
    </main>
  );
}
