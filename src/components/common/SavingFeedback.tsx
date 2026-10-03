import "./SavingFeedback.css";

export function SavingFeedback() {
  return (
    <div className="save-status" role="status" aria-live="polite">
      <span>Saving changes</span>
      <span className="save-status__dots" aria-hidden="true">
        <span>.</span><span>.</span><span>.</span>
      </span>
    </div>
  );
}
