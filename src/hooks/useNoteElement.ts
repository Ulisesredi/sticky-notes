import { RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { Note, NoteGeometry } from "../model/notes.types";

export function paint(element: HTMLElement, geometry: NoteGeometry) {
  element.style.transform = `translate(${geometry.x}px, ${geometry.y}px)`;
  element.style.width = `${geometry.width}px`;
  element.style.height = `${geometry.height}px`;
}

type Options = {
  note: Note;
  cancelRef: CancelGestureRef;
};

export type CancelGestureRef = { current: (() => void) | null };
export type NoteRef = RefObject<HTMLElement | null>;

export function useNoteElement({ note, cancelRef }: Options) {
  const noteRef: NoteRef = useRef(null);
  const { x, y, width, height } = note;

  useLayoutEffect(() => {
    cancelRef.current?.();
    if (noteRef.current) paint(noteRef.current, { x, y, width, height });
  }, [x, y, width, height, noteRef, cancelRef]);

  useEffect(() => () => cancelRef.current?.(), [cancelRef]);

  return noteRef;
}
