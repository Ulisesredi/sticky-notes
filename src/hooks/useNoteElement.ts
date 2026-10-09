import { RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { Note } from "../model/notes.types";

export type CancelGestureRef = { current: (() => void) | null };

export function paintNoteGeometry(
  element: HTMLElement,
  geometry: Pick<Note, "x" | "y" | "width" | "height">,
) {
  element.style.transform = `translate(${geometry.x}px, ${geometry.y}px)`;
  element.style.width = `${geometry.width}px`;
  element.style.height = `${geometry.height}px`;
}

export function useNoteElement(note: Note, cancelGestureRef: CancelGestureRef) {
  const noteRef = useRef<HTMLElement>(null);
  const { x, y, width, height } = note;

  useLayoutEffect(() => {
    cancelGestureRef.current?.();
    if (noteRef.current) paintNoteGeometry(noteRef.current, { x, y, width, height });
  }, [cancelGestureRef, x, y, width, height]);

  useEffect(() => () => cancelGestureRef.current?.(), [cancelGestureRef]);

  return noteRef;
}

export type NoteElementRef = RefObject<HTMLElement | null>;
