import { FormEvent, useLayoutEffect, useRef, useState } from "react";
import { NOTE_COLORS, NoteColor } from "../../model/notes.colors";
import { Note, NoteDraft } from "../../model/notes.types";
import "./CreateNoteModal.css";

type CreateProps = { mode: "create"; onCreate: (draft: NoteDraft) => void; onClose: () => void };
type EditProps = { mode: "edit"; note: Note; onSave: (id: string, draft: NoteDraft) => void; onClose: () => void };
type Props = CreateProps | EditProps;

export function CreateNoteModal(props: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(() => props.mode === "edit" ? props.note.content : "");
  const [color, setColor] = useState<NoteColor>(() =>
    props.mode === "edit" ? props.note.color : NOTE_COLORS[0].value
  );

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    contentRef.current?.focus();
    return () => dialog.close();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedContent = content.trim();
    if (!normalizedContent) return;
    const draft = { content: normalizedContent, color };
    if (props.mode === "edit") props.onSave(props.note.id, draft);
    else props.onCreate(draft);
  }

  const editing = props.mode === "edit";

  return (
    <dialog ref={dialogRef} className="create-modal" aria-labelledby="create-title"
      onCancel={(event) => { event.preventDefault(); props.onClose(); }}>
      <form onSubmit={submit}>
        <header className="create-modal__header">
          <div>
            <span className="create-modal__eyebrow">{editing ? "NOTE DETAILS" : "A NEW IDEA"}</span>
            <h2 id="create-title">{editing ? "Edit note" : "Create a note"}</h2>
          </div>
          <button type="button" className="create-modal__close" aria-label="Close dialog"
            onClick={props.onClose}>×</button>
        </header>
        <div className="create-modal__layout">
          <div className="create-modal__fields">
            <label htmlFor="note-content">Note content</label>
            <textarea ref={contentRef} id="note-content" required rows={6}
              placeholder="What's on your mind?" value={content}
              onChange={(event) => setContent(event.target.value)} />
            <fieldset>
              <legend>Note color</legend>
              <div className="create-modal__colors">
                {NOTE_COLORS.map((option) => (
                  <label key={option.value} className="color-option" title={option.name}>
                    <input type="radio" name="color" value={option.value}
                      aria-label={option.name} checked={color === option.value}
                      onChange={() => setColor(option.value)} />
                    <span style={{ backgroundColor: option.value }} aria-hidden="true">
                      {color === option.value ? "✓" : ""}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <section className="create-modal__preview" aria-label="Note preview">
            <span className="create-modal__preview-label">PREVIEW</span>
            <div className="note-preview" style={{ backgroundColor: color }}>
              <p>{content || "Your next idea starts here."}</p>
            </div>
          </section>
        </div>
        <footer className="create-modal__actions">
          <button type="button" className="secondary-button" onClick={props.onClose}>Cancel</button>
          <button type="submit" className="primary-button" disabled={!content.trim()}>
            {editing ? "Save changes" : "Create note"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
