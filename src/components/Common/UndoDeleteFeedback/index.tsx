import "./UndoDeleteFeedback.css";

export function UndoDeleteFeedback({
  onRestoreNote,
}: {
  onRestoreNote: () => void;
}) {
  return (
    <div className="undo-status" role="group" aria-label="Undo note deletion">
      <span className="undo-status__message" role="status" aria-live="polite">
        Note deleted
      </span>
      <button
        type="button"
        className="undo-status__undo"
        onClick={onRestoreNote}
      >
        Undo
      </button>
    </div>
  );
}
