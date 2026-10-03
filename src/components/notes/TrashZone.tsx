import { RefObject } from "react";
import "./TrashZone.css";

type Props = {
  zoneRef: RefObject<HTMLDivElement | null>;
  active: boolean;
};

export function TrashZone({ zoneRef, active }: Props) {
  return (
    <div ref={zoneRef} className="trash-zone" data-active={active || undefined}
      role="status" aria-live="polite" aria-atomic="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 10v7M14 10v7" />
      </svg>
      <strong>{active ? "Release to delete" : "Trash"}</strong>
      <span>{active ? "Move away to keep your note" : "Drop a note here"}</span>
    </div>
  );
}