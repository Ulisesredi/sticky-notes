import { useCallback, useReducer, useRef, useState } from "react";
import { notesReducer } from "../../model/notes.reducer";
import { NoteDraft, NoteGeometry } from "../../model/notes.types";
import { StickyNote } from "./StickyNote";
import { TrashZone } from "./TrashZone";
import { CreateNoteModal } from "./CreateNoteModal";
import { getInitialGeometry } from "../../utils/geometry";
import "./Board.css";

type ModalState = { type: "create" } | { type: "edit"; noteId: string };

export function Board() {
  const [notes, dispatch] = useReducer(notesReducer, []);
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [trashActive, setTrashActive] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const interactionLockRef = useRef<string | null>(null);

  const commitGeometry = useCallback((id: string, geometry: NoteGeometry) => {
    dispatch({ type: "note/geometryCommitted", id, geometry });
  }, []);
  const deleteNote = useCallback((id: string) => {
    if (interactionLockRef.current !== null) return;
    dispatch({ type: "note/deleted", id });
  }, []);
  const bringToFront = useCallback((id: string) => {
    if (interactionLockRef.current === null) dispatch({ type: "note/broughtToFront", id });
  }, []);
  const openEdit = useCallback((id: string) => {
    if (interactionLockRef.current === null) setModal({ type: "edit", noteId: id });
  }, []);

  function createNote(draft: NoteDraft) {
    const board = boardRef.current;
    if (!board) return;
    dispatch({
      type: "note/created",
      note: {
        id: crypto.randomUUID(),
        ...draft,
        ...getInitialGeometry(window.innerHeight, { width: board.clientWidth, height: board.clientHeight }, notes),
      },
    });
    setModal(null);
  }

  function updateNote(id: string, draft: NoteDraft) {
    dispatch({ type: "note/contentUpdated", id, draft });
    setModal(null);
  }

  const editedNote = modal?.type === "edit"
    ? notes.find((note) => note.id === modal.noteId)
    : undefined;

  return (
    <main className="workspace">
      <div ref={viewportRef} className="board-viewport"
        role="region" aria-label="Notes board">
        <div ref={boardRef} className="board">
          <header className="workspace__header">
            <h1>Sticky notes<span>.</span></h1>
            <div className="workspace__tools">
              <span className="workspace__count" role="status">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </span>
              <button type="button" className="create-note-button"
                onClick={() => {
                  if (interactionLockRef.current === null) setModal({ type: "create" });
                }}>＋ New note</button>
            </div>
          </header>
          {notes.map((note, index) => (
            <StickyNote key={note.id} note={note} number={index + 1}
              boardRef={boardRef} trashRef={trashRef} viewportRef={viewportRef}
              onTrashChange={setTrashActive} interactionLockRef={interactionLockRef}
              onCommit={commitGeometry} onDelete={deleteNote} onEdit={openEdit}
              onSelect={bringToFront} />
          ))}
          {notes.length > 0 && (
            <footer className="board-footer">
              Drag header to move · Corner to resize · Esc to cancel
            </footer>
          )}
          <TrashZone zoneRef={trashRef} active={trashActive} />
        </div>
      </div>
      {modal?.type === "create" && (
        <CreateNoteModal mode="create" onCreate={createNote} onClose={() => setModal(null)} />
      )}
      {editedNote && (
        <CreateNoteModal mode="edit" note={editedNote} onSave={updateNote} onClose={() => setModal(null)} />
      )}
    </main>
  );
}
