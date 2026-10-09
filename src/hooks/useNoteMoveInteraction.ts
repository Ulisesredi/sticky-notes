import { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { Note, NoteGeometry } from "../model/notes.types";
import { getGestureGeometry, isPointInRect } from "../utils/geometry";
import { CancelGestureRef, NoteElementRef, paintNoteGeometry } from "./useNoteElement";

type Options = {
  note: Note;
  noteRef: NoteElementRef;
  boardRef: RefObject<HTMLDivElement | null>;
  trashRef: RefObject<HTMLDivElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  cancelGestureRef: CancelGestureRef;
  interactionLockRef: RefObject<string | null>;
  onTrashChange: (active: boolean) => void;
  onCommit: (id: string, geometry: NoteGeometry) => void;
  onDelete: (id: string) => void;
};

export function useNoteMoveInteraction({
  note,
  noteRef,
  boardRef,
  trashRef,
  viewportRef,
  cancelGestureRef,
  interactionLockRef,
  onTrashChange,
  onCommit,
  onDelete,
}: Options) {
  const { x, y, width, height } = note;

  function startMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || !event.isPrimary || interactionLockRef.current !== null) return;
    const element = noteRef.current;
    const board = boardRef.current;
    if (!element || !board) return;

    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    handle.focus({ preventScroll: true });
    const pointerId = event.pointerId;
    const initial: NoteGeometry = { x, y, width, height };
    const initialBoardRect = board.getBoundingClientRect();
    const origin = {
      x: event.clientX - initialBoardRect.left,
      y: event.clientY - initialBoardRect.top,
    };
    const bounds = { width: board.clientWidth, height: board.clientHeight };
    let pointer = { x: event.clientX, y: event.clientY };
    let frame: number | null = null;
    let finished = false;
    let overTrash = false;

    function geometry() {
      const currentBoardRect = board!.getBoundingClientRect();
      return getGestureGeometry(initial, "move", {
        x: pointer.x - currentBoardRect.left - origin.x,
        y: pointer.y - currentBoardRect.top - origin.y,
      }, bounds);
    }

    function isOverTrash() {
      const trash = trashRef.current;
      const viewport = viewportRef.current;
      if (!trash || !viewport) return false;
      const viewportRect = viewport.getBoundingClientRect();
      const visibleArea = {
        left: viewportRect.left + viewport.clientLeft,
        top: viewportRect.top + viewport.clientTop,
        right: viewportRect.left + viewport.clientLeft + viewport.clientWidth,
        bottom: viewportRect.top + viewport.clientTop + viewport.clientHeight,
      };
      return isPointInRect(pointer, trash.getBoundingClientRect()) &&
        isPointInRect(pointer, visibleArea);
    }

    function updateTrashFeedback(active: boolean) {
      if (active === overTrash) return;
      overTrash = active;
      if (active) element!.dataset.deleteReady = "true";
      else delete element!.dataset.deleteReady;
      onTrashChange(active);
    }

    function finish(commit: boolean) {
      if (finished) return;
      finished = true;
      if (frame !== null) cancelAnimationFrame(frame);
      const shouldDelete = commit && isOverTrash();
      const finalGeometry = commit ? geometry() : initial;
      updateTrashFeedback(false);
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", cancel);
      handle.removeEventListener("lostpointercapture", cancel);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("resize", cancel);
      window.removeEventListener("scroll", schedule, true);
      document.removeEventListener("visibilitychange", visibility);
      cancelGestureRef.current = null;
      interactionLockRef.current = null;
      delete element!.dataset.interacting;
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
      paintNoteGeometry(element!, finalGeometry);
      if (shouldDelete) onDelete(note.id);
      else if (commit) onCommit(note.id, finalGeometry);
    }

    function cancel() { finish(false); }
    function keydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    }
    function visibility() { if (document.hidden) cancel(); }
    function schedule() {
      if (frame !== null || finished) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (finished) return;
        paintNoteGeometry(element!, geometry());
        updateTrashFeedback(isOverTrash());
      });
    }
    function move(e: PointerEvent) {
      if (e.pointerId !== pointerId) return;
      if ((e.buttons & 1) === 0) {
        cancel();
        return;
      }
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    }
    function up(e: PointerEvent) {
      if (e.pointerId !== pointerId) return;
      pointer = { x: e.clientX, y: e.clientY };
      finish(true);
    }

    interactionLockRef.current = note.id;
    cancelGestureRef.current = cancel;
    element.dataset.interacting = "move";
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", cancel);
    handle.addEventListener("lostpointercapture", cancel);
    window.addEventListener("keydown", keydown);
    window.addEventListener("blur", cancel);
    window.addEventListener("resize", cancel);
    window.addEventListener("scroll", schedule, true);
    document.addEventListener("visibilitychange", visibility);
    try {
      handle.setPointerCapture(pointerId);
      updateTrashFeedback(isOverTrash());
    } catch {
      cancel();
    }
  }

  return { startMove };
}
