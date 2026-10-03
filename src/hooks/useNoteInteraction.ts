import {
  PointerEvent as ReactPointerEvent,
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { Note, NoteGeometry } from "../model/notes.types";
import { getGestureGeometry, InteractionKind, isPointInRect } from "../utils/geometry";

type Options = {
  note: Note;
  boardRef: RefObject<HTMLDivElement | null>;
  trashRef: RefObject<HTMLDivElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  onTrashChange: (active: boolean) => void;
  interactionLockRef: RefObject<string | null>;
  onCommit: (id: string, geometry: NoteGeometry) => void;
  onDelete: (id: string) => void;
};

function paint(element: HTMLElement, geometry: NoteGeometry) {
  element.style.transform = `translate(${geometry.x}px, ${geometry.y}px)`;
  element.style.width = `${geometry.width}px`;
  element.style.height = `${geometry.height}px`;
}

export function useNoteInteraction({
  note,
  boardRef,
  trashRef,
  viewportRef,
  onTrashChange,
  interactionLockRef,
  onCommit,
  onDelete,
}: Options) {
  const noteRef = useRef<HTMLElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const { x, y, width, height } = note;

  // This hook owns geometry styles, both during gestures and after React commits.
  useLayoutEffect(() => {
    cancelRef.current?.();
    if (noteRef.current) paint(noteRef.current, { x, y, width, height });
  }, [x, y, width, height]);

  useEffect(() => () => cancelRef.current?.(), []);

  function start(
    event: ReactPointerEvent<HTMLButtonElement>,
    kind: InteractionKind,
  ) {
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      interactionLockRef.current !== null
    )
      return;
    const element = noteRef.current;
    const board = boardRef.current;
    if (!element || !board) return;

    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    handle.focus({ preventScroll: true });
    const pointerId = event.pointerId;
    const initial: NoteGeometry = { x, y, width, height };
    const rect = board.getBoundingClientRect();
    const origin = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const bounds = { width: board.clientWidth, height: board.clientHeight };
    let pointer = { x: event.clientX, y: event.clientY };
    let frame: number | null = null;
    let finished = false;
    let overTrash = false;

    function isOverTrash() {
      const trash = trashRef.current;
      const viewport = viewportRef.current;
      if (kind !== "move" || !trash || !viewport) return false;
      const viewportRect = viewport.getBoundingClientRect();
      // Exclude clipped content, borders, and scrollbars from the drop target.
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

    function geometry() {
      const currentRect = board!.getBoundingClientRect();
      return getGestureGeometry(
        initial,
        kind,
        {
          x: pointer.x - currentRect.left - origin.x,
          y: pointer.y - currentRect.top - origin.y,
        },
        bounds,
      );
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
      cancelRef.current = null;
      interactionLockRef.current = null;
      delete element!.dataset.interacting;
      if (handle.hasPointerCapture(pointerId))
        handle.releasePointerCapture(pointerId);
      // Keep the final pixels in place until the committed layout effect runs.
      paint(element!, finalGeometry);
      if (shouldDelete) onDelete(note.id);
      else if (commit) onCommit(note.id, finalGeometry);
    }

    function cancel() {
      finish(false);
    }
    function keydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    }
    function visibility() {
      if (document.hidden) cancel();
    }
    function schedule() {
      if (frame !== null || finished) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (!finished) {
          const nextGeometry = geometry();
          const nextOverTrash = isOverTrash();
          paint(element!, nextGeometry);
          updateTrashFeedback(nextOverTrash);
        }
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
      // Use pointerup coordinates even if the last animation frame hasn't run.
      finish(true);
    }

    interactionLockRef.current = note.id;
    cancelRef.current = cancel;
    element.dataset.interacting = kind;
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

  return { noteRef, start };
}
