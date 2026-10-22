import {
  PointerEvent as ReactPointerEvent,
  RefObject,
  useEffect,
  useRef,
} from "react";
import { NoteGeometry } from "../model/notes.types";
import { clamp, isValidGeometry } from "../utils/geometry";
import { paint } from "./useNoteElement";

type Options = {
  boardRef: RefObject<HTMLDivElement | null>;
  interactionLockRef: RefObject<string | null>;
  commitDrawnGeometry: (geometry: NoteGeometry) => void;
};

export function useDrawCreate({
  boardRef,
  interactionLockRef,
  commitDrawnGeometry,
}: Options) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const cancelGestureRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => cancelGestureRef.current?.();
  }, []);

  function startDrawCreation(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      interactionLockRef.current !== null ||
      event.currentTarget !== event.target
    )
      return;
    const board = boardRef.current;
    const preview = previewRef.current;
    if (!board || !preview) return;

    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;

    const pointerId = event.pointerId;

    const rect = board.getBoundingClientRect();
    const origin = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const bounds = { width: board.clientWidth, height: board.clientHeight };
    let pointer = { x: event.clientX, y: event.clientY };
    let frame: number | null = null;
    let finished = false;

    function geometry() {
      const currentRect = board!.getBoundingClientRect();

      const end = {
        x: clamp(pointer.x - currentRect.left, 0, bounds.width),
        y: clamp(pointer.y - currentRect.top, 0, bounds.height),
      };

      return {
        x: Math.min(origin.x, end.x),
        y: Math.min(origin.y, end.y),
        width: Math.abs(end.x - origin.x),
        height: Math.abs(end.y - origin.y),
      };
    }

    function finish(commit: boolean) {
      if (finished) return;
      finished = true;
      if (frame !== null) cancelAnimationFrame(frame);

      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", cancel);
      handle.removeEventListener("lostpointercapture", cancel);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("resize", cancel);
      window.removeEventListener("scroll", schedule, true);
      document.removeEventListener("visibilitychange", visibility);

      interactionLockRef.current = null;
      cancelGestureRef.current = null;

      if (handle.hasPointerCapture(pointerId))
        handle.releasePointerCapture(pointerId);

      if (commit) {
        const finalGeometry = geometry();
        if (isValidGeometry(finalGeometry, bounds)) {
          commitDrawnGeometry(finalGeometry);
        }
      }

      preview!.style.display = "none";
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
          paint(preview!, nextGeometry);
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
      preview!.style.display = "block";
    }
    function up(e: PointerEvent) {
      if (e.pointerId !== pointerId) return;
      pointer = { x: e.clientX, y: e.clientY };
      // Use pointerup coordinates even if the last animation frame hasn't run.
      finish(true);
    }

    cancelGestureRef.current = cancel;
    interactionLockRef.current = "draw-creation";

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
    } catch {
      cancel();
    }
  }

  return { previewRef, startDrawCreation };
}
