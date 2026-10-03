import { FormEvent, useLayoutEffect, useRef, useState } from "react";
import { NOTE_COLORS, NoteColor } from "../../model/notes.colors";
import { Note, NoteDraft, NoteGeometry } from "../../model/notes.types";
import { Size } from "../../utils/geometry";
import "./CreateNoteModal.css";

type CreateProps = {
  mode: "create";
  initialGeometry: NoteGeometry;
  boardBounds: Size;
  onCreate: (draft: NoteDraft & NoteGeometry) => void;
  onClose: () => void;
};
type EditProps = { mode: "edit"; note: Note; onSave: (id: string, draft: NoteDraft) => void; onClose: () => void };
type Props = CreateProps | EditProps;

export function CreateNoteModal(props: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(() => props.mode === "edit" ? props.note.content : "");
  const [color, setColor] = useState<NoteColor>(() =>
    props.mode === "edit" ? props.note.color : NOTE_COLORS[0].value
  );
  const [x, setX] = useState(() => props.mode === "create" ? String(props.initialGeometry.x) : "");
  const [y, setY] = useState(() => props.mode === "create" ? String(props.initialGeometry.y) : "");
  const [width, setWidth] = useState(() => props.mode === "create" ? String(props.initialGeometry.width) : "");
  const [height, setHeight] = useState(() => props.mode === "create" ? String(props.initialGeometry.height) : "");

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
    else props.onCreate({
      ...draft,
      x: Number(x),
      y: Number(y),
      width: Number(width),
      height: Number(height),
    });
  }

  const editing = props.mode === "edit";
  const maxX = props.mode === "create"
    ? Math.max(0, props.boardBounds.width - (Number(width) || 0))
    : undefined;
  const maxY = props.mode === "create"
    ? Math.max(0, props.boardBounds.height - (Number(height) || 0))
    : undefined;

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
            {!editing && (
              <fieldset className="create-modal__dimensions">
                <legend>Note size (px)</legend>
                <label htmlFor="note-width">Width
                  <input id="note-width" type="number" min="48"
                    max={props.mode === "create" ? props.boardBounds.width : undefined}
                    step="any" required value={width} onChange={(event) => setWidth(event.target.value)} />
                </label>
                <label htmlFor="note-height">Height
                  <input id="note-height" type="number" min="48"
                    max={props.mode === "create" ? props.boardBounds.height : undefined}
                    step="any" required value={height} onChange={(event) => setHeight(event.target.value)} />
                </label>
              </fieldset>
            )}
            {!editing && (
              <fieldset className="create-modal__position">
                <legend>Position on board (px)</legend>
                <label htmlFor="note-x">X
                  <input id="note-x" type="number" min="0" max={maxX}
                    step="any" required value={x} onChange={(event) => setX(event.target.value)} />
                </label>
                <label htmlFor="note-y">Y
                  <input id="note-y" type="number" min="0" max={maxY}
                    step="any" required value={y} onChange={(event) => setY(event.target.value)} />
                </label>
              </fieldset>
            )}
          </div>
          <section className="create-modal__preview" aria-label="Note preview">
            <span className="create-modal__preview-label">
              PREVIEW{!editing && ` · ${width || 0} × ${height || 0} px`}
            </span>
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
