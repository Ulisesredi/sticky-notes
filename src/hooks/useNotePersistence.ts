import { useEffect, useRef, useState } from "react";
import { Note, NOTES_STORAGE_KEY } from "../model/notes.types";
import { saveNotesToMockApi } from "../services/notesApi";

export function useNotePersistence(notes: Note[], initialVersion: number) {
  const persistedNotesRef = useRef(notes);
  const [isSaving, setIsSaving] = useState(false);
  const versionRef = useRef(initialVersion);

  const pendingSavesRef = useRef(0);

  useEffect(() => {
    if (notes === persistedNotesRef.current) return;
    const timeoutId = window.setTimeout(() => {
      const snapshot = { version: versionRef.current + 1, notes };
      versionRef.current = snapshot.version;
      pendingSavesRef.current += 1;
      setIsSaving(true);
      try {
        window.localStorage.setItem(
          NOTES_STORAGE_KEY,
          JSON.stringify(snapshot),
        );
        persistedNotesRef.current = notes;
      } catch {
        // Storage can be unavailable or full; keep the in-memory board usable.
      }
      void saveNotesToMockApi(snapshot)
        .catch(() => undefined)
        .finally(() => {
          pendingSavesRef.current -= 1;
          setIsSaving(pendingSavesRef.current > 0);
        });
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [notes]);

  return isSaving;
}
