import { NotesSnapshot } from "../model/notes.types";

export type MockSaveResult = {
  status: "saved" | "stale";
  version: number;
};

let latestSnapshot: NotesSnapshot = { version: 0, notes: [] };

export function saveNotesToMockApi(snapshot: NotesSnapshot): Promise<MockSaveResult> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (snapshot.version <= latestSnapshot.version) {
        resolve({ status: "stale", version: latestSnapshot.version });
        return;
      }

      latestSnapshot = snapshot;
      resolve({ status: "saved", version: latestSnapshot.version });
    }, 300);
  });
}

export function getMockApiSnapshot(): Promise<NotesSnapshot> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(latestSnapshot), 150);
  });
}
